// Senbrua - A simple, modern sound recorder for GNOME
// Copyright (C) 2026 Otabek Sadiridinov
// SPDX-License-Identifier: GPL-3.0-or-later
var _a;
import Adw from "gi://Adw";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import GObject from "gi://GObject";
import Gst from "gi://Gst";
import Gtk from "gi://Gtk?version=4.0";
import { Window } from "./window.js";
export const RecordingsDir = Gio.file_new_for_path(GLib.build_filenamev([GLib.get_user_data_dir(), pkg.name]));
export const CacheDir = Gio.file_new_for_path(GLib.build_filenamev([GLib.get_user_cache_dir(), pkg.name]));
export const Settings = new Gio.Settings({ schema: pkg.name });
export class Application extends Adw.Application {
    constructor() {
        super({
            application_id: pkg.name,
            resource_base_path: "/uz/mohirlab/senbrua/",
        });
        GLib.set_application_name(_("Senbrua"));
        GLib.setenv("PULSE_PROP_media.role", "production", true);
        GLib.setenv("PULSE_PROP_application.icon_name", pkg.name, true);
        this.add_main_option("version", "v".charCodeAt(0), GLib.OptionFlags.NONE, GLib.OptionArg.NONE, "Print version information and exit", null);
        this.connect("handle-local-options", (_, options) => {
            if (options.contains("version")) {
                print(pkg.version);
                return 0;
            }
            return -1;
        });
        // Promisify async methods
        Gio._promisify(Gio.File.prototype, "trash_async", "trash_finish");
        Gio._promisify(Gio.File.prototype, "load_bytes_async", "load_bytes_finish");
        Gio._promisify(Gio.File.prototype, "enumerate_children_async", "enumerate_children_finish");
        Gio._promisify(Gio.FileEnumerator.prototype, "next_files_async", "next_files_finish");
    }
    initAppMenu() {
        const profileAction = Settings.create_action("audio-profile");
        this.add_action(profileAction);
        const channelAction = Settings.create_action("audio-channel");
        this.add_action(channelAction);
        const noiseAction = Settings.create_action("noise-reduction-enabled");
        this.add_action(noiseAction);
        const aboutAction = new Gio.SimpleAction({ name: "about" });
        aboutAction.connect("activate", this.showAbout.bind(this));
        this.add_action(aboutAction);
        const quitAction = new Gio.SimpleAction({ name: "quit" });
        quitAction.connect("activate", () => {
            if (this.window) {
                this.window.close();
            }
        });
        this.add_action(quitAction);
        // Keyboard shortcuts
        this.set_accels_for_action("app.quit", ["<Primary>q"]);
        this.set_accels_for_action("win.show-help-overlay", [
            "<Primary>question",
        ]);
        this.set_accels_for_action("recorder.start", ["<Primary>r"]);
        this.set_accels_for_action("recorder.pause", ["space"]);
        this.set_accels_for_action("recorder.resume", ["space"]);
        this.set_accels_for_action("recorder.cancel", ["Delete"]);
        this.set_accels_for_action("recorder.stop", ["s"]);
        this.set_accels_for_action("recording.play", ["space"]);
        this.set_accels_for_action("recording.pause", ["space"]);
        this.set_accels_for_action("recording.seek-backward", ["b"]);
        this.set_accels_for_action("recording.seek-forward", ["n"]);
        this.set_accels_for_action("recording.rename", ["F2"]);
        this.set_accels_for_action("recording.delete", ["Delete"]);
        this.set_accels_for_action("recording.export", ["<Primary>s"]);
    }
    initUserDirectory(dir) {
        try {
            dir.make_directory_with_parents(null);
        }
        catch (e) {
            if (e instanceof GLib.Error &&
                !e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS)) {
                console.error(`Failed to create directory: ${e.message}`);
            }
        }
    }
    vfunc_startup() {
        super.vfunc_startup();
        log("Senbrua (%s)".format(pkg.name));
        log("Version: %s".format(pkg.version));
        Gst.init(null);
        this.initUserDirectory(CacheDir);
        this.initUserDirectory(RecordingsDir);
        this.initAppMenu();
    }
    vfunc_activate() {
        if (!this.window) {
            this.window = new Window({ application: this });
            if (pkg.name.endsWith("Devel")) {
                this.window.add_css_class("devel");
            }
        }
        this.window.present();
    }
    showAbout() {
        let appName = GLib.get_application_name();
        if (!appName)
            appName = _("Senbrua");
        const aboutDialog = new Adw.AboutDialog({
            application_name: appName,
            application_icon: pkg.name,
            version: pkg.version,
            website: "https://github.com/otabekoff/senbrua",
            issue_url: "https://github.com/otabekoff/senbrua/issues",
            license_type: Gtk.License.GPL_3_0,
            developers: [
                "Otabek Sadiridinov <sadiridinovotabek@gmail.com>",
            ],
            designers: [
                "Reda Lazri <the.red.shortcut@gmail.com>",
                "Garrett LaSage <garrettl@gmail.com>",
                "Hylke Bons <hylkebons@gmail.com>",
            ],
            copyright: "Copyright © 2026 Otabek Sadiridinov",
            translator_credits: _("translator-credits"),
            comments: _("A modern remake of Vocalis, the elegant GNOME sound recorder with advanced noise cancellation."),
        });
        aboutDialog.add_credit_section(_("Original Authors"), [
            "Christopher Davis <christopherdavis@gnome.org>",
            "Meg Ford <megford@gnome.org>",
        ]);
        aboutDialog.add_credit_section(_("Based On"), [
            "Vocalis https://gitlab.gnome.org/World/vocalis",
            "GNOME Sound Recorder https://gitlab.gnome.org/GNOME/gnome-sound-recorder",
        ]);
        aboutDialog.add_credit_section(_("Brought to you by"), [
            "MohirLab https://mohirlab.uz",
        ]);
        aboutDialog.add_legal_section("MohirLab", null, Gtk.License.CUSTOM, _("An open source company and community dedicated to building free and accessible software for everyone."));
        aboutDialog.present(this.window);
    }
}
_a = Application;
(() => {
    GObject.registerClass(_a);
})();
