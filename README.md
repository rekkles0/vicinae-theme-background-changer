# 🎨 Omarchy Theme & Wallpaper Changer

A beautiful [Vicinae](https://github.com/vicinaehq/vicinae) extension for managing your Omarchy themes and wallpapers with style.

![Vicinae Extension](https://img.shields.io/badge/Vicinae-Extension-6366f1?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## ✨ Features

- **🖼️ Visual Grid** — Browse themes and wallpapers in a beautiful grid layout
- **⚡ Quick Switch** — Apply themes and wallpapers instantly
- **🔍 Smart Search** — Filter by type (Themes / Wallpapers / All)
- **📍 Set Defaults** — Pin your favorite wallpaper as default
- **🔄 Multi-Source** — Scans all theme directories automatically

## 📂 Theme Locations

The extension searches for themes in:

```
~/.config/omarchy/themes     (user)
~/.local/share/omarchy/themes (local)
/usr/share/omarchy/themes    (system)
/etc/omarchy/themes          (global)
```

Wallpapers are loaded from the current theme:
```
~/.config/omarchy/current/theme/backgrounds/
```

## 🚀 Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. The extension will be available in Vicinae

## 🛠️ Development

```bash
# Hot-reload development
npm run dev

# Lint check
npm run lint

# Format code
npm run format
```

## ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Apply Theme/Wallpaper | `Enter` |
| Set as Default | `Cmd + D` |
| Open in File Manager | `Cmd + O` |
| Copy Path | `Cmd + Shift + C` |
| Refresh | `Cmd + R` |

## 📝 Adding Theme Previews

Add a `preview.png` to each theme's root directory for visual previews:

```
~/.config/omarchy/themes/
├── catppuccin/
│   ├── preview.png  ← Add this!
│   └── ...
├── everforest/
│   ├── preview.png
│   └── ...
```

## 📄 License

MIT © [r3kkles](https://github.com/rekkles0)
