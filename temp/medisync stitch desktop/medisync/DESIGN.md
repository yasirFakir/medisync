---
name: MediSync
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#3d4947'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#006492'
  on-secondary: '#ffffff'
  secondary-container: '#58bcfd'
  on-secondary-container: '#004a6d'
  tertiary: '#825100'
  on-tertiary: '#ffffff'
  tertiary-container: '#a36700'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#cae6ff'
  secondary-fixed-dim: '#8ccdff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004b6f'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
---

## Brand & Style
The design system for this platform is built on a foundation of **Calm Professionalism** and **Radical Accessibility**. The visual narrative avoids the clinical coldness of traditional healthcare software, opting instead for a "Human-Centric Medical" aesthetic. It utilizes a **Modern Corporate** style with leanings toward **Minimalism**, ensuring that high-stakes medical information is never obscured by decorative elements.

The emotional response should be one of quiet confidence. By using generous whitespace and a soft, organic color palette, the UI reduces the cognitive load and anxiety often associated with medical data management. The interface feels light, breathable, and unmistakably precise.

## Colors
The palette is rooted in a "Herbal Teal" primary color, chosen for its association with health, vitality, and stability. 

- **Primary (#0D9488):** Used for main actions and brand presence. It provides a grounded, trustworthy focal point.
- **Secondary (#2D9CDB):** A soft sky blue reserved for "Extracted" data points and informational highlights, suggesting clarity.
- **Tertiary/Accent (#F59E0B):** A soft amber used exclusively for "AI-Assisted" safety notices and cautionary information.
- **Neutral Stack:** Backgrounds use a cool-toned off-white (#F8FAFC) to separate the interface from the pure white (#FFFFFF) of interactive cards and surfaces.

## Typography
**Plus Jakarta Sans** is the sole typeface for this design system. Its soft curves and open counters provide a friendly, modern atmosphere while maintaining high legibility for technical medical terms.

- **Headlines:** Set in Dark Charcoal (#1E293B) with tight letter spacing for a sturdy, authoritative feel.
- **Body Text:** Set in Slate (#475569) to reduce contrast harshness, facilitating longer reading sessions of medical reports.
- **Labels:** Use a slightly increased letter spacing and higher font weight to ensure quick scannability in dense data environments.

## Layout & Spacing
The design system employs a **Fluid Grid** model with a 12-column structure for desktop and a 4-column structure for mobile. 

- **The 8px Rhythm:** All spacing (padding, margins, gaps) must be multiples of 8px to maintain a mathematical harmony across the UI.
- **Safety Margins:** Generous outer margins (40px on desktop) ensure the content feels framed and important, rather than cluttered.
- **Sidebar:** On desktop, a fixed 280px sidebar navigation is utilized to provide constant access to core features (Dashboard, Records, Prescriptions).

## Elevation & Depth
Depth is communicated through **Tonal Layers** combined with **Ambient Shadows**. 

- **Level 0 (Background):** #F8FAFC - The base canvas.
- **Level 1 (Cards/Surfaces):** #FFFFFF - Uses a very soft, diffused shadow (0px 4px 20px rgba(30, 41, 59, 0.05)) to appear slightly lifted.
- **Level 2 (Modals/Popovers):** #FFFFFF - Uses a more pronounced shadow (0px 12px 32px rgba(30, 41, 59, 0.12)) to command focus.

Avoid heavy borders; instead, use subtle 1px strokes in #E2E8F0 to define boundaries when elements sit on the same elevation.

## Shapes
The shape language is "Rounded" to reinforce the friendly and approachable brand personality. 

- **Default (8px):** Standard buttons, input fields, and small UI widgets.
- **Large (16px):** Main content cards and prescription detail views.
- **Extra Large (24px):** Large promotional banners or "Upload" drop zones.
- **Pill:** Reserved exclusively for status badges (e.g., 'Verified') and toggle switches.

## Components
### Buttons
- **Primary:** Solid Teal (#0D9488) with white text. High prominence for "Upload Prescription".
- **Secondary:** Ghost style with Teal border and text. Used for "Cancel" or "View Details".

### Badges (Status Indicators)
- **Verified:** Green background (10% opacity of Primary) with solid Primary text. Includes a checkmark icon.
- **Extracted:** Light Blue background (#E0F2FE) with Dark Blue text. Indicates data pulled by OCR.
- **AI-Assisted:** Soft Amber background (#FEF3C7) with Amber text (#B45309). Used for safety warnings.

### Input Fields
- Inputs feature a 1px Slate border that transitions to Primary Teal on focus. 
- Labels always sit above the input in `label-md` style.

### Cards
- Interactive cards must have a hover state that increases the shadow depth slightly (Level 2) and shifts the element -2px on the Y-axis.

### Sidebar
- A minimal, clean sidebar with icons and text. The active state is indicated by a subtle Primary Teal vertical bar on the left edge and a change in icon color.