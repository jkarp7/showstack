# Alpha Release Guide for ShowStack:Production

This guide explains how to create and distribute alpha releases of ShowStack:Production via GitHub Releases.

---

## Prerequisites

### 1. Install Dependencies

```bash
npm install
cd proof-of-concept && npm install && cd ..
```

### 2. Create App Icons (Required for Distribution)

You'll need to create icon files in the `resources/` directory:

**macOS:**
- `resources/icon.icns` - 512x512 icon in .icns format
- Use a tool like [Image2Icon](https://img2icnsapp.com/) or [IconUtil](https://developer.apple.com/library/archive/documentation/GraphicsAnimation/Conceptual/HighResolutionOSX/Optimizing/Optimizing.html)

**Windows:**
- `resources/icon.ico` - Multi-resolution .ico file (16x16, 32x32, 48x48, 256x256)
- Use [IcoFX](https://icofx.ro/) or [Convertio](https://convertio.co/png-ico/)

**Linux:**
- `resources/icon.png` - 512x512 PNG file

**Optional DMG Background (macOS):**
- `resources/dmg-background.png` - 540x400 PNG for installer background

---

## Building Your App

### Option 1: Build for Current Platform Only (Fastest)

```bash
# macOS
npm run dist:mac

# Windows
npm run dist:win

# Linux
npm run dist:linux
```

Output will be in `release/` directory.

### Option 2: Build for All Platforms (Requires macOS for .dmg)

```bash
npm run dist:all
```

**Note:** Building for all platforms from a single OS has limitations:
- macOS .dmg requires macOS
- Windows .exe can be built from macOS/Linux (with wine)
- Linux packages can be built from any OS

---

## Creating a GitHub Release (Manual - Alpha)

### Step 1: Build the App

```bash
# Build for your platform
npm run dist:mac

# Output files will be in release/
```

### Step 2: Test the Build Locally

Before uploading, test the installer:

**macOS:**
```bash
open release/ShowStack\ Production-0.1.0-alpha.dmg
```

**Windows:**
```bash
release/ShowStack-Production-Setup-0.1.0-alpha.exe
```

**Linux:**
```bash
chmod +x release/ShowStack-Production-0.1.0-alpha.AppImage
./release/ShowStack-Production-0.1.0-alpha.AppImage
```

### Step 3: Create Git Tag

```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare alpha release v0.1.0-alpha"

# Create and push tag
git tag -a v0.1.0-alpha -m "Alpha Release v0.1.0-alpha"
git push origin v0.1.0-alpha
```

### Step 4: Create GitHub Release

1. Go to your repository on GitHub: `https://github.com/jkarp7/showstack/releases`
2. Click **"Draft a new release"**
3. Fill in the release form:
   - **Tag:** Select `v0.1.0-alpha` (or create new tag)
   - **Release title:** `ShowStack:Production v0.1.0-alpha`
   - **Description:**
     ```markdown
     # ShowStack:Production Alpha Release

     ## ⚠️ Alpha Software Warning

     This is an early alpha release for testing purposes only. Expect bugs, crashes, and data loss.
     **Do not use for production work!**

     ## What's New

     - ✅ Virtual data grid with support for 1,000+ fixtures
     - ✅ In-cell editing with Tab/Enter navigation
     - ✅ Multi-select and bulk operations
     - 🚧 Electron desktop app shell
     - 🚧 Basic project management

     ## What's Missing (Coming Soon)

     - ⬜ Database persistence
     - ⬜ Sorting and filtering
     - ⬜ ETC Eos integration
     - ⬜ Vectorworks sync
     - ⬜ Label printing
     - ⬜ Report generation

     ## Installation

     ### macOS
     1. Download `ShowStack-Production-0.1.0-alpha.dmg`
     2. Open the DMG and drag to Applications
     3. Right-click the app and select "Open" (required for unsigned apps)

     ### Windows
     1. Download `ShowStack-Production-Setup-0.1.0-alpha.exe`
     2. Run the installer
     3. Click "More info" → "Run anyway" if Windows Defender warns you

     ### Linux
     1. Download `ShowStack-Production-0.1.0-alpha.AppImage`
     2. Make executable: `chmod +x ShowStack-Production-*.AppImage`
     3. Run: `./ShowStack-Production-*.AppImage`

     ## Known Issues

     - Data does not persist between sessions (no database yet)
     - No file import/export functionality
     - Performance may degrade with 5,000+ fixtures
     - macOS: Unsigned app requires "Open" from context menu

     ## Feedback

     Please report bugs and feedback by:
     - Opening GitHub issues: https://github.com/jkarp7/showstack/issues
     - Email: [your-email@example.com]

     ## Next Release

     Target: 2-4 weeks
     Focus: Database persistence, CSV import/export, improved grid performance

     ---

     **Thank you for testing!** 🎭
     ```

4. **Set as pre-release:** Check the "This is a pre-release" box
5. **Upload files:** Drag and drop these files from `release/` folder:
   - macOS: `ShowStack-Production-0.1.0-alpha.dmg`
   - Windows: `ShowStack-Production-Setup-0.1.0-alpha.exe`
   - Linux: `ShowStack-Production-0.1.0-alpha.AppImage`
   - Optional: ZIP files for direct downloads

6. Click **"Publish release"**

### Step 5: Share with Alpha Testers

Copy the release URL and share with testers:
```
https://github.com/jkarp7/showstack/releases/tag/v0.1.0-alpha
```

---

## Version Numbering for Alpha Releases

Use semantic versioning with alpha suffix:
- `0.1.0-alpha` - First alpha release
- `0.1.1-alpha` - Bug fix to alpha
- `0.2.0-alpha` - Second alpha with new features
- `0.3.0-beta` - First beta release

Update version in `package.json` before each build:
```json
{
  "version": "0.1.1-alpha"
}
```

---

## Troubleshooting Builds

### Issue: "Code signing required" (macOS)

**Solution:** Testers can bypass by right-clicking app → "Open" instead of double-clicking.

**Long-term:** Get Apple Developer account ($99/year) and sign the app.

### Issue: "Windows Defender blocks installation"

**Solution:** Tell testers to click "More info" → "Run anyway"

**Long-term:** Get Windows code signing certificate ($100-400/year)

### Issue: Build fails with "Cannot find module"

**Solution:**
```bash
rm -rf node_modules dist
npm install
cd proof-of-concept && npm install && cd ..
npm run build
```

### Issue: Electron app shows blank white screen

**Solution:** Check that the renderer build completed successfully:
```bash
ls -la dist/renderer/
# Should show index.html and assets/
```

---

## Next Steps: Automated Builds (Beta Phase)

For beta releases, you'll want to set up GitHub Actions to automatically build on every tag.

See `docs/beta-release-guide.md` for GitHub Actions workflow setup.

---

## Security Notes for Alpha

**DO NOT include in releases:**
- `.env` files with secrets
- API keys or credentials
- Private code signing certificates
- Development-only tools

**DO include:**
- Compiled app code
- Public assets (icons, fonts)
- LICENSE file
- User-facing documentation

---

## Checklist Before Each Alpha Release

- [ ] Update version in `package.json`
- [ ] Update version in `proof-of-concept/package.json` if needed
- [ ] Test app locally on target platform
- [ ] Create git tag
- [ ] Build distributable packages
- [ ] Test installers locally
- [ ] Create GitHub release
- [ ] Upload all platform builds
- [ ] Mark as pre-release
- [ ] Share with testers
- [ ] Monitor feedback channels

---

**Ready to ship!** 🚀
