// src/pages/DashboardPage.jsx — Panel principal del usuario
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDeportes, useMisSuscripciones, useMisReservas } from '../hooks/useDeportes';
import api from '../utils/api';

// ─── Subcomponentes ──────────────────────────────────────────

/** Tarjeta de suscripción activa */
const TarjetaSuscripcion = ({ suscripcion, onCancelar }) => {
  const [cancelando, setCancelando] = useState(false);

  const handleCancelar = async () => {
    if (!window.confirm(`¿Cancelar tu suscripción de ${suscripcion.deporte}?`)) return;
    setCancelando(true);
    try {
      await api.delete(`/suscripciones/${suscripcion.id}`);
      onCancelar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cancelar');
    } finally {
      setCancelando(false);
    }
  };

  const esActiva = suscripcion.estado === 'activa';

  return (
    <div className={`card-suscripcion ${!esActiva ? 'card-suscripcion--inactiva' : ''}`}>
      <div className="card-suscripcion__deporte">{suscripcion.deporte}</div>
      <div className="card-suscripcion__info">
        <span className={`badge ${esActiva ? 'badge--activa' : 'badge--cancelada'}`}>
          {suscripcion.estado}
        </span>
        <span>{suscripcion.modalidad}</span>
        <span>{suscripcion.precio_pagado} €</span>
      </div>
      <div className="card-suscripcion__fechas">
        <small>Hasta: {new Date(suscripcion.fecha_fin).toLocaleDateString('es-ES')}</small>
      </div>
      {esActiva && (
        <button className="btn btn-danger btn-sm" onClick={handleCancelar} disabled={cancelando}>
          {cancelando ? 'Cancelando…' : 'Cancelar suscripción'}
        </button>
      )}
    </div>
  );
};

