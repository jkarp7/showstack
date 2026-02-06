# ShowStack:Production - Alpha & Beta Release Setup

## 📦 What's Been Set Up

Your project is now configured for distributing alpha and beta releases via GitHub Releases using electron-builder.

### Files Created/Modified

**Electron Application Structure:**

- `src/main/index.ts` - Electron main process
- `src/preload/index.ts` - Preload script for secure IPC
- `tsconfig.json` - TypeScript configuration

**Build Configuration:**

- `electron-builder.yml` - Complete build configuration for all platforms
- `package.json` - Updated with build scripts and dependencies
- `.gitignore` - Updated to exclude build artifacts

**Documentation:**

- `docs/alpha-release-guide.md` - Complete guide for manual alpha releases
- `docs/beta-release-guide.md` - Guide for automated beta releases with GitHub Actions
- `resources/README.md` - Guide for creating app icons

**GitHub Actions:**

- `.github/workflows/release.yml` - Automated build workflow for all platforms

---

## 🚀 Quick Start

### For Alpha Releases (Manual Process)

**1. Install Dependencies**

```bash
npm install
cd proof-of-concept && npm install && cd ..
```

**2. Create App Icons**
Place these in the `resources/` directory:

- `icon.icns` (macOS)
- `icon.ico` (Windows)
- `icon.png` (Linux)

See `resources/README.md` for details.

**3. Build Your App**

```bash
# Build for your current platform
npm run dist         # Auto-detects platform

# Or build for specific platform
npm run dist:mac     # macOS .dmg
npm run dist:win     # Windows .exe
npm run dist:linux   # Linux .AppImage
```

**4. Test Locally**

```bash
# Output is in release/ directory
open release/ShowStack-Production-*.dmg  # macOS
# or
release/ShowStack-Production-Setup-*.exe  # Windows
```

**5. Create GitHub Release**

```bash
# Tag your release
git tag -a v0.1.0-alpha -m "Alpha release v0.1.0-alpha"
git push origin v0.1.0-alpha

# Go to GitHub.com → Your Repo → Releases → Draft new release
# Upload files from release/ directory
```

**See `docs/alpha-release-guide.md` for detailed instructions.**

---

### For Beta Releases (Automated with GitHub Actions)

**1. Ensure GitHub Actions is Enabled**

- Go to repository Settings → Actions → General
- Set Workflow permissions to "Read and write"

**2. Create and Push a Version Tag**

```bash
# Update version in package.json
npm version 0.1.0-beta --no-git-tag-version

# Commit and tag
git add package.json
git commit -m "Bump version to 0.1.0-beta"
git tag -a v0.1.0-beta -m "Beta release v0.1.0-beta"

# Push (triggers automatic build)
git push origin main
git push origin v0.1.0-beta
```

**3. Wait for GitHub Actions**

- Go to Actions tab in GitHub
- Watch the "Build and Release" workflow (~20-30 min)
- Builds for macOS, Windows, and Linux automatically

**4. Publish Release**

- Go to Releases tab
- Edit the draft release created by GitHub Actions
- Add release notes
- Publish

**See `docs/beta-release-guide.md` for detailed instructions.**

---

## 📋 Before Your First Release

### Required Tasks

- [ ] **Create app icons** (see `resources/README.md`)
  - `resources/icon.icns`
  - `resources/icon.ico`
  - `resources/icon.png`

- [ ] **Test the build locally**

  ```bash
  npm install
  npm run build
  npm run dist
  ```

- [ ] **Verify Electron app works**

  ```bash
  npm run dev
  ```

- [ ] **Test the installer** (install from `release/` directory)

### Optional (but Recommended for Beta)

- [ ] **Get code signing certificate** (macOS: $99/year, Windows: $100-400/year)
- [ ] **Set up crash reporting** (Sentry, BugSnag)
- [ ] **Enable GitHub Actions** workflow permissions
- [ ] **Create release notes template**

---

## 🛠️ Available npm Scripts

### Development

