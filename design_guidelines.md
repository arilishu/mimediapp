# MiPediApp – Design Guidelines

## 1. Brand Identity

**Purpose**: MiPediApp centralizes children's medical records for anxious parents who need quick, reliable access to critical health information.

**Aesthetic Direction**: **Soft & Trustworthy Medical** – A calming, approachable design that reduces parental anxiety while maintaining professional credibility. Think pediatrician's office meets thoughtful app design: gentle colors, generous breathing room, clear hierarchy, and reassuring visual cues.

**Memorable Element**: Each child profile uses a pastel-tinted card with a custom illustrated avatar, making multi-child management feel personal and warm rather than clinical.

## 2. Navigation Architecture

**Root Navigation**: Tab Bar (5 tabs)
- **Niños** (Home icon) - Dashboard with child list
- **Visitas** (Calendar icon) - Medical visits timeline
- **Vacunas** (Shield icon) - Vaccination schedule
- **Turnos** (Clock icon) - Upcoming appointments
- **Emergencias** (AlertCircle icon) - Quick access to emergency hospitals

**Auth Flow**: 
- Login/Signup screens (email + password, Google SSO button)
- Account screen accessible via profile icon in header (Niños tab)

## 3. Screen-by-Screen Specifications

### 3.1 Login Screen
- **Purpose**: Authenticate users
- **Layout**: 
  - Transparent header, no navigation buttons
  - Scrollable form centered vertically
  - Logo illustration at top
  - Email/password fields
  - "Olvidé mi contraseña" link below fields
  - Primary button: "Iniciar Sesión"
  - Divider with "o continuar con"
  - Google SSO button
  - Bottom link: "¿No tienes cuenta? Regístrate"
- **Insets**: Top: insets.top + 60, Bottom: insets.bottom + 40

### 3.2 Dashboard (Niños Tab)
- **Purpose**: View and select child profiles
- **Layout**:
  - Transparent header with "Mis Niños" title (large, bold)
  - Profile icon (top right) → Account screen
  - Scrollable grid of child cards (2 columns)
  - Floating action button (bottom right): "+" to add child
- **Components**: 
  - Child Card: pastel background, illustrated avatar, name, age, "Ver perfil" button
  - Empty state: illustration + "Agrega tu primer niño"
- **Insets**: Top: headerHeight + 24, Bottom: tabBarHeight + 80

### 3.3 Child Profile Screen (Modal)
- **Purpose**: View comprehensive health overview for one child
- **Layout**:
  - Default header with back button, child name as title, share icon (top right)
  - Scrollable content with sections:
    - Growth curve chart (collapsible)
    - Próximo Turno card (if exists)
    - "Últimas Visitas" (3 cards, "Ver más" button)
    - "Medicamentos Frecuentes" (3 chips, "Ver más")
    - "Vacunas Recientes" (3 rows, "Ver más")
    - "Alergias" (3 tags, "Ver más")
    - "Médicos Frecuentes" (3 contact cards, "Ver más")
    - "Enfermedades Previas" (3 rows, "Ver más")
- **Insets**: Top: 16, Bottom: insets.bottom + 24

### 3.4 Medical Visits (Visitas Tab)
- **Purpose**: View and log medical checkups
- **Layout**:
  - Transparent header: "Visitas Médicas", filter icon (right)
  - Scrollable timeline list of visit cards (newest first)
  - Floating action button: "+" nueva visita
- **Components**:
  - Visit card: Date, doctor name, weight/height badges, expand for notes
  - Empty state: "Aún no hay visitas registradas"
- **Insets**: Top: headerHeight + 24, Bottom: tabBarHeight + 80

### 3.5 Add/Edit Visit (Modal)
- **Purpose**: Log medical visit data
- **Layout**:
  - Default header: "Nueva Visita", X (left), Guardar (right, primary color)
  - Scrollable form:
    - Child selector (if multiple)
    - Date picker (default: today)
    - Doctor dropdown (existing) or "+ Nuevo médico"
    - Weight input (kg)
    - Height input (cm)
    - Head circumference input (cm)
    - Notes textarea
  - Buttons in header
- **Insets**: Top: 16, Bottom: insets.bottom + 24

### 3.6 Vaccines (Vacunas Tab)
- **Purpose**: Track vaccination schedule
- **Layout**:
  - Transparent header: "Calendario de Vacunas"
  - Child selector dropdown (if multiple)
  - Scrollable list grouped by age milestones
- **Components**:
  - Vaccine row: name, recommended age, checkbox (applied), date badge
  - Green checkmark for completed, orange dot for pending
  - Empty state: illustration + "Selecciona un niño"
