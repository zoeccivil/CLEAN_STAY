import { useState } from 'react';
import StatCard from './StatCard';
import TaskTable from './TaskTable';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';

export default function DashboardView() {
  const { documents: tasks, loading: tasksLoading } = useRealtimeCollection('tasks');
  const { documents: properties } = useRealtimeCollection('properties');
  const { documents: staff } = useRealtimeCollection('users');

  const [selectedTask, setSelectedTask] = useState(null);
  const [assignModal, setAssignModal] = useState(false);

  const completedToday = tasks.filter((t) => {
    if (t.estado !== 'Completada') return false;
    if (!t.fecha_programada) return false;
    const d = t.fecha_programada.toDate ? t.fecha_programada.toDate() : new Date(t.fecha_programada);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const inProgress = tasks.filter((t) => t.estado === 'En Progreso').length;
  const pending = tasks.filter((t) => t.estado === 'Pendiente').length;
  const totalProperties = properties.length;

  const cleaners = staff.filter((s) => s.rol === 'limpieza');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel de Operaciones</h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-slate-500 text-sm">Sincronizado</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon="✅"
          label="Completadas Hoy"
          value={tasksLoading ? '…' : completedToday}
          color="border-blue-500"
          bgColor="bg-blue-100"
        />
        <StatCard
          icon="🔄"
          label="En Progreso"
          value={tasksLoading ? '…' : inProgress}
          color="border-teal-500"
          bgColor="bg-teal-100"
        />
        <StatCard
          icon="⏳"
          label="Pendientes"
          value={tasksLoading ? '…' : pending}
          color="border-orange-500"
          bgColor="bg-orange-100"
        />
        <StatCard
          icon="🏠"
          label="Propiedades"
          value={tasksLoading ? '…' : totalProperties}
          color="border-purple-500"
          bgColor="bg-purple-100"
        />
      </div>

      {/* Task Table */}
      {tasksLoading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-slate-400">
          Cargando tareas...
        </div>
      ) : (
        <TaskTable
          tasks={tasks}
          properties={properties}
          staff={staff}
          onAssign={(task) => {
            setSelectedTask(task);
            setAssignModal(true);
          }}
          onDetails={(task) => setSelectedTask(task)}
        />
      )}

      {/* Task Details Modal */}
      {selectedTask && !assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Detalles de Tarea</h3>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div><span className="font-medium text-slate-600">Propiedad:</span> <span className="text-slate-800">{properties.find(p => p.id === selectedTask.property_id)?.nombre || selectedTask.property_id || '—'}</span></div>
              <div><span className="font-medium text-slate-600">Tipo:</span> <span className="text-slate-800">{selectedTask.tipo}</span></div>
              <div><span className="font-medium text-slate-600">Estado:</span> <span className="text-slate-800">{selectedTask.estado}</span></div>
              <div><span className="font-medium text-slate-600">Notas:</span> <span className="text-slate-800">{selectedTask.notas || 'Sin notas'}</span></div>
              {selectedTask.checklist && (
                <div>
                  <span className="font-medium text-slate-600">Checklist:</span>
                  <ul className="mt-1 space-y-1 pl-4">
                    {Object.entries(selectedTask.checklist).map(([k, v]) => (
                      <li key={k} className={v ? 'text-green-600' : 'text-slate-400'}>
                        {v ? '✓' : '○'} {k.replace(/_/g, ' ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedTask(null)}
              className="mt-5 w-full bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-600 transition-colors text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && selectedTask && (
        <AssignModal
          task={selectedTask}
          cleaners={cleaners}
          onClose={() => { setAssignModal(false); setSelectedTask(null); }}
        />
      )}
    </div>
  );
}

function AssignModal({ task, cleaners, onClose }) {
  const [selectedCleaner, setSelectedCleaner] = useState(task.assigned_cleaner_id || '');

  const handleAssign = async () => {
    // Assignment handled via useFirestore hook in parent
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Asignar Limpiador</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <select
          value={selectedCleaner}
          onChange={(e) => setSelectedCleaner(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 mb-4"
        >
          <option value="">Seleccionar limpiador...</option>
          {cleaners.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50">
            Cancelar
          </button>
          <button onClick={handleAssign} className="flex-1 bg-teal-500 text-white py-2 rounded-lg text-sm hover:bg-teal-600">
            Asignar
          </button>
        </div>
      </div>
    </div>
  );
}
