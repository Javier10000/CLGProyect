// controllers/authController.js
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const crypto    = require('crypto');
const nodemailer= require('nodemailer');
const pool      = require('../config/db');

// ─── Helpers ────────────────────────────────────────────────

/** Genera un JWT firmado con los datos básicos del usuario */
const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, nombre: user.nombre },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

/** Configura el transporter de correo (ajustar en producción) */
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.mailtrap.io',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── Controladores ──────────────────────────────────────────

/**
 * POST /api/auth/register
 * Registra un nuevo usuario (cliente)
 */
exports.register = async (req, res) => {
  const { email, password, nombre, apellidos, dni, fecha_nac } = req.body;

  try {
    // Comprobar si el email o DNI ya existen
    const existe = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1 OR dni = $2',
      [email.toLowerCase(), dni]
    );
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: 'Email o DNI ya registrado' });
    }

    // Hash de la contraseña (bcrypt, 12 rounds)
    const password_hash = await bcrypt.hash(password, 12);

    const resultado = await pool.query(
      `INSERT INTO usuarios (email, password_hash, nombre, apellidos, dni, fecha_nac)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, nombre, apellidos, dni, fecha_nac, creado_en`,
      [email.toLowerCase(), password_hash, nombre, apellidos, dni, fecha_nac]
    );

    const usuario = resultado.rows[0];
    const token   = generateToken(usuario);

    return res.status(201).json({ token, usuario });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * POST /api/auth/login
 * Inicia sesión y devuelve un JWT
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const usuario = resultado.rows[0];
    const coincide = await bcrypt.compare(password, usuario.password_hash);

    if (!coincide) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = generateToken(usuario);

    // Devolver usuario sin datos sensibles
    const { password_hash, reset_token, reset_expires, ...usuarioPublico } = usuario;
    return res.json({ token, usuario: usuarioPublico });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * GET /api/auth/me
 * Devuelve los datos del usuario autenticado
 */
exports.me = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, email, nombre, apellidos, dni, fecha_nac, creado_en
       FROM usuarios WHERE id = $1`,
      [req.user.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('me error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * POST /api/auth/forgot-password
 * Genera token de recuperación y envía email
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const resultado = await pool.query(
      'SELECT id, email, nombre FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );

    // Siempre responder OK para no revelar si el email existe
    if (resultado.rows.length === 0) {
      return res.json({ message: 'Si el email existe, recibirás instrucciones.' });
    }

    const usuario = resultado.rows[0];
    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await pool.query(
      'UPDATE usuarios SET reset_token = $1, reset_expires = $2 WHERE id = $3',
      [token, expires, usuario.id]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from:    `"Centro Deportivo" <${process.env.SMTP_FROM}>`,
      to:      usuario.email,
      subject: 'Recupera tu contraseña',
      html: `
        <h2>Hola, ${usuario.nombre}</h2>
        <p>Haz clic en el enlace para restablecer tu contraseña (válido 1 hora):</p>
        <a href="${resetUrl}">${resetUrl}</a>
      `,
    });

    return res.json({ message: 'Si el email existe, recibirás instrucciones.' });
  } catch (err) {
    console.error('forgotPassword error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * POST /api/auth/reset-password
 * Restablece la contraseña con el token recibido por email
 */
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const resultado = await pool.query(
      `SELECT id FROM usuarios
       WHERE reset_token = $1 AND reset_expires > NOW()`,
      [token]
    );

    if (resultado.rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    await pool.query(
      `UPDATE usuarios
       SET password_hash = $1, reset_token = NULL, reset_expires = NULL
       WHERE id = $2`,
      [password_hash, resultado.rows[0].id]
    );

    return res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
