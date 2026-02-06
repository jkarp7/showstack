# Next Steps - ShowStack Development

**Branch:** `develop`
**Last Updated:** January 20, 2026
**Status:** Shop order table migration complete, focusing on Lightwright parity features

---

## 🚀 Quick Start (Resuming Work)

```bash
# 1. Ensure you're on develop branch
git checkout develop

# 2. Pull latest changes
git pull origin develop

# 3. Start dev server
npm run dev

# 4. Run tests
npm test
```

---

## ✅ Just Completed (January 20, 2026)

### Shop Order Table Migration (PR #63)

- Migrated from dialog-based to modern spreadsheet-like table interface
- Inline cell editing with cell selection system
- Clipboard operations (paste TSV/CSV, export to CSV)
- Keyboard shortcuts (Ctrl/Cmd+V, Delete, Enter)
- Debounced saves (~90% reduction in database writes)
- Input validation and security improvements
- 82 comprehensive tests (100% passing)
- 4,876 lines of production code across 17 files
- Post-merge improvements tracked in Issue #65

### Previous Completions

- Telemetry System Hardening (PR #61 - January 18, 2026)
- Cloud-Native Architecture Planning (On hold until core features complete)

---

## 🎯 Immediate Priorities

### 1. Lightwright Parity Features (Short-term: 1-2 Months)

**Focus:** Industry standard features to compete with Lightwright

**High Priority:**

- [ ] **MVR export support** - Industry standard CAD/visualizer format (6-8 weeks)
- [ ] **Enhanced error checking** - Overlapping patches, overloaded dimmers, duplicate channels (4-6 weeks)
- [ ] **Basic console integration** - OSC protocol for ETC Eos (8-12 weeks)

**Medium Priority:**

- [ ] Add power distribution printable reports with visualization
- [ ] Implement CSV import/export with field mapping

### 2. Shop Order Post-Merge Improvements (Issue #65)

**Non-critical enhancements from PR #63 review:**

- [ ] Standardize error handling (toast notifications)
- [ ] Add integration tests for critical workflows
- [ ] Virtual scrolling for large tables (500+ items)
- [ ] Configuration extraction to separate file
- [ ] E2E tests with Playwright

### 3. Alpha.2 Release Preparation

- [ ] Complete MVR export
- [ ] Achieve 50% test coverage (in progress - shop order 100%, telemetry 100%)
- [ ] Fix critical bugs from alpha.1 feedback
- [ ] Update release notes
- [ ] Build and test on all platforms

---

## 📋 Future Work (After Core Features)

### Cloud-Native Architecture (Issues #34 + #33)

When ready to implement:

1. Review `docs/CLOUD_NATIVE_ARCHITECTURE_PLAN.md`
2. Confirm scope (15-16 weeks)
3. Confirm budget (~$20-50/month hosting)
4. Set up backend repository
5. Begin Phase 1: Backend Foundation

**Key Features:**

- Real-time collaboration
- User authentication (JWT)
- WebSocket integration
- Offline support (14-day grace period)
- Conflict resolution UI

---

## 🔗 Related Documentation

- `PROJECT_STATUS.md` - Overall project status
- `docs/CLOUD_NATIVE_ARCHITECTURE_PLAN.md` - Full cloud-native implementation plan
- `docs/testing/` - Testing documentation and guides
- GitHub Issues - Open issues and feature requests

---

## 💡 Tips for Resuming

1. **Check GitHub Issues** - Look for any critical bugs or feedback
2. **Review PR #63** - Latest shop order table migration merged
3. **Review Issue #65** - Post-merge improvement tracking
4. **Run test suite** - Ensure all tests passing: `npm test`
5. **Check PROJECT_STATUS.md** - Review completion status
6. **Focus on Lightwright parity** - MVR export, error checking, console integration

---

**Current Focus:** MVR export and industry standard features for competitive parity with Lightwright 🎯
