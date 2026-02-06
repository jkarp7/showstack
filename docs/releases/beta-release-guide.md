# Beta Release Guide - Automated Builds with GitHub Actions

This guide explains how to set up automated builds for beta releases using GitHub Actions.

---

## Overview

When you're ready for beta releases, GitHub Actions can automatically:

1. Build your app for macOS, Windows, and Linux
2. Create installers for all platforms
3. Upload to GitHub Releases
4. Enable auto-updates for users

---

## Setup GitHub Actions Workflow

### Step 1: Create Workflow File

Create `.github/workflows/release.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*' # Trigger on version tags (v0.1.0-beta, v1.0.0, etc.)

jobs:
  release:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm install
          cd proof-of-concept && npm install && cd ..

      - name: Build app
        run: npm run build

      - name: Build distributables (macOS)
        if: matrix.os == 'macos-latest'
        run: npm run dist:mac
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Build distributables (Windows)
        if: matrix.os == 'windows-latest'
        run: npm run dist:win
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Build distributables (Linux)
        if: matrix.os == 'ubuntu-latest'
        run: npm run dist:linux
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.os }}-build
          path: |
            release/*.dmg
            release/*.zip
            release/*.exe
            release/*.AppImage
            release/*.deb
          if-no-files-found: ignore

      - name: Release
        uses: softprops/action-gh-release@v1
        if: startsWith(github.ref, 'refs/tags/')
        with:
          draft: true
          files: |
            release/*.dmg
            release/*.zip
            release/*.exe
            release/*.AppImage
            release/*.deb
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Step 2: Configure GitHub Repository

1. Go to repository Settings → Actions → General
2. Under "Workflow permissions", select "Read and write permissions"
3. Click "Save"

This allows GitHub Actions to create releases automatically.

---

## Creating a Beta Release (Automated)

### Step 1: Update Version

```bash
# Update version in package.json
npm version 0.1.0-beta --no-git-tag-version

# Commit the version change
git add package.json
git commit -m "Bump version to 0.1.0-beta"
```

### Step 2: Create and Push Tag

```bash
# Create annotated tag
git tag -a v0.1.0-beta -m "Beta Release v0.1.0-beta"

# Push commits and tag
git push origin main
git push origin v0.1.0-beta
```

### Step 3: Wait for GitHub Actions

1. Go to Actions tab in your GitHub repository
2. Watch the "Build and Release" workflow run
3. Takes ~20-30 minutes to build for all platforms
4. When complete, check Releases tab

### Step 4: Edit and Publish Release

GitHub Actions creates a **draft release**. You need to:

1. Go to Releases tab
2. Click "Edit" on the draft release
3. Add release notes (see template below)
4. Uncheck "This is a pre-release" for stable betas
5. Click "Publish release"

---

## Beta Release Notes Template

```markdown
# ShowStack:Production v0.1.0-beta

## 🎉 Beta Release

This is a beta release of ShowStack:Production. The core functionality is stable, but some features are still under development.

## ✨ New Features

- Feature 1 description
- Feature 2 description
- Feature 3 description

## 🐛 Bug Fixes

- Fixed issue #123: Description
- Fixed crash when doing X

## ⚠️ Known Issues

