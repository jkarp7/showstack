# Propared Parity Analysis
## Production Management Software Competitive Analysis

**Created:** December 28, 2024
**Last Updated:** December 28, 2024
**Purpose:** Competitive analysis of Propared for ShowStack Production Edition development

---

## Executive Summary

**Propared** is a cloud-based production planning and scheduling software specifically designed for arts and events organizations. It unifies scheduling, budgeting, inventory management, and labor management into a single platform.

**Target Market:** Performing arts organizations (theater, opera, ballet, dance), educational institutions, festivals, corporate event producers

**Pricing:** Starting at $1,750/user/year (as of 2024)

**Key Differentiator:** Propared focuses on production logistics, resource allocation, and budgeting rather than ticketing or task management, positioning itself as "where the real coordination happens."

**ShowStack Opportunity:** Production Edition can compete by offering production management features integrated with technical design tools (lighting, sound, video) in a unified platform at a lower price point.

---

## Feature Comparison

### Core Features

| Feature Category | Propared | ShowStack Current | ShowStack Planned (Production Edition) | Parity Status |
|-----------------|----------|-------------------|----------------------------------------|---------------|
| **Scheduling** | ✅ Full | ❌ None | 🎯 Planned | ⚠️ **GAP** |
| **Budgeting** | ✅ Full | ❌ None | 🎯 Planned | ⚠️ **GAP** |
| **Inventory Management** | ✅ Full | ⚠️ Partial (fixtures/equipment only) | 🎯 Planned | ⚠️ **GAP** |
| **Labor Management** | ✅ Full | ❌ None | 🎯 Planned | ⚠️ **GAP** |
| **Production Books** | ✅ Full | ❌ None | 🎯 Planned | ⚠️ **GAP** |
| **Mobile App** | ✅ Yes (inventory companion) | ❌ None | 💡 Future | ⚠️ **GAP** |
| **Lighting Design Tools** | ❌ None | ✅ **Full** | ✅ Full | 🚀 **ADVANTAGE** |
| **Sound Design Tools** | ❌ None | ⬜ Planned | 🎯 Planned (Year 2) | 🚀 **ADVANTAGE** |
| **Video Design Tools** | ❌ None | ⬜ Planned | 🎯 Planned (Year 3) | 🚀 **ADVANTAGE** |
| **Technical Paperwork** | ❌ Limited | ✅ **12 reports** | ✅ Full | 🚀 **ADVANTAGE** |
| **Shop Orders** | ❌ None | ✅ **Full** | ✅ Full | 🚀 **ADVANTAGE** |

---

## Detailed Feature Analysis

### 1. Scheduling

**Propared Capabilities:**
- Build calendars and timelines with cloning and template capabilities
- Unlimited customized views (by venue, show, person, department)
- Year, month, week, day, and list view layouts
- Share schedules without login credentials
- Single data source feeds all views

**ShowStack Status:** ❌ Not implemented
**Priority:** 🔴 HIGH - Core production management feature

**Implementation Requirements:**
- Production calendar component
- Multi-view system (timeline, calendar, list, Gantt chart)
- Event types: rehearsals, performances, load-in, load-out, tech, focus, notes
- Recurring event support
- Template system for cloning shows
- Conflict detection
- Department/venue filtering
- Export to iCal/Google Calendar

**Effort Estimate:** 8-10 weeks

---

### 2. Budgeting

**Propared Capabilities:**
- Real-time cost tracking that updates automatically when schedules change
- Labor cost calculations with overtime rules
- Weekly hour tracking
- Budget estimation through labor lines and crew booking
- Financial aggregation by department, position, or project element

**ShowStack Status:** ❌ Not implemented
**Priority:** 🔴 HIGH - Critical for production management

**Implementation Requirements:**
- Budget creation and templates
- Line-item budget tracking
- Labor cost integration
- Equipment rental costs
- Vendor costs (shop orders integration)
- Actual vs. projected tracking
- Real-time cost updates
- Department/show rollups
- Budget reports and exports
- Cost variance analysis

**Effort Estimate:** 6-8 weeks

---

### 3. Inventory Management

