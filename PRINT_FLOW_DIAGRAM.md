# 🔄 Print System Flow Diagram

## Visual Guide to How the Print System Works

---

## 📋 User Flow

```
┌─────────────────────────────────────────────┐
│         USER OPENS PATIENT RECORD           │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│   OPTIONAL: Configure Print Settings       │
│   ┌───────────────────────────────────┐   │
│   │  Enter background image URL       │   │
│   │  ☑️ Enable background in print    │   │
│   └───────────────────────────────────┘   │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         USER CLICKS "PRINT" BUTTON          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│    Toast Message Appears (5 seconds)        │
│    "Tip: Set Scale to 100% and choose A4"  │
└─────────────────┬───────────────────────────┘
                  │
                  ▼ (300ms delay)
┌─────────────────────────────────────────────┐
│      PRINT DIALOG OPENS                     │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │  Print Preview Shows:               │  │
│  │  • Clinic header with logo          │  │
│  │  • All tabs in vertical flow        │  │
│  │  • Background image (if enabled)    │  │
│  │  • Professional signature lines     │  │
│  │  • Footer with confidentiality      │  │
│  └─────────────────────────────────────┘  │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         USER REVIEWS PREVIEW                │
│         Adjusts settings if needed          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         USER CLICKS "PRINT"                 │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│    DOCUMENT PRINTS SUCCESSFULLY! ✅         │
└─────────────────────────────────────────────┘
```

---

## 🔧 Technical Flow

```
┌─────────────────────────────────────────────┐
│     Component State Initialization          │
│                                             │
│  const [printBackgroundImage, set...] = ''  │
│  const [showPrintBackground, set...] = false│
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│        User Interacts with UI               │
│                                             │
│  • Enters background image URL              │
│  • Toggles checkbox                         │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      State Updates (React)                  │
│                                             │
│  setPrintBackgroundImage(url)               │
│  setShowPrintBackground(true/false)         │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│    handlePrint() Function Called            │
│                                             │
│  try {                                      │
│    // Show helpful toast                    │
│    toast.info('Tip: ...')                   │
│                                             │
│    // Delay 300ms                           │
│    setTimeout(() => {                       │
│      window.print()                         │
│    }, 300)                                  │
│                                             │
│  } catch (error) {                          │
│    // Handle errors                         │
│    console.error(error)                     │
│    toast.error('Print failed')              │
│  }                                          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│     Browser Print System Activates          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│   @media print CSS Styles Apply             │
│                                             │
│  • Hide navigation & buttons                │
│  • Show all tab content                     │
│  • Apply page breaks                        │
│  • Inject background image (if enabled)     │
│  • Show signature section                   │
│  • Format for A4 paper                      │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│    Print Preview Rendered                   │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│    User Confirms → Document Prints          │
└─────────────────────────────────────────────┘
```

---

## 🎨 CSS Application Flow

```
SCREEN VIEW
├── Normal Styles Applied
├── Tabs visible (5 tabs)
├── Buttons visible
├── Navigation visible
└── Background image HIDDEN

                  ↓ window.print()

PRINT VIEW
├── @media print { } Activates
│
├── HIDE ELEMENTS
│   ├── .print:hidden → display: none
│   ├── Header buttons
│   ├── Tab navigation
│   ├── Print settings panel
│   └── User info
│
├── SHOW ELEMENTS
│   ├── .print:block → display: block
│   ├── All tab content (vertical flow)
│   └── Signature section
│
├── APPLY BACKGROUND (if enabled)
│   └── ${showPrintBackground && printBackgroundImage ?
│       body { background-image: url(...) }
│       : ''}
│
├── FORMAT FOR PAPER
│   ├── @page { size: A4; margin: 1.5cm; }
│   ├── Page breaks (smart)
│   ├── Color accuracy
│   └── Typography optimization
│
└── RESULT: Clean Professional Printout
```

---

## 🔀 Conditional Background Flow

