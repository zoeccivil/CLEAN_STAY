export default function StatCard({ icon, label, value, color, bgColor }) {
  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${color} flex items-center gap-4`}>
      <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center text-xl shrink-0`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="text-slate-500 text-sm">{label}</div>
      </div>
    </div>
  );
}
