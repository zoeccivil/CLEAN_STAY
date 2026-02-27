import { useEffect, useState } from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useStorage } from '../../hooks/useStorage';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('SW registration failed:', err));
  });
}

function TaskCard({ task, properties, onOpen }) {
  const property = properties.find((p) => p.id === task.property_id);
  const STATUS_STYLES = {
    Completada: 'bg-green-100 text-green-700',
    'En Progreso': 'bg-blue-100 text-blue-700',
    Pendiente: 'bg-orange-100 text-orange-700',
  };

  return (
    <div
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:scale-98 transition-transform"
      onClick={() => onOpen(task)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-semibold text-slate-800 text-base">{property?.nombre || '—'}</div>
          <div className="text-slate-500 text-xs mt-0.5">{property?.direccion}</div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_STYLES[task.estado] || 'bg-gray-100 text-gray-600'}`}>
          {task.estado}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>🧹 {task.tipo}</span>
        {task.fecha_programada && (
          <span>🕐 {(task.fecha_programada.toDate ? task.fecha_programada.toDate() : new Date(task.fecha_programada)).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
        )}
      </div>
    </div>
  );
}

function ChecklistItem({ label, checked, onChange }) {
  return (
    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer active:scale-98 ${
      checked ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white'
    }`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="w-5 h-5 accent-teal-500" />
      <span className={`text-sm font-medium ${checked ? 'text-teal-700 line-through' : 'text-slate-700'}`}>{label}</span>
    </label>
  );
}

