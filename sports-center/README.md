# ══════════════════════════════════════════════════════
# CENTRO DEPORTIVO — Guía de instalación y estructura
# ══════════════════════════════════════════════════════

## Estructura del proyecto

```
sports-center/
├── database/
│   └── schema.sql              ← Esquema completo PostgreSQL
├── backend/
│   ├── server.js               ← Punto de entrada Express
│   ├── config/db.js            ← Pool de conexión PostgreSQL
│   ├── middleware/
│   │   ├── auth.js             ← Verificación JWT
│   │   └── validate.js         ← Procesador de errores de validación
│   ├── controllers/
│   │   ├── authController.js           ← Register / Login / Forgot / Reset
│   │   ├── deportesController.js       ← Listar deportes y profesores
│   │   ├── suscripcionesController.js  ← Crear / Ver / Cancelar
│   │   └── reservasController.js       ← Crear / Ver / Cancelar / Disponibilidad
│   └── routes/index.js         ← Registro central de rutas
└── frontend/
    └── src/
        ├── App.jsx             ← Router con rutas protegidas/públicas
        ├── context/AuthContext.js      ← Estado global de autenticación
        ├── hooks/useDeportes.js        ← Hooks de datos (deportes, suscripciones, reservas)
        ├── utils/api.js                ← Instancia Axios con interceptores JWT
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── PasswordPages.jsx       ← ForgotPassword + ResetPassword
        │   └── DashboardPage.jsx       ← Panel principal con tabs
        └── styles/global.css           ← Diseño completo (tema deportivo oscuro/dorado)
```

## Instalación

### 1. Base de datos (PostgreSQL)
```bash
psql -U postgres -c "CREATE DATABASE sports_center;"
psql -U postgres -d sports_center -f database/schema.sql
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env   # Edita con tus valores
npm run dev            # Inicia en http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env   # Edita REACT_APP_API_URL
npm start              # Inicia en http://localhost:3000
```

## Variables de entorno

### backend/.env
```
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sports_center
DB_USER=postgres
DB_PASSWORD=tu_password

JWT_SECRET=una_clave_secreta_muy_larga_y_segura

SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=tu_usuario_smtp
SMTP_PASS=tu_password_smtp
SMTP_FROM=noreply@centrodeportivo.com

FRONTEND_URL=http://localhost:3000
```

### frontend/.env
```
REACT_APP_API_URL=http://localhost:4000/api
```

## Endpoints API

| Método | Ruta                                    | Auth | Descripción                       |
|--------|-----------------------------------------|------|-----------------------------------|
| POST   | /api/auth/register                      | ✗    | Registro de usuario               |
| POST   | /api/auth/login                         | ✗    | Login → devuelve JWT              |
| GET    | /api/auth/me                            | ✓    | Datos del usuario autenticado     |
| POST   | /api/auth/forgot-password               | ✗    | Envía email de recuperación       |
| POST   | /api/auth/reset-password                | ✗    | Restablece contraseña con token   |
| GET    | /api/deportes                           | ✗    | Lista deportes y precios          |
| GET    | /api/deportes/:id/profesores            | ✗    | Profesores de un deporte          |
| GET    | /api/suscripciones/mis-suscripciones    | ✓    | Suscripciones del usuario         |
| POST   | /api/suscripciones                      | ✓    | Nueva suscripción                 |
| DELETE | /api/suscripciones/:id                  | ✓    | Cancelar suscripción              |
| GET    | /api/reservas/mis-reservas             | ✓    | Reservas del usuario              |
| GET    | /api/reservas/disponibilidad           | ✓    | Profesores/horas libres           |
| POST   | /api/reservas                           | ✓    | Nueva reserva (requiere suscripción) |
| DELETE | /api/reservas/:id                       | ✓    | Cancelar reserva futura           |
