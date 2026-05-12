// controllers/reservasController.js
const pool = require('../config/db');

/**
 * GET /api/reservas/mis-reservas
 * Lista todas las reservas del usuario autenticado
 */
exports.misReservas = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT r.id, r.fecha_clase, r.duracion_min, r.estado, r.notas,
              d.nombre AS deporte,
              p.nombre || ' ' || p.apellidos AS profesor
       FROM reservas r
       JOIN deportes d   ON d.id = r.deporte_id
       JOIN profesores p ON p.id = r.profesor_id
       WHERE r.usuario_id = $1
       ORDER BY r.fecha_clase DESC`,
      [req.user.id]
    );
    return res.json(resultado.rows);
  } catch (err) {
    console.error('misReservas error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * POST /api/reservas
 * Crea una reserva. Requiere suscripción activa en el deporte.
 * Body: { deporte_id, profesor_id, fecha_clase, duracion_min?, notas? }
 */
exports.crear = async (req, res) => {
  const { deporte_id, profesor_id, fecha_clase, duracion_min = 60, notas } = req.body;
  const usuario_id = req.user.id;

  try {
    // 1. Verificar suscripción activa del usuario para el deporte
    const suscripcion = await pool.query(
      `SELECT id FROM suscripciones
       WHERE usuario_id = $1 AND deporte_id = $2
         AND estado = 'activa' AND fecha_fin >= CURRENT_DATE`,
      [usuario_id, deporte_id]
    );

    if (suscripcion.rows.length === 0) {
      return res.status(403).json({
        error: 'Necesitas una suscripción activa en este deporte para reservar clases',
      });
    }

    // 2. Verificar que el profesor pertenece al deporte
    const profesor = await pool.query(
      'SELECT id FROM profesores WHERE id = $1 AND deporte_id = $2 AND activo = TRUE',
      [profesor_id, deporte_id]
    );

    if (profesor.rows.length === 0) {
      return res.status(400).json({ error: 'El profesor no está asignado a este deporte' });
    }

    // 3. Crear la reserva
    const resultado = await pool.query(
      `INSERT INTO reservas
         (usuario_id, deporte_id, profesor_id, suscripcion_id, fecha_clase, duracion_min, notas)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        usuario_id,
        deporte_id,
        profesor_id,
        suscripcion.rows[0].id,
        fecha_clase,
        duracion_min,
        notas || null,
      ]
    );

    return res.status(201).json(resultado.rows[0]);
  } catch (err) {
    // Violación de constraint UNIQUE (misma fecha/hora ya reservada)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya tienes una clase reservada en esa fecha y hora' });
    }
    console.error('crear reserva error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * DELETE /api/reservas/:id
 * Cancela una reserva futura
 */
exports.cancelar = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id;

  try {
    const resultado = await pool.query(
      `UPDATE reservas
       SET estado = 'cancelada'
       WHERE id = $1 AND usuario_id = $2 AND estado = 'confirmada'
         AND fecha_clase > NOW()
       RETURNING *`,
      [id, usuario_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada, ya cancelada o la clase ya ocurrió' });
    }

    return res.json({ message: 'Reserva cancelada', reserva: resultado.rows[0] });
  } catch (err) {
    console.error('cancelar reserva error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * GET /api/reservas/disponibilidad?deporte_id=&fecha=
 * Lista los profesores y horas disponibles para un deporte y fecha
 */
exports.disponibilidad = async (req, res) => {
  const { deporte_id, fecha } = req.query;

  if (!deporte_id || !fecha) {
    return res.status(400).json({ error: 'Parámetros deporte_id y fecha son obligatorios' });
  }

  try {
    // Profesores del deporte
    const profesores = await pool.query(
      `SELECT id, nombre, apellidos, bio, imagen_url
       FROM profesores WHERE deporte_id = $1 AND activo = TRUE`,
      [deporte_id]
    );

    // Reservas ya existentes ese día para ese deporte
    const reservadas = await pool.query(
      `SELECT fecha_clase, profesor_id
       FROM reservas
       WHERE deporte_id = $1
         AND DATE(fecha_clase) = $2
         AND estado = 'confirmada'`,
      [deporte_id, fecha]
    );

    return res.json({
      profesores: profesores.rows,
      horasOcupadas: reservadas.rows,
    });
  } catch (err) {
    console.error('disponibilidad error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