function PhotoCapture({ label, badge, taskId, area, tipo, onCapture }) {
  const [preview, setPreview] = useState(null);
  const { uploadFile, progress, uploading, error } = useStorage();

  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    if (taskId) {
      const path = `tasks/${taskId}/photos/${tipo}_${area}_${Date.now()}`;
      try {
        const url = await uploadFile(file, path);
        // Save to subcollection
        await addDoc(collection(db, 'tasks', taskId, 'photos'), {
          tipo,
          area,
          url_storage: url,
          timestamp: serverTimestamp(),
          observaciones: '',
        });
        onCapture && onCapture({ tipo, area, url_storage: url });
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
  };

  return (
    <label className="block cursor-pointer">
      <div className={`border-2 border-dashed rounded-2xl p-4 text-center transition-colors ${
        preview ? 'border-teal-400' : 'border-slate-300 hover:border-teal-400'
      }`}>
        <div className="text-xs font-semibold mb-2">
          <span className={`px-2 py-0.5 rounded-full ${tipo === 'Antes' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
            {tipo}
          </span>
        </div>
        {preview ? (
          <div className="relative">
            <img src={preview} alt={label} className="w-full h-32 object-cover rounded-xl" />
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                <div className="text-white text-sm font-bold">{progress}%</div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6">
            <div className="text-3xl mb-1">📷</div>
            <div className="text-slate-500 text-xs">{label}</div>
          </div>
        )}
        {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
      </div>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />
    </label>
  );
}

const CHECKLIST_LABELS = {
  sabanas_toallas: 'Sábanas y Toallas Cambiadas',
  amenidades: 'Amenidades Repuestas',
  basureros: 'Basureros Vaciados',
  electrodomesticos: 'Electrodomésticos Verificados',
  reporte_danos: 'Sin Daños',
};

const PHOTO_AREAS = ['Sala de Estar', 'Cocina', 'Baño', 'Habitación'];

function TaskExecution({ task, properties, onBack, onComplete }) {
  const property = properties.find((p) => p.id === task.property_id);
  const [checklist, setChecklist] = useState(task.checklist || {
    sabanas_toallas: false,
    amenidades: false,
    basureros: false,
    electrodomesticos: false,
    reporte_danos: false,
  });
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeArea, setActiveArea] = useState(PHOTO_AREAS[0]);

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const total = Object.keys(checklist).length;

  const handleChecklistChange = (key, checked) => {
    setChecklist((prev) => ({ ...prev, [key]: checked }));
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        estado: 'Completada',
        checklist,
        updatedAt: serverTimestamp(),
      });
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6]">
      {/* Header */}
      <div className="bg-[#1e293b] px-4 py-4 safe-top">
        <button onClick={onBack} className="text-slate-400 mb-3 flex items-center gap-1 text-sm">
          ← Volver
        </button>
        <h1 className="text-white font-bold text-lg">{property?.nombre || '—'}</h1>
        <p className="text-slate-400 text-sm">{task.tipo} · {property?.direccion}</p>
        {/* Progress bar */}
        <div className="mt-3 bg-slate-700 rounded-full h-2">
          <div
            className="bg-teal-400 h-2 rounded-full transition-all"
            style={{ width: `${(completedCount / total) * 100}%` }}
          />
        </div>
        <div className="text-slate-400 text-xs mt-1">{completedCount}/{total} completado</div>
      </div>

      <div className="p-4 space-y-6">
        {/* Checklist */}
        <div>
          <h2 className="font-semibold text-slate-700 mb-3">✅ Lista de Verificación</h2>
          <div className="space-y-2">
            {Object.entries(checklist).map(([key, checked]) => (
              <ChecklistItem
                key={key}
                label={CHECKLIST_LABELS[key] || key}
                checked={checked}
                onChange={(e) => handleChecklistChange(key, e.target.checked)}
              />
            ))}
          </div>
        </div>

        {/* Photos */}
        <div>
          <h2 className="font-semibold text-slate-700 mb-3">📸 Evidencia Fotográfica</h2>
          {/* Area tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {PHOTO_AREAS.map((area) => (
              <button
                key={area}
                onClick={() => setActiveArea(area)}
                className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                  activeArea === area
                    ? 'bg-teal-500 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <PhotoCapture
              label="Foto Antes"
              tipo="Antes"
              area={activeArea}
              taskId={task.id}
              onCapture={(p) => setPhotos((prev) => [...prev, p])}
            />
            <PhotoCapture
              label="Foto Después"
              tipo="Después"
              area={activeArea}
              taskId={task.id}
              onCapture={(p) => setPhotos((prev) => [...prev, p])}
            />
          </div>
        </div>

        {/* Complete button */}
        <button
          onClick={handleComplete}
          disabled={saving || completedCount < total}
          className="w-full bg-teal-500 text-white py-4 rounded-2xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 transition-all shadow-lg shadow-teal-500/30"
        >
          {saving ? 'Guardando...' : completedCount < total ? `Completa ${total - completedCount} más` : '✅ Marcar como Completada'}
        </button>
      </div>
    </div>
  );
}

export default function MobileApp() {
  const { user, userRole, loading, logout } = useAuth();
  const { documents: allTasks } = useRealtimeCollection('tasks');
  const { documents: properties } = useRealtimeCollection('properties');
  const [selectedTask, setSelectedTask] = useState(null);
  const [completedMsg, setCompletedMsg] = useState(false);

  // Filter today's tasks for this cleaner
  const todayTasks = allTasks.filter((t) => {
    if (t.assigned_cleaner_id !== user?.uid) return false;
    if (!t.fecha_programada) return true;
    const d = t.fecha_programada.toDate ? t.fecha_programada.toDate() : new Date(t.fecha_programada);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7f6] flex items-center justify-center">
        <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl animate-pulse">C</div>
      </div>
    );
  }

  if (selectedTask) {
    return (
      <TaskExecution
        task={selectedTask}
        properties={properties}
        onBack={() => setSelectedTask(null)}
        onComplete={() => {
          setSelectedTask(null);
          setCompletedMsg(true);
          setTimeout(() => setCompletedMsg(false), 3000);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f6]">
      {/* Header */}
      <div className="bg-[#1e293b] px-4 pt-safe pb-4">
        <div className="flex items-center justify-between pt-4">
          <div>
            <h1 className="text-white font-bold text-xl">Hola, {user?.nombre?.split(' ')[0] || 'Limpiador'} 👋</h1>
            <p className="text-slate-400 text-sm">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button onClick={logout} className="text-slate-400 text-sm hover:text-red-400">
            🚪
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Success toast */}
        {completedMsg && (
          <div className="bg-green-500 text-white px-4 py-3 rounded-2xl text-sm font-medium animate-bounce">
            ✅ ¡Tarea completada exitosamente!
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-teal-500">{todayTasks.length}</div>
            <div className="text-slate-500 text-xs">Total Hoy</div>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-orange-500">
              {todayTasks.filter((t) => t.estado === 'Pendiente').length}
            </div>
            <div className="text-slate-500 text-xs">Pendientes</div>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-500">
              {todayTasks.filter((t) => t.estado === 'Completada').length}
            </div>
            <div className="text-slate-500 text-xs">Completadas</div>
          </div>
        </div>

        {/* Tasks list */}
        <div>
          <h2 className="font-semibold text-slate-700 mb-3">Tareas de Hoy</h2>
          {todayTasks.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <div className="text-4xl mb-3">🎉</div>
              <div className="text-slate-600 font-medium">¡No tienes tareas hoy!</div>
              <div className="text-slate-400 text-sm mt-1">Descansa o consulta con tu supervisor</div>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  properties={properties}
                  onOpen={setSelectedTask}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
