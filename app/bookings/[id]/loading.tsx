export default function BookingDetailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse" aria-busy="true" aria-label="Foglalás betöltése">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200" />
          <div className="h-4 w-56 rounded-full bg-slate-200/80" />
        </div>
        <div className="rounded-3xl bg-white border border-slate-200 p-6 mb-8 flex flex-wrap items-center gap-4">
          <div className="h-14 w-60 rounded-2xl bg-slate-200/80" />
          <div className="h-14 w-40 rounded-2xl bg-slate-100" />
          <div className="h-14 flex-1 min-w-[160px] rounded-2xl bg-slate-200/80" />
          <div className="h-14 flex-1 min-w-[160px] rounded-2xl bg-emerald-100" />
        </div>
        <div className="flex items-start gap-5 mb-6">
          <div className="w-20 h-20 rounded-3xl bg-slate-200/80" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-48 rounded-full bg-slate-200/80" />
            <div className="h-14 w-64 rounded-2xl bg-slate-200/80" />
            <div className="h-16 w-full rounded-2xl bg-blue-50 border border-blue-100" />
          </div>
        </div>
        <div className="rounded-3xl bg-white border border-slate-200 grid grid-cols-1 lg:grid-cols-4 mb-7">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-7 space-y-3 lg:border-r border-slate-100 last:border-r-0">
              <div className="h-4 w-28 rounded-full bg-slate-200/80" />
              <div className="h-5 w-40 rounded-full bg-slate-100" />
              <div className="h-5 w-32 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
          <div className="lg:col-span-2 h-64 rounded-3xl bg-white border border-slate-200" />
          <div className="h-64 rounded-3xl bg-white border border-slate-200" />
        </div>
      </div>
    </div>
  );
}
