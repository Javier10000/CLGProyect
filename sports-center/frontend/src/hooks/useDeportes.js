// src/hooks/useDeportes.js — Hook para cargar deportes y suscripciones
import { useState, useEffect } from 'react';
import api from '../utils/api';

/** Devuelve la lista de deportes con sus precios */
export const useDeportes = () => {
  const [deportes, setDeportes]   = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    api.get('/deportes')
      .then(({ data }) => setDeportes(data))
      .catch((err) => setError(err.response?.data?.error || 'Error al cargar deportes'))
      .finally(() => setCargando(false));
  }, []);

  return { deportes, cargando, error };
};

/** Devuelve las suscripciones activas del usuario */
export const useMisSuscripciones = () => {
  const [suscripciones, setSuscripciones] = useState([]);
  const [cargando, setCargando]           = useState(true);
  const [error, setError]                 = useState(null);

  const cargar = () => {
    setCargando(true);
    api.get('/suscripciones/mis-suscripciones')
      .then(({ data }) => setSuscripciones(data))
      .catch((err) => setError(err.response?.data?.error || 'Error al cargar suscripciones'))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  return { suscripciones, cargando, error, recargar: cargar };
};

/** Devuelve las reservas del usuario */
export const useMisReservas = () => {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState(null);

  const cargar = () => {
    setCargando(true);
    api.get('/reservas/mis-reservas')
      .then(({ data }) => setReservas(data))
      .catch((err) => setError(err.response?.data?.error || 'Error al cargar reservas'))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  return { reservas, cargando, error, recargar: cargar };
};
