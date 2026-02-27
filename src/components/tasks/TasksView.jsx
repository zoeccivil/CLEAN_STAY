import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { useFirestore } from '../../hooks/useFirestore';

const TASK_TYPES = ['Check-out', 'Profunda', 'Mantenimiento'];
const TASK_STATUSES = ['Pendiente', 'En Progreso', 'Completada'];

const STATUS_STYLES = {
  Completada: 'bg-green-100 text-green-700',
  'En Progreso': 'bg-blue-100 text-blue-700',
  Pendiente: 'bg-orange-100 text-orange-700',
};

const INITIAL_FORM = {
  property_id: '',
  assigned_cleaner_id: '',
  supervisor_id: '',
  tipo: 'Check-out',
  fecha_programada: '',
  estado: 'Pendiente',
  notas: '',
  checklist: {
    sabanas_toallas: false,
    amenidades: false,
    basureros: false,
    electrodomesticos: false,
    reporte_danos: false,
  },
};

export default function TasksView() {
  const { documents: tasks, loading } = useRealtimeCollection('tasks', [], 'fecha_programada');
  const { documents: properties } = useRealtimeCollection('properties');
  const { documents: staff } = useRealtimeCollection('users');
  const { addDocument, updateDocument, deleteDocument } = useFirestore();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const cleaners = staff.filter((s) => s.rol === 'limpieza');
  const supervisors = staff.filter((s) => s.rol === 'supervisor' || s.rol === 'admin');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        fecha_programada: form.fecha_programada
          ? Timestamp.fromDate(new Date(form.fecha_programada))
          : null,
      };
      if (editId) {
        await updateDocument('tasks', editId, data);
        showToast('Tarea actualizada');
      } else {
        await addDocument('tasks', data);
        showToast('Tarea creada');
      }
      setForm(INITIAL_FORM);
      setShowForm(false);
      setEditId(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await updateDocument('tasks', task.id, { estado: newStatus });
      showToast(`Estado actualizado: ${newStatus}`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    try {
      await deleteDocument('tasks', id);
      showToast('Tarea eliminada');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleEdit = (task) => {
    let fechaStr = '';
    if (task.fecha_programada) {
      const d = task.fecha_programada.toDate ? task.fecha_programada.toDate() : new Date(task.fecha_programada);
      fechaStr = d.toISOString().slice(0, 16);
    }
    setForm({
      property_id: task.property_id || '',
      assigned_cleaner_id: task.assigned_cleaner_id || '',
      supervisor_id: task.supervisor_id || '',
      tipo: task.tipo || 'Check-out',
      fecha_programada: fechaStr,
      estado: task.estado || 'Pendiente',
      notas: task.notas || '',
      checklist: task.checklist || INITIAL_FORM.checklist,
    });
    setEditId(task.id);
    setShowForm(true);
  };

  const getPropertyName = (id) => properties.find((p) => p.id === id)?.nombre || id || '—';
  const getStaffName = (id) => staff.find((s) => s.id === id)?.nombre || id || '—';

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filteredTasks = statusFilter
    ? tasks.filter((t) => t.estado === statusFilter)
    : tasks;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tareas de Limpieza</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión y seguimiento de tareas</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(INITIAL_FORM); }}
          className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-600 flex items-center gap-2"
        >
          + Nueva Tarea
        </button>
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`}>{toast.msg}</div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', ...TASK_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-teal-500 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {s || 'Todas'}
          </button>
        ))}
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">{editId ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Propiedad *</label>
                  <select
                    value={form.property_id}
                    onChange={(e) => setForm((p) => ({ ...p, property_id: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {properties.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tipo *</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {TASK_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Limpiador</label>
                  <select
                    value={form.assigned_cleaner_id}
                    onChange={(e) => setForm((p) => ({ ...p, assigned_cleaner_id: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Sin asignar</option>
                    {cleaners.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Supervisor</label>
                  <select
                    value={form.supervisor_id}
                    onChange={(e) => setForm((p) => ({ ...p, supervisor_id: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Sin asignar</option>
                    {supervisors.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Fecha Programada</label>
                  <input
                    type="datetime-local"
                    value={form.fecha_programada}
                    onChange={(e) => setForm((p) => ({ ...p, fecha_programada: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Estado</label>
                  <select
                    value={form.estado}
                    onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notas</label>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 bg-teal-500 text-white py-2 rounded-lg text-sm disabled:opacity-50">
                  {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tasks Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-slate-400">Cargando...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-slate-500">No hay tareas</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <th className="px-4 py-3 text-left">Propiedad</th>
                  <th className="px-4 py-3 text-left">Asignado</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{getPropertyName(task.property_id)}</td>
                    <td className="px-4 py-3 text-slate-600">{getStaffName(task.assigned_cleaner_id)}</td>
                    <td className="px-4 py-3 text-slate-600">{task.tipo}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(task.fecha_programada)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={task.estado}
                        onChange={(e) => handleStatusChange(task, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${STATUS_STYLES[task.estado] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(task)} className="text-xs text-blue-600 hover:underline">Editar</button>
                        <button onClick={() => handleDelete(task.id)} className="text-xs text-red-400 hover:underline">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