```
┌─────────────────────────────────────────────┐
│   Is showPrintBackground === true?          │
└─────────────┬───────────────┬───────────────┘
              │               │
          YES │               │ NO
              ▼               ▼
    ┌──────────────┐   ┌──────────────┐
    │ Check if URL │   │ No background│
    │ is provided? │   │ applied      │
    └──────┬───────┘   └──────────────┘
           │
       YES │  NO → No background
           ▼
    ┌──────────────────────────────────┐
    │  Inject Background CSS:          │
    │                                  │
    │  body {                          │
    │    background-image: url(${url}) │
    │    background-size: contain      │
    │    background-position: center   │
    │    background-repeat: no-repeat  │
    │  }                               │
    └──────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────┐
    │  Background Visible in Print     │
    └──────────────────────────────────┘
```

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────┐
│         MATERNAL HEALTH DATA                │
│  (Stored in formData state)                 │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         RENDERED IN TABS                    │
│                                             │
│  Tab 1: Patient Info                        │
│  Tab 2: Pregnancy                           │
│  Tab 3: Risk & Vaccination                  │
│  Tab 4: Prenatal Visits                     │
│  Tab 5: Birth Plan                          │
└─────────────────┬───────────────────────────┘
                  │
                  │ SCREEN VIEW
                  │ (Only active tab visible)
                  │
                  ▼ window.print()
                  │
                  │ PRINT VIEW
                  │ (All tabs visible)
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      PRINT DOCUMENT STRUCTURE               │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ HEADER (Logo + Clinic Name)           │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ PATIENT INFORMATION                   │ │
│  │ (All fields from Tab 1)               │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ PREGNANCY DETAILS                     │ │
│  │ (All fields from Tab 2)               │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ RISK CODES & VACCINATION              │ │
│  │ (All fields from Tab 3)               │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ PRENATAL VISITS (1-6)                 │ │
│  │ (All visits from Tab 4)               │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ BIRTH PLAN CHECKLIST                  │ │
│  │ (All 16 items from Tab 5)             │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ SIGNATURE SECTION                     │ │
│  │ • Client signature line               │ │
│  │ • Midwife signature line              │ │
│  │ • Date fields                         │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ FOOTER                                │ │
│  │ Confidentiality notice                │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 🎯 Error Handling Flow

```
┌─────────────────────────────────────────────┐
│      User Clicks Print Button              │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         try { ... }                         │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│    Toast notification displayed              │
│    setTimeout starts (300ms)                │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         window.print() executes             │
└─────────────┬───────────────┬───────────────┘
              │               │
         ✅ Success      ❌ Error
              │               │
              ▼               ▼
    ┌──────────────┐   ┌──────────────────┐
    │ Print dialog │   │ catch (error)    │
    │ opens        │   │ {                │
    └──────────────┘   │   console.error  │
                       │   toast.error    │
                       │ }                │
                       └──────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ User sees error  │
                       │ message          │
                       │ Can try again    │
                       └──────────────────┘
```

---

## 🔄 Component Lifecycle

```
┌─────────────────────────────────────────────┐
│   Component Mounts                          │
│   - Load patient data (if editing)          │
│   - Initialize state                        │
│   - Set printBackgroundImage = ''           │
│   - Set showPrintBackground = false         │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│   User Interaction                          │
│   - Fill form fields                        │
│   - Configure print settings                │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│   State Updates                             │
│   - Form data changes                       │
│   - Print settings change                   │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│   Component Re-renders                      │
│   - UI updates to show changes              │
│   - Print settings panel reflects state     │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│   Print Action                              │
│   - handlePrint() called                    │
│   - CSS uses current state values           │
│   - Background applied if enabled           │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│   After Print                               │
│   - Component state unchanged               │
│   - User can print again                    │
│   - Settings persist in session             │
└─────────────────────────────────────────────┘
```

---

## 💾 State Persistence

```
SESSION STORAGE
└── Print settings NOT persisted
    (Reset on page refresh)

LOCAL STORAGE
├── maternalHealthRecord_draft
│   └── Form data auto-saved
│
└── hospital_patients_encrypted
    └── Complete patient records

COMPONENT STATE
├── printBackgroundImage
│   └── Temporary (current session only)
│
└── showPrintBackground
    └── Temporary (current session only)
```

---

## 🎨 CSS Cascade During Print

```
NORMAL STYLES
↓
TAILWIND CLASSES
↓
COMPONENT STYLES
↓
@media print { }  ← HIGHEST PRIORITY
    ↓
    Overrides all previous styles
    ↓
    Controls final print appearance
```

---

## 📱 Responsive Print Flow

```
ANY DEVICE SIZE
        ↓
    window.print()
        ↓
    @media print
        ↓
    ALWAYS A4 FORMAT
        ↓
    21cm × 29.7cm
    (8.27" × 11.69")
```

---

## ✅ Success Indicators

```
✅ Toast notification appears
   ↓
✅ Print dialog opens
   ↓
✅ Preview shows all tabs
   ↓
✅ Signature section visible
   ↓
✅ Background image (if enabled)
   ↓
✅ No console errors
   ↓
✅ Clean professional output
```

---

## 🎯 Quick Reference

| Step | What Happens | Where to Look |
|------|--------------|---------------|
| 1 | User configures | Lines ~663-705 |
| 2 | State updates | Lines ~395-400 |
| 3 | Print clicked | Lines ~430-455 |
| 4 | CSS applies | Lines ~2200-2400 |
| 5 | Preview shows | Browser print |
| 6 | Document prints | Printer output |

---

**Legend:**
- ✅ Success path
- ❌ Error path  
- → Data flow
- ▼ Process flow
- ├── Branch
- └── End

---

**File:** PRINT_FLOW_DIAGRAM.md  
**Purpose:** Visual understanding of print system  
**Audience:** Developers & Technical Users
