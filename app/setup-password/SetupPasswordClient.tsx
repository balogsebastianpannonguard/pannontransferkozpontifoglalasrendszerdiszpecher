"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, Star } from "lucide-react";

export default function SetupPasswordClient() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") || "";
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<"dispatcher" | "admin">("dispatcher");
  const [requireTwoFactor, setRequireTwoFactor] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setError("Hiányzó aktiválási token. Kérjük, használd az emailben kapott linket.");
      return;
    }
    (async () => {
      setVerifying(true);
      try {
        const res = await fetch(`/api/setup-password/verify?token=${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
          setError(json?.message || "Érvénytelen aktiválási link.");
        } else {
          setUserEmail(json.user?.email || "");
          setUserName(json.user?.name || "");
          setUserRole((json.user?.role || "dispatcher") as any);
          setRequireTwoFactor(!!json.user?.requireTwoFactor);
          setExpiresAt(json.user?.inviteExpiresAt || null);
        }
      } catch (e) {
        setError("Hálózati hiba az ellenőrzés közben. Kérjük, próbálja újra.");
      } finally {
        setVerifying(false);
      }
    })();
  }, [token]);

  const passwordOk =
    password.length >= 6 && password === passwordConfirm;

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordOk || !token) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/setup-password/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, name: userName }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.message || "Nem sikerült a fiók aktiválása.");
      } else {
        setDone(true);
        setTimeout(() => router.push("/"), 1800);
      }
    } catch {
      setError("Hálózati hiba a mentés közben.");
    } finally {
      setLoading(false);
    }
  }

  const roleLabel = userRole === "dispatcher" ? "Diszpécser" : "Adminisztrátor";
  const roleGradient =
    userRole === "dispatcher"
      ? "from-[#0056D2] via-[#0047BA] to-[#003F9F]"
      : "from-slate-800 to-black";

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="min-h-screen flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-lg">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-5">
              <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${roleGradient} flex items-center justify-center shadow-[0_20px_50px_rgba(0,86,210,0.35)] relative`}>
                <Shield className="w-10 h-10 text-white" strokeWidth={1.7} />
                <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 border-4 border-[#F7F9FC] shadow-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-white" fill="currentColor" />
                </div>
              </div>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-2">
              Fiók aktiválása
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
              Üdv a Pannon Transfernél! Állítsd be a hozzáférési adataidat, hogy személyre szabottan fogadjunk a saját dashboardodon.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-[28px] shadow-[0_30px_80px_rgba(15,23,42,0.08)] p-7 sm:p-9 relative overflow-hidden">
            <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br ${roleGradient} opacity-[0.07] blur-3xl pointer-events-none`} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-[#0056D2]/40 to-transparent opacity-60 pointer-events-none" />

            {verifying ? (
              <div className="py-16 flex flex-col items-center text-center">
                <Loader2 className="w-10 h-10 text-[#0056D2] animate-spin mb-5" />
                <div className="font-bold text-slate-900 mb-1.5">Aktiválási link ellenőrzése...</div>
                <p className="text-sm text-slate-500 font-medium">
                  Kérjük, várj amíg megvizsgáljuk a meghívásod érvényességét.
                </p>
              </div>
            ) : error ? (
              <div className="py-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-5">
                  <AlertTriangle className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2">Hiba történt</h3>
                <p className="text-slate-500 font-medium mb-7 max-w-sm leading-relaxed">{error}</p>
                <button
                  onClick={() => router.push("/login")}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-br from-slate-900 to-black hover:shadow-lg text-white text-xs font-black tracking-[0.15em] uppercase transition-all hover:-translate-y-0.5"
                >
                  Vissza a bejelentkezéshez
                </button>
              </div>
            ) : done ? (
              <div className="py-12 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6 animate-[popIn_0.4s_ease]">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" strokeWidth={2} />
                </div>
                <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2">
                  Sikeres aktiválás!
                </h3>
                <p className="text-slate-500 font-medium max-w-sm leading-relaxed">
                  Üdvözöllek, <span className="font-bold text-slate-900">{userName || userEmail}</span>!
                  Hamarosan átirányítunk a személyre szabott Dashboardodra...
                </p>
              </div>
            ) : (
              <>
                <div className={`rounded-2xl border p-5 mb-7 bg-gradient-to-br ${
                  userRole === "dispatcher"
                    ? "from-[#0056D2]/[0.05] via-[#0047BA]/[0.03] to-transparent border-[#0056D2]/15"
                    : "from-slate-900/5 via-slate-800/3 to-transparent border-slate-900/15"
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${roleGradient} flex items-center justify-center shadow-md shrink-0`}>
                      <span className="text-white font-black text-lg tracking-tight">
                        {((userName || userEmail || "D").charAt(0) || "D").toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <div className="font-bold text-slate-900 truncate">
                          {userName || userEmail.split("@")[0]}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[9px] font-black tracking-wider uppercase bg-gradient-to-br ${roleGradient} text-white shadow-sm`}>
                          <Star className="w-2.5 h-2.5 mr-1" fill="currentColor" />
                          {roleLabel}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-500 truncate flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                        {userEmail}
                      </div>
                    </div>
                  </div>
                  {requireTwoFactor && (
                    <div className="mt-4 pt-4 border-t border-slate-200/70 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm mb-0.5">
                          Kétfaktoros hitelesítés kötelező
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          A fiókod biztonsága érdekében a jelszó beállítása után a következő belépésednél
                          <strong className="text-slate-900"> be kell kapcsolnod a 2FA-t</strong>.
                        </p>
                      </div>
                    </div>
                  )}
                  {expiresAt && (
                    <div className="mt-3 text-[11px] text-slate-400 font-medium">
                      Link érvényessége: {new Date(expiresAt).toLocaleString("hu-HU")}
                    </div>
                  )}
                </div>

                <form onSubmit={handleActivate} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-black tracking-[0.2em] uppercase text-slate-500 mb-2.5">
                      Új jelszó
                    </label>
                    <div className="relative">
                      <input
                        type={showPwd ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 karakter, legyen erős és egyedi"
                        className="w-full h-[54px] px-5 pr-14 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#0056D2]/20 focus:border-[#0056D2] transition-all"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                        tabIndex={-1}
                      >
                        {showPwd ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black tracking-[0.2em] uppercase text-slate-500 mb-2.5">
                      Jelszó megerősítése
                    </label>
                    <input
                      type={showPwd ? "text" : "password"}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="Írd be újra a jelszavad"
                      className={`w-full h-[54px] px-5 bg-slate-50 border rounded-2xl text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 transition-all ${
                        passwordConfirm && !passwordOk
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-slate-200 focus:ring-[#0056D2]/20 focus:border-[#0056D2]"
                      }`}
                    />
                    {passwordConfirm && !passwordOk && (
                      <p className="text-xs text-rose-600 font-medium mt-2 pl-1">
                        A két jelszó nem egyezik meg, vagy túl rövid.
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700 font-medium">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !passwordOk}
                    className={`w-full h-[58px] rounded-2xl text-white font-black text-xs tracking-[0.18em] uppercase bg-gradient-to-r ${roleGradient} hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3 shadow-[0_12px_32px_rgba(0,86,210,0.35)] hover:shadow-[0_18px_44px_rgba(0,86,210,0.45)]`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-[18px] h-[18px] animate-spin" />
                        Mentés...
                      </>
                    ) : (
                      <>
                        <Shield className="w-[18px] h-[18px]" />
                        Fiók aktiválása &amp; Belépés
                      </>
                    )}
                  </button>
                </form>

                <p className="text-center text-xs text-slate-400 font-medium mt-7 leading-relaxed">
                  A fiókod aktiválásával elfogadod a Pannon Transfer feltételeit.
                  <br />
                  A bejelentkezés után személyre szabott Dashboardon fogunk fogadni.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
