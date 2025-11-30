# ShowStack Admin Panel - User Guide

**Version**: 1.0
**Last Updated**: November 2025

---

## Overview

The ShowStack Admin Panel provides secure access to system-wide configuration and template management. It's designed for administrators who need to customize default layouts, manage system settings, and maintain the application.

## Accessing the Admin Panel

### Method 1: Keyboard Shortcut (Recommended)
Press **Cmd+Shift+A** (Mac) or **Ctrl+Shift+A** (Windows/Linux) from anywhere in the application.

### Method 2: Direct URL
Navigate to `/admin` in the application.

## First-Time Setup

### Setting Your Admin Password

1. On first access, you'll be prompted to set an admin password
2. Enter a password (minimum 6 characters)
3. Confirm the password
4. Click "Set Password"

**Important**: Store your password securely. There is no password recovery mechanism.

### Subsequent Access

When accessing the admin panel after setup:
1. Enter your admin password
2. Click "Unlock"
3. You'll be granted access to the admin panel

---

## Features

### Layout Template Management

The Layout Template Manager allows you to export, import, and manage default page layout templates used throughout ShowStack:Prep.

#### Viewing Current Layouts

The main panel displays all default layouts with:
- Template name and description
- Page type (cover, contacts, equipment-by-section, notes, revision-summary)
- Grid configuration (columns × rows)
- Page dimensions (width × height in pixels)

#### Exporting Layouts

**Export Single Layout:**
1. Find the layout you want to export in the list
2. Click the "Export" button next to it
3. Choose a save location
4. The layout will be saved as a JSON file

**Export All Default Layouts:**
1. Click "Export All Default Layouts" in Quick Actions
2. Select a directory to save all layouts
3. All default layouts will be exported as individual JSON files

**Use Cases:**
- Creating backups before making changes
- Sharing custom layouts between installations
- Version controlling layout templates
- Creating custom layout variations

#### Importing Layouts

1. Click "Import Layouts from JSON" in Quick Actions
2. Select one or more JSON layout files
3. The system will validate and import the layouts
4. You'll see a success message with the count of imported layouts

**Validation:**
- The system validates JSON structure before importing
- Invalid files will be skipped with error messages
- Successfully imported layouts are immediately available

#### Reset to Factory Defaults

**⚠️ Warning**: This action cannot be undone!

1. Click "Reset to Factory Defaults"
2. Confirm the action in the dialog
3. All custom default layouts will be deleted
4. Original factory layouts will be restored

**When to use:**
- After breaking layouts during customization
- Reverting to original ShowStack designs
- Starting fresh after experiments

---

## JSON Layout File Structure

### File Format

Layout JSON files follow this structure:

```json
{
  "template": {
    "name": "Cover Page - ShowStack Default",
    "description": "Professional cover page...",
    "page_type": "cover",
    "grid_columns": 12,
    "grid_rows": 20,
    "grid_gap": 8,
    "page_width": 816,
    "page_height": 1056,
    "is_default": true
  },
  "elements": [
    {
      "element_type": "text",
      "config": { "content": "..." },
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
        "color": "#000000"
      }
    }
  ]
}
```

### Element Types

- **text**: Static or dynamic text (supports placeholders like `{production_name}`)
- **dataField**: Dynamic data from project (venue, dates, contacts, etc.)
- **shape**: Lines, rectangles, dividers
- **equipment_list**: Auto-generated equipment table
- **notes_content**: Dynamic notes content
- **revision_log**: Revision change history

### Page Types

- `cover`: Cover page
- `contacts`: Contact information and schedule
- `equipment-by-section`: Equipment organized by sections
- `notes`: General notes and conditions
- `revision-summary`: Revision change log

---

## Workflow: Customizing Default Layouts

### Step 1: Export Current Layouts

```
Admin Panel → Export All Default Layouts → Choose directory
```

This creates backup copies of all current layouts.

### Step 2: Modify Layouts

**Option A: Edit JSON Files Directly**
1. Open exported JSON files in a text editor
2. Modify template properties or element configurations
3. Save changes

**Option B: Use Layout Designer**
1. Open ShowStack:Prep
2. Access Print Builder → Manage Templates
3. Create or edit a layout visually
4. Save as default

### Step 3: Import Modified Layouts

```
Admin Panel → Import Layouts from JSON → Select files
```

The system validates and imports your changes.

### Step 4: Verify Changes

1. Open ShowStack:Prep
2. Create a test shop order
3. Check that layouts render correctly
4. Adjust as needed

---

## Default Layouts Directory

### Location

```
src/main/database/defaultLayouts/
```

### Files

- `cover_default_layout.json` - Cover page
- `contacts_default_layout.json` - Contacts & dates
- `equipment-by-section_default_layout.json` - Equipment list
- `notes_default_layout.json` - Notes page
- `revision-summary_default_layout.json` - Revision log

### Version Control

These JSON files are included in the repository, making them:
- **Version controlled**: Track changes over time
- **Shareable**: Distribute custom layouts easily
- **Reviewable**: See exactly what changed in diffs
- **Restorable**: Revert to previous versions if needed

---

## Best Practices

### Security

1. **Protect Your Password**
   - Use a strong, unique password
   - Don't share admin credentials
   - Change password if compromised

2. **Limit Admin Access**
   - Only grant access to trusted users
   - Use keyboard shortcut to avoid exposing the URL
   - Close admin panel when done

### Layout Management

1. **Always Export Before Changes**
   - Create backups before modifying layouts
   - Keep dated exports for version history
   - Test changes in a development environment first

2. **Use Descriptive Names**
   - Name custom layouts clearly
   - Add detailed descriptions
   - Document customizations

3. **Test Thoroughly**
   - Test with real project data
   - Check all page types
   - Verify PDF exports
   - Test on different screen sizes

4. **Version Control**
   - Commit layout JSON files to Git
   - Use meaningful commit messages
   - Tag releases with version numbers

---

## Troubleshooting

### Can't Access Admin Panel

**Problem**: Password prompt doesn't appear
**Solution**:
- Try the keyboard shortcut (Cmd/Ctrl+Shift+A)
- Check browser console for errors
- Restart the application

**Problem**: Forgot admin password
**Solution**:
- Password cannot be recovered
- Manually delete password from app database:
  ```sql
  DELETE FROM app_settings_kv WHERE key = 'admin_password_hash';
  ```
- Restart application to set new password

### Import Failures

**Problem**: Import shows errors
**Solution**:
- Check JSON syntax (use JSONLint.com)
- Verify all required fields are present
- Ensure element types are valid
- Check console for detailed error messages

**Problem**: Imported layouts don't appear
**Solution**:
- Refresh the layout list
- Check that `is_default: true` is set
- Verify page_type matches expected values
- Restart application

### Layouts Not Rendering

**Problem**: Blank pages in print preview
**Solution**:
- Check that layout has elements
- Verify element grid positions are within bounds
- Check element visibility (layer, style)
- Test with factory defaults

---

## Support

For additional help:
- Check the [Technical Documentation](./ADMIN_PANEL_MIGRATION.md)
- Review [Phase 1 Development Guide](./PHASE_1_DEVELOPMENT_GUIDE.md)
- Report issues on GitHub

---

**Next Steps**: Explore the Layout Designer to visually create and customize layouts!
