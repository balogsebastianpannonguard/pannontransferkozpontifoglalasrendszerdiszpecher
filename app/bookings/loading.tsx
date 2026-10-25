export default function BookingsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse" aria-busy="true" aria-label="Foglalások betöltése">
        <div className="flex items-center justify-between mb-6">
          <div className="h-10 w-56 rounded-2xl bg-slate-200/80" />
          <div className="h-11 w-36 rounded-2xl bg-blue-200/70" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-3xl bg-white border border-slate-200" />
          ))}
        </div>
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-52 rounded-3xl bg-white border border-slate-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
