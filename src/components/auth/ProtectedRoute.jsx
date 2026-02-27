import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7f6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 animate-pulse">
            C
          </div>
          <div className="text-slate-500 text-sm">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen bg-[#f4f7f6] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center max-w-sm shadow-sm">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="font-bold text-slate-800 mb-2">Acceso Restringido</h2>
          <p className="text-slate-500 text-sm">No tienes permiso para ver esta sección.</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
