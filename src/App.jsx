import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/AuthProvider';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginView from './components/auth/LoginView';
import DashboardView from './components/dashboard/DashboardView';
import PropertiesView from './components/properties/PropertiesView';
import TasksView from './components/tasks/TasksView';
import ReportsView from './components/reports/ReportsView';
import StaffView from './components/staff/StaffView';
import MaintenanceView from './components/maintenance/MaintenanceView';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginView />} />

          {/* Protected routes for all authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardView />} />
              <Route path="/propiedades" element={<PropertiesView />} />
              <Route path="/tareas" element={<TasksView />} />
              <Route path="/reportes" element={<ReportsView />} />
              <Route path="/mantenimiento" element={<MaintenanceView />} />

              {/* Admin-only route */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/personal" element={<StaffView />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

