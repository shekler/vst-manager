# Electron App Icons

This directory contains the icon files for the Electron app. Replace the placeholder files with your actual icons:

## Required Icon Files:

1. **icon.png** - Main icon (512x512 pixels) - Used for Linux and as fallback
2. **icon.ico** - Windows icon (256x256 pixels minimum) - Used for Windows builds
3. **icon.icns** - macOS icon (1024x1024 pixels) - Used for macOS builds

## Icon Requirements:

- **Windows (.ico)**: Should be 256x256 pixels minimum, can contain multiple sizes (16x16, 32x32, 48x48, 256x256)
- **macOS (.icns)**: Should be 1024x1024 pixels
- **Linux (.png)**: Should be 512x512 pixels

## How to Create Icons:

1. **Online converters**: Use tools like https://convertio.co/ or https://www.icoconverter.com/
2. **Design tools**: Use Photoshop, GIMP, or Figma to create your icon
3. **Icon generators**: Use tools like https://www.electron.build/icons

## Building with Icons:

After adding your icon files, run:
```bash
npm run build
```

This will create platform-specific builds with your custom icons. 