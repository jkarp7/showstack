# App Icons and Resources

This directory contains assets needed for building distributable packages.

## Required Files

Before building your app for distribution, you need to create the following icon files:

### macOS
- **icon.icns** - 512x512 icon in ICNS format
  - Tools: [Image2Icon](https://img2icnsapp.com/), [IconUtil](https://developer.apple.com/library/archive/documentation/GraphicsAnimation/Conceptual/HighResolutionOSX/Optimizing/Optimizing.html)

### Windows
- **icon.ico** - Multi-resolution ICO file (16x16, 32x32, 48x48, 256x256)
  - Tools: [IcoFX](https://icofx.ro/), [Convertio](https://convertio.co/png-ico/)

### Linux
- **icon.png** - 512x512 PNG file

### Optional
- **dmg-background.png** - 540x400 PNG for macOS installer background

## Creating Icons

1. Design your app icon at 1024x1024 resolution
2. Export as PNG
3. Use the tools above to convert to platform-specific formats
4. Place files in this directory

## Icon Design Guidelines

- Use a simple, recognizable design
- Ensure it looks good at small sizes (16x16)
- Use high contrast for visibility
- Avoid text if possible (becomes unreadable at small sizes)
- Test on light and dark backgrounds

## Example Icon Creation Workflow

```bash
# macOS (using iconutil)
mkdir icon.iconset
sips -z 16 16     icon-1024.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon-1024.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon-1024.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon-1024.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon-1024.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon-1024.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon-1024.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon-1024.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon-1024.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon-1024.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
```

## Placeholder Icons

For testing purposes, electron-builder can generate basic icons, but they won't look professional. Always create proper icons before sharing with testers.