/** Modal para suscribirse a un deporte */
const ModalSuscripcion = ({ deporte, onClose, onExito }) => {
  const [modalidad, setModalidad] = useState('mensual');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const precio = modalidad === 'anual' ? deporte.precio_anual : deporte.precio_mes;
  const ahorro = modalidad === 'anual'
    ? ((deporte.precio_mes * 12) - deporte.precio_anual).toFixed(2)
    : 0;

  const handleSuscribir = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/suscripciones', { deporte_id: deporte.id, modalidad });
      onExito();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al suscribirse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>Suscribirse a {deporte.nombre}</h2>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="modalidad-selector">
          {['mensual', 'anual'].map((m) => (
            <button
              key={m}
              className={`modalidad-btn ${modalidad === m ? 'modalidad-btn--active' : ''}`}
              onClick={() => setModalidad(m)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        <div className="precio-display">
          <span className="precio-valor">{precio} €</span>
          <span className="precio-periodo">/ {modalidad === 'anual' ? 'año' : 'mes'}</span>
          {ahorro > 0 && <span className="precio-ahorro">¡Ahorras {ahorro} €!</span>}
        </div>

        <button className="btn btn-primary" onClick={handleSuscribir} disabled={loading}>
          {loading ? 'Procesando…' : 'Confirmar suscripción'}
        </button>
      </div>
    </div>
  );
};

/** Modal para reservar una clase */
const ModalReserva = ({ deporte, onClose, onExito }) => {
  const [profesores, setProfesores] = useState([]);
  const [form, setForm]             = useState({ profesor_id: '', fecha_clase: '', notas: '' });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  React.useEffect(() => {
    api.get(`/deportes/${deporte.id}/profesores`)
      .then(({ data }) => setProfesores(data));
  }, [deporte.id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleReservar = async () => {
    if (!form.profesor_id || !form.fecha_clase) {
      return setError('Selecciona profesor y fecha/hora');
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/reservas', {
        deporte_id: deporte.id,
        profesor_id: form.profesor_id,
        fecha_clase: form.fecha_clase,
        notas: form.notas,
      });
      onExito();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al reservar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>Reservar clase de {deporte.nombre}</h2>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label>Profesor</label>
          <select name="profesor_id" value={form.profesor_id} onChange={handleChange}>
            <option value="">-- Selecciona un profesor --</option>
            {profesores.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre} {p.apellidos}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Fecha y hora de la clase</label>
          <input type="datetime-local" name="fecha_clase"
            value={form.fecha_clase} onChange={handleChange} />
        </div>

        <div className="field">
          <label>Notas (opcional)</label>
          <textarea name="notas" value={form.notas} onChange={handleChange}
            placeholder="Ej: quiero trabajar el saque..." rows={3} />
        </div>

        <button className="btn btn-primary" onClick={handleReservar} disabled={loading}>
          {loading ? 'Reservando…' : 'Confirmar reserva'}
        </button>
      </div>
    </div>
  );
};

// ─── Página principal ────────────────────────────────────────

const DashboardPage = () => {
  const { usuario, logout }                          = useAuth();
  const { deportes }                                 = useDeportes();
  const { suscripciones, recargar: recargarSubs }    = useMisSuscripciones();
  const { reservas, recargar: recargarReservas }     = useMisReservas();

  const [modalSub, setModalSub]   = useState(null); // deporte seleccionado para suscribirse
  const [modalRes, setModalRes]   = useState(null); // deporte para reservar
  const [tab, setTab]             = useState('deportes'); // tab activa

  // IDs de deportes con suscripción activa
  const deportesActivos = new Set(
    suscripciones.filter((s) => s.estado === 'activa').map((s) => s.deporte_id)
  );

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">🏆 Centro Deportivo</div>
        <div className="navbar-user">
          <span>Hola, {usuario?.nombre}</span>
          <button className="btn btn-outline btn-sm" onClick={logout}>Cerrar sesión</button>
        </div>
      </nav>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-avatar">{usuario?.nombre?.[0]?.toUpperCase()}</div>
          <div className="sidebar-name">{usuario?.nombre} {usuario?.apellidos}</div>
          <div className="sidebar-email">{usuario?.email}</div>
          <nav className="sidebar-nav">
            {[
              { id: 'deportes',      label: '⚽ Deportes'       },
              { id: 'suscripciones', label: '📋 Mis suscripciones' },
              { id: 'reservas',      label: '📅 Mis reservas'    },
              { id: 'perfil',        label: '👤 Mi perfil'       },
            ].map((item) => (
              <button
                key={item.id}
                className={`sidebar-link ${tab === item.id ? 'sidebar-link--active' : ''}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Contenido principal */}
        <main className="main-content">

          {/* ── Tab Deportes ── */}
          {tab === 'deportes' && (
            <section>
              <h2 className="section-title">Nuestros Deportes</h2>
              <div className="deportes-grid">
                {deportes.map((d) => {
                  const suscrito = deportesActivos.has(d.id);
                  return (
                    <div key={d.id} className={`deporte-card ${suscrito ? 'deporte-card--suscrito' : ''}`}>
                      <div className="deporte-card__emoji">
                        {d.nombre === 'Fútbol' ? '⚽' :
                         d.nombre === 'Tenis' ? '🎾' :
                         d.nombre === 'Baloncesto' ? '🏀' : '🏐'}
                      </div>
                      <h3>{d.nombre}</h3>
                      <p>{d.descripcion}</p>
                      <div className="deporte-card__precios">
                        <span>{d.precio_mes} €/mes</span>
                        <span>{d.precio_anual} €/año</span>
                      </div>
                      {suscrito ? (
                        <div className="deporte-card__actions">
                          <span className="badge badge--activa">✓ Suscrito</span>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => setModalRes(d)}>
                            Reservar clase
                          </button>
                        </div>
                      ) : (
                        <button className="btn btn-primary btn-sm"
                          onClick={() => setModalSub(d)}>
                          Suscribirse
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Tab Suscripciones ── */}
          {tab === 'suscripciones' && (
            <section>
              <h2 className="section-title">Mis Suscripciones</h2>
              {suscripciones.length === 0 ? (
                <div className="empty-state">
                  <p>No tienes suscripciones activas.</p>
                  <button className="btn btn-primary" onClick={() => setTab('deportes')}>
                    Ver deportes disponibles
                  </button>
                </div>
              ) : (
                <div className="suscripciones-lista">
                  {suscripciones.map((s) => (
                    <TarjetaSuscripcion key={s.id} suscripcion={s} onCancelar={recargarSubs} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Tab Reservas ── */}
          {tab === 'reservas' && (
            <section>
              <h2 className="section-title">Mis Reservas</h2>
              {reservas.length === 0 ? (
                <div className="empty-state">
                  <p>No tienes reservas.</p>
                  <button className="btn btn-primary" onClick={() => setTab('deportes')}>
                    Reservar una clase
                  </button>
                </div>
              ) : (
                <div className="reservas-tabla-wrapper">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>Deporte</th><th>Profesor</th><th>Fecha</th><th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservas.map((r) => (
                        <tr key={r.id}>
                          <td>{r.deporte}</td>
                          <td>{r.profesor}</td>
                          <td>{new Date(r.fecha_clase).toLocaleString('es-ES')}</td>
                          <td>
                            <span className={`badge badge--${r.estado}`}>{r.estado}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ── Tab Perfil ── */}
          {tab === 'perfil' && (
            <section>
              <h2 className="section-title">Mi Perfil</h2>
              <div className="perfil-card">
                {[
                  { label: 'Nombre completo', valor: `${usuario?.nombre} ${usuario?.apellidos}` },
                  { label: 'DNI',             valor: usuario?.dni },
                  { label: 'Fecha nacimiento',valor: usuario?.fecha_nac
                      ? new Date(usuario.fecha_nac).toLocaleDateString('es-ES') : '—' },
                  { label: 'Correo',          valor: usuario?.email },
                  { label: 'Miembro desde',   valor: usuario?.creado_en
                      ? new Date(usuario.creado_en).toLocaleDateString('es-ES') : '—' },
                ].map(({ label, valor }) => (
                  <div key={label} className="perfil-row">
                    <span className="perfil-label">{label}</span>
                    <span className="perfil-valor">{valor}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

        </main>
      </div>

      {/* Modales */}
      {modalSub && (
        <ModalSuscripcion
          deporte={modalSub}
          onClose={() => setModalSub(null)}
          onExito={recargarSubs}
        />
      )}
      {modalRes && (
        <ModalReserva
          deporte={modalRes}
          onClose={() => setModalRes(null)}
          onExito={recargarReservas}
        />
      )}
    </div>
  );
};

export default DashboardPage;
