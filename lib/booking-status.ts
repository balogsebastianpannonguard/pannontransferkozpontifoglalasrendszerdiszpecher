export type BookingStatus = 'pending' | 'modified' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';

/**
 * Single source of truth for how each BookingStatus is labelled and colored
 * across the dashboard, bookings list, and booking detail page. "confirmed"
 * and "in-progress" intentionally share the same "Értesítve" label/color —
 * the dispatcher-facing status model only exposes 5 distinct statuses.
 *
 * This file has no server-only dependencies (no mongodb) so it can be
 * imported directly from client components.
 */
export const STATUS_DISPLAY: Record<
  BookingStatus,
  { label: string; chip: string; dot: string; gradient: string; shadow: string }
> = {
  pending: {
    label: "Beérkezett",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
    gradient: "from-rose-500 to-red-500",
    shadow: "shadow-rose-500/30",
  },
  modified: {
    label: "Módosított",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    gradient: "from-amber-500 to-yellow-500",
    shadow: "shadow-amber-500/30",
  },
  confirmed: {
    label: "Értesítve",
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    gradient: "from-blue-500 to-indigo-500",
    shadow: "shadow-blue-500/30",
  },
  "in-progress": {
    label: "Értesítve",
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    gradient: "from-blue-500 to-indigo-500",
    shadow: "shadow-blue-500/30",
  },
  completed: {
    label: "Befejezett",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    gradient: "from-emerald-500 to-teal-500",
    shadow: "shadow-emerald-500/30",
  },
  cancelled: {
    label: "Lemondott",
    chip: "bg-slate-200 text-slate-900 border-slate-400",
    dot: "bg-slate-900",
    gradient: "from-slate-900 to-black",
    shadow: "shadow-slate-900/30",
  },
};

export function getStatusDisplay(status: BookingStatus) {
  return STATUS_DISPLAY[status];
}
