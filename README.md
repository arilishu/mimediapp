# MiMediApp - Gestión de Salud Familiar

MiMediApp es una aplicación móvil (Android e iOS) que permite gestionar y consultar información médica familiar desde un único lugar seguro.

Centraliza datos clave de salud de toda la familia (hijos, padres, abuelos, etc.), incluyendo visitas médicas, vacunas, medicamentos, alergias, enfermedades previas y turnos médicos.

## Características

- **Autenticación segura**: Login con email/contraseña o Google SSO via Clerk
- **Perfiles familiares**: Gestión de perfiles de cada miembro de la familia
- **Visitas médicas**: Registro de peso, altura, perímetro cefálico y notas del médico
- **Calendario de vacunación**: Seguimiento de vacunas aplicadas y pendientes
- **Turnos médicos**: Agendar y gestionar citas médicas con integración a Google Calendar
- **Alergias**: Registro de alergias con nivel de severidad
- **Medicamentos**: Control de medicación activa e histórica
- **Enfermedades previas**: Historial de enfermedades
- **Médicos**: Directorio de médicos con teléfono y dirección
- **Centros médicos**: Hospitales y clínicas de emergencia con acceso rápido a llamada y direcciones (Google Maps / Waze)
- **Compartir perfiles**: Compartí perfiles de familiares con otros usuarios mediante códigos de 8 caracteres (acceso completo o solo lectura)

## Tecnologías

| Componente | Tecnología |
|---|---|
| Frontend | Expo / React Native (TypeScript) |
| Backend | Express.js (TypeScript) |
| Base de datos | PostgreSQL |
| Autenticación | Clerk |
| Navegación | React Navigation 7 |
| Fuente | Nunito (Google Fonts) |

## Arquitectura

```
├── client/                 # App React Native (Expo)
│   ├── App.tsx             # Entrada principal con providers
│   ├── components/         # Componentes reutilizables (Card, Button, Input, etc.)
│   ├── screens/            # Pantallas organizadas por funcionalidad
│   ├── navigation/         # Navegación (tabs + stacks)
│   ├── constants/theme.ts  # Sistema de diseño (colores, espaciado, tipografía)
│   ├── lib/api.ts          # Cliente API tipado
│   ├── lib/utils.ts        # Utilidades (formato de fechas, cálculo de edad)
│   └── types/index.ts      # Definiciones TypeScript
├── server/                 # API Express.js
│   ├── index.ts            # Configuración del servidor
│   └── routes.ts           # Endpoints REST (CRUD para todas las entidades)
└── assets/                 # Imágenes e íconos
```

## API Endpoints

### Familiares
- `GET /api/children?userId=` - Listar familiares
- `POST /api/children` - Crear familiar
- `GET/PUT/DELETE /api/children/:id` - Obtener/actualizar/eliminar familiar

### Visitas Médicas
- `GET /api/visits?childId=` - Listar visitas
- `POST /api/visits` - Crear visita

### Vacunas
- `GET /api/vaccines?childId=` - Listar vacunas
- `GET /api/vaccines/user/:userId` - Vacunas pendientes de todos los familiares
- `POST /api/vaccines/batch` - Inicializar calendario de vacunación

### Turnos
- `GET /api/appointments?childId=` - Listar turnos
- `GET /api/appointments/user/:userId` - Próximos turnos de todos los familiares
- `POST /api/appointments` - Crear turno

### Alergias, Enfermedades, Medicamentos
- `GET/POST /api/allergies` - Listar/crear alergias
- `GET/POST /api/diseases` - Listar/crear enfermedades
- `GET/POST /api/medications` - Listar/crear medicamentos

### Médicos y Centros
- `GET/POST /api/doctors` - Listar/crear médicos
- `GET/POST /api/hospitals` - Listar/crear centros médicos
- `PUT/DELETE /api/hospitals/:id` - Actualizar/eliminar centro médico

### Compartir
- `POST /api/share-codes` - Generar código para compartir
- `GET /api/share-codes?code=` - Buscar código
- `POST /api/child-access` - Otorgar acceso a familiar compartido

## Diseño

La app sigue una estética **"Soft & Trustworthy Medical"** con colores suaves y tipografía amigable:

- **Color primario**: #6BA5CF (azul cielo suave)
- **Color secundario**: #A8D5BA (verde salvia)
- **Color accent**: #FFB84D (ámbar cálido)
- **Fuente**: Nunito

## Ejecución

```bash
# Instalar dependencias
npm install

# Iniciar backend (puerto 5000)
npm run server:dev

# Iniciar frontend Expo (puerto 8081)
npm run expo:dev
```

## Variables de entorno requeridas

- `DATABASE_URL` - URL de conexión PostgreSQL
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clave pública de Clerk
- `SESSION_SECRET` - Secreto de sesión

## Licencia

Proyecto privado.
