# Maximize To Empty Workspace Extension

New and maximized windows will be moved to empty workspaces. Supports multiple monitors.

## Features

- Automatically moves newly maximized windows to empty workspaces
- Supports multiple monitor setups
- Compatible with GNOME Shell 45 and 46
- **Fixed**: Monitor activation bug that previously caused window minimization

## Recent Changes (v15)

- **Bug Fix**: Fixed issue where connecting/activating a second monitor would cause applications on the main screen to minimize
- **Improvement**: Added display configuration change detection to prevent unwanted window movements during monitor setup
- **Enhancement**: Better stability when monitors turn on/off or change configuration

## Installation

1. Copy the extension directory to `~/.local/share/gnome-shell/extensions/`
2. Restart GNOME Shell (Alt+F2, type 'r', press Enter)
3. Enable the extension using GNOME Extensions app or via command line:
   ```bash
   gnome-extensions enable MaximizeToEmptyWorkspace-extension@MostafaRM7.github.io
   ```

## Compatibility

- GNOME Shell 45
- GNOME Shell 46
- Ubuntu 24.04 and newer
- Other GNOME-based distributions

## License

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

## Credits

- **Original Author**: [kaiseracm](https://github.com/kaiseracm/gnome-shell-extension-maximize-to-empty-workspace)
- **Based on**: [Maximize To Workspace With History](https://github.com/raonetwo/MaximizeToWorkspace) by raonetwo
- **Maintained by**: MostafaRM7
- **Bug Fix Contributors**: MostafaRM7

## Contributing

Feel free to submit issues and pull requests. This extension is actively maintained and updated for newer GNOME Shell versions.
