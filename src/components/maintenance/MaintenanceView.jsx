import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { useFirestore } from '../../hooks/useFirestore';

const ISSUE_TYPES = ['Plomería', 'Electricidad', 'Electrodoméstico', 'Estructura', 'Limpieza Especial', 'Otro'];
const PRIORITIES = ['Baja', 'Media', 'Alta', 'Urgente'];
const STATUSES = ['Reportado', 'En Revisión', 'En Reparación', 'Resuelto'];

const PRIORITY_STYLES = {
  Baja: 'bg-slate-100 text-slate-600',
  Media: 'bg-yellow-100 text-yellow-700',
  Alta: 'bg-orange-100 text-orange-700',
  Urgente: 'bg-red-100 text-red-700',
};

const STATUS_STYLES = {
  Reportado: 'bg-blue-100 text-blue-700',
  'En Revisión': 'bg-yellow-100 text-yellow-700',
  'En Reparación': 'bg-orange-100 text-orange-700',
  Resuelto: 'bg-green-100 text-green-700',
};

const INITIAL_FORM = {
  property_id: '',
  tipo: 'Otro',
  descripcion: '',
  prioridad: 'Media',
  estado: 'Reportado',
  assigned_to: '',
  fecha_reporte: '',
};

export default function MaintenanceView() {
  const { documents: issues, loading } = useRealtimeCollection('maintenance');
  const { documents: properties } = useRealtimeCollection('properties');
  const { documents: staff } = useRealtimeCollection('users');
  const { addDocument, updateDocument, deleteDocument } = useFirestore();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

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
        fecha_reporte: form.fecha_reporte ? Timestamp.fromDate(new Date(form.fecha_reporte)) : Timestamp.now(),
      };
      if (editId) {
        await updateDocument('maintenance', editId, data);
        showToast('Reporte actualizado');
      } else {
        await addDocument('maintenance', data);
        showToast('Reporte creado');
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

  const handleStatusChange = async (issue, newStatus) => {
    try {
      await updateDocument('maintenance', issue.id, { estado: newStatus });
      showToast(`Estado: ${newStatus}`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este reporte?')) return;
    try {
      await deleteDocument('maintenance', id);
      showToast('Reporte eliminado');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const getPropertyName = (id) => properties.find((p) => p.id === id)?.nombre || '—';
  const getStaffName = (id) => staff.find((s) => s.id === id)?.nombre || '—';

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const urgentCount = issues.filter((i) => i.prioridad === 'Urgente' && i.estado !== 'Resuelto').length;
  const openCount = issues.filter((i) => i.estado !== 'Resuelto').length;
  const resolvedCount = issues.filter((i) => i.estado === 'Resuelto').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mantenimiento</h1>
          <p className="text-slate-500 text-sm mt-1">Reporte y seguimiento de problemas</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(INITIAL_FORM); }}
          className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-600"
        >
          + Nuevo Reporte
        </button>
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`}>{toast.msg}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-400">
          <div className="text-2xl font-bold text-slate-800">{urgentCount}</div>
          <div className="text-slate-500 text-xs">Urgentes</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-orange-400">
          <div className="text-2xl font-bold text-slate-800">{openCount}</div>
          <div className="text-slate-500 text-xs">Abiertos</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-400">
          <div className="text-2xl font-bold text-slate-800">{resolvedCount}</div>
          <div className="text-slate-500 text-xs">Resueltos</div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">{editId ? 'Editar Reporte' : 'Nuevo Reporte de Mantenimiento'}</h3>
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
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de Problema</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {ISSUE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Prioridad</label>
                  <select
                    value={form.prioridad}
                    onChange={(e) => setForm((p) => ({ ...p, prioridad: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Asignar a</label>
                  <select
                    value={form.assigned_to}
                    onChange={(e) => setForm((p) => ({ ...p, assigned_to: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Sin asignar</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Descripción *</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                  rows={3}
                  placeholder="Describe el problema..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 bg-teal-500 text-white py-2 rounded-lg text-sm disabled:opacity-50">
                  {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Reportar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issues List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-slate-400">Cargando...</div>
      ) : issues.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-4xl mb-3">🔧</div>
          <div className="text-slate-500">No hay reportes de mantenimiento</div>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <div key={issue.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-slate-800">{issue.tipo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_STYLES[issue.prioridad] || 'bg-gray-100 text-gray-600'}`}>
                      {issue.prioridad}
                    </span>
                  </div>
                  <div className="text-slate-600 text-sm mb-2">{issue.descripcion}</div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span>🏠 {getPropertyName(issue.property_id)}</span>
                    {issue.assigned_to && <span>👤 {getStaffName(issue.assigned_to)}</span>}
                    <span>📅 {formatDate(issue.fecha_reporte)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <select
                    value={issue.estado}
                    onChange={(e) => handleStatusChange(issue, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${STATUS_STYLES[issue.estado] || 'bg-gray-100'}`}
                  >
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <button
                    onClick={() => handleDelete(issue.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
