// src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export const ForgotPasswordPage = () => {
  const [email, setEmail]     = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMensaje(data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🔑</div>
        <h1 className="auth-title">Recuperar contraseña</h1>
        <p className="auth-subtitle">Te enviaremos un enlace por correo</p>

        {error   && <div className="alert alert-error">{error}</div>}
        {mensaje && <div className="alert alert-success">{mensaje}</div>}

        {!mensaje && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <input id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </button>
          </form>
        )}

        <p className="auth-footer"><Link to="/login">← Volver al inicio de sesión</Link></p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// src/pages/ResetPasswordPage.jsx
// ─────────────────────────────────────────────────────────────
export const ResetPasswordPage = () => {
  const token = new URLSearchParams(window.location.search).get('token');
  const [form, setForm]       = useState({ password: '', confirmar: '' });
  const [mensaje, setMensaje] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmar) return setError('Las contraseñas no coinciden');
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/reset-password', {
        token, password: form.password,
      });
      setMensaje(data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Token inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🔒</div>
        <h1 className="auth-title">Nueva contraseña</h1>

        {error   && <div className="alert alert-error">{error}</div>}
        {mensaje && <div className="alert alert-success">{mensaje} <Link to="/login">Inicia sesión</Link></div>}

        {!mensaje && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label>Nueva contraseña</label>
              <input name="password" type="password" value={form.password}
                onChange={handleChange} placeholder="Mín. 8 caracteres"
                required minLength={8} />
            </div>
            <div className="field">
              <label>Confirmar contraseña</label>
              <input name="confirmar" type="password" value={form.confirmar}
                onChange={handleChange} placeholder="Repite la contraseña" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
