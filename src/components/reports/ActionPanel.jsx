import { useState } from 'react';

export default function ActionPanel({ onSend, onPreview, onSaveDraft, loading, reportData }) {
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (sent) return;
    await onSend();
    setSent(true);
  };

  return (
    <div className="bg-[#1e293b] rounded-xl p-5 shadow-sm">
      <h2 className="font-semibold text-white mb-4">🚀 Acciones del Reporte</h2>

      {/* Recipient info */}
      <div className="bg-slate-700/50 rounded-lg p-3 mb-4 text-xs text-slate-300">
        <div className="flex items-center gap-2 mb-1">
          <span>📧</span>
          <span>Destinatario:</span>
          <span className="text-teal-300 font-medium">{reportData?.cliente_email || 'No especificado'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🏠</span>
          <span>Propiedad:</span>
          <span className="text-teal-300 font-medium">{reportData?.property_name || 'No seleccionada'}</span>
        </div>
      </div>

      {/* Primary action */}
      <button
        onClick={handleSend}
        disabled={loading || sent || !reportData?.cliente_email}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all mb-3 shadow-lg ${
          sent
            ? 'bg-green-500 text-white cursor-default'
            : 'bg-teal-500 text-white hover:bg-teal-400 active:scale-95 shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Enviando...
          </span>
        ) : sent ? (
          '✅ Reporte Enviado'
        ) : (
          '📧 Enviar Reporte al Cliente'
        )}
      </button>

      {/* Secondary actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onPreview}
          className="py-2.5 bg-slate-600 text-slate-200 hover:bg-slate-500 rounded-lg text-sm transition-colors"
        >
          👁️ Vista Previa PDF
        </button>
        <button
          onClick={onSaveDraft}
          className="py-2.5 bg-slate-600 text-slate-200 hover:bg-slate-500 rounded-lg text-sm transition-colors"
        >
          💾 Guardar Borrador
        </button>
      </div>
    </div>
  );
}
