# Default Page Layouts

This directory contains the default page layout templates used by ShowStack:Prep for shop order generation. These JSON files define the visual structure and content of each page type.

## Overview

When ShowStack:Prep is first launched or when "Reset to Factory Defaults" is triggered, these JSON files are loaded into the application database as default templates. Users can then customize these templates or create their own variations.

## Files

| File | Page Type | Description |
|------|-----------|-------------|
| `cover_default_layout.json` | cover | Cover page with production info, designer credits, and revision details |
| `contacts_default_layout.json` | contacts | Contact information and important dates |
| `equipment-by-section_default_layout.json` | equipment-by-section | Equipment list organized by sections with delta tracking |
| `notes_default_layout.json` | notes | General conditions, notes, and fixture notes |
| `revision-summary_default_layout.json` | revision-summary | Revision change log with color-coded changes |

## JSON Structure

Each layout file contains two main sections:

### 1. Template Metadata

```json
{
  "template": {
    "name": "Cover Page - ShowStack Default",
    "description": "Professional cover page matching ShowStack Designer format",
    "page_type": "cover",
    "grid_columns": 12,
    "grid_rows": 20,
    "grid_gap": 8,
    "page_width": 816,
    "page_height": 1056,
    "is_default": true
  }
}
```

**Fields:**
- `name`: Display name for the template
- `description`: Detailed description of the layout's purpose
- `page_type`: Type identifier (must match PrintSectionType)
- `grid_columns`: Number of columns in the grid system (typically 12)
- `grid_rows`: Number of rows in the grid system
- `grid_gap`: Spacing between grid cells in pixels
- `page_width`: Page width in pixels (816 = 8.5" at 96 DPI)
- `page_height`: Page height in pixels (1056 = 11" at 96 DPI)
- `is_default`: Mark this as a default template

### 2. Layout Elements

```json
{
  "elements": [
    {
      "element_type": "text",
      "config": { "content": "SHOP ORDER" },
      "grid_column": 0,
      "grid_row": 0,
      "column_span": 12,
      "row_span": 1,
      "layer": 0,
      "style": {
        "fontFamily": "Arial",
        "fontSize": 14,
        "fontWeight": "bold",
        "textAlign": "center",
        "color": "#000000",
        "backgroundColor": "#D1D5DB",
        "padding": 8
      }
    }
  ]
}
```

**Common Fields:**
- `element_type`: Type of element (see Element Types below)
- `config`: Type-specific configuration
- `grid_column`: Starting column (0-indexed)
- `grid_row`: Starting row (0-indexed)
- `column_span`: Number of columns to span
- `row_span`: Number of rows to span
- `layer`: Z-index for stacking (higher = on top)
- `style`: Styling properties (fonts, colors, spacing)

## Element Types

### text
Static or dynamic text content.

**Config:**
```json
{
  "content": "SHOP ORDER - REVISION {revision_number}"
}
```

Supports placeholders:
- `{production_name}` - Production name
- `{venue}` - Venue name
- `{venue_city}` - Venue city
- `{venue_state}` - Venue state
- `{revision_number}` - Current revision number
- etc.

### dataField
Dynamic data field linked to project properties.

**Config:**
```json
{
  "fieldType": "ld_name",
  "label": "Lighting Designer:",
  "showLabel": true
}
```

**Field Types:**
- Contact fields: `ld_name`, `ld_email`, `ld_phone`, `pe_name`, etc.
- Dates: `order_date`, `load_in_date`, `opening_night_date`, etc.
- Project info: `production_name`, `venue`, `venue_city`, etc.
- Revision: `current_revision`, `revision_date`

### shape
Visual shapes and dividers.

**Config:**
```json
{
  "shapeType": "line",
  "thickness": 1,
  "color": "#000000"
}
```

**Shape Types:**
- `line` / `divider`: Horizontal line
- `rectangle`: Filled rectangle

### equipment_list
Dynamic equipment table (auto-generated from project data).

**Config:**
```json
{}
```

Displays equipment organized by sections with:
- Delta indicators (new, modified, removed)
- Quantity columns (Total, Active, Spare)
- Description
- Item notes

### notes_content
Dynamic notes content by type.

**Config:**
```json
{
  "noteType": "general_conditions"
}
```

**Note Types:**
- `general_conditions`
- `general_notes`
- `fixture_notes`

### revision_log
Revision change history (auto-generated).

**Config:**
```json
{}
```

Displays:
- Current revision with change details
- Previous revisions list
- Color-coded change indicators
- Legend for change types

## Style Properties

All elements support these style properties:

```json
{
  "fontFamily": "Arial",
  "fontSize": 12,
  "fontWeight": "normal | bold",
  "fontStyle": "normal | italic",
  "textAlign": "left | center | right",
  "textDecoration": "none | underline",
  "color": "#000000",
  "backgroundColor": "#FFFFFF | transparent",
  "padding": 8,
  "paddingTop": 0,
  "paddingRight": 0,
  "paddingBottom": 0,
  "paddingLeft": 0,
  "lineHeight": 1.4
}
```

## Grid System

The layout uses a 12-column grid system:
- **Columns**: 0-11 (12 total)
- **Rows**: Typically 20-24 depending on page type
- **Positioning**: Elements are placed using `grid_column` and `grid_row`
- **Spanning**: Elements can span multiple columns/rows

### Example Grid Positions

```
Full width header:
grid_column: 0, column_span: 12

Two-column layout (50/50):
Left:  grid_column: 0, column_span: 6
Right: grid_column: 6, column_span: 6

Three-column layout:
Left:   grid_column: 0, column_span: 4
Center: grid_column: 4, column_span: 4
Right:  grid_column: 8, column_span: 4
```

## Page Dimensions

All layouts use letter size (8.5" × 11") at 96 DPI:
- **Width**: 816 pixels (8.5" × 96 DPI)
- **Height**: 1056 pixels (11" × 96 DPI)

This ensures consistent PDF export and printing.

## Modifying Layouts

### Option 1: Edit JSON Files Directly

1. Open the JSON file in a text editor
2. Modify template properties or elements
3. Save the file
4. Reload layouts in the application (Admin Panel → Import or Reset)

### Option 2: Use Admin Panel

1. Access Admin Panel (Cmd/Ctrl+Shift+A)
2. Export layouts to modify them
3. Edit exported files
4. Import modified files
5. Verify changes in Print Preview

### Option 3: Use Layout Designer

1. Open ShowStack:Prep
2. Access Print Builder → Manage Templates
3. Create or edit layouts visually
4. Export to JSON via Admin Panel

## Best Practices

### 1. Backup Before Changes
Always export layouts before modifying them:
```
Admin Panel → Export All Default Layouts
```

### 2. Use Version Control
Commit layout changes to Git with descriptive messages:
```bash
git add src/main/database/defaultLayouts/
git commit -m "Update cover page layout: add company logo field"
```

### 3. Validate JSON
Use a JSON validator (like JSONLint) to ensure valid syntax before importing.

### 4. Test Thoroughly
- Test with sample project data
- Check all page types
- Verify PDF exports
- Test on different screen sizes

### 5. Document Changes
Add comments in Git commit messages explaining:
- What was changed
- Why it was changed
- Any breaking changes

## Troubleshooting

### Layout Not Loading

**Check:**
1. JSON syntax is valid (use JSONLint.com)
2. All required fields are present
3. Element types are spelled correctly
4. Grid positions are within bounds
5. File is saved with UTF-8 encoding

### Elements Not Displaying

**Check:**
1. `grid_column` + `column_span` ≤ `grid_columns`
2. `grid_row` + `row_span` ≤ `grid_rows`
3. Element has valid `style` properties
4. `layer` value doesn't hide the element behind others

### Data Not Showing

**Check:**
1. `fieldType` matches available project properties
2. Project actually has data for that field
3. Placeholder syntax is correct: `{field_name}`
4. `config` object has correct structure for element type

## Development Notes

### Loading Process

1. Application starts → `seedDefaultPageLayoutsFromJSON()` is called
2. Function reads all `.json` files from this directory
3. Each file is parsed and validated
4. Layouts are created in the app database as default templates
5. Fallback: If loading fails, uses hardcoded layouts from `seedDefaultLayouts.ts`

### Fallback Mechanism

The system includes a fallback to hardcoded layouts if JSON loading fails:
- Directory doesn't exist
- No JSON files found
- All files have errors
- JSON parsing fails

This ensures the application always has default layouts available.

## Support

For more information:
- [Admin Panel User Guide](../../../docs/ADMIN_PANEL_USER_GUIDE.md)
- [Admin Panel Migration Summary](../../../docs/ADMIN_PANEL_MIGRATION.md)
- [Phase 1 Development Guide](../../../docs/PHASE_1_DEVELOPMENT_GUIDE.md)

---

**Version**: 1.0
**Last Updated**: November 2025
