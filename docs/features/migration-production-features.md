# ShowStack Production Features Specification
## Complete Production Management & Tour Logistics

**Created:** December 28, 2024
**Last Updated:** December 28, 2024
**Purpose:** Detailed specification for Production Edition features (Year 3-4)

---

## Overview

The **Production Edition** ($599/year) combines all design features (Lighting + Sound + Video) with comprehensive production management and tour logistics tools. This document specifies the features needed to compete with Propared while leveraging ShowStack's unique integration advantages.

**Target Users:**
- Technical Directors
- Production Managers
- Tour Managers
- Producing organizations (theaters, opera, dance)
- University theater programs
- Festival producers

**Competitive Positioning:**
- **vs. Propared:** 66% cheaper, includes technical design tools, offline-first
- **vs. Spreadsheets:** Automated workflows, real-time updates, professional output
- **vs. Separate Tools:** Integrated platform, data flows automatically

---

## Feature Domains

### 1. Production Scheduling
### 2. Budget Tracking & Management
### 3. Labor & Crew Management
### 4. Inventory Management (Extended)
### 5. Vendor Management
### 6. Production Books & Sharing
### 7. Tour Logistics
### 8. Reporting & Analytics

---

## 1. Production Scheduling

### Overview
Comprehensive production calendar system for managing rehearsals, performances, load-in/load-out, technical rehearsals, and all production events.

### Core Features

#### 1.1 Production Calendar
**Component:** `ProductionCalendar.tsx`
**Database Table:** `production_events`

**Fields:**
- `id` (primary key)
- `project_id` (foreign key)
- `event_type` (enum: rehearsal, performance, load_in, load_out, focus, tech_rehearsal, dress_rehearsal, meeting, notes_session, other)
- `title` (string)
- `description` (text)
- `start_datetime` (datetime)
- `end_datetime` (datetime)
- `location` (string, foreign key to venues)
- `venue_id` (foreign key, optional)
- `department` (enum: lighting, sound, video, production, stage, wardrobe, props, all)
- `status` (enum: scheduled, confirmed, tentative, cancelled, completed)
- `recurrence_rule` (JSON, for recurring events)
- `color` (string, for visual coding)
- `assigned_to` (JSON array of crew IDs)
- `notes` (text)
- `created_at` (datetime)
- `updated_at` (datetime)

**View Modes:**
- Year view (annual calendar)
- Month view (traditional calendar grid)
- Week view (7-day schedule)
- Day view (hourly breakdown)
- List view (chronological event list)
- Timeline view (Gantt-style)
- Department view (filter by department)
- Venue view (filter by location)

**Key Capabilities:**
- Drag-and-drop event creation and editing
- Event templates (e.g., "Standard Tech Day")
- Recurring events (daily, weekly, custom patterns)
- Conflict detection (double-booked venue, crew, equipment)
- Color-coding by event type or department
- Multi-select for bulk operations
- Export to iCal, Google Calendar, Outlook
- Print-friendly views
- Real-time sync across users (if collaboration enabled)

**Integration Points:**
- **Labor Management:** Crew booking synced with calendar
- **Budget Tracking:** Labor hours calculated from scheduled events
- **Inventory:** Equipment allocated to specific events
- **Venue Database:** Locations linked to events

---

#### 1.2 Event Templates
**Component:** `EventTemplates.tsx`
**Database Table:** `event_templates`

**Purpose:** Reusable event structures for common production workflows

**Template Examples:**
- "Tech Day" (10am-10pm, lighting/sound/video focus)
- "Dress Rehearsal" (call 6pm, curtain 7:30pm, notes after)
- "Load-In Day" (8am-6pm, full crew)
- "Performance Day" (call 6pm, curtain 8pm, strike after)

**Template Fields:**
- Template name
- Default duration
- Default event types
- Crew positions required
- Equipment checklist
- Notes template

**Usage:**
- One-click event creation from template
- Edit template to update all future instances
- Share templates across projects

---

#### 1.3 Recurring Events
**Component:** `RecurringEventDialog.tsx`

