// server.js — Punto de entrada del servidor Express
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const routes  = require('./routes/index');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middlewares globales ────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rutas API ───────────────────────────────────────────────
app.use('/api', routes);

// ── Health check ────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true }));

// ── Manejo de rutas no encontradas ─────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// ── Manejo global de errores ────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀  Servidor escuchando en http://localhost:${PORT}`);
});
