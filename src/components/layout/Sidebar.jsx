import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/', icon: '📊', label: 'Dashboard', roles: ['admin', 'supervisor'] },
  { to: '/propiedades', icon: '🏠', label: 'Propiedades', roles: ['admin', 'supervisor'] },
  { to: '/tareas', icon: '✅', label: 'Tareas de Limpieza', roles: ['admin', 'supervisor', 'limpieza'] },
  { to: '/reportes', icon: '📄', label: 'Reportes a Clientes', roles: ['admin', 'supervisor'] },
  { to: '/personal', icon: '👥', label: 'Personal', roles: ['admin'] },
  { to: '/mantenimiento', icon: '🔧', label: 'Mantenimiento', roles: ['admin', 'supervisor'] },
];

export default function Sidebar() {
  const { user, userRole, logout } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !userRole || item.roles.includes(userRole)
  );

  return (
    <aside className="w-64 bg-[#1e293b] flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            C
          </div>
          <div>
            <div className="text-white font-bold text-sm">CleanStay Pro</div>
            <div className="text-slate-400 text-xs">v2.1.0</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-slate-700 text-teal-400 border-r-2 border-teal-400'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase">
            {user?.nombre?.[0] || user?.email?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">
              {user?.nombre || user?.email || 'Usuario'}
            </div>
            <div className="text-slate-400 text-xs capitalize">{userRole || 'Sin rol'}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-left text-slate-400 hover:text-red-400 text-xs px-2 py-1 rounded transition-colors"
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
