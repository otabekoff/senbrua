// Senbrua - A simple, modern sound recorder for GNOME
// Copyright (C) 2024 Senbrua Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import GLib from "gi://GLib";
import GObject from "gi://GObject";
import Gio from "gi://Gio";
import Gst from "gi://Gst";
import GstPbutils from "gi://GstPbutils";

import { RecordingsDir, Settings } from "./application.js";
import { Recording } from "./recording.js";

// All supported encoding profiles
export const EncodingProfiles = [
    {
        name: "VORBIS",
        containerCaps: "application/ogg;audio/ogg;video/ogg",
        audioCaps: "audio/x-vorbis",
        contentType: "audio/x-vorbis+ogg",
        extension: "ogg",
    },
    {
        name: "OPUS",
        containerCaps: "application/ogg",
        audioCaps: "audio/x-opus",
        contentType: "audio/x-opus+ogg",
        extension: "opus",
    },
    {
        name: "FLAC",
        containerCaps: "audio/x-flac",
        audioCaps: "audio/x-flac",
        contentType: "audio/flac",
        extension: "flac",
    },
    {
        name: "MP3",
        containerCaps: "application/x-id3",
        audioCaps: "audio/mpeg,mpegversion=(int)1,layer=(int)3",
        contentType: "audio/mpeg",
        extension: "mp3",
    },
    {
        name: "M4A",
        containerCaps: "video/quicktime,variant=(string)iso",
        audioCaps: "audio/mpeg,mpegversion=(int)4",
        contentType: "video/mp4",
        extension: "m4a",
    },
];

const AudioChannels = [
    { name: "stereo", channels: 2 },
    { name: "mono", channels: 1 },
];

export class Recorder extends GObject.Object {
    private peaks: number[];

    private _duration: number = 0;
    private _current_peak: number = 0;

    private pipeline!: Gst.Pipeline;
    private level?: Gst.Element;
    private ebin?: Gst.Element;
    private filesink?: Gst.Element;
    private recordBus?: Gst.Bus | null;
    private handlerId?: number | null;
    private file?: Gio.File;
    private timeout?: number | null;
    private pipeState?: Gst.State;
    private noiseSuppressionPreference: boolean;

    static {
        GObject.registerClass(
            {
                Properties: {
                    duration: GObject.ParamSpec.int(
                        "duration",
                        "Recording Duration",
                        "Recording duration in nanoseconds",
                        GObject.ParamFlags.READWRITE |
                            GObject.ParamFlags.CONSTRUCT,
                        0,
                        GLib.MAXINT16,
                        0,
                    ),
                    "current-peak": GObject.ParamSpec.float(
                        "current-peak",
                        "Waveform current peak",
                        "Waveform current peak in float [0, 1]",
                        GObject.ParamFlags.READWRITE |
                            GObject.ParamFlags.CONSTRUCT,
                        0.0,
                        1.0,
                        0.0,
                    ),
                },
            },
            this,
        );
    }

    constructor() {
        super();
        this.peaks = [];
        this.noiseSuppressionPreference = Settings.get_boolean(
            "noise-reduction-enabled",
        );

        this.configurePipeline(this.noiseSuppressionPreference);
    }

