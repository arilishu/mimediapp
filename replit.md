# MiPediApp - Gestion de Salud Infantil

## Overview
MiPediApp es una aplicacion movil (Android e iOS) desarrollada con Expo (React Native) que permite a padres y cuidadores gestionar y consultar informacion medica pediatrica desde un unico lugar seguro.

La aplicacion centraliza datos clave de salud infantil, incluyendo visitas medicas, vacunas, medicamentos, alergias, enfermedades previas y turnos medicos.

## Project Architecture

### Frontend (Expo/React Native)
- **client/**: Contains all React Native code
  - **App.tsx**: Main application entry with navigation, fonts, and providers
  - **components/**: Reusable UI components (Card, Button, Input, EmptyState, etc.)
  - **screens/**: Application screens organized by feature
  - **navigation/**: Navigation structure with tab and stack navigators
  - **constants/theme.ts**: Design system colors, spacing, typography
  - **lib/storage.ts**: AsyncStorage utilities for local data persistence
  - **lib/utils.ts**: Helper functions (date formatting, age calculation)
  - **types/index.ts**: TypeScript type definitions

### Backend (Express.js)
- **server/**: Express.js API server
  - **index.ts**: Server configuration with CORS, body parsing, static serving
  - **routes.ts**: API route definitions

### Data Storage
- Uses AsyncStorage for local persistence
- Data models: Children, Medical Visits, Doctors, Medications, Vaccines, Appointments, Allergies, Past Diseases, Hospitals

## Design System
- **Primary Color**: #6BA5CF (soft sky blue)
- **Secondary Color**: #A8D5BA (sage green)
- **Accent Color**: #FFB84D (warm amber)
- **Font**: Nunito (Google Fonts)
- **Style**: Soft & Trustworthy Medical aesthetic

## Key Features
1. **Dashboard**: View and manage child profiles
2. **Medical Visits**: Log weight, height, head circumference, doctor visits
3. **Vaccination Calendar**: Track applied and pending vaccines
4. **Appointments**: Schedule and manage medical appointments
5. **Emergency Hospitals**: Quick access to emergency contacts with call/directions

## Running the App
- Frontend runs on port 8081 (Expo)
- Backend runs on port 5000 (Express)
- Use `Start Frontend` workflow for Expo dev server
- Use `Start Backend` workflow for Express server

## User Preferences
- Language: Spanish (es-ES)
- Date format: DD MMM YYYY
- All UI text in Spanish
