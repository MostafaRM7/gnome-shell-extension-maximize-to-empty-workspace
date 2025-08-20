/* extension.js
 *
 * Maximize To Empty Workspace Extension (Patched for GNOME 46)
 *
 * Original work Copyright (C) 2019 kaiseracm
 * Modified work Copyright (C) 2025 MostafaRM7
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import Meta from 'gi://Meta';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const _handles = [];
const _windowids_maximized = {};
const _windowids_size_change = {};

let _displayConfigChangeInProgress = false;
let _displayHandle = null;

export default class Extension {
    constructor() {}

    markDisplayConfigChange() {
        _displayConfigChangeInProgress = true;

        // بعد از 3 ثانیه دوباره اجازه بده اکستنشن کار کنه
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => {
            _displayConfigChangeInProgress = false;
            return GLib.SOURCE_REMOVE;
        });
    }

    getFirstFreeMonitor(manager, mMonitor) {
        const n = manager.get_n_workspaces();
        for (let i = 0; i < n; i++) {
            let win_count = manager.get_workspace_by_index(i).list_windows()
                .filter(w => !w.is_always_on_all_workspaces() && w.get_monitor() === mMonitor).length;
            if (win_count < 1)
                return i;
        }
        return -1;
    }

    getLastOcupiedMonitor(manager, nCurrent, mMonitor) {
        for (let i = nCurrent - 1; i >= 0; i--) {
            let win_count = manager.get_workspace_by_index(i).list_windows()
                .filter(w => !w.is_always_on_all_workspaces() && w.get_monitor() === mMonitor).length;
            if (win_count > 0)
                return i;
        }
        const n = manager.get_n_workspaces();
        for (let i = nCurrent + 1; i < n; i++) {
            let win_count = manager.get_workspace_by_index(i).list_windows()
                .filter(w => !w.is_always_on_all_workspaces() && w.get_monitor() === mMonitor).length;
            if (win_count > 0)
                return i;
        }
        return -1;
    }

    placeOnWorkspace(win) {
        if (_displayConfigChangeInProgress)
            return;

        // جلوگیری از دستکاری خود gjs
        if (win.get_wm_class() === 'gjs')
            return;

        const mMonitor = win.get_monitor();
        const manager = win.get_display().get_workspace_manager();
        const current = manager.get_active_workspace_index();

        const wList = win.get_workspace().list_windows()
            .filter(w => w !== win && !w.is_always_on_all_workspaces() && w.get_monitor() === mMonitor);

        if (wList.length >= 1) {
            const firstfree = this.getFirstFreeMonitor(manager, mMonitor);
            if (firstfree === -1 || current === firstfree)
                return;

            // safe reorder
            if (current < firstfree) {
                manager.reorder_workspace(manager.get_workspace_by_index(firstfree), current);
                wList.forEach(w => { w.change_workspace_by_index(current, false); });
                _windowids_maximized[win.get_id()] = "reorder";
            } else if (current > firstfree) {
                manager.reorder_workspace(manager.get_workspace_by_index(current), firstfree);
                wList.forEach(w => { w.change_workspace_by_index(current, false); });
                _windowids_maximized[win.get_id()] = "reorder";
            }
        }
    }

    backto(win) {
        if (_displayConfigChangeInProgress)
            return;

        if (!(win.get_id() in _windowids_maximized))
            return;

        delete _windowids_maximized[win.get_id()];

        const mMonitor = win.get_monitor();
        const manager = win.get_display().get_workspace_manager();
        const current = manager.get_active_workspace_index();

        // جلوگیری از دستکاری خود gjs
        if (win.get_wm_class() === 'gjs')
            return;

        const lastocupied = this.getLastOcupiedMonitor(manager, current, mMonitor);
        if (lastocupied === -1 || current === lastocupied)
            return;

        manager.reorder_workspace(manager.get_workspace_by_index(current), lastocupied);
    }

    window_manager_map(act) {
        const win = act.meta_window;
        if (win.window_type !== Meta.WindowType.NORMAL)
            return;
        if (win.get_maximized() !== Meta.MaximizeFlags.BOTH)
            return;
        if (win.is_always_on_all_workspaces())
            return;
        this.placeOnWorkspace(win);
    }

    window_manager_destroy(act) {
        const win = act.meta_window;
        if (win.window_type !== Meta.WindowType.NORMAL)
            return;
        this.backto(win);
    }

    window_manager_size_change(act, change, rectold) {
        const win = act.meta_window;
        if (win.window_type !== Meta.WindowType.NORMAL)
            return;
        if (win.is_always_on_all_workspaces())
            return;

        if (change === Meta.SizeChange.MAXIMIZE) {
            if (win.get_maximized() === Meta.MaximizeFlags.BOTH)
                _windowids_size_change[win.get_id()] = "place";
        } else if (change === Meta.SizeChange.FULLSCREEN) {
            _windowids_size_change[win.get_id()] = "place";
        } else if (change === Meta.SizeChange.UNMAXIMIZE) {
            const rectmax = win.get_work_area_for_monitor(win.get_monitor());
            if (rectmax.equal(rectold))
                _windowids_size_change[win.get_id()] = "back";
        } else if (change === Meta.SizeChange.UNFULLSCREEN) {
            if (win.get_maximized() !== Meta.MaximizeFlags.BOTH)
                _windowids_size_change[win.get_id()] = "back";
        }
    }

    window_manager_minimize(act) {
        const win = act.meta_window;
        if (win.window_type !== Meta.WindowType.NORMAL)
            return;
        if (win.is_always_on_all_workspaces())
            return;
        this.backto(win);
    }

    window_manager_unminimize(act) {
        const win = act.meta_window;
        if (win.window_type !== Meta.WindowType.NORMAL)
            return;
        if (win.get_maximized() !== Meta.MaximizeFlags.BOTH)
            return;
        if (win.is_always_on_all_workspaces())
            return;
        this.placeOnWorkspace(win);
    }

    window_manager_size_changed(act) {
        const win = act.meta_window;
        if (win.get_id() in _windowids_size_change) {
            if (_windowids_size_change[win.get_id()] === "place") {
                this.placeOnWorkspace(win);
            } else if (_windowids_size_change[win.get_id()] === "back") {
                this.backto(win);
            }
            delete _windowids_size_change[win.get_id()];
        }
    }

    enable() {
        this._mutterSettings = new Gio.Settings({ schema_id: 'org.gnome.mutter' });

        try {
            _displayHandle = Main.layoutManager.connect('monitors-changed', () => {
                this.markDisplayConfigChange();
            });
        } catch (error) {
            console.log('MaximizeToEmptyWorkspace: Could not connect monitors-changed signal:', error);
            _displayHandle = null;
        }

        _handles.push(global.window_manager.connect('minimize', (_, act) => {this.window_manager_minimize(act);}));
        _handles.push(global.window_manager.connect('unminimize', (_, act) => {this.window_manager_unminimize(act);}));
        _handles.push(global.window_manager.connect('size-changed', (_, act) => {this.window_manager_size_changed(act);}));
        _handles.push(global.window_manager.connect('map', (_, act) => {this.window_manager_map(act);}));
        _handles.push(global.window_manager.connect('destroy', (_, act) => {this.window_manager_destroy(act);}));
        _handles.push(global.window_manager.connect('size-change', (_, act, change, rectold) => {this.window_manager_size_change(act, change, rectold);}));
    }

    disable() {
        _handles.splice(0).forEach(h => global.window_manager.disconnect(h));

        if (_displayHandle) {
            try {
                Main.layoutManager.disconnect(_displayHandle);
            } catch (error) {
                console.log('MaximizeToEmptyWorkspace: Could not disconnect monitors-changed signal:', error);
            }
            _displayHandle = null;
        }

        _displayConfigChangeInProgress = false;
        this._mutterSettings = null;
    }
}
