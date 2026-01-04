# ShowStack v0.1.0-alpha - First Alpha Testing Release

**Release Date:** January 3, 2026
**Build From:** `develop` branch
**Status:** Pre-release (Alpha Testing)

---

## 🎯 About This Release

This is the **first alpha release** of ShowStack for external testing and feedback. The application represents 90% completion of the Unified Visual Editor System, plus comprehensive power management and infrastructure enhancements.

**Target Audience:** Alpha testers, early adopters, and technical users comfortable with pre-release software.

---

## ✨ What's New in This Release

### Unified Visual Editor System (90% Complete)

#### Phase 3: Paperwork Template System ✅
- **13 Report Types** with customizable templates
  - Fixture Reports (8): Channel hookup, dimmer schedule, circuit list, DMX addresses, power summary, color schedule, gobo schedule, color cut report
  - Infrastructure Reports (5): Equipment list, network summary, port assignments, power consumption, location map
- **Column Configuration UI** with drag-and-drop reordering
- **Grouping & Sorting Controls** for report organization
- **Color Swatch Visualization** in Color Cut Report
- **Gel Color Database** with 628 theatrical gels (GAM, LEE, Roscolux)
- **Template Library** with save/load/duplicate functionality
- **Automatic Sheet Calculations** for gel cutting lists

#### Phase 3.5: Logo & Image Support ✅
- **Image Upload** with file browser (PNG, JPG, SVG, GIF support)
- **Base64 Storage** for logos and graphics (2MB max per image)
- **Project Logo Integration** in paperwork headers
- **ObjectFit Options** (contain, cover, fill) for image scaling
- **PDF Export Support** with Puppeteer rendering

#### Phase 4: Label Integration ✅
- **Grid-Based Visual Designer** for label layouts (4 cells per inch precision)
- **5 Avery Templates** supported:
  - **5160**: Address labels (3×10 grid, 2.625" × 1")
  - **5163**: Shipping labels (2×5 grid, 4" × 2")
  - **5164**: Shipping labels (2×3 grid, 4" × 3.33")
  - **8160**: Address labels (3×10 grid, 2.625" × 1")
  - **5167**: Return address labels (4×20 grid, 1.75" × 0.5")
- **36 Fixture Data Fields** for label customization
- **Background Color Picker** with full color customization
- **Batch PDF Printing** with multi-label sheet rendering
- **Automated Migration** from legacy localStorage designs to database
- **Complete Documentation** (617 lines) in codebase

### Power Management & Infrastructure (Sprints 1-4)

#### Sprint 1: Power Foundation ✅
- **Building Service Assignment** - Designate racks to Service A/B/C for load planning
- **Custom Phase Labels** - Rename phases from A/B/C to 1/2/3 or custom names project-wide
- **Service Configuration Panel** - Set capacity (amps) for each building service
- **Persistent Settings** - Service configurations stored in settingsStore

#### Sprint 2: Phase Distribution Templates ✅
- **Template System** for saving and loading phase configurations
- **Built-in Templates**:
  - AB Phasing (Alternating): A, B, A, B, ...
  - AC Phasing (Alternating): A, C, A, C, ...
  - Three Phase ABC (Sequential): A, B, C, A, B, C, ...
- **Phase Template Editor** with circuit-to-phase mapping
- **Apply Templates** to racks with one click

#### Sprint 3: Infrastructure Enhancements ✅
- **Port Linking** - Link infrastructure ports to:
  - Fixtures (by ID)
  - Other equipment (with port number)
  - Free text notes
- **Port Usage Tracking** - Visual indicators showing port utilization
- **CSV Import/Export** - Bulk import/export infrastructure equipment with field mapping UI
- **Enhanced Port Editor** with link type persistence

#### Sprint 4: PDF Export Polish ✅
- **Color Mode Toggle** for all PDF exports (Color vs Grayscale)
- **Default: Color** printing enabled (user-configurable)
- **Grayscale Filter** applied via CSS for B&W mode
- **Consistent Across All Exports** - Paperwork, Shop Orders, Labels

### UI/UX Improvements ✅
- **Settings Dialog Modal** - Click-outside-to-close, no navigation disruption
- **Power Management Page** - Standalone page with tabs (Racks, Configuration, Summary)
- **Equipment Manager "Power" Tab** - Rack listing table with color-coded badges
- **Service Configuration UI** - Add/remove services with capacity tracking
- **Improved macOS Window Focus** - Better window management for project windows

---

## 🧪 What to Test

We're looking for feedback on:

### Critical Functionality
1. **Label Designer**
   - Create labels using the visual grid editor
   - Test all 5 Avery templates (5160, 5163, 5164, 8160, 5167)
   - Add images and customize background colors
   - Batch print multiple labels to PDF

2. **Service Configuration**
   - Set up building services (Service A/B/C)
   - Assign racks to services
   - Configure phase templates and apply to racks
   - Verify custom phase labels appear in UI

3. **Port Management**
   - Link infrastructure ports to fixtures and equipment
   - Test port usage tracking visual indicators
   - Import/export infrastructure via CSV

4. **Paperwork Generation**
   - Create reports using template system
   - Customize column visibility and grouping
   - Export PDFs in both color and grayscale modes
   - Test Color Cut Report with gel database

### General Testing
- Overall app stability and performance
- UI responsiveness and clarity
- Feature discoverability
- Error handling and edge cases
- Cross-feature integration (e.g., fixtures → labels → paperwork flow)

---

## 📥 Installation Instructions (macOS)

### Download
1. Download **ShowStack-0.1.0-alpha-arm64.dmg** from the Assets section below