- Issue 1 description ([#456](link-to-issue))
- Issue 2 description

## 📥 Installation

### macOS

1. Download `ShowStack-Production-{version}.dmg`
2. Open DMG and drag to Applications
3. **Important:** Right-click → "Open" on first launch (unsigned app)

### Windows

1. Download `ShowStack-Production-Setup-{version}.exe`
2. Run installer
3. May need to click "More info" → "Run anyway" in Windows Defender

### Linux

1. Download `ShowStack-Production-{version}.AppImage`
2. Make executable: `chmod +x ShowStack-Production-*.AppImage`
3. Run: `./ShowStack-Production-*.AppImage`

## 🔄 Auto-Updates

This version includes auto-update support. Future releases will be downloaded automatically when available.

## 🐞 Reporting Bugs

Please report bugs on [GitHub Issues](https://github.com/jkarp7/showstack/issues) with:

- Operating system and version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## 📧 Feedback

We'd love to hear your feedback! Contact us at [your-email] or join our Discord [link].

## 🙏 Thank You

Thank you to our beta testers for helping make ShowStack:Production better!

---

**Full Changelog:** https://github.com/jkarp7/showstack/compare/v0.0.9-beta...v0.1.0-beta
```

---

## Advanced: Code Signing (Recommended for Beta)

### macOS Code Signing

**Prerequisites:**

- Apple Developer account ($99/year)
- Developer ID Application certificate

**Setup:**

1. Export certificate from Xcode/Keychain as `.p12` file
2. Encode to base64:

   ```bash
   base64 -i certificate.p12 -o certificate-base64.txt
   ```

3. Add GitHub Secrets (Settings → Secrets → Actions):
   - `APPLE_CERTIFICATE`: Paste contents of `certificate-base64.txt`
   - `APPLE_CERTIFICATE_PASSWORD`: Your certificate password
   - `APPLE_ID`: Your Apple ID email
   - `APPLE_ID_PASSWORD`: App-specific password from appleid.apple.com
   - `APPLE_TEAM_ID`: Your team ID (10 characters)

4. Update workflow to include code signing:

```yaml
- name: Import Code Signing Certificate (macOS)
  if: matrix.os == 'macos-latest'
  uses: apple-actions/import-codesign-certs@v2
  with:
    p12-file-base64: ${{ secrets.APPLE_CERTIFICATE }}
    p12-password: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}

- name: Build and notarize (macOS)
  if: matrix.os == 'macos-latest'
  run: npm run dist:mac
  env:
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

### Windows Code Signing

**Prerequisites:**

- Code signing certificate from DigiCert, Sectigo, etc. ($100-400/year)

**Setup:**

1. Add GitHub Secrets:
   - `WINDOWS_CERTIFICATE`: Base64 encoded .pfx file
   - `WINDOWS_CERTIFICATE_PASSWORD`: Certificate password

2. Update workflow:

```yaml
- name: Import Code Signing Certificate (Windows)
  if: matrix.os == 'windows-latest'
  run: |
    echo "${{ secrets.WINDOWS_CERTIFICATE }}" > cert.pfx.base64
    certutil -decode cert.pfx.base64 cert.pfx

- name: Build (Windows)
  if: matrix.os == 'windows-latest'
  run: npm run dist:win
  env:
    CSC_LINK: cert.pfx
    CSC_KEY_PASSWORD: ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}
```

---

## Auto-Update Configuration

Users will automatically receive updates if they install from a GitHub release.

**How it works:**

1. App checks GitHub Releases on startup
2. If newer version exists, downloads in background
3. Prompts user to restart and install
4. Updates seamlessly

**Customize update behavior** in `src/main/index.ts`:

```typescript
import { autoUpdater } from 'electron-updater';

// Check for updates on startup
app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
});

// Optional: Check every hour
setInterval(() => {
  autoUpdater.checkForUpdates();
}, 3600000);
```

---

## Rollback Strategy

If a release has critical bugs:

### Option 1: Unpublish Release

1. Go to Releases
2. Click "Delete" on problematic release
3. Users on that version won't get auto-updates to it

### Option 2: Create Hotfix Release

1. Fix the bug
2. Bump patch version (0.1.1-beta)
3. Create new tag and release
4. Auto-update will upgrade users

---

## Release Cadence Recommendations

**Alpha:** Ad-hoc, as features are ready
**Beta:** Every 1-2 weeks with scheduled milestones
**Stable:** Monthly or quarterly

### Beta Milestone Example

- **v0.1.0-beta:** Core grid + database
- **v0.2.0-beta:** Power management
- **v0.3.0-beta:** Label printing
- **v0.4.0-beta:** Eos integration
- **v0.5.0-beta:** Vectorworks sync
- **v1.0.0:** Stable release

---

## Monitoring Releases

### Track Downloads

GitHub provides download stats:

1. Go to Releases
2. Each asset shows download count
3. Use GitHub API for detailed analytics

### Crash Reporting (Recommended)

Integrate [Sentry](https://sentry.io) or [BugSnag](https://www.bugsnag.com):

```typescript
import * as Sentry from '@sentry/electron';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: process.env.NODE_ENV,
  release: app.getVersion(),
});
```

Add to GitHub Secrets: `SENTRY_DSN`

---

## Troubleshooting GitHub Actions

### Build fails with "No space left on device"

**Solution:** Clean up artifacts in workflow:

```yaml
- name: Clean up
  run: npm run clean
```

### Build fails on Windows with "long path" error

**Solution:** Enable long paths:

```yaml
- name: Enable long paths (Windows)
  if: matrix.os == 'windows-latest'
  run: git config --system core.longpaths true
```

### Release upload fails with 401/403

**Solution:** Check repository permissions in Settings → Actions

---

## Checklist for First Beta Release

- [ ] GitHub Actions workflow created (`.github/workflows/release.yml`)
- [ ] Repository permissions set to "Read and write"
- [ ] App icons created (`resources/icon.*`)
- [ ] Version bumped in `package.json`
- [ ] Code tested locally
- [ ] Tag created and pushed
- [ ] GitHub Actions completed successfully
- [ ] Release notes added
- [ ] Release published
- [ ] Testers notified
- [ ] Feedback channels monitored

---

**You're all set for automated beta releases!** 🎊
