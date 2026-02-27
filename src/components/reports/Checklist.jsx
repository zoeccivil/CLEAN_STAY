const CHECKLIST_ITEMS = [
  { key: 'sabanas_toallas', label: 'Sábanas y Toallas Cambiadas', icon: '🛏️' },
  { key: 'amenidades', label: 'Amenidades Repuestas', icon: '🧴' },
  { key: 'basureros', label: 'Basureros Vaciados y Limpios', icon: '🗑️' },
  { key: 'electrodomesticos', label: 'Electrodomésticos Verificados', icon: '🔌' },
  { key: 'reporte_danos', label: 'Sin Daños Reportados', icon: '🔍' },
];

export default function Checklist({ checklist, onChange, readOnly = false }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-700">✅ Checklist de Verificación</h2>
      </div>
      <div className="p-4 space-y-3">
        {CHECKLIST_ITEMS.map((item) => (
          <label
            key={item.key}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              checklist[item.key]
                ? 'border-green-200 bg-green-50'
                : 'border-slate-200 bg-white'
            } ${readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-slate-50'}`}
          >
            <input
              type="checkbox"
              checked={!!checklist[item.key]}
              onChange={readOnly ? undefined : (e) => onChange && onChange(item.key, e.target.checked)}
              disabled={readOnly}
              className="w-4 h-4 accent-teal-500"
            />
            <span className="text-base">{item.icon}</span>
            <span className={`text-sm ${checklist[item.key] ? 'text-green-700 font-medium' : 'text-slate-600'}`}>
              {item.label}
            </span>
            {checklist[item.key] && (
              <span className="ml-auto text-green-500 text-sm font-bold">✓</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
