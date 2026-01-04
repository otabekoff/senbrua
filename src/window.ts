// Senbrua - A simple, modern sound recorder for GNOME
// Copyright (C) 2026 Otabek Sadiridinov
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from "gi://Adw";
import Gio from "gi://Gio";
import GObject from "gi://GObject";
import Gst from "gi://Gst";
import GstPlayer from "gi://GstPlayer";
import Gtk from "gi://Gtk?version=4.0";

import { Recorder } from "./recorder.js";
import { Settings } from "./application.js";
import { RecordingList } from "./recordingList.js";
import { RecordingsListWidget } from "./recordingListWidget.js";
import { RecorderWidget } from "./recorderWidget.js";
import { Recording } from "./recording.js";
import { Row } from "./row.js";

enum WindowState {
    Empty,
    List,
    Recorder,
}

export class Window extends Adw.ApplicationWindow {
    private _mainStack!: Gtk.Stack;
    private _emptyPage!: Adw.StatusPage;
    private _column!: Adw.Clamp;
    private _toastOverlay!: Adw.ToastOverlay;
    private _toolbarView!: Adw.ToolbarView;
    private _noiseSwitch!: Gtk.Switch;

    // Theme radio buttons
    private _themeSystemRadio!: Gtk.CheckButton;
    private _themeLightRadio!: Gtk.CheckButton;
    private _themeDarkRadio!: Gtk.CheckButton;

    // Format radio buttons
    private _formatVorbisRadio!: Gtk.CheckButton;
    private _formatOpusRadio!: Gtk.CheckButton;
    private _formatFlacRadio!: Gtk.CheckButton;
    private _formatMp3Radio!: Gtk.CheckButton;

    // Channel radio buttons
    private _channelStereoRadio!: Gtk.CheckButton;
    private _channelMonoRadio!: Gtk.CheckButton;

    private recorder: Recorder;
    private recorderWidget: RecorderWidget;
    private player: GstPlayer.Player;
    private recordingList: RecordingList;
    private itemsSignalId: number;
    private recordingListWidget: RecordingsListWidget;
    private colorSchemeHandler?: number;
    private formatSettingsHandler?: number;
    private channelSettingsHandler?: number;

    private toastUndo: boolean;
    private undoToasts: Adw.Toast[];
    private undoSignalID: number | null;
    private undoAction: Gio.SimpleAction;

    private _state: WindowState;

    static {
        GObject.registerClass(
            {
                Template: "resource:///uz/mohirlab/senbrua/ui/window.ui",
                InternalChildren: [
                    "mainStack",
                    "emptyPage",
                    "column",
                    "toastOverlay",
                    "toolbarView",
                    "noiseSwitch",
                    "themeSystemRadio",
                    "themeLightRadio",
                    "themeDarkRadio",
                    "formatVorbisRadio",
                    "formatOpusRadio",
                    "formatFlacRadio",
                    "formatMp3Radio",
                    "channelStereoRadio",
                    "channelMonoRadio",
                ],
            },
            this,
        );
    }

