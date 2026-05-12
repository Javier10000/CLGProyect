// controllers/suscripcionesController.js
const pool = require('../config/db');

// ─── Helpers ────────────────────────────────────────────────

/** Calcula la fecha de fin según la modalidad */
const calcularFechaFin = (modalidad) => {
  const hoy = new Date();
  if (modalidad === 'anual') {
    return new Date(hoy.setFullYear(hoy.getFullYear() + 1));
  }
  return new Date(hoy.setMonth(hoy.getMonth() + 1));
};

// ─── Controladores ──────────────────────────────────────────

/**
 * GET /api/suscripciones/mis-suscripciones
 * Devuelve todas las suscripciones del usuario autenticado
 */
exports.misSuscripciones = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT s.id, s.modalidad, s.precio_pagado, s.estado,
              s.fecha_inicio, s.fecha_fin, s.cancelada_en,
              d.id AS deporte_id, d.nombre AS deporte, d.imagen_url
       FROM suscripciones s
       JOIN deportes d ON d.id = s.deporte_id
       WHERE s.usuario_id = $1
       ORDER BY s.creado_en DESC`,
      [req.user.id]
    );
    return res.json(resultado.rows);
  } catch (err) {
    console.error('misSuscripciones error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * POST /api/suscripciones
 * Crea una nueva suscripción para el usuario autenticado
 * Body: { deporte_id, modalidad }
 */
exports.crear = async (req, res) => {
  const { deporte_id, modalidad } = req.body;
  const usuario_id = req.user.id;

  if (!['mensual', 'anual'].includes(modalidad)) {
    return res.status(400).json({ error: 'Modalidad inválida (mensual | anual)' });
  }

  try {
    // Verificar que el deporte existe
    const deporte = await pool.query(
      'SELECT id, nombre, precio_mes, precio_anual FROM deportes WHERE id = $1',
      [deporte_id]
    );
    if (deporte.rows.length === 0) {
      return res.status(404).json({ error: 'Deporte no encontrado' });
    }

    // Comprobar si ya hay una suscripción activa para ese deporte
    const activa = await pool.query(
      `SELECT id FROM suscripciones
       WHERE usuario_id = $1 AND deporte_id = $2 AND estado = 'activa'`,
      [usuario_id, deporte_id]
    );
    if (activa.rows.length > 0) {
      return res.status(409).json({ error: 'Ya tienes una suscripción activa para este deporte' });
    }

    const { precio_mes, precio_anual } = deporte.rows[0];
    const precio_pagado = modalidad === 'anual' ? precio_anual : precio_mes;
    const fecha_fin     = calcularFechaFin(modalidad);

    const resultado = await pool.query(
      `INSERT INTO suscripciones
         (usuario_id, deporte_id, modalidad, precio_pagado, fecha_fin)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [usuario_id, deporte_id, modalidad, precio_pagado, fecha_fin]
    );

    return res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error('crear suscripción error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * DELETE /api/suscripciones/:id
 * Cancela (baja) una suscripción activa
 */
exports.cancelar = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id;

  try {
    // Solo el propietario puede cancelar
    const resultado = await pool.query(
      `UPDATE suscripciones
       SET estado = 'cancelada', cancelada_en = NOW()
       WHERE id = $1 AND usuario_id = $2 AND estado = 'activa'
       RETURNING *`,
      [id, usuario_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Suscripción no encontrada o ya cancelada' });
    }

    return res.json({ message: 'Suscripción cancelada correctamente', suscripcion: resultado.rows[0] });
  } catch (err) {
    console.error('cancelar suscripción error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
