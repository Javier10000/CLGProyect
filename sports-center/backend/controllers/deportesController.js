// controllers/deportesController.js
const pool = require('../config/db');

/**
 * GET /api/deportes
 * Lista todos los deportes disponibles con sus precios
 */
exports.listar = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nombre, descripcion, precio_mes, precio_anual, imagen_url
       FROM deportes ORDER BY id`
    );
    return res.json(resultado.rows);
  } catch (err) {
    console.error('listar deportes error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * GET /api/deportes/:id/profesores
 * Lista los profesores de un deporte específico
 */
exports.profesores = async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pool.query(
      `SELECT id, nombre, apellidos, bio, imagen_url
       FROM profesores
       WHERE deporte_id = $1 AND activo = TRUE
       ORDER BY nombre`,
      [id]
    );
    return res.json(resultado.rows);
  } catch (err) {
    console.error('profesores por deporte error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
