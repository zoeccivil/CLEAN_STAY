import { useState } from 'react';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { useFirestore } from '../../hooks/useFirestore';

const INITIAL_FORM = {
  nombre: '',
  direccion: '',
  propietario_nombre: '',
  propietario_email: '',
};

export default function PropertiesView() {
  const { documents: properties, loading } = useRealtimeCollection('properties');
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
    if (!form.nombre || !form.direccion) return;
    setSaving(true);
    try {
      if (editId) {
        await updateDocument('properties', editId, form);
        showToast('Propiedad actualizada');
      } else {
        await addDocument('properties', form);
        showToast('Propiedad agregada');
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

  const handleEdit = (prop) => {
    setForm({
      nombre: prop.nombre || '',
      direccion: prop.direccion || '',
      propietario_nombre: prop.propietario_nombre || '',
      propietario_email: prop.propietario_email || '',
    });
    setEditId(prop.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta propiedad?')) return;
    try {
      await deleteDocument('properties', id);
      showToast('Propiedad eliminada');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Propiedades</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión de propiedades registradas</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(INITIAL_FORM); }}
          className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-600 transition-colors flex items-center gap-2"
        >
          + Nueva Propiedad
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`}>{toast.msg}</div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">
                {editId ? 'Editar Propiedad' : 'Nueva Propiedad'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre de la Propiedad *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej: Apartamento 101 - Centro"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Dirección *</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
                  placeholder="Calle, Ciudad"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre del Propietario</label>
                <input
                  type="text"
                  value={form.propietario_nombre}
                  onChange={(e) => setForm((p) => ({ ...p, propietario_nombre: e.target.value }))}
                  placeholder="Juan Pérez"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email del Propietario</label>
                <input
                  type="email"
                  value={form.propietario_email}
                  onChange={(e) => setForm((p) => ({ ...p, propietario_email: e.target.value }))}
                  placeholder="juan@example.com"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-teal-500 text-white py-2 rounded-lg text-sm hover:bg-teal-600 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Properties Grid */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-slate-400">
          Cargando propiedades...
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-4xl mb-3">🏠</div>
          <div className="text-slate-500">No hay propiedades registradas</div>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 bg-teal-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-600"
          >
            Agregar primera propiedad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((prop) => (
            <div key={prop.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 text-xl">
                  🏠
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(prop)}
                    className="text-xs text-blue-600 hover:text-blue-800 p-1"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(prop.id)}
                    className="text-xs text-red-400 hover:text-red-600 p-1"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="font-semibold text-slate-800 mb-1">{prop.nombre}</div>
              <div className="text-slate-500 text-xs mb-2">📍 {prop.direccion}</div>
              {prop.propietario_nombre && (
                <div className="text-slate-500 text-xs">👤 {prop.propietario_nombre}</div>
              )}
              {prop.propietario_email && (
                <div className="text-teal-600 text-xs mt-1">📧 {prop.propietario_email}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
