// Senbrua - A simple, modern sound recorder for GNOME
// Copyright (C) 2024 Senbrua Contributors
// SPDX-License-Identifier: GPL-3.0-or-later
import Gettext from "gettext";
import GLib from "gi://GLib";
import Gst from "gi://Gst";
export function formatTime(nanoSeconds) {
    const time = new Date(0, 0, 0, 0, 0, 0, nanoSeconds / Gst.MSECOND);
    const miliseconds = (time.getMilliseconds() / 100).toString();
    const seconds = time.getSeconds().toString().padStart(2, "0");
    const minutes = time.getMinutes().toString().padStart(2, "0");
    const hours = time.getHours().toString().padStart(2, "0");
    // Using ratio character for visual separator
    return `${hours} ∶ ${minutes} ∶ ${seconds} . <small>${miliseconds}</small>`;
}
export function displayDateTime(time) {
    const DAY = 86400000000;
    const now = GLib.DateTime.new_now_local();
    const difference = now.difference(time);
    const days = Math.floor(difference / DAY);
    const weeks = Math.floor(difference / (7 * DAY));
    const months = Math.floor(difference / (30 * DAY));
    const years = Math.floor(difference / (365 * DAY));
    if (difference < DAY) {
        const formattedTime = time.format("%X");
        return formattedTime ? formattedTime : _("Less than a day ago");
    }
    else if (difference < 2 * DAY) {
        return _("Yesterday");
    }
    else if (difference < 7 * DAY) {
        return Gettext.ngettext("%d day ago", "%d days ago", days).format(days);
    }
    else if (difference < 14 * DAY) {
        return _("Last week");
    }
    else if (difference < 28 * DAY) {
        return Gettext.ngettext("%d week ago", "%d weeks ago", weeks).format(weeks);
    }
    else if (difference < 60 * DAY) {
        return _("Last month");
    }
    else if (difference < 360 * DAY) {
        return Gettext.ngettext("%d month ago", "%d months ago", months).format(months);
    }
    else if (difference < 730 * DAY) {
        return _("Last year");
    }
    return Gettext.ngettext("%d year ago", "%d years ago", years).format(years);
}
