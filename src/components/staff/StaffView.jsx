import { useState } from 'react';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { useFirestore } from '../../hooks/useFirestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';

const ROLES = ['admin', 'supervisor', 'limpieza'];

const ROLE_LABELS = {
  admin: { label: 'Administrador', color: 'bg-purple-100 text-purple-700' },
  supervisor: { label: 'Supervisor', color: 'bg-blue-100 text-blue-700' },
  limpieza: { label: 'Personal de Limpieza', color: 'bg-teal-100 text-teal-700' },
};

const INITIAL_FORM = {
  nombre: '',
  email: '',
  password: '',
  rol: 'limpieza',
  telefono: '',
  activo: true,
};

export default function StaffView() {
  const { documents: staff, loading } = useRealtimeCollection('users');
  const { updateDocument, deleteDocument } = useFirestore();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      // Store user data in Firestore
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        nombre: form.nombre,
        rol: form.rol,
        telefono: form.telefono,
        activo: form.activo,
        email: form.email,
        createdAt: serverTimestamp(),
      });
      showToast('Usuario creado exitosamente');
      setForm(INITIAL_FORM);
      setShowForm(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (member) => {
    try {
      await updateDocument('users', member.id, { activo: !member.activo });
      showToast(`Usuario ${member.activo ? 'desactivado' : 'activado'}`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Personal</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión del equipo de limpieza</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(INITIAL_FORM); }}
          className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-600 flex items-center gap-2"
        >
          + Nuevo Usuario
        </button>
      </div>

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
              <h3 className="font-bold text-slate-800">Nuevo Usuario</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre completo *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder="María García"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="maria@cleanstay.com"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Contraseña *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Rol *</label>
                  <select
                    value={form.rol}
                    onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
                    placeholder="+1 555 0000"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 bg-teal-500 text-white py-2 rounded-lg text-sm disabled:opacity-50">
                  {saving ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-slate-400">Cargando...</div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-4xl mb-3">👥</div>
          <div className="text-slate-500">No hay usuarios registrados</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {staff.map((member) => {
            const roleInfo = ROLE_LABELS[member.rol] || { label: member.rol, color: 'bg-gray-100 text-gray-700' };
            return (
              <div key={member.id} className={`bg-white rounded-xl shadow-sm p-5 ${!member.activo ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-xl font-bold text-slate-600 uppercase">
                    {member.nombre?.[0] || '?'}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </div>
                </div>
                <div className="font-semibold text-slate-800 mb-1">{member.nombre}</div>
                {member.email && <div className="text-slate-500 text-xs mb-1">📧 {member.email}</div>}
                {member.telefono && <div className="text-slate-500 text-xs mb-3">📞 {member.telefono}</div>}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${member.activo ? 'text-green-600' : 'text-red-400'}`}>
                    {member.activo ? '● Activo' : '● Inactivo'}
                  </span>
                  <button
                    onClick={() => handleToggleActive(member)}
                    className="text-xs text-slate-500 hover:text-slate-700 underline"
                  >
                    {member.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
