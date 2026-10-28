export type PartnerId =
  | "catl"
  | "ecoproinnovation"
  | "ecoprobm"
  | "schaefflermotion"
  | "schaefflerdebrecen"
  | "tama"
  | "ibusz"
  | "ni";

type PartnerAccent =
  | "blue"
  | "cyan"
  | "sky"
  | "rose"
  | "green"
  | "teal"
  | "indigo"
  | "lime"
  | "emerald";

export interface PartnerMeta {
  id: PartnerId;
  name: string;
  short: string;
  accent: PartnerAccent;
  gradient: string;
  portalPath: string;
}

const PARTNER_META: Record<PartnerId, PartnerMeta> = {
  catl: {
    id: "catl",
    name: "CATL",
    short: "CATL",
    accent: "blue",
    gradient: "from-blue-500 to-indigo-600 shadow-blue-500/25",
    portalPath: "/catl",
  },
  ecoproinnovation: {
    id: "ecoproinnovation",
    name: "Ecopro Innovation",
    short: "Ecopro Innovation",
    accent: "cyan",
    gradient: "from-cyan-500 to-sky-600 shadow-cyan-500/25",
    portalPath: "/ecoproinnovation",
  },
  ecoprobm: {
    id: "ecoprobm",
    name: "Ecopro BM",
    short: "Ecopro BM",
    accent: "sky",
    gradient: "from-sky-500 to-blue-600 shadow-sky-500/25",
    portalPath: "/ecoprobm",
  },
  schaefflermotion: {
    id: "schaefflermotion",
    name: "Schaeffler Motion",
    short: "Schaeffler Motion",
    accent: "green",
    gradient: "from-green-500 to-emerald-600 shadow-green-500/25",
    portalPath: "/schaefflermotion",
  },
  schaefflerdebrecen: {
    id: "schaefflerdebrecen",
    name: "Schaeffler Debrecen",
    short: "Schaeffler Debrecen",
    accent: "teal",
    gradient: "from-teal-500 to-cyan-600 shadow-teal-500/25",
    portalPath: "/schaefflerdebrecen",
  },
  tama: {
    id: "tama",
    name: "TAMA Hungary Kft.",
    short: "TAMA",
    accent: "lime",
    gradient: "from-lime-500 to-green-600 shadow-lime-500/25",
    portalPath: "/tama",
  },
  ibusz: {
    id: "ibusz",
    name: "IBUSZ Hungary Kft.",
    short: "IBUSZ",
    accent: "rose",
    gradient: "from-rose-500 to-red-600 shadow-rose-500/25",
    portalPath: "/ibusz",
  },
  ni: {
    id: "ni",
    name: "National Instruments",
    short: "NI",
    accent: "emerald",
    gradient: "from-emerald-400 to-green-600 shadow-emerald-500/25",
    portalPath: "/ni",
  },
};

/** Régi (egy portálos) azonosítók - a korábbi foglalások továbbra is egy céghez tartozzanak. */
const LEGACY_PORTAL_IDS: Record<string, PartnerId> = {
  ecopro: "ecoprobm",
  schaeffler: "schaefflerdebrecen",
};

export function getAllPartnerMeta(): PartnerMeta[] {
  return Object.values(PARTNER_META);
}

export function getPartnerMetaById(id?: string | null): PartnerMeta | null {
  if (!id) return null;
  const key = String(id).toLowerCase();
  return PARTNER_META[key as PartnerId] || PARTNER_META[LEGACY_PORTAL_IDS[key]] || null;
}

export function resolvePartnerMeta(input: {
  portal?: string | null;
  companyName?: string | null;
  travelerEmail?: string | null;
  userEmail?: string | null;
}): PartnerMeta | null {
  const companyName = String(input.companyName || "").toUpperCase();
  const travelerEmail = String(input.travelerEmail || "").toUpperCase();
  const userEmail = String(input.userEmail || "").toUpperCase();
  const portal = String(input.portal || "").toLowerCase();

  const inAny = (keyword: string) =>
    companyName.includes(keyword) ||
    travelerEmail.includes(keyword) ||
    userEmail.includes(keyword);

  const refine = (id: PartnerId | null): PartnerMeta | null => {
    if (id === "ecoprobm" || id === "ecoproinnovation") {
      return PARTNER_META[inAny("INNOVATION") ? "ecoproinnovation" : "ecoprobm"];
    }
    if (id === "schaefflerdebrecen" || id === "schaefflermotion") {
      return PARTNER_META[inAny("MOTION") ? "schaefflermotion" : "schaefflerdebrecen"];
    }
    return id ? PARTNER_META[id] : null;
  };

  const direct = getPartnerMetaById(portal);
  if (direct) return refine(direct.id);

  if (inAny("CATL") || companyName.includes("宁德时代")) return PARTNER_META.catl;
  if (inAny("ECOPRO") || inAny("ECO PRO")) return refine("ecoprobm");
  if (inAny("SCHAEFFLER")) return refine("schaefflerdebrecen");
  if (inAny("IBUSZ")) return PARTNER_META.ibusz;
  if (inAny("TAMA")) return PARTNER_META.tama;
  if (
    companyName.includes("NATIONAL INSTRUMENTS") ||
    /\bNI\b/.test(companyName) ||
    /\bNI\b/.test(travelerEmail) ||
    /\bNI\b/.test(userEmail)
  ) {
    return PARTNER_META.ni;
  }

  return null;
}

export function getPartnerColorClasses(accent: PartnerAccent) {
  switch (accent) {
    case "blue":
      return {
        bg: "bg-blue-100",
        text: "text-blue-700",
        border: "border-blue-300",
        ring: "ring-blue-200",
        dot: "bg-blue-600",
        soft: "bg-blue-50",
      };
    case "cyan":
      return {
        bg: "bg-cyan-100",
        text: "text-cyan-700",
        border: "border-cyan-300",
        ring: "ring-cyan-200",
        dot: "bg-cyan-600",
        soft: "bg-cyan-50",
      };
    case "sky":
      return {
        bg: "bg-sky-100",
        text: "text-sky-700",
        border: "border-sky-300",
        ring: "ring-sky-200",
        dot: "bg-sky-600",
        soft: "bg-sky-50",
      };
    case "rose":
      return {
        bg: "bg-rose-100",
        text: "text-rose-700",
        border: "border-rose-300",
        ring: "ring-rose-200",
        dot: "bg-rose-600",
        soft: "bg-rose-50",
      };
    case "green":
      return {
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-300",
        ring: "ring-green-200",
        dot: "bg-green-600",
        soft: "bg-green-50",
      };
    case "teal":
      return {
        bg: "bg-teal-100",
        text: "text-teal-700",
        border: "border-teal-300",
        ring: "ring-teal-200",
        dot: "bg-teal-600",
        soft: "bg-teal-50",
      };
    case "indigo":
      return {
        bg: "bg-indigo-100",
        text: "text-indigo-700",
        border: "border-indigo-300",
        ring: "ring-indigo-200",
        dot: "bg-indigo-600",
        soft: "bg-indigo-50",
      };
    case "lime":
      return {
        bg: "bg-lime-100",
        text: "text-lime-700",
        border: "border-lime-300",
        ring: "ring-lime-200",
        dot: "bg-lime-600",
        soft: "bg-lime-50",
      };
    case "emerald":
      return {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        border: "border-emerald-300",
        ring: "ring-emerald-200",
        dot: "bg-emerald-600",
        soft: "bg-emerald-50",
      };
  }
}
