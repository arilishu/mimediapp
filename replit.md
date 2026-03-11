# MiMediApp - Gestión de Salud Familiar

## ¿Qué es?

MiMediApp es una aplicación móvil (iOS y Android) desarrollada con Expo (React Native) que permite gestionar y consultar información médica familiar desde un único lugar seguro.

Centraliza datos clave de salud de toda la familia: visitas médicas, vacunas, medicamentos, alergias, enfermedades previas y turnos médicos.

---

## Stack

| Capa | Tecnología |
|---|---|
| App móvil | Expo (React Native) |
| Backend API | Express.js + TypeScript |
| Base de datos | PostgreSQL (Neon) |
| Autenticación | Clerk |
| Backend hosting | Vercel |
| Builds / TestFlight | EAS (Expo Application Services) |

---

## Desarrollo local

### Requisitos

- Node.js 18+
- Una cuenta en [expo.dev](https://expo.dev) (pedirle acceso al owner del proyecto)
- Archivo `.env` en la raíz (pedirle al owner del proyecto)

### Instalación

```bash
git clone <URL-del-repo>
cd mimediapp
npm install
```

### Correr la app localmente

Abrí **dos terminales**:

**Terminal 1 — Backend:**
```bash
npm run server:dev
# Corre en http://localhost:5001
```

**Terminal 2 — Expo / Metro:**
```bash
PORT=5001 npx expo start --localhost
```

Luego escaneás el QR con Expo Go, o presionás `i` para iOS simulator / `a` para Android.

---

## Publicar cambios en TestFlight

### Requisitos previos (una sola vez)

1. Tener una cuenta en [expo.dev](https://expo.dev) con acceso al proyecto
2. Instalar EAS CLI:
   ```bash
   npm install -g eas-cli
   eas login
   ```

### Flujo de deploy

```bash
# 1. Subir cambios al repo
git add .
git commit -m "descripción del cambio"
git push

# 2. Buildear en la nube (~15-20 min)
# eas build --platform ios --profile production //esto no va porque me pide credenciales
# usar esta de aca abajo que usa credenciales de Alu
eas build --platform ios --profile production --non-interactive 

# 3. Subir a TestFlight cuando termina el build
eas submit --platform ios --latest
```

EAS maneja automáticamente los certificados de Apple — no se necesita la cuenta de Apple Developer.

---

## Variables de entorno

El archivo `.env` va en la raíz del proyecto y **no se sube al repo**. Pedirle al owner del proyecto una copia. Contiene:

```
DATABASE_URL=           # Neon PostgreSQL
CLERK_SECRET_KEY=       # Clerk backend key
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=   # Clerk frontend key (producción)
EXPO_PUBLIC_CLERK_DEV_PUBLISHABLE_KEY= # Clerk frontend key (desarrollo)
OPENAI_API_KEY=         # OpenAI
PORT=5001               # Puerto local del servidor
EXPO_PUBLIC_DOMAIN=localhost:5001    # Dominio local para la app
NODE_ENV=production
```

---

## Arquitectura del proyecto

```
mimediapp/
├── client/                 # App React Native
│   ├── App.tsx             # Entry point, providers, navegación raíz
│   ├── components/         # Componentes reutilizables
│   ├── screens/            # Pantallas organizadas por feature
│   │   ├── auth/           # SignIn, SignUp
│   │   ├── dashboard/      # Dashboard principal
│   │   ├── children/       # Perfiles de hijos
│   │   ├── visits/         # Visitas médicas
│   │   ├── vaccines/       # Calendario de vacunas
│   │   ├── appointments/   # Turnos médicos
│   │   ├── allergies/      # Alergias
│   │   ├── diseases/       # Enfermedades previas
│   │   ├── medications/    # Medicamentos
│   │   ├── doctors/        # Médicos
│   │   └── emergency/      # Hospitales de emergencia
│   ├── navigation/         # Navegadores (tabs y stacks)
│   ├── constants/theme.ts  # Design system
│   └── lib/                # query-client, clerk, utils
├── server/                 # Backend Express
│   ├── index.ts            # Configuración del servidor
│   └── routes.ts           # Todos los endpoints REST
├── api/
│   └── index.ts            # Entry point para Vercel
├── eas.json                # Config de builds EAS
└── vercel.json             # Config de deploy Vercel
```

---

## API Endpoints

Todos los endpoints requieren autenticación via JWT (Clerk).

| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/api/children` | Listar / crear hijos |
| GET/PUT/DELETE | `/api/children/:id` | Obtener / editar / eliminar hijo |
| GET/POST | `/api/visits` | Visitas médicas |
| GET/POST | `/api/vaccines` | Vacunas |
| GET | `/api/vaccines/user/:userId` | Vacunas pendientes del usuario |
| POST | `/api/vaccines/batch` | Inicializar calendario |
| GET/POST | `/api/appointments` | Turnos |
| GET | `/api/appointments/user/:userId` | Próximos turnos del usuario |
| GET/POST | `/api/allergies` | Alergias |
| GET/POST | `/api/diseases` | Enfermedades previas |
| GET/POST | `/api/medications` | Medicamentos |
| GET/POST | `/api/doctors` | Médicos |
| GET/POST | `/api/hospitals` | Hospitales de emergencia |
| POST/GET | `/api/share-codes` | Códigos para compartir hijos |
| POST | `/api/child-access` | Otorgar acceso a hijo compartido |

---

## Design System

- **Color primario**: `#6BA5CF` (azul cielo)
- **Color secundario**: `#A8D5BA` (verde salvia)
- **Acento**: `#FFB84D` (ámbar cálido)
- **Fuente**: Nunito (Google Fonts)
- **Idioma**: Español

---

## Base de datos

Tablas principales en PostgreSQL (Neon):

- `children` — perfiles de hijos
- `medical_visits` — visitas con medidas
- `vaccines` — calendario de vacunas
- `appointments` — turnos médicos
- `allergies` — alergias con severidad
- `past_diseases` — historial de enfermedades
- `medications` — medicamentos
- `doctors` — médicos del usuario
- `hospitals` — contactos de emergencia
- `share_codes` — códigos de 8 caracteres para compartir
- `child_access` — permisos multi-usuario
