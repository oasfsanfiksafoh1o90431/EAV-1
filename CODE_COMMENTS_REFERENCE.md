# 📚 Code Comments Reference Guide

## Quick Reference for Understanding the Codebase

---

## 🎯 Comment Patterns Used

### **Pattern 1: Section Markers**
Used to separate major sections of code

```typescript
// ============================================
// SECTION NAME
// Brief description
// ============================================
```

**Where to find:**
- State declarations
- Function definitions
- Component sections
- Print styles

---

### **Pattern 2: Function Documentation**
Explains what each function does

```typescript
// ============================================
// FUNCTION: Function Name
// Purpose and description
// - Key feature 1
// - Key feature 2
// ============================================
const functionName = () => {
  // Implementation
};
```

**Where to find:**
- `handlePrint()` - Print functionality
- `handleSave()` - Save to database
- `handleExportJSON()` - JSON export
- `handleExportCSV()` - CSV export
- `updateField()` - Form field updates
- `updateMedicalHistory()` - Medical checkbox updates
- `updatePrenatalVisit()` - Prenatal visit updates
- `updateDeliveryChecklist()` - Birth plan updates

---

### **Pattern 3: JSX Component Comments**
Explains UI sections

```jsx
{/* ============================================
    COMPONENT NAME
    Description of what it does
    ============================================ */}
<div>
  {/* Component content */}
</div>
```

**Where to find:**
- Print settings panel
- Signature section
- Print-only styles
- Header sections

---

## 📖 Where to Find Important Code

### **State Management** (Lines ~390-400)
```typescript
// ============================================
// STATE: Background Image for Printing
// Set custom background image URL for print layout
// ============================================
const [printBackgroundImage, setPrintBackgroundImage] = useState<string>('');
const [showPrintBackground, setShowPrintBackground] = useState(false);
```

### **Print Function** (Lines ~430-455)
```typescript
// ============================================
// FUNCTION: Handle Print
// Opens browser print dialog with optimized layout
// - Hides navigation and buttons
// - Shows all tabs in vertical flow
// - Applies professional formatting
// ============================================
const handlePrint = () => {
  // Implementation with error handling
};
```

### **Save Function** (Lines ~405-425)
```typescript
// ============================================
// FUNCTION: Handle Save
// Saves maternal record to patient database
// - Stores draft in localStorage
// - Saves to encrypted patient list
// - Returns to dashboard on success
// ============================================
const handleSave = () => {
  // Implementation
};
```

### **Export Functions** (Lines ~427-480)
```typescript
// ============================================
// FUNCTION: Export as JSON
// Downloads complete record as JSON file
// ============================================

// ============================================
// FUNCTION: Export as CSV
// Downloads record as CSV spreadsheet
// ============================================
```

### **Update Functions** (Lines ~485-530)
```typescript
// ============================================
// FUNCTION: Update Form Field
// Generic field updater for maternal data
// ============================================

// ============================================
// FUNCTION: Update Medical History Checkbox
// Updates individual medical condition flags
// ============================================

// ============================================
// FUNCTION: Update Prenatal Visit Data
// Updates specific visit record by index
// ============================================

// ============================================
// FUNCTION: Update Delivery Checklist Item
// Toggles birth plan checklist items
// ============================================
```

### **Print Settings UI** (Lines ~663-705)
```jsx
{/* ============================================
    PRINT SETTINGS: Background Image Control
    Allows customization of print background
    - Useful for adding clinic logo watermarks
    - Professional document branding
    - Optional - can be left blank
    ============================================ */}
```

### **Signature Section** (Lines ~2115-2150)
```jsx
{/* ============================================
    SIGNATURE SECTION - Print Only
    Professional signature lines for client & midwife
    ============================================ */}
```

### **Enhanced Print Styles** (Lines ~2200-2400)
```jsx
{/* ============================================
    ENHANCED PRINT STYLES
    Comprehensive print layout optimization
    - A4 paper size with proper margins
    - Background image support (optional)
    - Clean professional formatting
    - All tabs displayed in vertical flow
    ============================================ */}
```

---

## 🔍 Key Code Sections by Purpose

### **Print-Related Code**

| Purpose | Location | Comment Marker |
|---------|----------|----------------|
| Print state | Lines ~395-400 | `STATE: Background Image` |
| Print function | Lines ~430-455 | `FUNCTION: Handle Print` |
| Print settings UI | Lines ~663-705 | `PRINT SETTINGS:` |
| Print styles | Lines ~2200-2400 | `ENHANCED PRINT STYLES` |
| Signature section | Lines ~2115-2150 | `SIGNATURE SECTION` |

