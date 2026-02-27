export default function TitleBar() {
  return (
    <div className="h-8 bg-[#1e293b] flex items-center px-4 gap-3 select-none shrink-0">
      {/* Traffic light buttons */}
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
      </div>
      <div className="flex-1 text-center text-slate-400 text-xs">
        CleanStay Pro — Panel de Administración v2.1.0
      </div>
    </div>
  );
}
