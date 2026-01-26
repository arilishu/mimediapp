# MiMediApp - Gestion de Salud Familiar

## Overview
MiMediApp es una aplicacion movil (Android e iOS) desarrollada con Expo (React Native) que permite gestionar y consultar informacion medica familiar desde un unico lugar seguro.

La aplicacion centraliza datos clave de salud de toda la familia (hijos, padres, abuelos, etc.), incluyendo visitas medicas, vacunas, medicamentos, alergias, enfermedades previas y turnos medicos.

## Project Architecture

### Frontend (Expo/React Native)
- **client/**: Contains all React Native code
  - **App.tsx**: Main application entry with navigation, fonts, and providers
  - **components/**: Reusable UI components (Card, Button, Input, EmptyState, etc.)
  - **screens/**: Application screens organized by feature in folders:
    - **auth/**: SignInScreen, SignUpScreen
    - **dashboard/**: DashboardScreen
    - **children/**: AddChildScreen, EditChildScreen, ChildProfileScreen
    - **visits/**: VisitsScreen, VisitsListScreen, AddVisitScreen
    - **vaccines/**: VaccinesScreen
    - **appointments/**: AppointmentsScreen, AddAppointmentScreen
    - **allergies/**: AllergiesListScreen, AddAllergyScreen
    - **diseases/**: DiseasesListScreen, AddDiseaseScreen
    - **medications/**: MedicationsListScreen, AddMedicationScreen
    - **doctors/**: DoctorsListScreen, AddDoctorScreen
    - **emergency/**: EmergencyScreen, AddHospitalScreen
  - **navigation/**: Navigation structure with tab and stack navigators
  - **constants/theme.ts**: Design system colors, spacing, typography
  - **lib/api.ts**: API client with typed helpers for all entities
  - **lib/storage.ts**: AsyncStorage utilities (legacy, used for local preferences)
  - **lib/utils.ts**: Helper functions (date formatting, age calculation)
  - **types/index.ts**: TypeScript type definitions

### Backend (Express.js)
- **server/**: Express.js API server
  - **index.ts**: Server configuration with CORS, body parsing, static serving
  - **routes.ts**: Full REST API with CRUD endpoints for all entities

### Database (PostgreSQL)
All data is stored in PostgreSQL for multi-user access and cross-device synchronization:
- **children**: Child profiles with owner association
- **medical_visits**: Visit records with measurements
- **vaccines**: Vaccination schedule and status
- **appointments**: Scheduled medical appointments
- **allergies**: Allergy records with severity
- **past_diseases**: Disease history
- **medications**: Medication records
- **doctors**: Doctor registry (user-owned)
- **hospitals**: Hospital/emergency contacts (user-owned)
- **share_codes**: 8-character codes for child sharing
- **child_access**: Multi-user access permissions for shared children

### API Endpoints
- `GET/POST /api/children` - List/create children (requires userId)
- `GET/PUT/DELETE /api/children/:id` - Get/update/delete child
- `GET/POST /api/visits` - List/create visits (requires childId)
- `GET/POST /api/vaccines` - List/create vaccines
- `GET /api/vaccines/user/:userId` - Get pending vaccines for all user's children
- `POST /api/vaccines/batch` - Initialize vaccine schedule
- `GET/POST /api/appointments` - List/create appointments
- `GET /api/appointments/user/:userId` - Get upcoming appointments for all user's children
- `GET/POST /api/allergies` - List/create allergies
- `GET/POST /api/diseases` - List/create past diseases
- `GET/POST /api/medications` - List/create medications
- `GET/POST /api/doctors` - List/create doctors (requires userId)
- `GET/POST /api/hospitals` - List/create hospitals (requires userId)
- `POST/GET /api/share-codes` - Create/lookup share codes
- `POST /api/child-access` - Grant access to shared children

## Design System
- **Primary Color**: #6BA5CF (soft sky blue)
- **Secondary Color**: #A8D5BA (sage green)
- **Accent Color**: #FFB84D (warm amber)
- **Font**: Nunito (Google Fonts)
- **Style**: Soft & Trustworthy Medical aesthetic

## Authentication
- **Provider**: Clerk (@clerk/clerk-expo)
- **Methods**: Email/Password, Google OAuth SSO
- **Token Storage**: expo-secure-store
- **Screens**: SignInScreen, SignUpScreen (with email verification)
- **Secret**: EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY (required)
- **User ID**: All API calls use Clerk userId for data isolation

## Key Features
1. **Authentication**: Secure login with email/password or Google SSO
2. **Dashboard**: View and manage child profiles with:
   - "Mis Hijos" section showing child cards
   - "Proximos Turnos" section showing upcoming appointments
   - "Vacunas Pendientes" section showing pending vaccines
3. **Medical Visits**: Log weight, height, head circumference, doctor visits
4. **Vaccination Calendar**: Track applied and pending vaccines
5. **Appointments**: Schedule and manage medical appointments
6. **Emergency Hospitals**: Quick access to emergency contacts with call/directions
7. **Child Sharing**: Share child profiles with other users via 8-character codes
   - Generate share codes from child card menu
   - Read-only or full access toggle
   - Load shared children using code in AddChildScreen
   - Data stored in PostgreSQL for cross-device access

## Running the App
- Frontend runs on port 8081 (Expo)
- Backend runs on port 5000 (Express)
- Use `Start Frontend` workflow for Expo dev server
- Use `Start Backend` workflow for Express server

## User Preferences
- Language: Spanish (es-ES)
- Date format: DD MMM YYYY
- All UI text in Spanish

## Test Credentials
- Email: replit@replit.com
- Password: replitClerk

## Recent Changes
- Reorganized screens into feature-based folders (auth, dashboard, children, visits, etc.)
- Added JWT authentication security on all API endpoints via @clerk/express
- Added Sentry error monitoring for both frontend (sentry-expo) and backend (@sentry/node)
- Added GitHub integration for pushing code to repository
- Added Dashboard sections for "Mis Hijos", "Proximos Turnos", and "Vacunas Pendientes"
- Added API endpoints for user-level appointments and vaccines queries
- Migrated all data storage from AsyncStorage to PostgreSQL database
- Added REST API endpoints for all entities
- Implemented user-based data isolation using Clerk userId
- Added child sharing with share_codes and child_access tables

## Error Monitoring (Sentry)
- Frontend: Uses sentry-expo, initialized in App.tsx
- Backend: Uses @sentry/node, initialized in server/index.ts
- DSN stored in SENTRY_DSN (backend) and EXPO_PUBLIC_SENTRY_DSN (frontend) secrets
- Errors are captured automatically and sent to Sentry dashboard