    constructor(params: Partial<Adw.ApplicationWindow.ConstructorProps>) {
        super(params);

        this.iconName = pkg.name;
        this._state = WindowState.Empty;

        this.recorder = new Recorder();
        this.recorderWidget = new RecorderWidget(this.recorder);
        this._mainStack.add_named(this.recorderWidget, "recorder");

        const dispatcher = GstPlayer.PlayerGMainContextSignalDispatcher.new(
            null,
        );
        this.player = GstPlayer.Player.new(null, dispatcher);
        this.player.connect("end-of-stream", () => this.player.stop());

        this.recordingList = new RecordingList();
        this.itemsSignalId = this.recordingList.connect("items-changed", () => {
            if (this.state !== WindowState.Recorder) {
                if (this.recordingList.get_n_items() === 0) {
                    this.state = WindowState.Empty;
                } else this.state = WindowState.List;
            }
        });

        this.recordingListWidget = new RecordingsListWidget(
            this.recordingList,
            this.player,
        );

        this.recordingListWidget.connect(
            "row-deleted",
            (_listBox: Gtk.ListBox, recording: Recording, index: number) => {
                this.recordingList.remove(index);
                let message: string;
                if (recording.name) {
                    message = _('"%s" deleted').format(recording.name);
                } else {
                    message = _("Recording deleted");
                }
                this.sendNotification(message, recording, index);
            },
        );

        this.toastUndo = false;
        this.undoSignalID = null;
        this.undoToasts = [];
        this.undoAction = new Gio.SimpleAction({ name: "undo" });
        this.add_action(this.undoAction);

        // Setup theme radio buttons
        this.setupThemeRadios();

        // Setup format radio buttons
        this.setupFormatRadios();

        // Setup channel radio buttons
        this.setupChannelRadios();

        Settings.bind(
            "noise-reduction-enabled",
            this._noiseSwitch,
            "active",
            Gio.SettingsBindFlags.DEFAULT,
        );

        this.connect("destroy", () => {
            if (this.colorSchemeHandler) {
                Settings.disconnect(this.colorSchemeHandler);
                this.colorSchemeHandler = undefined;
            }
            if (this.formatSettingsHandler) {
                Settings.disconnect(this.formatSettingsHandler);
                this.formatSettingsHandler = undefined;
            }
            if (this.channelSettingsHandler) {
                Settings.disconnect(this.channelSettingsHandler);
                this.channelSettingsHandler = undefined;
            }
        });
        this._column.set_child(this.recordingListWidget);

        this.recorderWidget.connect(
            "started",
            this.onRecorderStarted.bind(this),
        );
        this.recorderWidget.connect(
            "canceled",
            this.onRecorderCanceled.bind(this),
        );
        this.recorderWidget.connect(
            "stopped",
            this.onRecorderStopped.bind(this),
        );
        this.insert_action_group("recorder", this.recorderWidget.actionsGroup);
        this._emptyPage.icon_name = `${pkg.name}-symbolic`;
    }

    private setupThemeRadios(): void {
        const styleManager = Adw.StyleManager.get_default();

        // Apply saved color scheme on startup
        const savedScheme = Settings.get_enum("color-scheme");
        this.applyColorScheme(savedScheme);

        // Set initial radio state
        switch (savedScheme) {
            case 0:
                this._themeSystemRadio.set_active(true);
                break;
            case 1:
                this._themeLightRadio.set_active(true);
                break;
            case 2:
                this._themeDarkRadio.set_active(true);
                break;
        }

        // Connect radio button signals
        this._themeSystemRadio.connect("toggled", () => {
            if (this._themeSystemRadio.get_active()) {
                Settings.set_enum("color-scheme", 0);
                styleManager.set_color_scheme(Adw.ColorScheme.DEFAULT);
            }
        });

        this._themeLightRadio.connect("toggled", () => {
            if (this._themeLightRadio.get_active()) {
                Settings.set_enum("color-scheme", 1);
                styleManager.set_color_scheme(Adw.ColorScheme.FORCE_LIGHT);
            }
        });

        this._themeDarkRadio.connect("toggled", () => {
            if (this._themeDarkRadio.get_active()) {
                Settings.set_enum("color-scheme", 2);
                styleManager.set_color_scheme(Adw.ColorScheme.FORCE_DARK);
            }
        });

        // Listen for external changes
        this.colorSchemeHandler = Settings.connect(
            "changed::color-scheme",
            () => {
                const scheme = Settings.get_enum("color-scheme");
                this.applyColorScheme(scheme);
                switch (scheme) {
                    case 0:
                        this._themeSystemRadio.set_active(true);
                        break;
                    case 1:
                        this._themeLightRadio.set_active(true);
                        break;
                    case 2:
                        this._themeDarkRadio.set_active(true);
                        break;
                }
            },
        );
    }

    private applyColorScheme(scheme: number): void {
        const styleManager = Adw.StyleManager.get_default();
        switch (scheme) {
            case 0:
                styleManager.set_color_scheme(Adw.ColorScheme.DEFAULT);
                break;
            case 1:
                styleManager.set_color_scheme(Adw.ColorScheme.FORCE_LIGHT);
                break;
            case 2:
                styleManager.set_color_scheme(Adw.ColorScheme.FORCE_DARK);
                break;
        }
    }