**Propared Capabilities:**
- Track owned, rented, and borrowed items
- QR code system for item identification
- Mobile Companion app for cataloging
- Department-specific tagging (types and keywords)
- Production books for sharing inventory subsets
- Conflict detection for over-allocated resources

**ShowStack Status:** ⚠️ **PARTIAL** (fixtures and infrastructure equipment only)
**Priority:** 🟡 MEDIUM - Extend existing system

**ShowStack Advantages:**
- Already tracks lighting fixtures with 68+ fields
- Infrastructure equipment tracking with port-level detail
- Power management and calculations
- Integration with technical paperwork

**Propared Advantages:**
- QR code system
- Mobile app for field cataloging
- Cross-department inventory (props, costumes, scenery, etc.)
- Rental/borrowed tracking
- Conflict detection across productions

**Implementation Requirements:**
- Extend inventory system to props, costumes, scenery, sound, video
- QR code generation and scanning
- Rental vs. owned vs. borrowed status
- Conflict detection when allocated to multiple shows
- Inventory check-in/check-out workflow
- Maintenance schedules and notes
- Photo/attachment support (partial - already have logo upload)
- Department categorization

**Effort Estimate:** 6-8 weeks

---

### 4. Labor Management

**Propared Capabilities:**
- Crew position setup with configurable pay rates
- Booking system with status tracking (confirmed, tentative, etc.)
- Conflict detection across overlapping bookings
- Weekly hours monitoring and overtime calculations
- CSV export for payroll integration

**ShowStack Status:** ❌ Not implemented
**Priority:** 🔴 HIGH - Essential for production management

**Implementation Requirements:**
- Crew database with contact information
- Position/role definitions with pay rates
- Booking calendar integration
- Status tracking (confirmed, tentative, declined, requested)
- Availability tracking
- Conflict detection (double-booked crew)
- Weekly hour tracking
- Overtime calculations (configurable rules)
- Payroll export (CSV)
- Per diem tracking (for tour features)
- Call sheet generation

**Effort Estimate:** 8-10 weeks

---

### 5. Production Books

**Propared Capabilities:**
- Web-based information sharing (no login required)
- Automatic updates reflecting real-time data
- Filterable by team, department, or custom criteria
- Supports schedules, notes, attachments, locations, team rosters, requirements
- Mobile-friendly viewing
- Optional calendar embedding

**ShowStack Status:** ❌ Not implemented
**Priority:** 🟡 MEDIUM - Nice to have, but can leverage existing paperwork system

**ShowStack Alternative:**
- Already has comprehensive paperwork generation (12 reports)
- PDF export for all technical paperwork
- Shop order system with professional PDFs

**Implementation Requirements:**
- Web-based sharing portal (optional login)
- Real-time updates from project data
- Filterable views
- Mobile-responsive design
- Embedded calendar widgets
- Contact lists and rosters
- Notes and attachments
- Schedule integration

**Effort Estimate:** 6-8 weeks (lower priority - can use PDF exports initially)

---

### 6. Project Management

**Propared Capabilities:**
- Project cloning to reuse past production structures
- Template projects for standardized workflows
- Cross-project resource allocation visibility
- Attachment management

**ShowStack Status:** ⚠️ **PARTIAL** (project files exist, no cloning/templates)
**Priority:** 🟡 MEDIUM - Workflow enhancement

**Implementation Requirements:**
- Project template system
- Clone project functionality
- Multi-project view (season planning)
- Resource allocation across projects
- Attachment/document management
- Project archiving

**Effort Estimate:** 4-6 weeks

---

## ShowStack Competitive Advantages

### 1. Unified Technical Design + Production Management

**ShowStack's Unique Position:**
- **Only platform** offering lighting + sound + video design tools integrated with production management
- Technical designers can use same platform as production managers
- Data flows seamlessly from design to budget to schedule

**Example Workflow:**
1. Lighting designer creates fixture plot in ShowStack (Lighting Edition)
2. Production manager sees equipment list automatically populated in inventory
3. Budget updates with rental costs from shop order
4. Labor schedule includes focus call based on fixture count
5. Shop order feeds directly into vendor management

**Propared Limitation:** No technical design tools - requires separate software for lighting (LightWright), sound (Minotaur), etc.

---

### 2. Offline-First Architecture