### Install
2. **Open the DMG file** - Double-click the downloaded DMG
3. **Drag to Applications** - Drag "ShowStack" to the Applications folder icon

### First Launch (Important!)

**You will see a "damaged" error** - This is actually a code signing issue, not corruption!

If macOS shows: `"ShowStack" is damaged and can't be opened. You should move it to the Trash.`

**DO NOT move it to trash!** This is Gatekeeper blocking unsigned apps. Use one of these methods:

#### Method 1: Right-Click to Open (Recommended)
1. Open **Finder** → **Applications**
2. **Right-click** (or Control+click) on "ShowStack"
3. Select **"Open"** from the context menu
4. Click **"Open"** in the security dialog that appears

#### Method 2: Remove Quarantine (Alternative)
Open Terminal and run:
```bash
xattr -cr /Applications/ShowStack.app
```

Then launch the app normally.

### Why This Step?
This alpha build is **not code-signed** with an Apple Developer certificate ($99/year). macOS Gatekeeper blocks unsigned apps by default to protect users. The "damaged" message is misleading - the app is fine, just unsigned.

**Only needed once** - After the first launch, the app works normally (double-click).

---

## ⚠️ Known Limitations

This is an **alpha release** - please expect:

### Not Yet Implemented
- ❌ Auto-updates (manual download required for future versions)
- ❌ Phase 5: Polish & UX features (keyboard shortcuts, inline editing, shadows)
- ❌ Code signing (requires Apple Developer certificate)
- ❌ Multi-user collaboration (planned for future)
- ❌ Vectorworks/MVR integration (planned for beta)
- ❌ Console integration (ETC Eos, grandMA - planned for beta)

### Expected Rough Edges
- Some UI polish items remain (Phase 5 scope)
- Error messages may not be comprehensive
- Performance optimizations pending
- Documentation is developer-focused (user manual coming later)

### Platform Limitations
- **Multi-platform support:** macOS (ARM64), Windows (x64), Linux (x64)
- macOS tested on 12.0+ (Monterey and later)
- Windows/Linux builds are unsigned (similar Gatekeeper-style warnings may appear)
- Requires **Node.js 20+** if running from source

---

## 🗑️ Complete Removal (If Needed)

If you need to uninstall ShowStack completely:

```bash
# Delete the application
rm -rf "/Applications/ShowStack.app"

# Delete all user data (projects, settings, databases)
rm -rf ~/Library/Application\ Support/ShowStack/

# Delete application preferences
rm -rf ~/Library/Preferences/com.lytrix.showstack.plist

# Verify removal
ls -la ~/Library/Application\ Support/ | grep -i showstack
```

**Note:** This removes **all projects and settings**. Export any projects you want to keep first.

---

## 📝 Providing Feedback

We'd love to hear from you! Please report:

### Bug Reports
- File issues at: https://github.com/jkarp7/showstack/issues
- Include:
  - Steps to reproduce
  - Expected vs actual behavior
  - Screenshots if applicable
  - macOS version
  - Any error messages

### Feature Requests & Suggestions
- Use GitHub Discussions: https://github.com/jkarp7/showstack/discussions
- Or contact directly: [your email/contact method]

### What We're Looking For
- ✅ Critical bugs or crashes
- ✅ UX friction points
- ✅ Missing features that block workflows
- ✅ Performance issues
- ✅ Unclear UI/labeling
- ✅ General usability feedback

---

## 📊 Technical Details

### Build Information
- **Version:** 0.1.0-alpha
- **Build Date:** January 3, 2026
- **Branch:** `develop`
- **Commits:** 96 from `feature/unified-visual-editor`
- **Electron:** 39.2.1
- **React:** 19.2.0
- **Node.js:** 20.0.0+

### Database
- **Architecture:** Two-database system (SQLite via sql.js)
  - App Database: `showstack-app.db` (licenses, settings, templates)
  - Project Database: `showstack-projects.db` (all project data)
- **Location:** `~/Library/Application Support/ShowStack Production/`
- **Migrations:** Automatic on startup

### File Sizes
- **DMG:** ~180 MB (recommended for distribution)
- **ZIP:** ~180 MB (alternative format)
- **Installed Size:** ~250 MB

---

## 🚀 What's Next

### Phase 5: Polish & UX (Upcoming)
- Keyboard shortcuts (Cmd+S, Cmd+Z, Cmd+D, arrow keys)
- Inline editing for text elements
- Visual effects (shadows, gradients, advanced borders)
- Smart alignment guides with snap-to-grid
- Template management and sharing
- Comprehensive validation and error handling
- **Timeline:** 1 week development + testing

### Future Releases
- **v0.1.0-alpha-2:** Phase 5 completion + tester feedback fixes
- **v0.1.0-beta:** Lightwright parity features (MVR export, console integration)
- **v1.0.0:** Public release with full feature set

---

## 🙏 Thank You

Thank you for testing ShowStack and helping shape its development! Your feedback directly influences the product roadmap and priorities.

This alpha release represents **thousands of hours** of development focused on creating a modern, powerful alternative to legacy production management tools.

---

## 📚 Additional Resources

- **GitHub Repository:** https://github.com/jkarp7/showstack
- **Documentation:** Available in `docs/` folder of repository
- **Phase 4 Implementation:** `docs/features/phase-4-label-integration.md`
- **Phase 5 Plan:** `docs/features/phase-5-polish-ux.md`
- **Project Status:** `PROJECT_STATUS.md` (comprehensive feature tracking)

---

**Questions?** Open an issue or start a discussion on GitHub!

🤖 *Built with [Claude Code](https://claude.com/claude-code)*
