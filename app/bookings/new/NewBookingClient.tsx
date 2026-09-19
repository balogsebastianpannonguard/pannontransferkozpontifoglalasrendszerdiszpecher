"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Plane,
  Save,
  UserRound,
  UsersRound,
} from "lucide-react";
import { getAllPartnerMeta } from "@/lib/partner-meta";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100";
const labelClass = "mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500";

export default function NewBookingClient() {
  const router = useRouter();
  const partnerOptions = getAllPartnerMeta();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    userEmail: "",
    travelerEmail: "",
    travelerName: "",
    travelerPhone: "",
    customerType: "individual",
    secondTravelerEmail: "",
    secondTravelerPhone: "",
    companyName: "",
    companyOption: "other",
    paymentMethod: "bank",
    transferType: "standard",
    fromType: "other",
    fromAddress: "",
    toType: "other",
    toAddress: "",
    flightNumber: "",
    pickupDate: "",
    pickupTime: "",
    travelers: "1",
    luggage: "0",
    category: "city",
    comment: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const { companyOption: _companyOption, ...bookingForm } = form;
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...bookingForm,
          travelers: Number(form.travelers),
          luggage: Number(form.luggage),
          userEmail: form.userEmail.trim() || form.travelerEmail.trim(),
          travelerEmail: form.travelerEmail.trim(),
          travelerName: form.travelerName.trim(),
          travelerPhone: form.travelerPhone.trim(),
          customerType: form.customerType,
          fromAddress: form.fromAddress.trim(),
          toAddress: form.toAddress.trim(),
          comment: form.comment.trim() || undefined,
          secondTravelerEmail: form.secondTravelerEmail.trim() || undefined,
          secondTravelerPhone: form.secondTravelerPhone.trim() || undefined,
          companyName: form.companyName.trim() || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.booking?._id) {
        throw new Error(data.error || "A foglalás mentése sikertelen.");
      }
      router.push(`/bookings/${data.booking._id}`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "A foglalás mentése sikertelen.");
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/bookings")}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-slate-900 hover:shadow-md"
              aria-label="Vissza a foglalásokhoz"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="text-xs font-bold text-slate-500">Diszpécser Központ / Foglalások</div>
              <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight">Új manuális foglalás</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700 sm:flex">
            <CheckCircle2 className="h-4 w-4" />
            Naptárba mentés automatikusan
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/[0.04] sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black">Utas adatai</h2>
                <p className="text-xs text-slate-500">Az e-mail címre később a visszaigazolás is kiküldhető.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Utas neve *</label>
                <input className={inputClass} required value={form.travelerName} onChange={(e) => update("travelerName", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Utas telefonszáma *</label>
                <input className={inputClass} required value={form.travelerPhone} onChange={(e) => update("travelerPhone", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Utas e-mail címe *</label>
                <input className={inputClass} required type="email" value={form.travelerEmail} onChange={(e) => update("travelerEmail", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Foglaló típusa *</label>
                <select
                  className={inputClass}
                  required
                  value={form.customerType}
                  onChange={(e) => {
                    const customerType = e.target.value;
                    update("customerType", customerType);
                    if (customerType === "individual") {
                      update("companyName", "");
                      update("companyOption", "other");
                    }
                  }}
                >
                  <option value="individual">Magánszemély</option>
                  <option value="company">Céges út</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Cég / partner {form.customerType === "company" ? "*" : ""}</label>
                <select
                  className={inputClass}
                  disabled={form.customerType === "individual"}
                  value={form.companyOption}
                  onChange={(e) => {
                    const option = e.target.value;
                    update("companyOption", option);
                    update("companyName", option === "other" ? "" : option);
                  }}
                >
                  <option value="other">Egyéb cég / kézi megadás</option>
                  {partnerOptions.map((partner) => (
                    <option key={partner.id} value={partner.name}>{partner.name}</option>
                  ))}
                </select>
                {form.customerType === "company" && form.companyOption === "other" && (
                  <input
                    className={`${inputClass} mt-2`}
                    required
                    value={form.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    placeholder="Cégnév kézi megadása"
                  />
                )}
              </div>
              <div>
                <label className={labelClass}>Kapcsolattartó e-mail, ha eltér</label>
                <input className={inputClass} type="email" value={form.userEmail} onChange={(e) => update("userEmail", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Második utas e-mailje</label>
                <input className={inputClass} type="email" value={form.secondTravelerEmail} onChange={(e) => update("secondTravelerEmail", e.target.value)} />
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/[0.04] sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/25">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black">Útvonal és időpont</h2>
                <p className="text-xs text-slate-500">Ezek az adatok kerülnek a naptárba és a fuvarlapra.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Felvételi dátum *</label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input className={`${inputClass} pl-10`} required type="date" value={form.pickupDate} onChange={(e) => update("pickupDate", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Felvételi időpont *</label>
                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input className={`${inputClass} pl-10`} required type="time" value={form.pickupTime} onChange={(e) => update("pickupTime", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Felvétel helye *</label>
                <input className={inputClass} required value={form.fromAddress} onChange={(e) => update("fromAddress", e.target.value)} placeholder="Cím, repülőtér vagy szálloda" />
              </div>
              <div>
                <label className={labelClass}>Érkezés helye *</label>
                <input className={inputClass} required value={form.toAddress} onChange={(e) => update("toAddress", e.target.value)} placeholder="Cím, repülőtér vagy szálloda" />
              </div>
              <div>
                <label className={labelClass}>Felvétel típusa</label>
                <select className={inputClass} value={form.fromType} onChange={(e) => update("fromType", e.target.value)}>
                  <option value="other">Cím / egyéb</option>
                  <option value="airport">Repülőtér</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Érkezés típusa</label>
                <select className={inputClass} value={form.toType} onChange={(e) => update("toType", e.target.value)}>
                  <option value="other">Cím / egyéb</option>
                  <option value="airport">Repülőtér</option>
                </select>
              </div>
              {form.toType === "airport" && (
                <div>
                  <label className={labelClass}>Járatszám *</label>
                  <div className="relative">
                    <Plane className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      className={`${inputClass} pl-10`}
                      required
                      value={form.flightNumber}
                      onChange={(e) => update("flightNumber", e.target.value.toUpperCase())}
                      placeholder="pl. LH1234"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/[0.04] sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-500/25">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black">Fuvar beállításai</h2>
                <p className="text-xs text-slate-500">A foglalás mentés után ugyanúgy kezelhető, mint bármelyik partneri rendelés.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className={labelClass}>Utasok száma *</label>
                <input className={inputClass} required min="1" type="number" value={form.travelers} onChange={(e) => update("travelers", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Csomagok száma *</label>
                <input className={inputClass} required min="0" type="number" value={form.luggage} onChange={(e) => update("luggage", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Transzfer típusa</label>
                <select className={inputClass} value={form.transferType} onChange={(e) => update("transferType", e.target.value)}>
                  <option value="standard">Standard</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Kategória</label>
                <select className={inputClass} value={form.category} onChange={(e) => update("category", e.target.value)}>
                  <option value="city">Városi</option>
                  <option value="airport">Repülőtéri</option>
                  <option value="long-distance">Távolsági</option>
                  <option value="vip">VIP</option>
                  <option value="partner">Partner</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Fizetési mód</label>
                <select className={inputClass} value={form.paymentMethod} onChange={(e) => update("paymentMethod", e.target.value)}>
                  <option value="bank">Átutalás</option>
                  <option value="card">Bankkártya</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={labelClass}>Megjegyzés</label>
                <textarea className={`${inputClass} min-h-24 resize-y`} value={form.comment} onChange={(e) => update("comment", e.target.value)} placeholder="E-mailben érkezett külön kérés, speciális információ..." />
              </div>
            </div>
          </section>

          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button type="button" onClick={() => router.push("/bookings")} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
              Mégse
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Foglalás mentése
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