    public start(): void {
        this.ensurePipelineConfiguration();

        let index = 1;

        do {
            this.file = RecordingsDir.get_child_for_display_name(
                _("Recording %d").format(index++),
            );
        } while (this.file.query_exists(null));

        this.recordBus = this.pipeline.get_bus();
        this.recordBus.add_signal_watch();
        this.handlerId = this.recordBus.connect(
            "message",
            (_, message: Gst.Message) => {
                if (message) this.onMessageReceived(message);
            },
        );

        if (this.ebin && this.level && this.filesink) {
            this.ebin.set_property("profile", this.getProfile());
            this.filesink.set_property("location", this.file.get_path());
            // Link after profile is set (encodebin requires profile before linking)
            this.level.link(this.ebin);
            this.ebin.link(this.filesink);
        }

        this.state = Gst.State.PLAYING;

        this.timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
            const pos = this.pipeline.query_position(Gst.Format.TIME)[1];
            if (pos > 0) this.duration = pos;
            return true;
        });
    }

    public pause(): void {
        this.state = Gst.State.PAUSED;
    }

    public resume(): void {
        if (this.state === Gst.State.PAUSED) this.state = Gst.State.PLAYING;
    }

    public stop(): Recording | undefined {
        this.state = Gst.State.NULL;
        this.duration = 0;
        if (this.timeout) {
            GLib.source_remove(this.timeout);
            this.timeout = null;
        }

        if (this.recordBus && this.handlerId) {
            this.recordBus.remove_watch();
            this.recordBus.disconnect(this.handlerId);
            this.recordBus = null;
            this.handlerId = null;
        }

        if (
            this.file &&
            this.file.query_exists(null) &&
            this.peaks.length > 0
        ) {
            const recording = new Recording(this.file);
            recording.peaks = this.peaks.slice();
            this.peaks.length = 0;
            return recording;
        }

        return undefined;
    }

    private ensurePipelineConfiguration(): void {
        const desired = Settings.get_boolean("noise-reduction-enabled");
        if (desired === this.noiseSuppressionPreference) {
            return;
        }

        if (this.pipeline) {
            this.pipeline.set_state(Gst.State.NULL);
        }

        this.configurePipeline(desired);
    }

    private onMessageReceived(message: Gst.Message): void {
        switch (message.type) {
            case Gst.MessageType.ELEMENT: {
                if (GstPbutils.is_missing_plugin_message(message)) {
                    const detail =
                        GstPbutils.missing_plugin_message_get_installer_detail(
                            message,
                        );
                    const description =
                        GstPbutils.missing_plugin_message_get_description(
                            message,
                        );
                    log(`Detail: ${detail}\nDescription: ${description}`);
                    break;
                }

                const s = message.get_structure();
                if (s && s.has_name("level")) {
                    const peakVal = s.get_value(
                        "peak",
                    ) as unknown as GObject.ValueArray;
                    if (peakVal) {
                        this.current_peak = peakVal.get_nth(0) as number;
                    }
                }
                break;
            }

            case Gst.MessageType.EOS:
                this.stop();
                break;
            case Gst.MessageType.WARNING: {
                const warning = message.parse_warning()[0];
                if (warning) {
                    log(warning.toString());
                }
                break;
            }
            case Gst.MessageType.ERROR:
                log(message.parse_error().toString());
                break;
        }
    }

    private configurePipeline(enableNoise: boolean): void {
        if (this.pipeline) {
            this.pipeline.set_state(Gst.State.NULL);
        }

        this.pipeline = new Gst.Pipeline({ name: "pipe" });
        this.recordBus = null;
        this.handlerId = null;
        this.level = undefined;
        this.ebin = undefined;
        this.filesink = undefined;

        const rawCaps = Gst.Caps.from_string("audio/x-raw");

        const srcElement = this.makeElement("pulsesrc", "srcElement");
        let tail: Gst.Element = srcElement;

        const preConvert = this.makeElement("audioconvert", "preConvert");
        this.linkElements(tail, preConvert);
        tail = preConvert;

        if (enableNoise) {
            // Try audiornnoise (gst-plugins-rs) first, then rnnoise (gst-plugins-bad)
            let rnnoiseElement = this.tryMakeElement(
                "audiornnoise",
                "audiornnoise",
            );
            let useF32Format = true;

            if (!rnnoiseElement) {
                rnnoiseElement = this.tryMakeElement("rnnoise", "rnnoise");
                useF32Format = false;
            }

            if (rnnoiseElement) {
                const resample = this.makeElement(
                    "audioresample",
                    "rnnoiseResample",
                );
                this.linkElements(tail, resample);
                tail = resample;

                const capsFilter = this.makeElement(
                    "capsfilter",
                    "rnnoiseCaps",
                );
                // audiornnoise uses F32LE, rnnoise uses S16LE
                const rnnoiseCaps = Gst.Caps.from_string(
                    useF32Format
                        ? "audio/x-raw,format=F32LE,channels=1,rate=48000"
                        : "audio/x-raw,format=S16LE,channels=1,rate=48000",
                );
                if (rnnoiseCaps) {
                    capsFilter.set_property("caps", rnnoiseCaps);
                }
                this.linkElements(tail, capsFilter);
                tail = capsFilter;

                this.linkElements(tail, rnnoiseElement);
                tail = rnnoiseElement;

                const postConvert = this.makeElement(
                    "audioconvert",
                    "postConvert",
                );
                this.linkElements(tail, postConvert);
                tail = postConvert;
            } else {
                log(
                    "RNNoise plugin not available - continuing without noise reduction.",
                );
            }
        }

        this.level = this.makeElement("level", "level");
        if (rawCaps) {
            this.linkElements(tail, this.level, rawCaps);
        } else {
            this.linkElements(tail, this.level);
        }

        // Create encodebin and filesink but don't link yet - must link after profile is set in start()
        this.ebin = this.makeElement("encodebin", "ebin");
        this.filesink = this.makeElement("filesink", "filesink");

        this.noiseSuppressionPreference = enableNoise;
        this.pipeState = Gst.State.NULL;
    }

    private makeElement(factory: string, name: string): Gst.Element {
        const element = Gst.ElementFactory.make(factory, name);
        if (!element) {
            throw new Error(`Failed to create element ${factory}`);
        }
        this.pipeline.add(element);
        return element;
    }

    private tryMakeElement(factory: string, name: string): Gst.Element | null {
        const element = Gst.ElementFactory.make(factory, name);
        if (!element) {
            return null;
        }
        this.pipeline.add(element);
        return element;
    }

    private linkElements(
        src: Gst.Element,
        dest: Gst.Element,
        caps?: Gst.Caps | null,
    ): void {
        const success = caps ? src.link_filtered(dest, caps) : src.link(dest);
        if (!success) {
            throw new Error(
                `Failed to link ${src.get_name()} to ${dest.get_name()}`,
            );
        }
    }

    private getChannel(): number {
        const channelIndex = Settings.get_enum("audio-channel");
        return AudioChannels[channelIndex].channels;
    }

    private getProfile(): GstPbutils.EncodingContainerProfile | undefined {
        const profileIndex = Settings.get_enum("audio-profile");
        const profile = EncodingProfiles[profileIndex];

        const audioCaps = Gst.Caps.from_string(profile.audioCaps);
        audioCaps?.set_value("channels", this.getChannel());

        if (audioCaps) {
            const encodingProfile = GstPbutils.EncodingAudioProfile.new(
                audioCaps,
                null,
                null,
                1,
            );
            const containerCaps = Gst.Caps.from_string(profile.containerCaps);
            if (containerCaps) {
                const containerProfile =
                    GstPbutils.EncodingContainerProfile.new(
                        "record",
                        null,
                        containerCaps,
                        null,
                    );
                containerProfile.add_profile(encodingProfile);
                return containerProfile;
            }
        }

        return undefined;
    }

    public get duration(): number {
        return this._duration;
    }

    public set duration(val: number) {
        this._duration = val;
        this.notify("duration");
    }

    public get current_peak(): number {
        return this._current_peak;
    }

    public set current_peak(peak: number) {
        if (this.peaks) {
            // Validate peak value - must be a finite number
            if (!Number.isFinite(peak)) {
                peak = 0;
            }

            const normalizedPeak = Math.pow(10, peak / 20);
            // Ensure the normalized peak is also valid
            if (
                Number.isFinite(normalizedPeak) &&
                normalizedPeak !== this._current_peak
            ) {
                this._current_peak = normalizedPeak;
                this.peaks.push(this._current_peak);
                this.notify("current-peak");
            }
        }
    }

    public get state(): Gst.State | undefined {
        return this.pipeState;
    }

    public set state(s: Gst.State | undefined) {
        this.pipeState = s;
        if (this.pipeState) {
            const ret = this.pipeline.set_state(this.pipeState);
            if (ret === Gst.StateChangeReturn.FAILURE) {
                log("Unable to update the recorder pipeline state");
            }
        }
    }
}