- **Insets**: Top: headerHeight + 24, Bottom: tabBarHeight + 24

### 3.7 Appointments (Turnos Tab)
- **Purpose**: Manage upcoming medical appointments
- **Layout**:
  - Transparent header: "Próximos Turnos"
  - Scrollable list of appointment cards (soonest first)
  - Floating action button: "+" nuevo turno
- **Components**:
  - Appointment card: Date/time, doctor, specialty, notes, edit/delete icons
  - Past appointments in collapsed section
  - Empty state: "No tienes turnos agendados"
- **Insets**: Top: headerHeight + 24, Bottom: tabBarHeight + 80

### 3.8 Emergency Hospitals (Emergencias Tab)
- **Purpose**: Quick access to emergency contacts
- **Layout**:
  - Transparent header: "Hospitales de Emergencia"
  - Scrollable list of hospital cards
  - Floating action button: "+" agregar hospital
- **Components**:
  - Hospital card: Name, address, phone (tap to call), specialties tags, directions icon
  - Empty state: "Agrega hospitales cercanos"
- **Insets**: Top: headerHeight + 24, Bottom: tabBarHeight + 80

### 3.9 Account Screen (Modal from header)
- **Purpose**: Manage user profile and settings
- **Layout**:
  - Default header: "Mi Cuenta", X (left)
  - Scrollable content:
    - Avatar (generated, editable)
    - Display name field
    - Email (non-editable)
    - "Cambiar contraseña" button
    - "Cerrar sesión" button (secondary)
    - "Configuración" section → nested settings
- **Insets**: Top: 16, Bottom: insets.bottom + 24

## 4. Color Palette

**Primary**: #6BA5CF (soft sky blue – trustworthy, calm)
**Secondary**: #A8D5BA (sage green – health, growth)
**Accent**: #FFB84D (warm amber – alerts, highlights)

**Backgrounds**:
- App background: #F8FAFB (very light blue-gray)
- Surface/Card: #FFFFFF
- Surface elevated: #FFFFFF (shadow for depth)

**Text**:
- Primary text: #2C3E50 (dark blue-gray)
- Secondary text: #6B7C93
- Disabled: #A5B3C7

**Semantic**:
- Success: #5FB894 (calm green)
- Warning: #FFB84D (amber)
- Error: #E07A7A (soft red)
- Info: #6BA5CF (primary)

**Child Profile Tints** (for cards): #E8F4F8, #F0F8E8, #FFF4E6, #F8E8F4

## 5. Typography

**Font**: Nunito (Google Font) for warm, friendly medical experience
- Headings: Nunito Bold
- Body/UI: Nunito Regular

**Type Scale**:
- XXL (32): Screen titles
- XL (24): Section headers
- L (18): Card titles, important labels
- M (16): Body text, buttons
- S (14): Secondary text, captions
- XS (12): Footnotes, badges

## 6. Visual Design

- Icons: Feather icon set (@expo/vector-icons)
- Touchable feedback: Slight scale (0.97) + opacity (0.7) on press
- Cards: 12px border radius, subtle shadow (offset: 0,2 / opacity: 0.08 / radius: 8)
- Floating action button: Primary color circle, white plus icon, shadow (offset: 0,2 / opacity: 0.10 / radius: 2)
- Input fields: 8px border radius, light border (#E5EAF0), focus state with primary color border
- Badges: 16px border radius, colored background at 15% opacity with matching text

## 7. Assets to Generate

**App Assets**:
1. **icon.png** - App icon: Stethoscope + heart in soft circular design, primary color gradient
2. **splash-icon.png** - Same as icon, centered on light background

**Illustrations**:
3. **welcome-hero.png** - Parent holding child's hand with medical icons floating around. **WHERE USED**: Login/signup top area
4. **empty-children.png** - Gentle illustration of teddy bear with clipboard. **WHERE USED**: Dashboard empty state
5. **empty-visits.png** - Minimalist calendar with stethoscope. **WHERE USED**: Medical visits empty state
6. **empty-appointments.png** - Clock with soft checkmark. **WHERE USED**: Appointments empty state
7. **empty-hospitals.png** - Simple hospital building icon. **WHERE USED**: Emergency hospitals empty state

**Child Avatars** (generate 8 diverse options):
8. **avatar-boy-1.png** through **avatar-boy-4.png** - Illustrated child faces (various skin tones)
9. **avatar-girl-1.png** through **avatar-girl-4.png** - Illustrated child faces (various skin tones)
**WHERE USED**: Child profile cards, profile screen headers

All illustrations should use soft colors from the palette, minimal line work, and convey trust/care without medical sterility.