    private setupFormatRadios(): void {
        const formatRadios = [
            this._formatVorbisRadio,
            this._formatOpusRadio,
            this._formatFlacRadio,
            this._formatMp3Radio,
        ];

        // Set initial state
        const savedFormat = Settings.get_enum("audio-profile");
        if (savedFormat >= 0 && savedFormat < formatRadios.length) {
            formatRadios[savedFormat].set_active(true);
        }

        // Connect signals
        formatRadios.forEach((radio, index) => {
            radio.connect("toggled", () => {
                if (radio.get_active()) {
                    Settings.set_enum("audio-profile", index);
                }
            });
        });

        // Listen for external changes
        this.formatSettingsHandler = Settings.connect(
            "changed::audio-profile",
            () => {
                const format = Settings.get_enum("audio-profile");
                if (format >= 0 && format < formatRadios.length) {
                    formatRadios[format].set_active(true);
                }
            },
        );
    }

    private setupChannelRadios(): void {
        const channelRadios = [
            this._channelStereoRadio,
            this._channelMonoRadio,
        ];

        // Set initial state
        const savedChannel = Settings.get_enum("audio-channel");
        if (savedChannel >= 0 && savedChannel < channelRadios.length) {
            channelRadios[savedChannel].set_active(true);
        }

        // Connect signals
        channelRadios.forEach((radio, index) => {
            radio.connect("toggled", () => {
                if (radio.get_active()) {
                    Settings.set_enum("audio-channel", index);
                }
            });
        });

        // Listen for external changes
        this.channelSettingsHandler = Settings.connect(
            "changed::audio-channel",
            () => {
                const channel = Settings.get_enum("audio-channel");
                if (channel >= 0 && channel < channelRadios.length) {
                    channelRadios[channel].set_active(true);
                }
            },
        );
    }

    public vfunc_close_request(): boolean {
        this.dismissUndoToasts();
        this.recordingList.cancellable.cancel();
        if (this.itemsSignalId) {
            this.recordingList.disconnect(this.itemsSignalId);
        }

        for (let i = 0; i < this.recordingList.get_n_items(); i++) {
            const recording = this.recordingList.get_item(i) as Recording;
            if (recording.pipeline) {
                recording.pipeline.set_state(Gst.State.NULL);
            }
        }

        this.recorder.stop();
        return false;
    }

    dismissUndoToasts() {
        this.undoToasts.forEach((toast) => toast.dismiss());
    }

    private onRecorderStarted(): void {
        this.player.stop();

        const activeRow = this.recordingListWidget.activeRow;
        if (activeRow && activeRow.editMode) activeRow.editMode = false;

        this.state = WindowState.Recorder;
    }

    private onRecorderCanceled(): void {
        if (this.recordingList.get_n_items() === 0) {
            this.state = WindowState.Empty;
        } else this.state = WindowState.List;
    }

    private onRecorderStopped(
        _widget: RecorderWidget,
        recording: Recording,
    ): void {
        this.recordingList.insert(0, recording);
        const row = this.recordingListWidget.list.get_row_at_index(0) as Row;
        row.editMode = true;
        this.state = WindowState.List;
    }

    private sendNotification(
        message: string,
        recording: Recording,
        index: number,
    ): void {
        const toast = Adw.Toast.new(message);
        toast.connect("dismissed", () => {
            if (!this.toastUndo) void recording.delete();

            this.toastUndo = false;
            this.undoToasts = this.undoToasts.filter(
                (undoToast) => undoToast.title !== toast.title,
            );
        });

        if (this.undoSignalID !== null) {
            this.undoAction.disconnect(this.undoSignalID);
        }

        this.undoSignalID = this.undoAction.connect("activate", () => {
            this.recordingList.insert(index, recording);
            this.toastUndo = true;
        });

        toast.set_action_name("win.undo");
        toast.set_button_label(_("Undo"));
        this._toastOverlay.add_toast(toast);
        this.undoToasts.push(toast);
    }

    public set state(state: WindowState) {
        let visibleChild: string;
        let isHeaderVisible = true;

        switch (state) {
            case WindowState.Recorder:
                visibleChild = "recorder";
                isHeaderVisible = false;
                break;
            case WindowState.List:
                visibleChild = "recordings";
                break;
            case WindowState.Empty:
                visibleChild = "empty";
                break;
        }

        this._mainStack.visible_child_name = visibleChild;
        this._toolbarView.reveal_top_bars = isHeaderVisible;
        this._state = state;
    }

    public get state(): WindowState {
        return this._state;
    }
}
