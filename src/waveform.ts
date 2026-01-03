// Senbrua - A simple, modern sound recorder for GNOME
// Copyright (C) 2024 Senbrua Contributors
// SPDX-License-Identifier: GPL-3.0-or-later
// Based on code from Pitivi

import Adw from "gi://Adw";
import GObject from "gi://GObject";
import Gdk from "gi://Gdk?version=4.0";
import Gtk from "gi://Gtk?version=4.0";
import Cairo from "cairo";

export enum WaveType {
    Recorder,
    Player,
}

const GUTTER = 4;

export class WaveForm extends Gtk.DrawingArea {
    private _peaks: number[];
    private _position: number;
    private dragGesture?: Gtk.GestureDrag;
    private hcId: number;
    private accentId: number;
    private lastX?: number;

    private waveType: WaveType;

    static {
        GObject.registerClass(
            {
                Properties: {
                    position: GObject.ParamSpec.float(
                        "position",
                        "Waveform position",
                        "Waveform position",
                        GObject.ParamFlags.READWRITE |
                            GObject.ParamFlags.CONSTRUCT,
                        0.0,
                        1.0,
                        0.0,
                    ),
                    peak: GObject.ParamSpec.float(
                        "peak",
                        "Waveform current peak",
                        "Waveform current peak in float [0, 1]",
                        GObject.ParamFlags.READWRITE |
                            GObject.ParamFlags.CONSTRUCT,
                        0.0,
                        1.0,
                        0.0,
                    ),
                },
                Signals: {
                    "position-changed": { param_types: [GObject.TYPE_DOUBLE] },
                    "gesture-pressed": {},
                },
            },
            this,
        );
    }

    constructor(
        params: Partial<Gtk.DrawingArea.ConstructorProps> | undefined,
        type: WaveType,
    ) {
        super(params);
        this._peaks = [];
        this._position = 0;
        this.waveType = type;

        if (this.waveType === WaveType.Player) {
            this.dragGesture = Gtk.GestureDrag.new();
            this.dragGesture.connect("drag-begin", this.dragBegin.bind(this));
            this.dragGesture.connect("drag-update", this.dragUpdate.bind(this));
            this.dragGesture.connect("drag-end", this.dragEnd.bind(this));
            this.add_controller(this.dragGesture);
        }

        const styleManager = Adw.StyleManager.get_default();
        this.hcId = styleManager.connect("notify::high-contrast", () => {
            this.queue_draw();
        });
        this.accentId = styleManager.connect("notify::accent-color", () => {
            this.queue_draw();
        });

        // @ts-expect-error ts-for-gir doesn't handle the cairo Context properly
        this.set_draw_func(this.drawFunc.bind(this));
    }

    private dragBegin(gesture: Gtk.GestureDrag): void {
        gesture.set_state(Gtk.EventSequenceState.CLAIMED);
        this.emit("gesture-pressed");
    }

    private dragUpdate(_gesture: Gtk.GestureDrag, offsetX: number): void {
        if (this.lastX !== undefined) {
            this._position = this.clamped(offsetX + this.lastX);
            this.queue_draw();
        }
    }

    private dragEnd(): void {
        this.lastX = this._position;
        this.emit("position-changed", this.position);
    }

    private drawFunc(superDa: Gtk.DrawingArea, ctx: Cairo.Context) {
        const da = superDa as WaveForm;
        const maxHeight = da.get_allocated_height();
        const vertiCenter = maxHeight / 2;
        const horizCenter = da.get_allocated_width() / 2;

        let pointer = horizCenter + da._position;

        const styleManager = Adw.StyleManager.get_default();

        const leftColor = da.get_color();
        const rightColor = da.get_color();
        rightColor.alpha *= styleManager.high_contrast ? 0.9 : 0.55;

        let dividerColor;

        if (da.waveType === WaveType.Player) {
            const accent = styleManager.accent_color;
            const dark = styleManager.dark;
            dividerColor = Adw.accent_color_to_standalone_rgba(accent, dark);
        } else {
            const styleContext = da.get_style_context();
            const lookupColor = styleContext.lookup_color("destructive_color");
            const ok = lookupColor[0];
            dividerColor = lookupColor[1];
            if (!ok) dividerColor = da.get_color();
        }

        ctx.setLineCap(Cairo.LineCap.SQUARE);
        ctx.setAntialias(Cairo.Antialias.NONE);
        ctx.setLineWidth(1);

        this.setSourceRGBA(ctx, dividerColor);

        ctx.moveTo(horizCenter, vertiCenter - maxHeight);
        ctx.lineTo(horizCenter, vertiCenter + maxHeight);
        ctx.stroke();

        ctx.setLineWidth(2);

        for (const peak of da._peaks) {
            // Skip invalid peaks (NaN, undefined, etc.)
            if (!Number.isFinite(peak)) {
                if (da.waveType === WaveType.Player) pointer += GUTTER;
                else pointer -= GUTTER;
                continue;
            }

            // Don't try to render peaks outside the widget's width
            if (pointer > da.get_allocated_width()) {
                break;
            }

            // Don't try to draw peaks before the widget's left edge
            if (pointer > 0) {
                if (da.waveType === WaveType.Player && pointer > horizCenter) {
                    this.setSourceRGBA(ctx, rightColor);
                } else this.setSourceRGBA(ctx, leftColor);

                ctx.moveTo(pointer, vertiCenter + peak * maxHeight);
                ctx.lineTo(pointer, vertiCenter - peak * maxHeight);
                ctx.stroke();
            }

            if (da.waveType === WaveType.Player) pointer += GUTTER;
            else pointer -= GUTTER;
        }
    }

    public set peak(p: number) {
        if (this._peaks) {
            if (
                this._peaks.length > this.get_allocated_width() / (2 * GUTTER)
            ) {
                this._peaks.pop();
            }

            // Validate and normalize the peak value
            let numPeak = Number(p);

            // If it's not a finite number, use 0
            if (!Number.isFinite(numPeak)) {
                numPeak = 0;
            } else {
                // Clamp peak to [0, 1] range
                numPeak = Math.max(0, Math.min(1, numPeak));
                // Round to 2 decimal places but keep as number
                numPeak = Math.round(numPeak * 100) / 100;
            }

            this._peaks.unshift(numPeak);
            this.queue_draw();
        }
    }

    public set peaks(p: number[]) {
        // Filter out any invalid values
        this._peaks = p.filter((val) => Number.isFinite(val));
        this.queue_draw();
    }

    public set position(pos: number) {
        if (this._peaks) {
            this._position = this.clamped(-pos * this._peaks.length * GUTTER);
            this.lastX = this._position;
            this.queue_draw();
            this.notify("position");
        }
    }

    public get position(): number {
        return -this._position / (this._peaks.length * GUTTER);
    }

    private clamped(position: number): number {
        if (position > 0) position = 0;
        else if (position < -this._peaks.length * GUTTER) {
            position = -this._peaks.length * GUTTER;
        }

        return position;
    }

    private setSourceRGBA(cr: Cairo.Context, rgba: Gdk.RGBA): void {
        cr.setSourceRGBA(rgba.red, rgba.green, rgba.blue, rgba.alpha);
    }

    public destroy(): void {
        Adw.StyleManager.get_default().disconnect(this.hcId);
        Adw.StyleManager.get_default().disconnect(this.accentId);
        this._peaks.length = 0;
        this.queue_draw();
    }
}
