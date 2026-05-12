// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const INITIAL = {
  nombre: '', apellidos: '', dni: '', fecha_nac: '',
  email: '', password: '', confirmar: '',
};

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]   = useState(INITIAL);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmar) {
      return setError('Las contraseñas no coinciden');
    }

    setLoading(true);
    try {
      const { confirmar, ...datos } = form;
      await register(datos);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-logo">🏅</div>
        <h1 className="auth-title">Crea tu cuenta</h1>
        <p className="auth-subtitle">Únete al mejor centro deportivo</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-row">
            <div className="field">
              <label htmlFor="nombre">Nombre</label>
              <input id="nombre" name="nombre" value={form.nombre}
                onChange={handleChange} placeholder="Juan" required />
            </div>
            <div className="field">
              <label htmlFor="apellidos">Apellidos</label>
              <input id="apellidos" name="apellidos" value={form.apellidos}
                onChange={handleChange} placeholder="García López" required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="dni">DNI</label>
              <input id="dni" name="dni" value={form.dni}
                onChange={handleChange} placeholder="12345678A" required />
            </div>
            <div className="field">
              <label htmlFor="fecha_nac">Fecha de nacimiento</label>
              <input id="fecha_nac" name="fecha_nac" type="date"
                value={form.fecha_nac} onChange={handleChange} required />
            </div>
          </div>

          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" name="email" type="email"
              value={form.email} onChange={handleChange}
              placeholder="tucorreo@ejemplo.com" required />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input id="password" name="password" type="password"
                value={form.password} onChange={handleChange}
                placeholder="Mín. 8 caracteres" required minLength={8} />
            </div>
            <div className="field">
              <label htmlFor="confirmar">Confirmar contraseña</label>
              <input id="confirmar" name="confirmar" type="password"
                value={form.confirmar} onChange={handleChange}
                placeholder="Repite la contraseña" required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
