import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SurveyProvider } from './context/SurveyContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SurveyPage from './pages/SurveyPage';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';
import AdminSurveyEdit from './pages/AdminSurveyEdit';
import { isAdminLoggedIn } from './utils/storage';

// Auth guard for admin routes
const RequireAdmin = ({ children }) => {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <SurveyProvider>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/survey/:id" element={<SurveyPage />} />

          {/* Admin auth */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin protected */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/new"
            element={
              <RequireAdmin>
                <AdminSurveyEdit />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/edit/:id"
            element={
              <RequireAdmin>
                <AdminSurveyEdit />
              </RequireAdmin>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SurveyProvider>
    </BrowserRouter>
  );
}

export default App;