### **Data Management Code**

| Purpose | Location | Comment Marker |
|---------|----------|----------------|
| Save to database | Lines ~405-425 | `FUNCTION: Handle Save` |
| Export JSON | Lines ~427-445 | `FUNCTION: Export as JSON` |
| Export CSV | Lines ~447-480 | `FUNCTION: Export as CSV` |
| Update fields | Lines ~485-530 | `FUNCTION: Update...` |

### **UI Components**

| Component | Location | Comment Marker |
|-----------|----------|----------------|
| Header | Lines ~570-626 | `Header` section |
| Print Settings | Lines ~663-705 | `PRINT SETTINGS:` |
| Form Tabs | Lines ~707+ | Tab sections |
| Signatures | Lines ~2115-2150 | `SIGNATURE SECTION` |

---

## 🎨 Print CSS Comments

### **Main Sections in Print Styles**

```css
/* ========================================
   PAGE SETUP - A4 Size Configuration
   ======================================== */

/* ========================================
   BACKGROUND IMAGE SETUP
   Dynamic background based on user setting
   ======================================== */

/* ========================================
   HIDE NAVIGATION & INTERACTIVE ELEMENTS
   Clean printout without UI controls
   ======================================== */

/* ========================================
   SHOW ALL FORM TABS IN VERTICAL FLOW
   All sections print as single document
   ======================================== */

/* ========================================
   PAGE BREAK CONTROLS
   Smart pagination for clean printing
   ======================================== */

/* ========================================
   COLOR ACCURACY
   Ensure colors print correctly
   ======================================== */

/* ========================================
   SIGNATURE LINES
   Professional signature formatting
   ======================================== */
```

---

## 🚀 Quick Navigation Guide

### **Want to modify print layout?**
→ Go to lines ~2200-2400 (Enhanced Print Styles section)

### **Want to change save behavior?**
→ Go to lines ~405-425 (Handle Save function)

### **Want to add/edit background image feature?**
→ Go to lines ~395-400 (State) and ~663-705 (UI)

### **Want to modify signature section?**
→ Go to lines ~2115-2150 (Signature Section)

### **Want to change export format?**
→ Go to lines ~427-480 (Export functions)

### **Want to update form fields?**
→ Go to lines ~485-530 (Update functions)

---

## 💡 Tips for Working with This Code

### **Finding Functions**
1. Search for `// FUNCTION:` to find all function definitions
2. Each function has a clear description of what it does
3. Key features are listed with bullet points

### **Understanding State**
1. Search for `// STATE:` to find state variable declarations
2. Each state has a comment explaining its purpose
3. State updates are documented in update functions

### **Modifying Print Styles**
1. All print styles are in one `<style>` block at the bottom
2. Each CSS section has a header comment
3. Classes use Tailwind's `print:` prefix

### **Debugging**
1. Check console for errors (`console.error` statements included)
2. Toast messages provide user feedback
3. Error handling in try/catch blocks

---

## 📋 Checklist for Code Changes

When modifying the code:

- [ ] Read the comment for the section you're changing
- [ ] Update the comment if behavior changes
- [ ] Add comments for new features
- [ ] Follow the existing comment pattern
- [ ] Test print functionality after changes
- [ ] Verify error handling still works
- [ ] Check that existing features still work

---

## 🔧 Common Modifications

### **Adding a New Form Field**
1. Add to `MaternalData` interface
2. Add to `INITIAL_DATA` object
3. Add to form UI in appropriate tab
4. Update export functions if needed
5. Add comment explaining the field

### **Changing Print Layout**
1. Go to print styles section (~2200-2400)
2. Find the relevant CSS section
3. Modify the styles
4. Test in print preview
5. Update comments if behavior changes

### **Adding New Export Format**
1. Create new `handleExport___()` function
2. Add function documentation comment
3. Add button in UI
4. Test the export
5. Add error handling

---

## 📞 Need Help?

### **Understanding a Section**
1. Find the section using search (Ctrl+F)
2. Read the comment header
3. Look at the code below it
4. Check related functions

### **Making Changes**
1. Read comments for affected sections
2. Make changes carefully
3. Test thoroughly
4. Update comments
5. Document new features

---

**Remember:** Comments are here to help you! Read them before making changes.

**Last Updated:** April 2026  
**File:** MaternalHealthRecord.tsx  
**Total Lines:** ~2400+  
**Comment Coverage:** Comprehensive
