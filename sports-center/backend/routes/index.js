// routes/index.js — Registro central de rutas
const express  = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const auth     = require('../middleware/auth');

const authCtrl        = require('../controllers/authController');
const deportesCtrl    = require('../controllers/deportesController');
const suscripCtrl     = require('../controllers/suscripcionesController');
const reservasCtrl    = require('../controllers/reservasController');

const router = express.Router();

// ────────────────────────────────────────────────────────────
// AUTH
// ────────────────────────────────────────────────────────────
router.post('/auth/register',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres'),
    body('nombre').notEmpty(),
    body('apellidos').notEmpty(),
    body('dni').notEmpty(),
    body('fecha_nac').isDate().withMessage('Fecha inválida'),
  ],
  validate,
  authCtrl.register
);

router.post('/auth/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  validate,
  authCtrl.login
);

router.get('/auth/me',        auth, authCtrl.me);

router.post('/auth/forgot-password',
  [body('email').isEmail()],
  validate,
  authCtrl.forgotPassword
);

router.post('/auth/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  validate,
  authCtrl.resetPassword
);

// ────────────────────────────────────────────────────────────
// DEPORTES (públicas)
// ────────────────────────────────────────────────────────────
router.get('/deportes',                  deportesCtrl.listar);
router.get('/deportes/:id/profesores',   deportesCtrl.profesores);

// ────────────────────────────────────────────────────────────
// SUSCRIPCIONES (protegidas)
// ────────────────────────────────────────────────────────────
router.get('/suscripciones/mis-suscripciones', auth, suscripCtrl.misSuscripciones);

router.post('/suscripciones',
  auth,
  [
    body('deporte_id').isInt({ min: 1 }),
    body('modalidad').isIn(['mensual', 'anual']),
  ],
  validate,
  suscripCtrl.crear
);

router.delete('/suscripciones/:id',
  auth,
  [param('id').isUUID()],
  validate,
  suscripCtrl.cancelar
);

// ────────────────────────────────────────────────────────────
// RESERVAS (protegidas)
// ────────────────────────────────────────────────────────────
router.get('/reservas/mis-reservas',     auth, reservasCtrl.misReservas);
router.get('/reservas/disponibilidad',   auth, reservasCtrl.disponibilidad);

router.post('/reservas',
  auth,
  [
    body('deporte_id').isInt({ min: 1 }),
    body('profesor_id').isUUID(),
    body('fecha_clase').isISO8601(),
  ],
  validate,
  reservasCtrl.crear
);

router.delete('/reservas/:id',
  auth,
  [param('id').isUUID()],
  validate,
  reservasCtrl.cancelar
);

module.exports = router;
