export type PartnerId =
  | "catl"
  | "ecopro"
  | "eccoino"
  | "vitesco"
  | "schaeffler"
  | "krones"
  | "enterair"
  | "tama"
  | "ni";

type PartnerAccent =
  | "blue"
  | "cyan"
  | "sky"
  | "rose"
  | "green"
  | "indigo"
  | "lime"
  | "yellow";

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
    name: "CATL Hungary Kft.",
    short: "CATL",
    accent: "blue",
    gradient: "from-blue-500 to-indigo-600 shadow-blue-500/25",
    portalPath: "/catl",
  },
  ecopro: {
    id: "ecopro",
    name: "EcoPro BM Hungary",
    short: "EcoPro",
    accent: "cyan",
    gradient: "from-cyan-500 to-sky-600 shadow-cyan-500/25",
    portalPath: "/ecopro",
  },
  eccoino: {
    id: "eccoino",
    name: "Eccoino",
    short: "Eccoino",
    accent: "sky",
    gradient: "from-sky-500 to-blue-600 shadow-sky-500/25",
    portalPath: "/eccoino",
  },
  vitesco: {
    id: "vitesco",
    name: "Vitesco Technologies",
    short: "Vitesco",
    accent: "rose",
    gradient: "from-rose-500 to-red-600 shadow-rose-500/25",
    portalPath: "/vitesco",
  },
  schaeffler: {
    id: "schaeffler",
    name: "Schaeffler",
    short: "Schaeffler",
    accent: "green",
    gradient: "from-green-500 to-emerald-600 shadow-green-500/25",
    portalPath: "/schaeffler",
  },
  krones: {
    id: "krones",
    name: "Krones AG",
    short: "Krones",
    accent: "indigo",
    gradient: "from-indigo-500 to-blue-700 shadow-indigo-500/25",
    portalPath: "/krones",
  },
  enterair: {
    id: "enterair",
    name: "Enter Air",
    short: "Enter Air",
    accent: "sky",
    gradient: "from-sky-500 to-cyan-600 shadow-sky-500/25",
    portalPath: "/enterair",
  },
  tama: {
    id: "tama",
    name: "Tama",
    short: "Tama",
    accent: "lime",
    gradient: "from-lime-500 to-green-600 shadow-lime-500/25",
    portalPath: "/tama",
  },
  ni: {
    id: "ni",
    name: "National Instruments",
    short: "NI",
    accent: "yellow",
    gradient: "from-yellow-400 to-amber-500 shadow-yellow-500/25",
    portalPath: "/ni",
  },
};

export function getAllPartnerMeta(): PartnerMeta[] {
  return Object.values(PARTNER_META);
}

export function getPartnerMetaById(id?: string | null): PartnerMeta | null {
  if (!id) return null;
  return PARTNER_META[id as PartnerId] || null;
}

export function resolvePartnerMeta(input: {
  portal?: string | null;
  companyName?: string | null;
  travelerEmail?: string | null;
  userEmail?: string | null;
}): PartnerMeta | null {
  const direct = getPartnerMetaById(input.portal);
  if (direct) return direct;

  const companyName = String(input.companyName || "").toUpperCase();
  const travelerEmail = String(input.travelerEmail || "").toUpperCase();
  const userEmail = String(input.userEmail || "").toUpperCase();

  const inAny = (keyword: string) =>
    companyName.includes(keyword) ||
    travelerEmail.includes(keyword) ||
    userEmail.includes(keyword);

  if (inAny("CATL") || companyName.includes("宁德时代")) return PARTNER_META.catl;
  if (inAny("ECOPRO") || inAny("ECO PRO")) return PARTNER_META.ecopro;
  if (inAny("ECCOINO")) return PARTNER_META.eccoino;
  if (inAny("VITESCO")) return PARTNER_META.vitesco;
  if (inAny("SCHAEFFLER")) return PARTNER_META.schaeffler;
  if (inAny("KRONES")) return PARTNER_META.krones;
  if (inAny("ENTER AIR") || inAny("ENTERAIR")) return PARTNER_META.enterair;
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
    case "yellow":
      return {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        border: "border-yellow-300",
        ring: "ring-yellow-200",
        dot: "bg-yellow-600",
        soft: "bg-yellow-50",
      };
  }
}
