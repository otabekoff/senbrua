// Senbrua - A simple, modern sound recorder for GNOME
// Copyright (C) 2024 Senbrua Contributors
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
    private _formatDropdown!: Gtk.DropDown;
    private _channelDropdown!: Gtk.DropDown;
    private _noiseSwitch!: Gtk.Switch;

    private recorder: Recorder;
    private recorderWidget: RecorderWidget;
    private player: GstPlayer.Player;
    private recordingList: RecordingList;
    private itemsSignalId: number;
    private recordingListWidget: RecordingsListWidget;
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
                Template: "resource:///io/github/senbrua/ui/window.ui",
                InternalChildren: [
                    "mainStack",
                    "emptyPage",
                    "column",
                    "toastOverlay",
                    "toolbarView",
                    "formatDropdown",
                    "channelDropdown",
                    "noiseSwitch",
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

        const dispatcher =
            GstPlayer.PlayerGMainContextSignalDispatcher.new(null);
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

        const formatStrings = Gtk.StringList.new([
            _("Vorbis"),
            _("Opus"),
            _("FLAC"),
            _("MP3"),
        ]);
        this._formatDropdown.set_model(formatStrings);
        this._formatDropdown.set_selected(Settings.get_enum("audio-profile"));

        let updatingFormat = false;
        this._formatDropdown.connect("notify::selected", () => {
            if (updatingFormat) return;
            updatingFormat = true;
            const selected = this._formatDropdown.get_selected();
            if (selected >= 0) {
                Settings.set_enum("audio-profile", selected);
            }
            updatingFormat = false;
        });

        this.formatSettingsHandler = Settings.connect(
            "changed::audio-profile",
            () => {
                updatingFormat = true;
                this._formatDropdown.set_selected(
                    Settings.get_enum("audio-profile"),
                );
                updatingFormat = false;
            },
        );

        const channelStrings = Gtk.StringList.new([_("Stereo"), _("Mono")]);
        this._channelDropdown.set_model(channelStrings);
        this._channelDropdown.set_selected(Settings.get_enum("audio-channel"));

        let updatingChannel = false;
        this._channelDropdown.connect("notify::selected", () => {
            if (updatingChannel) return;
            updatingChannel = true;
            const selected = this._channelDropdown.get_selected();
            if (selected >= 0) {
                Settings.set_enum("audio-channel", selected);
            }
            updatingChannel = false;
        });

        this.channelSettingsHandler = Settings.connect(
            "changed::audio-channel",
            () => {
                updatingChannel = true;
                this._channelDropdown.set_selected(
                    Settings.get_enum("audio-channel"),
                );
                updatingChannel = false;
            },
        );

        Settings.bind(
            "noise-reduction-enabled",
            this._noiseSwitch,
            "active",
            Gio.SettingsBindFlags.DEFAULT,
        );

        this.connect("destroy", () => {
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
