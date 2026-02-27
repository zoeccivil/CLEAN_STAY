import { useState } from 'react';
import { useStorage } from '../../hooks/useStorage';

const AREAS = ['Sala de Estar', 'Cocina', 'Baño Principal', 'Habitación 1', 'Habitación 2', 'Área Exterior'];

function PhotoUploadArea({ area, tipo, taskId, onUploaded }) {
  const [preview, setPreview] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const { uploadFile, progress, uploading } = useStorage();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    if (taskId) {
      const path = `tasks/${taskId}/photos/${tipo}_${area}_${Date.now()}`;
      try {
        const url = await uploadFile(file, path);
        onUploaded && onUploaded({ tipo, area, url_storage: url });
        setUploaded(true);
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
  };

  return (
    <div className="relative">
      <label className="block cursor-pointer">
        <div className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${
          uploaded ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-teal-400 hover:bg-teal-50'
        }`}>
          {preview ? (
            <div className="relative">
              <img src={preview} alt={`${tipo} - ${area}`} className="w-full h-24 object-cover rounded" />
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                  <div className="text-white text-xs">{progress}%</div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4">
              <div className="text-slate-400 text-2xl mb-1">📷</div>
              <div className="text-slate-500 text-xs">Subir foto</div>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
      <span className={`absolute -top-2 -right-2 text-xs px-1.5 py-0.5 rounded-full font-medium ${
        tipo === 'Antes' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
      }`}>
        {tipo}
      </span>
    </div>
  );
}

export default function PhotoEvidence({ taskId, onPhotosUpdate }) {
  const [photos, setPhotos] = useState({});

  const handleUploaded = (photoData) => {
    const key = `${photoData.tipo}_${photoData.area}`;
    const updated = { ...photos, [key]: photoData };
    setPhotos(updated);
    onPhotosUpdate && onPhotosUpdate(Object.values(updated));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-700">📸 Evidencia Fotográfica</h2>
      </div>
      <div className="p-4 space-y-4">
        {AREAS.map((area) => (
          <div key={area}>
            <div className="text-sm font-medium text-slate-600 mb-2">{area}</div>
            <div className="grid grid-cols-2 gap-3">
              <PhotoUploadArea area={area} tipo="Antes" taskId={taskId} onUploaded={handleUploaded} />
              <PhotoUploadArea area={area} tipo="Después" taskId={taskId} onUploaded={handleUploaded} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
