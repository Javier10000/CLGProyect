// config/db.js — Conexión a PostgreSQL usando el módulo 'pg'
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'sports_center',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // Reutilización de conexiones
  max: 10,
  idleTimeoutMillis: 30000,
});

// Verificar conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌  Error conectando a PostgreSQL:', err.message);
  } else {
    console.log('✅  Conectado a PostgreSQL');
    release();
  }
});

module.exports = pool;