```bash
npm run dev              # Start Electron app in dev mode
npm run dev:poc          # Run proof-of-concept only (web)
```

### Building

```bash
npm run build            # Compile all TypeScript
npm run clean            # Remove dist/ and release/
```

### Distribution

```bash
npm run dist             # Build for current platform
npm run dist:mac         # Build macOS .dmg
npm run dist:win         # Build Windows installer
npm run dist:linux       # Build Linux AppImage
npm run dist:all         # Build for all platforms
```

---

## 📁 Project Structure

```
showstack/
├── .github/
│   └── workflows/
│       └── release.yml          # Automated build workflow
│
├── src/
│   ├── main/
│   │   └── index.ts             # Electron main process
│   ├── preload/
│   │   └── index.ts             # Preload script
│   └── renderer/                # (Uses proof-of-concept for now)
│
├── proof-of-concept/            # React app (will move to src/renderer)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── resources/                   # App icons and assets
│   ├── icon.icns
│   ├── icon.ico
│   └── icon.png
│
├── docs/
│   ├── alpha-release-guide.md   # Manual release guide
│   ├── beta-release-guide.md    # Automated release guide
│   ├── technical-spec.md
│   └── dev-setup.md
│
├── dist/                        # Compiled TypeScript (gitignored)
├── release/                     # Built installers (gitignored)
│
├── electron-builder.yml         # Build configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript config
└── .gitignore
```

---

## 🎯 Release Workflow Summary

### Alpha (Manual)

1. Build locally → 2. Test → 3. Create tag → 4. Upload to GitHub → 5. Share with testers

### Beta (Automated)

1. Create tag → 2. Push → 3. GitHub Actions builds → 4. Edit release notes → 5. Publish

---

## ⚠️ Important Notes

### Security

- **Never commit** `.env` files, API keys, or code signing certificates to git
- Code signing certificates are optional for alpha, recommended for beta
- Without code signing, users will see security warnings (normal for unsigned apps)

### Platform Limitations

- macOS .dmg files can only be built on macOS
- Windows and Linux builds can be created from any platform
- GitHub Actions builds on all platforms automatically

### Version Numbering

Use semantic versioning:

- `0.1.0-alpha` - Alpha releases
- `0.1.0-beta` - Beta releases
- `1.0.0` - Stable release

Update version in `package.json` before each release.

---

## 📚 Documentation

- **[Alpha Release Guide](docs/alpha-release-guide.md)** - Step-by-step manual release process
- **[Beta Release Guide](docs/beta-release-guide.md)** - Automated builds with GitHub Actions
- **[Technical Spec](docs/technical-spec.md)** - Complete feature specifications
- **[Development Setup](docs/dev-setup.md)** - Development environment guide

---

## 🆘 Troubleshooting

### Build fails with "Cannot find icon"

**Solution:** Create icons in `resources/` directory (see `resources/README.md`)

### GitHub Actions fails with permission error

**Solution:** Settings → Actions → General → Set "Read and write permissions"

### App shows blank screen

**Solution:**

```bash
npm run clean
npm install
cd proof-of-concept && npm install && cd ..
npm run build
```

### Windows/macOS security warnings

**Solution:** This is normal for unsigned apps. For beta, consider getting code signing certificates.

---

## ✅ Next Steps

1. **Create app icons** (`resources/icon.*`)
2. **Test local build** (`npm run dist`)
3. **Install and test** the built app
4. **Create your first alpha release** (follow `docs/alpha-release-guide.md`)
5. **Get feedback** from 3-5 testers
6. **Iterate** based on feedback
7. **Move to beta** when ready (follow `docs/beta-release-guide.md`)

---

## 🎉 You're Ready!

Everything is set up for distributing your Electron app. Choose your path:

- **Quick alpha test?** → Build locally and share with a few testers
- **Proper beta?** → Set up GitHub Actions and automate everything

Good luck with your release! 🚀

---

**Questions?** Check the detailed guides in `docs/` or open an issue on GitHub.
