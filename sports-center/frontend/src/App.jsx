// src/App.jsx — Router principal con rutas protegidas
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import DashboardPage      from './pages/DashboardPage';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/PasswordPages';

import './styles/global.css';

/** Ruta protegida: redirige al login si el usuario no está autenticado */
const RutaProtegida = ({ children }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="loading-screen">Cargando…</div>;
  return usuario ? children : <Navigate to="/login" replace />;
};

/** Ruta pública: redirige al dashboard si ya está autenticado */
const RutaPublica = ({ children }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="loading-screen">Cargando…</div>;
  return usuario ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login"            element={<RutaPublica><LoginPage /></RutaPublica>} />
    <Route path="/register"         element={<RutaPublica><RegisterPage /></RutaPublica>} />
    <Route path="/forgot-password"  element={<RutaPublica><ForgotPasswordPage /></RutaPublica>} />
    <Route path="/reset-password"   element={<RutaPublica><ResetPasswordPage /></RutaPublica>} />
    <Route path="/dashboard"        element={<RutaProtegida><DashboardPage /></RutaProtegida>} />
    <Route path="*"                 element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
