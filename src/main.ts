// Senbrua - A simple, modern sound recorder for GNOME
// Copyright (C) 2024 Senbrua Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import { Application } from "./application.js";

export function main(argv: string[]): Promise<number> {
    const app = new Application();
    return app.runAsync(argv);
}
