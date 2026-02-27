import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { serverTimestamp } from 'firebase/firestore';
import PhotoEvidence from './PhotoEvidence';
import Checklist from './Checklist';
import ActionPanel from './ActionPanel';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { useFirestore } from '../../hooks/useFirestore';
import { useAuth } from '../../hooks/useAuth';

const DEFAULT_CHECKLIST = {
  sabanas_toallas: false,
  amenidades: false,
  basureros: false,
  electrodomesticos: false,
  reporte_danos: false,
};

export default function ReportsView() {
  const [searchParams] = useSearchParams();
  const taskIdParam = searchParams.get('task');

  const { user } = useAuth();
  const { documents: properties } = useRealtimeCollection('properties');
  const { addDocument, loading } = useFirestore();

  const [formData, setFormData] = useState({
    property_id: '',
    cliente_nombre: '',
    cliente_email: '',
    fecha_servicio: new Date().toISOString().slice(0, 16),
    notas: '',
  });
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [photos, setPhotos] = useState([]);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (taskIdParam) {
      setFormData((prev) => ({ ...prev, task_id: taskIdParam }));
    }
  }, [taskIdParam]);

  const selectedProperty = properties.find((p) => p.id === formData.property_id);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChecklistChange = (key, value) => {
    setChecklist((prev) => ({ ...prev, [key]: value }));
  };

  const handleSend = async () => {
    if (!formData.property_id || !formData.cliente_email) {
      showToast('Completa propiedad y email del cliente', 'error');
      return;
    }
    try {
      await addDocument('reports', {
        task_id: formData.task_id || null,
        property_id: formData.property_id,
        fecha_generacion: serverTimestamp(),
        pdf_url: null,
        enviado_email: true,
        cliente_email: formData.cliente_email,
        cliente_nombre: formData.cliente_nombre,
        notas: formData.notas,
        checklist,
        photos,
      });
      showToast('✅ Reporte enviado al cliente');
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handlePreview = () => {
    showToast('Vista previa PDF generada (requiere Cloud Functions)', 'info');
  };

  const handleSaveDraft = async () => {
    try {
      await addDocument('reports', {
        task_id: formData.task_id || null,
        property_id: formData.property_id,
        fecha_generacion: serverTimestamp(),
        pdf_url: null,
        enviado_email: false,
        cliente_email: formData.cliente_email,
        cliente_nombre: formData.cliente_nombre,
        notas: formData.notas,
        checklist,
        photos,
        borrador: true,
      });
      setSaved(true);
      showToast('💾 Borrador guardado');
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reportes a Clientes</h1>
        <p className="text-slate-500 text-sm mt-1">Generador de reportes con evidencia fotográfica</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm ${
          toast.type === 'error' ? 'bg-red-500' : toast.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: form + photos + checklist */}
        <div className="xl:col-span-2 space-y-6">
          {/* Report Form */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-700">📋 Datos del Reporte</h2>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Propiedad *</label>
                <select
                  value={formData.property_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, property_id: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">Seleccionar propiedad...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fecha de Servicio</label>
                <input
                  type="datetime-local"
                  value={formData.fecha_servicio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fecha_servicio: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  value={formData.cliente_nombre}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cliente_nombre: e.target.value }))}
                  placeholder="Nombre del propietario"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email del Cliente *</label>
                <input
                  type="email"
                  value={formData.cliente_email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cliente_email: e.target.value }))}
                  placeholder="cliente@email.com"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              {selectedProperty && (
                <div className="sm:col-span-2 bg-teal-50 border border-teal-100 rounded-lg p-3 text-xs text-teal-700">
                  <div className="font-medium">{selectedProperty.nombre}</div>
                  <div>{selectedProperty.direccion}</div>
                  <div>{selectedProperty.propietario_nombre} — {selectedProperty.propietario_email}</div>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Notas adicionales</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notas: e.target.value }))}
                  rows={3}
                  placeholder="Observaciones del servicio..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Photo Evidence */}
          <PhotoEvidence taskId={formData.task_id} onPhotosUpdate={setPhotos} />

          {/* Checklist */}
          <Checklist checklist={checklist} onChange={handleChecklistChange} />
        </div>

        {/* Right column: action panel */}
        <div className="space-y-4">
          <ActionPanel
            onSend={handleSend}
            onPreview={handlePreview}
            onSaveDraft={handleSaveDraft}
            loading={loading}
            reportData={{
              cliente_email: formData.cliente_email,
              property_name: selectedProperty?.nombre,
            }}
          />

          {/* Summary card */}
          <div className="bg-white rounded-xl shadow-sm p-4 text-sm space-y-2">
            <div className="font-semibold text-slate-700 mb-3">Resumen del Reporte</div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Fotos subidas</span>
              <span className="font-medium text-teal-600">{photos.length}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Checklist completado</span>
              <span className="font-medium text-teal-600">
                {Object.values(checklist).filter(Boolean).length}/5
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Estado</span>
              <span className={`font-medium ${saved ? 'text-green-600' : 'text-orange-500'}`}>
                {saved ? 'Guardado' : 'Borrador'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