**ShowStack Advantage:**
- Works fully offline (SQLite database)
- No internet required for day-to-day work
- Fast performance (no cloud latency)
- Data ownership (files on user's machine)

**Propared Limitation:** Cloud-based only, requires internet connection

---

### 3. Lower Price Point

**ShowStack Production Edition:** $599/year (all design + production + tour features)
**Propared:** $1,750/user/year (production management only)

**Cost Savings:** 66% cheaper for integrated solution
**Value Proposition:** "Get technical design tools AND production management for less than Propared alone"

---

### 4. Technical Paperwork Generation

**ShowStack Advantage:**
- 12 automated technical reports (fixture, infrastructure, power, etc.)
- Customizable headers with visual designer
- Professional PDF export
- Label designer for equipment

**Propared Limitation:** Limited technical paperwork, focuses on production schedules and budgets

---

### 5. Shop Order System

**ShowStack Advantage:**
- Complete shop order builder with equipment sections
- Revision tracking (up to 5 revisions)
- Notes system (3-tier)
- Professional PDF export
- Drag-and-drop print builder

**Propared Limitation:** No dedicated shop order system

---

## Critical Gaps to Address

### 1. 🔴 HIGH PRIORITY

| Feature | Propared | ShowStack Needs | Effort |
|---------|----------|----------------|--------|
| **Production Scheduling** | ✅ Full | Build from scratch | 8-10 weeks |
| **Budget Tracking** | ✅ Full | Build from scratch | 6-8 weeks |
| **Labor Management** | ✅ Full | Build from scratch | 8-10 weeks |

**Total Effort for Core Parity:** 22-28 weeks (5-7 months)

---

### 2. 🟡 MEDIUM PRIORITY

| Feature | Propared | ShowStack Needs | Effort |
|---------|----------|----------------|--------|
| **Inventory Extensions** | ✅ Full | Extend existing system | 6-8 weeks |
| **Production Books** | ✅ Full | Web sharing portal | 6-8 weeks |
| **Project Templates** | ✅ Full | Cloning/templates | 4-6 weeks |

**Total Effort for Enhanced Features:** 16-22 weeks (4-5.5 months)

---

### 3. 🟢 LOW PRIORITY

| Feature | Propared | ShowStack Needs | Effort |
|---------|----------|----------------|--------|
| **Mobile App** | ✅ Companion app | Native mobile app | 12-16 weeks |
| **QR Code System** | ✅ Full | QR generation/scanning | 2-3 weeks |

---

## Market Positioning Strategy

### Option 1: "Technical Design First, Production Second"
**Focus:** Launch Lighting Edition (Year 1), Sound Edition (Year 2), add production features gradually
**Pros:** Compete with LightWright/Minotaur first, add production management as differentiator
**Cons:** Delayed entry into production management market, Propared has head start

**Timeline:**
- Year 1 (2025): Lighting Edition launch
- Year 2 (2026): Sound Edition launch
- Year 3 (2027): Production Edition with basic features (scheduling, budgeting, labor)
- Year 4 (2028): Production Edition parity with Propared

---

### Option 2: "Integrated Solution from Day One"
**Focus:** Launch Production Edition (Year 2-3) with core production features alongside design tools
**Pros:** Unique market position, compete on integration + price
**Cons:** Longer development timeline, more complex initial offering

**Timeline:**
- Year 1 (2025): Lighting Edition launch
- Year 2 (2026): Sound Edition + Production Edition (scheduling, budgeting, labor)
- Year 3 (2027): Production Edition parity with Propared
- Year 4 (2028): Complete Edition with all features

---

### Option 3: "Hybrid Approach" (RECOMMENDED)
**Focus:** Launch design tools first, add production features incrementally based on user demand

**Phase 1 (Year 1-2): Design Tools**
- Lighting Edition (Year 1)
- Sound Edition (Year 2)
- Designer Edition bundle

**Phase 2 (Year 2-3): Basic Production Features**
- Production calendar (lightweight)
- Budget tracking (basic)
- Crew roster management
- Position as "integrated design + lightweight production"

**Phase 3 (Year 3-4): Production Edition Parity**
- Full scheduling with templates
- Advanced budgeting with real-time updates
- Labor management with payroll integration
- Inventory extensions
- Production books

**Pros:**
- Faster to market with design tools
- Test production features with existing users
- Iterate based on feedback
- Gradual development investment

**Cons:**
- Feature set builds slowly
- May lose some production managers to Propared initially

---

## Target Users

### Propared's Target Users:
1. Producing theaters and opera companies
2. University theater programs
3. Dance companies and ballet organizations
4. Festivals and performing arts centers
5. Corporate event producers
6. Educational institutions

### ShowStack Production Edition Target Users:
1. **Technical Directors** - Need design tools AND production management
2. **Production Managers** - Manage budgets, schedules, crew
3. **Lighting/Sound/Video Designers who produce** - Freelance designers who also produce shows
4. **Producing organizations** - Regional theaters, opera companies, dance companies
5. **University programs** - Need integrated teaching tools for design + production
6. **Tour managers** - Touring productions need equipment + scheduling + budgets

**Key Insight:** ShowStack targets technical staff who need BOTH design tools AND production management, whereas Propared targets production managers who may not do technical design.

---

## Pricing Strategy

### Propared Pricing:
- **Starting:** $1,750/user/year
- **Target:** Mid-to-large producing organizations
- **Value Prop:** Unified production management, eliminates spreadsheets

### ShowStack Production Edition Pricing:
- **Proposed:** $599/year
- **Includes:** All design features (Lighting + Sound + Video) + Production Management + Tour Logistics
- **Target:** Technical directors, production managers, multi-discipline designers
- **Value Prop:** "Technical design tools AND production management for 66% less than Propared alone"

### Competitive Comparison:
| Solution | Annual Cost | Features | Cost Savings with ShowStack |
|----------|-------------|----------|----------------------------|
| **LightWright 6** | $845 (one-time, ~$170/year amortized) | Lighting only | - |
| **Minotaur** | ~$200-400/year (est.) | Sound only | - |
| **Propared** | $1,750/year | Production mgmt only | - |
| **Total (all three)** | ~$2,320/year | Lighting + Sound + Production | **$1,721/year saved** |
| **ShowStack Production Edition** | $599/year | Lighting + Sound + Video + Production + Tour | **74% cheaper** |

**Value Proposition:** "Replace 3+ tools with one integrated platform and save $1,700+/year"

---

## Recommended Development Priorities

### Phase 1: Core Production Features (Year 3, 2027-2028)
**Focus:** Essential features to compete with Propared

1. **Production Scheduling** (8-10 weeks)
   - Calendar component with multi-view
   - Event types (rehearsal, performance, load-in, etc.)
   - Conflict detection
   - Template system

2. **Budget Tracking** (6-8 weeks)
   - Line-item budgets
   - Labor cost integration
   - Vendor/rental costs
   - Actual vs. projected tracking

3. **Labor Management** (8-10 weeks)
   - Crew database
   - Position/pay rate setup
   - Booking system
   - Weekly hours and overtime
   - Payroll export

**Total:** 22-28 weeks (5-7 months)

---

### Phase 2: Enhanced Features (Year 3-4, 2028-2029)
**Focus:** Differentiation and advanced capabilities

1. **Inventory Extensions** (6-8 weeks)
   - Props, costumes, scenery, video equipment
   - QR code system
   - Rental/owned/borrowed tracking
   - Conflict detection

2. **Production Books** (6-8 weeks)
   - Web-based sharing portal
   - Real-time updates
   - Mobile-responsive design

3. **Project Management** (4-6 weeks)
   - Template system
   - Project cloning
   - Multi-project view
   - Season planning

**Total:** 16-22 weeks (4-5.5 months)

---

### Phase 3: Advanced Features (Year 4+, 2029+)
**Focus:** Market leadership and mobile

1. **Mobile App** (12-16 weeks)
   - Native iOS/Android app
   - Inventory scanning
   - Schedule viewing
   - Check-in/check-out

2. **Advanced Integrations** (ongoing)
   - Accounting software (QuickBooks, Xero)
   - Payroll systems (ADP, Gusto)
   - Calendar sync (Google, Outlook, iCal)
   - Communication tools (Slack, Teams)

---

## Strategic Recommendations

### 1. Lean into Integration Advantage
**Strategy:** Position ShowStack as the ONLY platform that integrates technical design with production management

**Marketing Angle:**
- "Stop using 3+ separate tools. Design, plan, and produce in one platform."
- "Your fixture list becomes your inventory. Your inventory becomes your budget. Your budget drives your schedule."
- "Data flows automatically from design to production to performance."

**Proof Points:**
- Fixture plot → Equipment list → Shop order → Budget → Schedule
- Labor hours for focus call calculated from fixture count
- Rental costs from shop order feed budget automatically

---

### 2. Competitive Pricing
**Strategy:** Undercut Propared by 66% while offering MORE features (design tools included)

**Pricing Messaging:**
- "Propared costs $1,750/year for production management alone."
- "ShowStack Production Edition: $599/year for lighting + sound + video + production + tour."
- "Save $1,151/year and get technical design tools included."

---

### 3. Target Technical Directors
**Strategy:** Focus on technical staff who need BOTH design and production tools

**User Persona:**
- **Name:** Sarah, Technical Director at Regional Theater
- **Current Tools:** LightWright ($845) + Excel (free) + Propared ($1,750) = $2,595/year
- **Pain Points:**
  - Data doesn't flow between tools
  - Manual data entry errors
  - Expensive tool stack
  - Switching between applications
- **ShowStack Solution:** One platform, $599/year, integrated workflow
- **Savings:** $1,996/year (77% cost reduction)

---

### 4. Gradual Rollout (Recommended)
**Strategy:** Launch production features incrementally, validate with users

**Year 1 (2025):**
- Lighting Edition launch
- Gather user feedback on production management needs

**Year 2 (2026):**
- Sound Edition launch
- Add basic production features (calendar, simple budgets, crew roster)
- Beta test with existing users

**Year 3 (2027):**
- Production Edition official launch
- Core feature parity (scheduling, budgeting, labor)
- Target technical directors and production managers

**Year 4 (2028+):**
- Advanced features (inventory extensions, production books, mobile app)
- Enterprise features
- Market leadership positioning

---

## Success Metrics

### User Adoption
- **Year 3:** 200+ Production Edition users
- **Year 4:** 500+ Production Edition users
- **Year 5:** 1,000+ Production Edition users

### Revenue Targets
- **Year 3:** $120k ARR from Production Edition
- **Year 4:** $300k ARR from Production Edition
- **Year 5:** $600k ARR from Production Edition

### Feature Parity
- **Year 3:** 70% parity with Propared (core features)
- **Year 4:** 90% parity with Propared (enhanced features)
- **Year 5:** 100% parity + unique advantages (design integration)

### Competitive Wins
- **Year 3:** 20+ users switching from Propared
- **Year 4:** 50+ users switching from Propared
- **Year 5:** 100+ users switching from Propared or choosing ShowStack over Propared

---

## Conclusion

**Propared** is a strong competitor in the production management space with a comprehensive feature set and proven market adoption. However, ShowStack has a unique opportunity to compete through:

1. **Integration Advantage:** Only platform combining technical design + production management
2. **Pricing Advantage:** 66% cheaper than Propared while offering MORE features
3. **Offline-First:** Works without internet, faster performance
4. **Technical Paperwork:** Best-in-class reporting for design + production

**Recommended Path Forward:**
- Launch Lighting Edition (Year 1) and Sound Edition (Year 2) first
- Add basic production features incrementally (Year 2-3)
- Launch Production Edition with core parity (Year 3)
- Achieve full parity and market leadership (Year 4+)

**Total Development Investment:** 38-50 weeks (9-12 months) for full Propared parity

**Market Opportunity:** Capture technical directors and production managers who need integrated design + production tools at a fraction of the cost of multiple separate platforms.

---

**See Also:**
- `migration-production-features.md` - Detailed feature specifications for Production Edition
- `PROJECT_STATUS.md` - Current development status and roadmap
- `docs/architecture/naming-and-editions.md` - Edition structure and pricing

---

**Sources:**
- [Propared Official Website](https://www.propared.com/)
- [Propared Pricing on Capterra](https://www.capterra.com/p/141392/Propared/)
- [Propared Features on SaaSCounter](https://www.saascounter.com/products/propared)

**Last Updated:** December 28, 2024
