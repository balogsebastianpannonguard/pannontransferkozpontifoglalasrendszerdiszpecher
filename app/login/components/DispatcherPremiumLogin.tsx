"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type State = "login" | "done";

export default function DispatcherPremiumLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<State>("login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Kérjük, adja meg az e-mail címet és a jelszót.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        setError(json?.message || "Sikertelen bejelentkezés.");
        return;
      }

      if (json?.user) {
        setState("done");
        setTimeout(() => {
          router.push("/");
        }, 1800);
        return;
      }

      setError("Váratlan hiba történt a bejelentkezés során.");
    } catch {
      setError("Hálózati hiba történt. Kérjük, próbálja újra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex flex-col justify-between overflow-hidden selection:bg-[#0056D2] selection:text-white">
      {/* Pannon Transfer Elegant Background (NO GRID) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#0056D2]/[0.03] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#FFD700]/[0.04] blur-[100px] rounded-full" />
      </div>

      {/* Elegant Header */}
      <div className="relative z-10 w-full pt-10 px-8 flex justify-center">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#0056D2] to-[#003F9F] flex items-center justify-center shadow-[0_4px_20px_rgba(0,86,210,0.2)]">
            <span className="text-white font-serif font-bold text-lg tracking-tight">P</span>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#FFD700] to-[#E6B800] border-2 border-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-serif font-bold text-slate-900 leading-none tracking-wide">
              Pannon Transfer
            </span>
            <span className="text-[9.5px] text-slate-400 mt-1 font-semibold tracking-[0.2em] uppercase">
              Diszpécser Központ
            </span>
          </div>
        </div>
      </div>

      {/* Centered Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          <AnimatePresence mode="wait">
            {state === "login" && (
              <motion.div
                key="card-login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <div className="absolute -inset-[1px] rounded-[24px] bg-gradient-to-br from-[#0056D2]/20 via-white to-[#FFD700]/30 blur-sm opacity-70" />
                <div className="relative rounded-[24px] bg-white border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,86,210,0.08)] p-8 sm:p-10">
                  <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="mb-10 text-center">
                      <h1 className="text-[32px] font-serif font-bold text-slate-900 tracking-tight mb-4">
                        Bejelentkezés
                      </h1>
                      <div className="w-10 h-0.5 rounded-full bg-gradient-to-r from-[#FFD700] to-[#E6B800] mx-auto mb-5" />
                      <p className="text-[13.5px] text-slate-500 font-medium px-4">
                        Kérjük, adja meg diszpécseri hozzáférését a rendszerhez.
                      </p>
                    </div>

                    <div className="space-y-5 mb-8">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1">
                          E-mail cím
                        </label>
                        <div
                          className={cn(
                            "relative flex items-center bg-slate-50/80 border transition-all duration-300 rounded-xl overflow-hidden",
                            error
                              ? "border-red-200 bg-red-50/50"
                              : "border-slate-200/60 focus-within:border-[#0056D2]/50 focus-within:bg-white focus-within:ring-[3px] focus-within:ring-[#0056D2]/10 hover:border-slate-300"
                          )}
                        >
                          <Mail
                            className={cn(
                              "absolute left-4 w-4 h-4 transition-colors",
                              error ? "text-red-400" : "text-[#0056D2]/60"
                            )}
                          />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (error) setError(null);
                            }}
                            placeholder="pelda@pannon.hu"
                            className="w-full bg-transparent pl-11 pr-4 py-3.5 text-[14.5px] text-slate-900 placeholder:text-slate-300 font-medium outline-none"
                            autoComplete="email"
                            spellCheck={false}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between ml-1 mr-1">
                          <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                            Jelszó
                          </label>
                        </div>
                        <div
                          className={cn(
                            "relative flex items-center bg-slate-50/80 border transition-all duration-300 rounded-xl overflow-hidden",
                            error
                              ? "border-red-200 bg-red-50/50"
                              : "border-slate-200/60 focus-within:border-[#0056D2]/50 focus-within:bg-white focus-within:ring-[3px] focus-within:ring-[#0056D2]/10 hover:border-slate-300"
                          )}
                        >
                          <Lock
                            className={cn(
                              "absolute left-4 w-4 h-4 transition-colors",
                              error ? "text-red-400" : "text-[#0056D2]/60"
                            )}
                          />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              if (error) setError(null);
                            }}
                            placeholder="••••••••"
                            className="w-full bg-transparent pl-11 pr-11 py-3.5 text-[14.5px] text-slate-900 placeholder:text-slate-300 font-medium outline-none tracking-widest"
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-2 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-[#0056D2] transition-colors rounded-lg"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="w-[15px] h-[15px]" />
                            ) : (
                              <Eye className="w-[15px] h-[15px]" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-8 px-1">
                      <div
                        className="flex items-center gap-2.5 cursor-pointer group"
                        onClick={() => setRemember((v) => !v)}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded flex items-center justify-center border transition-all duration-300",
                            remember
                              ? "bg-[#0056D2] border-[#0056D2] shadow-[0_2px_8px_rgba(0,86,210,0.3)]"
                              : "bg-white border-slate-300 group-hover:border-[#0056D2]/40"
                          )}
                        >
                          {remember && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                        <span className="text-[12.5px] text-slate-500 font-medium select-none group-hover:text-slate-800 transition-colors">
                          Emlékezzen rám
                        </span>
                      </div>
                      <a
                        href="mailto:dispecer@pannon.hu?subject=Jelsz%F3%20vissza%E1ll%EDt%E1s"
                        className="text-[12px] font-semibold text-[#0056D2] hover:text-[#003F9F] transition-colors"
                      >
                        Elfelejtette?
                      </a>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -4, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden mb-6"
                        >
                          <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100/50 rounded-xl">
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                            <p className="text-[12.5px] text-red-600 font-medium">{error}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative w-full h-[54px] rounded-xl bg-gradient-to-r from-[#0056D2] to-[#003F9F] text-white text-[14.5px] font-semibold shadow-[0_8px_20px_-6px_rgba(0,86,210,0.4)] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                      <span className="relative z-10 flex items-center gap-2">
                        {loading ? (
                          <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        ) : (
                          <>
                            Belépés
                            <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform duration-300" />
                          </>
                        )}
                      </span>
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {state === "done" && (
              <motion.div
                key="card-done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center p-10"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0056D2] to-[#003F9F] flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(0,86,210,0.3)]"
                >
                  <Check className="w-7 h-7 text-white" strokeWidth={2.5} />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-[24px] font-serif font-bold text-slate-900 mb-2"
                >
                  Hitelesítve
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="w-16 h-[2px] rounded-full bg-slate-100 mt-6 overflow-hidden"
                >
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    className="w-full h-full bg-[#FFD700]"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="relative z-10 w-full pb-8 px-8 flex justify-center text-[11.5px] text-slate-400 font-medium uppercase tracking-[0.05em]">
        <span>© {new Date().getFullYear()} Pannon Transfer Zrt.</span>
      </div>
    </div>
  );
}
