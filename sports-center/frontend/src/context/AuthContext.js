// src/context/AuthContext.js — Estado global de autenticación
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true); // Evita flash de contenido

  // Al montar, intentar recuperar el usuario del token guardado
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(({ data }) => setUsuario(data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setCargando(false));
    } else {
      setCargando(false);
    }
  }, []);

  /** Login: guarda token y actualiza estado */
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUsuario(data.usuario);
    return data;
  };

  /** Registro: guarda token y actualiza estado */
  const register = async (datos) => {
    const { data } = await api.post('/auth/register', datos);
    localStorage.setItem('token', data.token);
    setUsuario(data.usuario);
    return data;
  };

  /** Logout: limpia estado */
  const logout = () => {
    localStorage.removeItem('token');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/** Hook de conveniencia */
export const useAuth = () => useContext(AuthContext);
