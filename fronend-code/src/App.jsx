import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Logout from './pages/Logout';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import Catalogue from './pages/Catalogue';
import AddCatalogue from './pages/AddCatalogue';
import Detail from './pages/Detail';
import Submit from './pages/Submit';
import Pipeline from './pages/Pipeline';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Help from './pages/Help';
import FamilyDetail from './pages/FamilyDetail';
import SubmissionDetail from './pages/SubmissionDetail';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/logout" element={<Logout />} />
        <Route
          path="/login"
          element={<PublicRoute><Login /></PublicRoute>}
        />
        <Route
          path="/"
          element={<ProtectedRoute><AppLayout /></ProtectedRoute>}
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="catalog" element={<Catalogue />} />
          <Route path="catalog/new" element={<AddCatalogue />} />
          <Route path="family/:id" element={<FamilyDetail />} />
          <Route path="detail/:id" element={<Detail />} />
          <Route path="submit"     element={<Submit />} />
          <Route path="pipeline"   element={<Pipeline />} />
          <Route path="pipeline/:id" element={<SubmissionDetail />} />
          <Route path="analytics"  element={<Analytics />} />
          <Route path="settings"   element={<Settings />} />
          <Route path="help"       element={<Help />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
