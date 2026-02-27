import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STATUS_STYLES = {
  Completada: 'bg-green-100 text-green-700',
  'En Progreso': 'bg-blue-100 text-blue-700',
  Pendiente: 'bg-orange-100 text-orange-700',
};

export default function TaskTable({ tasks, properties, staff, onAssign, onDetails }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const getPropertyName = (id) =>
    properties.find((p) => p.id === id)?.nombre || id || '—';

  const getStaffName = (id) =>
    staff.find((s) => s.id === id)?.nombre || id || '—';

  const filtered = tasks.filter((t) => {
    const prop = getPropertyName(t.property_id).toLowerCase();
    const cleaner = getStaffName(t.assigned_cleaner_id).toLowerCase();
    const s = search.toLowerCase();
    return (
      prop.includes(s) ||
      cleaner.includes(s) ||
      (t.tipo || '').toLowerCase().includes(s) ||
      (t.estado || '').toLowerCase().includes(s)
    );
  });

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
        <h2 className="font-semibold text-slate-700">Limpiezas Programadas</h2>
        <input
          type="text"
          placeholder="Buscar tarea..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
              <th className="px-4 py-3 text-left">Propiedad</th>
              <th className="px-4 py-3 text-left">Asignado a</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No hay tareas programadas
                </td>
              </tr>
            ) : (
              filtered.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {getPropertyName(task.property_id)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 text-xs font-bold uppercase">
                        {getStaffName(task.assigned_cleaner_id)?.[0] || '?'}
                      </div>
                      <span className="text-slate-600">
                        {getStaffName(task.assigned_cleaner_id)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{task.tipo}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(task.fecha_programada)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        STATUS_STYLES[task.estado] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {task.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {task.estado === 'Completada' ? (
                        <button
                          onClick={() => navigate(`/reportes?task=${task.id}`)}
                          className="text-xs bg-teal-50 text-teal-600 hover:bg-teal-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          Ver Reporte
                        </button>
                      ) : (
                        <button
                          onClick={() => onAssign && onAssign(task)}
                          className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          Asignar
                        </button>
                      )}
                      <button
                        onClick={() => onDetails && onDetails(task)}
                        className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Detalles
                      </button>
                      <button
                        onClick={() => navigate('/reportes')}
                        className="text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Nuevo Reporte
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