**Patterns:**
- Daily (every day, weekdays only, custom interval)
- Weekly (specific days of week)
- Custom (e.g., "every other Tuesday")
- Series exceptions (skip specific dates)

**Series Management:**
- Edit single occurrence vs. entire series
- Delete single occurrence vs. series
- Add exceptions (holidays, dark days)

---

### Technical Implementation

**Calendar Library:** FullCalendar or React Big Calendar
**Date Handling:** date-fns or Luxon
**Recurrence:** rrule library

**Database Schema:**
```sql
CREATE TABLE production_events (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_datetime TEXT NOT NULL,
  end_datetime TEXT NOT NULL,
  location TEXT,
  venue_id INTEGER,
  department TEXT,
  status TEXT DEFAULT 'scheduled',
  recurrence_rule TEXT,
  color TEXT,
  assigned_to TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (venue_id) REFERENCES venues(id)
);

CREATE TABLE event_templates (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  default_duration_hours REAL,
  crew_positions TEXT,
  equipment_checklist TEXT,
  notes_template TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Effort Estimate:** 8-10 weeks

---

## 2. Budget Tracking & Management

### Overview
Comprehensive budget system with line-item tracking, real-time cost updates, and integration with labor, equipment, and vendor costs.

### Core Features

#### 2.1 Budget Builder
**Component:** `BudgetBuilder.tsx`
**Database Table:** `budgets`, `budget_line_items`

**Budget Structure:**
- Budget name (e.g., "Spring 2025 Production")
- Budget categories:
  - Labor (crew wages, overtime)
  - Equipment (rental, purchase, repair)
  - Venue (rental fees, utilities)
  - Materials (consumables, supplies)
  - Transportation (trucking, gas, per diem)
  - Other (insurance, permits, misc)

**Line Item Fields:**
- `id` (primary key)
- `budget_id` (foreign key)
- `category` (enum)
- `subcategory` (string)
- `description` (string)
- `quantity` (decimal)
- `unit_cost` (decimal)
- `estimated_total` (calculated: quantity × unit_cost)
- `actual_cost` (decimal, optional)
- `variance` (calculated: estimated - actual)
- `vendor_id` (foreign key, optional)
- `notes` (text)
- `status` (enum: estimated, confirmed, paid, overdue)

**Key Capabilities:**
- Line-item budget creation
- Category subtotals and grand totals
- Estimated vs. actual tracking
- Variance analysis (over/under budget)
- Real-time cost updates from integrated sources:
  - Labor costs from crew bookings
  - Equipment costs from shop orders
  - Vendor costs from purchase orders
- Budget templates (save and reuse)
- Multi-project budget rollups
- Department-level budgets
- Export to Excel, PDF

---

#### 2.2 Labor Cost Integration
**Component:** `LaborCostCalculator.tsx`

**Automatic Cost Calculation:**
- Crew positions linked to pay rates
- Hours calculated from production calendar
- Overtime rules applied automatically
- Weekly hour limits with warnings

**Formula:**
```
Labor Cost = (Regular Hours × Hourly Rate) + (Overtime Hours × OT Rate)
```

**Overtime Rules (Configurable):**
- Daily OT: Hours > 8 in a day
- Weekly OT: Hours > 40 in a week
- Double-time: Hours > 12 in a day or > 60 in a week
- OT multipliers: 1.5× (time and a half), 2× (double time)

**Real-Time Updates:**
- Calendar event added → Labor hours increase → Budget updates
- Crew member booked → Labor cost increases → Budget updates
- Pay rate changed → All budgets recalculate

---

#### 2.3 Equipment Cost Integration
**Component:** `EquipmentCostTracker.tsx`

**Integration with Shop Orders:**
- Equipment items from shop orders automatically populate budget
- Rental costs (daily, weekly, per-show rates)
- Purchase costs for owned equipment (capital expenses)
- Shipping/freight costs

**Equipment Budget Line Items:**
- Lighting equipment rental
- Sound equipment rental
- Video equipment rental
- Consumables (gels, tape, batteries, cable)
- Repairs and maintenance

---

#### 2.4 Vendor Management Integration
**Component:** `VendorCostTracker.tsx`

**Purchase Orders linked to Budget:**
- PO created → Budget line item created
- PO confirmed → Estimated cost updated
- Invoice received → Actual cost entered
- Payment made → Status updated to "paid"

---

### Technical Implementation

**Database Schema:**
```sql
CREATE TABLE budgets (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  total_estimated REAL DEFAULT 0,
  total_actual REAL DEFAULT 0,
  variance REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE budget_line_items (
  id INTEGER PRIMARY KEY,
  budget_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL,
  quantity REAL DEFAULT 1,
  unit_cost REAL DEFAULT 0,
  estimated_total REAL DEFAULT 0,
  actual_cost REAL,
  variance REAL,
  vendor_id INTEGER,
  notes TEXT,
  status TEXT DEFAULT 'estimated',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (budget_id) REFERENCES budgets(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);
```

**Effort Estimate:** 6-8 weeks

---

## 3. Labor & Crew Management

### Overview
Comprehensive crew database, position management, booking system, and payroll integration.

### Core Features

#### 3.1 Crew Database
**Component:** `CrewDatabase.tsx`
**Database Table:** `crew_members`

**Crew Member Fields:**
- `id` (primary key)
- `first_name` (string)
- `last_name` (string)
- `email` (string)
- `phone` (string)
- `address` (text)
- `emergency_contact_name` (string)
- `emergency_contact_phone` (string)
- `positions` (JSON array, e.g., ["Master Electrician", "Lighting Designer"])
- `departments` (JSON array, e.g., ["lighting", "sound"])
- `pay_rate_default` (decimal)
- `overtime_eligible` (boolean)
- `w9_on_file` (boolean)
- `notes` (text)
- `availability` (JSON, weekly recurring availability)
- `photo` (base64, optional)
- `created_at` (datetime)
- `updated_at` (datetime)

**Key Capabilities:**
- Add, edit, delete crew members
- Search and filter (by position, department, availability)
- Tag system for skills (rigging, programming, etc.)
- Availability calendar
- Document storage (W-9, contract, resume)
- Export contact list

---

#### 3.2 Position Management
**Component:** `PositionManager.tsx`
**Database Table:** `crew_positions`

**Position Fields:**
- `id` (primary key)
- `title` (string, e.g., "Master Electrician")
- `department` (enum: lighting, sound, video, production, stage, wardrobe, props)
- `default_pay_rate` (decimal)
- `overtime_multiplier` (decimal, default 1.5)
- `description` (text)
- `required_skills` (JSON array)

**Standard Positions (Pre-populated):**

**Lighting:**
- Lighting Designer
- Associate Lighting Designer
- Master Electrician
- Assistant Master Electrician
- Electrician
- Moving Light Programmer
- Follow Spot Operator

**Sound:**
- Sound Designer
- A1 (Audio #1)
- A2 (Audio #2)
- Sound Engineer
- Mic Tech

**Video:**
- Projection Designer
- Video Engineer
- Media Server Operator
- Projectionist

**Production:**
- Production Manager
- Technical Director
- Stage Manager
- Assistant Stage Manager
- Production Assistant

**Other:**
- Stagehand
- Carpenter
- Scenic Artist
- Props Master
- Wardrobe Supervisor
- Dresser
- Run Crew

---

#### 3.3 Crew Booking System
**Component:** `CrewBooking.tsx`
**Database Table:** `crew_bookings`

**Booking Fields:**
- `id` (primary key)
- `project_id` (foreign key)
- `event_id` (foreign key, links to production_events)
- `crew_member_id` (foreign key)
- `position_id` (foreign key)
- `start_datetime` (datetime)
- `end_datetime` (datetime)
- `hours` (calculated)
- `pay_rate` (decimal, defaults to position or crew member rate)
- `overtime_hours` (calculated)
- `total_cost` (calculated)
- `status` (enum: requested, tentative, confirmed, declined, completed, cancelled)
- `notes` (text)
- `created_at` (datetime)

**Key Capabilities:**
- Book crew from calendar event
- Drag-and-drop crew assignment
- Conflict detection (crew double-booked)
- Availability checking
- Booking status workflow (request → confirm)
- Bulk booking (assign multiple crew to same event)
- Weekly hour tracking per crew member
- Overtime warnings when hours exceed limits

**Booking Workflow:**
1. Production manager creates calendar event
2. Assigns crew positions needed (e.g., "need 1 ME, 2 Electricians")
3. System suggests available crew based on position and availability
4. PM selects crew members and sends booking requests
5. Crew confirms or declines
6. Confirmed bookings appear on crew's personal calendar

---

#### 3.4 Payroll Integration
**Component:** `PayrollExport.tsx`

**Payroll Export Features:**
- CSV export for payroll systems (ADP, Gusto, QuickBooks)
- Weekly or custom date range
- Columns: Name, Position, Regular Hours, OT Hours, Double-Time Hours, Total Hours, Pay Rate, Total Earnings
- Filter by department or project
- Summary totals

**Export Format (CSV):**
```csv
Name,Position,Regular Hours,OT Hours,DT Hours,Total Hours,Pay Rate,Total Earnings
Jane Smith,Master Electrician,40,5,0,45,$35.00,"$1,487.50"
John Doe,Electrician,32,0,0,32,$25.00,$800.00
```

---

### Technical Implementation

**Database Schema:**
```sql
CREATE TABLE crew_members (
  id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  positions TEXT,
  departments TEXT,
  pay_rate_default REAL,
  overtime_eligible INTEGER DEFAULT 1,
  w9_on_file INTEGER DEFAULT 0,
  notes TEXT,
  availability TEXT,
  photo TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crew_positions (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  default_pay_rate REAL DEFAULT 0,
  overtime_multiplier REAL DEFAULT 1.5,
  description TEXT,
  required_skills TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crew_bookings (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL,
  event_id INTEGER,
  crew_member_id INTEGER NOT NULL,
  position_id INTEGER NOT NULL,
  start_datetime TEXT NOT NULL,
  end_datetime TEXT NOT NULL,
  hours REAL,
  pay_rate REAL,
  overtime_hours REAL DEFAULT 0,
  total_cost REAL,
  status TEXT DEFAULT 'requested',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (event_id) REFERENCES production_events(id),
  FOREIGN KEY (crew_member_id) REFERENCES crew_members(id),
  FOREIGN KEY (position_id) REFERENCES crew_positions(id)
);
```

**Effort Estimate:** 8-10 weeks

---

## 4. Inventory Management (Extended)

### Overview
Extend existing fixture and infrastructure tracking to include props, costumes, scenery, video equipment, and general production inventory.

### Core Features

#### 4.1 Multi-Department Inventory
**Component:** `UnifiedInventory.tsx`
**Database Tables:** Extend existing `fixtures`, `infrastructure_equipment` + new `production_inventory`

**New Inventory Categories:**
- Props
- Costumes
- Scenery/Set Pieces
- Wardrobe
- Tools
- Consumables (gels, tape, batteries, etc.)
- General equipment

**Inventory Item Fields:**
- `id` (primary key)
- `category` (enum: props, costumes, scenery, wardrobe, tools, consumables, general)
- `name` (string)
- `description` (text)
- `manufacturer` (string, optional)
- `model` (string, optional)
- `quantity` (integer)
- `ownership` (enum: owned, rented, borrowed)
- `rental_vendor` (foreign key to vendors, if rented)
- `rental_rate_daily` (decimal)
- `rental_rate_weekly` (decimal)
- `purchase_cost` (decimal)
- `condition` (enum: new, good, fair, poor, repair_needed)
- `location` (string, storage location)
- `qr_code` (string, unique identifier)
- `photos` (JSON array of base64 images)
- `notes` (text)
- `tags` (JSON array, e.g., ["period", "1920s", "formal"])
- `created_at` (datetime)
- `updated_at` (datetime)

---

#### 4.2 QR Code System
**Component:** `QRCodeManager.tsx`

**QR Code Features:**
- Generate unique QR code for each inventory item
- Print QR labels (via label designer)
- Scan QR code to view item details
- Scan to check out/check in items
- Mobile scanning support (future mobile app)

**QR Code Contains:**
- Item ID
- Item name
- Link to item details (web URL for production books)

**Libraries:** qrcode.react for generation, html5-qrcode for scanning

---

#### 4.3 Rental & Borrowed Tracking
**Component:** `RentalTracker.tsx`

**Rental Management:**
- Mark items as rented with vendor information
- Rental period tracking (start date, end date)
- Automatic cost calculation (days × daily rate OR weeks × weekly rate)
- Rental return tracking
- Late fee calculation

**Borrowed Items:**
- Borrowed from (organization or person)
- Borrowed date
- Expected return date
- Return confirmation

---

#### 4.4 Allocation & Conflict Detection
**Component:** `InventoryAllocator.tsx`

**Allocation System:**
- Allocate inventory to specific projects/shows
- Check availability across date ranges
- Detect conflicts (item allocated to multiple shows on same dates)
- Reservation system (hold items for future shows)

**Conflict Detection:**
- Visual warnings when item is double-booked
- Suggest alternative items from inventory
- Show conflict details (which shows need the same item)

---

### Technical Implementation

**Database Schema:**
```sql
CREATE TABLE production_inventory (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  manufacturer TEXT,
  model TEXT,
  quantity INTEGER DEFAULT 1,
  ownership TEXT DEFAULT 'owned',
  rental_vendor_id INTEGER,
  rental_rate_daily REAL,
  rental_rate_weekly REAL,
  purchase_cost REAL,
  condition TEXT DEFAULT 'good',
  location TEXT,
  qr_code TEXT UNIQUE,
  photos TEXT,
  notes TEXT,
  tags TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rental_vendor_id) REFERENCES vendors(id)
);

CREATE TABLE inventory_allocations (
  id INTEGER PRIMARY KEY,
  inventory_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  quantity_allocated INTEGER DEFAULT 1,
  status TEXT DEFAULT 'reserved',
  notes TEXT,
  FOREIGN KEY (inventory_id) REFERENCES production_inventory(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

**Effort Estimate:** 6-8 weeks

---

## 5. Vendor Management

### Overview
Comprehensive vendor database, purchase order system, and invoice tracking.

### Core Features

#### 5.1 Vendor Database
**Component:** `VendorDatabase.tsx`
**Database Table:** `vendors`

**Vendor Fields:**
- `id` (primary key)
- `name` (string)
- `type` (enum: equipment_rental, consumables, services, fabrication, trucking, other)
- `contact_name` (string)
- `email` (string)
- `phone` (string)
- `address` (text)
- `website` (string)
- `payment_terms` (string, e.g., "Net 30")
- `tax_id` (string)
- `notes` (text)
- `rating` (integer, 1-5 stars)
- `created_at` (datetime)
- `updated_at` (datetime)

**Key Capabilities:**
- Add, edit, delete vendors
- Search and filter
- Tag system (preferred vendor, local, etc.)
- Rating/review system
- Document storage (contracts, W-9)
- Export vendor list

---

#### 5.2 Purchase Order System
**Component:** `PurchaseOrders.tsx`
**Database Table:** `purchase_orders`, `purchase_order_items`

**PO Fields:**
- `id` (primary key)
- `po_number` (string, auto-generated)
- `project_id` (foreign key)
- `vendor_id` (foreign key)
- `po_date` (date)
- `required_by_date` (date)
- `status` (enum: draft, sent, confirmed, received, paid, cancelled)
- `subtotal` (decimal, calculated)
- `tax` (decimal)
- `shipping` (decimal)
- `total` (decimal, calculated)
- `notes` (text)
- `created_by` (string)
- `created_at` (datetime)
- `updated_at` (datetime)

**PO Line Items:**
- `id` (primary key)
- `po_id` (foreign key)
- `description` (string)
- `quantity` (decimal)
- `unit_cost` (decimal)
- `total` (calculated: quantity × unit_cost)
- `notes` (text)

**Key Capabilities:**
- Create PO from shop order items
- Auto-generate PO numbers (e.g., PO-2025-001)
- Multi-line item support
- PDF export (professional PO template)
- Email PO to vendor
- Track PO status
- Link to budget line items

**PO Workflow:**
1. Create PO from shop order or manually
2. Add line items
3. Generate PDF
4. Send to vendor via email
5. Vendor confirms → Status: confirmed
6. Items received → Status: received
7. Invoice received → Link invoice
8. Payment made → Status: paid

---

#### 5.3 Invoice Tracking
**Component:** `InvoiceTracker.tsx`
**Database Table:** `invoices`

**Invoice Fields:**
- `id` (primary key)
- `invoice_number` (string)
- `po_id` (foreign key, optional)
- `vendor_id` (foreign key)
- `invoice_date` (date)
- `due_date` (date)
- `amount` (decimal)
- `paid_amount` (decimal, optional)
- `status` (enum: received, approved, paid, overdue, disputed)
- `payment_date` (date, optional)
- `payment_method` (string, e.g., "Check #1234")
- `notes` (text)
- `attachment` (file path or base64)

**Key Capabilities:**
- Link invoice to PO
- Track payment status
- Overdue warnings
- Payment history
- Export to accounting software

---

### Technical Implementation

**Database Schema:**
```sql
CREATE TABLE vendors (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  payment_terms TEXT,
  tax_id TEXT,
  notes TEXT,
  rating INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_orders (
  id INTEGER PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  project_id INTEGER NOT NULL,
  vendor_id INTEGER NOT NULL,
  po_date TEXT NOT NULL,
  required_by_date TEXT,
  status TEXT DEFAULT 'draft',
  subtotal REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  shipping REAL DEFAULT 0,
  total REAL DEFAULT 0,
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

CREATE TABLE purchase_order_items (
  id INTEGER PRIMARY KEY,
  po_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity REAL DEFAULT 1,
  unit_cost REAL DEFAULT 0,
  total REAL DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
);

CREATE TABLE invoices (
  id INTEGER PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  po_id INTEGER,
  vendor_id INTEGER NOT NULL,
  invoice_date TEXT NOT NULL,
  due_date TEXT,
  amount REAL NOT NULL,
  paid_amount REAL,
  status TEXT DEFAULT 'received',
  payment_date TEXT,
  payment_method TEXT,
  notes TEXT,
  attachment TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);
```

**Effort Estimate:** 6-8 weeks

---

## 6. Production Books & Sharing

### Overview
Web-based information sharing portal for production schedules, notes, rosters, and documents.

### Core Features

#### 6.1 Production Book Builder
**Component:** `ProductionBookBuilder.tsx`

**Production Book Sections:**
- Cover page (show title, dates, contact info)
- Production schedule
- Crew roster with contact information
- Venue information
- Technical specifications
- Equipment lists
- Notes and instructions
- Attachments (PDFs, images, documents)
- Emergency contacts

**Customization:**
- Select which sections to include
- Custom ordering
- Department filtering (show only lighting info, etc.)
- Custom branding (logo, colors)

---

#### 6.2 Web Sharing Portal
**Component:** `ProductionBookPortal.tsx`

**Portal Features:**
- Public or password-protected sharing
- No login required for viewers
- Mobile-responsive design
- Real-time updates (when project data changes, portal updates)
- Embedded calendar (iCal subscription)
- Download sections as PDF
- Contact crew directly from roster
- Dark mode support

**URL Structure:**
```
https://showstack.app/books/{book_id}/{share_token}
```

**Access Control:**
- Public link (anyone with URL can view)
- Password-protected (require password to view)
- Expiration dates (link expires after date)
- View-only (no editing)

---

#### 6.3 Automatic Updates
**Component:** `ProductionBookSync.tsx`

**Real-Time Sync:**
- Schedule changes → Production book updates automatically
- Crew roster changes → Portal reflects new contact info
- Equipment list changes → Updated in production book
- Notes added → Appear in portal immediately

**Update Notifications:**
- Optional email notifications to crew when book is updated
- Change log showing recent updates

---

### Technical Implementation

**Backend Requirements:**
- Web server for hosting production books (Express.js or static hosting)
- Database for storing book configurations and access control
- Real-time sync (WebSocket or polling)

**Database Schema:**
```sql
CREATE TABLE production_books (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  expires_at TEXT,
  sections_config TEXT,
  branding_config TEXT,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

**Effort Estimate:** 6-8 weeks (lower priority - can use PDF exports initially)

---

## 7. Tour Logistics

### Overview
Tools for managing touring productions, including tour calendar, venue database, per diem tracking, and equipment manifests.

### Core Features

#### 7.1 Tour Calendar
**Component:** `TourCalendar.tsx`
**Database Table:** `tour_dates`

**Tour Date Fields:**
- `id` (primary key)
- `project_id` (foreign key, tour/show)
- `venue_id` (foreign key)
- `load_in_date` (date)
- `focus_date` (date, optional)
- `tech_date` (date, optional)
- `performance_dates` (JSON array of dates)
- `strike_date` (date)
- `load_out_date` (date)
- `travel_day` (boolean)
- `dark_day` (boolean)
- `notes` (text)
- `status` (enum: confirmed, tentative, cancelled)

**Key Capabilities:**
- Visual tour calendar (timeline view)
- Load-in to load-out tracking
- Travel days and dark days
- Multi-show coordination
- Export tour schedule to PDF/iCal

---

#### 7.2 Venue Database
**Component:** `VenueDatabase.tsx`
**Database Table:** `venues`

**Venue Fields:**
- `id` (primary key)
- `name` (string)
- `type` (enum: theater, arena, outdoor, black_box, club, other)
- `address` (text)
- `city` (string)
- `state` (string)
- `zip` (string)
- `country` (string)
- `capacity` (integer)
- `stage_dimensions` (string, e.g., "40' × 60'")
- `grid_height` (string)
- `loading_dock` (boolean)
- `power_available` (string, e.g., "400A 3-phase")
- `contact_name` (string)
- `contact_email` (string)
- `contact_phone` (string)
- `website` (string)
- `notes` (text)
- `photos` (JSON array)
- `tech_specs` (text or file attachment)
- `created_at` (datetime)
- `updated_at` (datetime)

**Key Capabilities:**
- Add, edit, delete venues
- Search and filter (by city, state, capacity)
- Link venues to tour dates
- Store technical specifications
- Contact information
- Historical notes ("Great load-in, 2hr drive from hotel")

---

#### 7.3 Per Diem Calculator
**Component:** `PerDiemCalculator.tsx`
**Database Table:** `per_diem_records`

**Per Diem Tracking:**
- `id` (primary key)
- `project_id` (foreign key)
- `crew_member_id` (foreign key)
- `date` (date)
- `amount` (decimal)
- `currency` (string, default "USD")
- `location` (string, city/state)
- `meal_type` (enum: breakfast, lunch, dinner, full_day)
- `notes` (text)

**Features:**
- Standard per diem rates by city/state
- Custom per diem rates
- Track per diem by crew member and date
- Export for expense reporting
- Currency conversion (for international tours)

**Per Diem Reports:**
- Weekly per diem summary
- Crew member total
- Project total
- Export to CSV for accounting

---

#### 7.4 Equipment Manifests
**Component:** `TourManifest.tsx`

**Manifest Features:**
- Packing lists (what equipment goes on tour)
- Truck packing diagrams
- Equipment tracking (which truck, which case)
- Check-in/check-out workflow
- Damage tracking
- Replacement tracking

**Integration:**
- Pull from existing fixture/equipment inventory
- Mark items as "on tour"
- Conflict detection (item needed in two places)

---

### Technical Implementation

**Database Schema:**
```sql
CREATE TABLE tour_dates (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL,
  venue_id INTEGER NOT NULL,
  load_in_date TEXT,
  focus_date TEXT,
  tech_date TEXT,
  performance_dates TEXT,
  strike_date TEXT,
  load_out_date TEXT,
  travel_day INTEGER DEFAULT 0,
  dark_day INTEGER DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'confirmed',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (venue_id) REFERENCES venues(id)
);

CREATE TABLE venues (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'USA',
  capacity INTEGER,
  stage_dimensions TEXT,
  grid_height TEXT,
  loading_dock INTEGER DEFAULT 0,
  power_available TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  notes TEXT,
  photos TEXT,
  tech_specs TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE per_diem_records (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL,
  crew_member_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  location TEXT,
  meal_type TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (crew_member_id) REFERENCES crew_members(id)
);
```

**Effort Estimate:** 8-12 weeks

---

## 8. Reporting & Analytics

### Overview
Comprehensive reporting system for budgets, labor, schedules, and production metrics.

### Core Reports

#### 8.1 Budget Reports
- Budget summary (estimated vs. actual)
- Variance analysis
- Department rollup
- Cost by category
- Vendor spending report

#### 8.2 Labor Reports
- Crew hours summary
- Overtime report
- Payroll export (CSV)
- Labor cost by project
- Weekly hours by crew member

#### 8.3 Schedule Reports
- Production calendar (PDF)
- Crew call sheet
- Daily schedule
- Weekly schedule
- Conflict report (double-bookings)

#### 8.4 Inventory Reports
- Equipment allocation
- Rental costs
- Inventory by department
- Missing/damaged equipment
- Maintenance schedule

#### 8.5 Tour Reports
- Tour schedule
- Venue contact list
- Per diem summary
- Equipment manifest
- Travel logistics

---

## Integration Advantages

### Unique ShowStack Integrations

#### Fixture Plot → Budget
- Fixture count drives labor hours for focus call
- Equipment rental costs from shop order feed budget automatically
- Power requirements inform venue selection

#### Shop Order → Purchase Order
- Equipment items from shop order → PO line items
- Vendor information pre-populated
- Cost tracking from quote to invoice

#### Calendar → Labor Cost
- Scheduled events calculate crew hours
- Overtime automatically calculated
- Budget updates in real-time

#### Inventory → Allocation
- Fixtures allocated to specific shows
- Conflict detection (same fixture in two shows)
- Rental period tracking

---

## Development Timeline

### Phase 1: Core Production Features (Year 3, 2027-2028)
**Duration:** 22-28 weeks (5-7 months)

1. **Production Scheduling** (8-10 weeks)
2. **Budget Tracking** (6-8 weeks)
3. **Labor Management** (8-10 weeks)

**Deliverable:** Production Edition v1.0 with core features

---

### Phase 2: Enhanced Features (Year 3-4, 2028)
**Duration:** 16-22 weeks (4-5.5 months)

1. **Inventory Extensions** (6-8 weeks)
2. **Vendor Management** (6-8 weeks)
3. **Tour Logistics** (8-12 weeks)

**Deliverable:** Production Edition v2.0 with enhanced features

---

### Phase 3: Advanced Features (Year 4+, 2029+)
**Duration:** 12-20 weeks (3-5 months)

1. **Production Books** (6-8 weeks)
2. **Advanced Reporting** (4-6 weeks)
3. **Mobile App** (12-16 weeks, optional)

**Deliverable:** Production Edition v3.0 with full feature parity

---

## Success Metrics

### User Adoption
- **Year 3:** 200+ Production Edition users
- **Year 4:** 500+ Production Edition users
- **Year 5:** 1,000+ Production Edition users

### Feature Usage
- 80% of users use scheduling features
- 70% use budget tracking
- 60% use labor management
- 40% use tour logistics

### Competitive Wins
- 50+ users choosing ShowStack over Propared
- 100+ users consolidating from multiple tools

---

## Conclusion

The Production Edition represents a comprehensive production management solution that integrates seamlessly with ShowStack's technical design tools. By offering scheduling, budgeting, labor management, inventory, vendor management, and tour logistics in a unified platform, ShowStack provides unprecedented value to technical directors, production managers, and producing organizations.

**Key Advantages:**
1. **Integration:** Design data flows automatically to production
2. **Pricing:** $599/year vs. Propared's $1,750/year (66% savings)
3. **Offline-First:** Works without internet
4. **Comprehensive:** Technical design + production management in one platform

**Total Development Investment:** 50-70 weeks (12-17 months) for full feature parity

---

**See Also:**
- `propared-parity-analysis.md` - Competitive analysis vs. Propared
- `PROJECT_STATUS.md` - Current development status and roadmap
- `docs/architecture/naming-and-editions.md` - Edition structure and pricing

**Last Updated:** December 28, 2024
