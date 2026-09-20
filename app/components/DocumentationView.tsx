"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Bug,
  Calendar,
  CarFront,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  ListChecks,
  MapPin,
  Search,
  Settings,
  ShieldAlert,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

type DocumentationStep = {
  title: string;
  details: string[];
};

type DocumentationSection = {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  keywords: string[];
  canDo: string[];
  whenToUse: string[];
  tips: string[];
  warnings?: string[];
  related: string[];
  icon: LucideIcon;
  accent: string;
  steps: DocumentationStep[];
};

type Workflow = {
  title: string;
  objective: string;
  relatedMenu: string;
  steps: string[];
};

type FaqEntry = {
  question: string;
  answer: string;
};

type ContentTab = "all" | "menus" | "workflows" | "faq";

const QUICK_SEARCHES = [
  "új foglalás",
  "módosítás",
  "sofőr kiosztás",
  "ár jóváhagyás",
  "hibabejelentés",
  "vip",
  "státusz",
];

const DOCUMENTATION_SECTIONS: DocumentationSection[] = [
  {
    id: "dashboard",
    title: "Irányítópult",
    subtitle: "A napi operáció központi áttekintése",
    summary:
      "Az Irányítópult az első oldal, amit belépés után látsz. Ez arra való, hogy néhány másodperc alatt megértsd, milyen nap elé néz a műszak: mennyi aktív fuvar van, hol vannak függő tételek, érkezett-e partneri módosítás, és melyik foglalást kell azonnal kézbe venni.",
    keywords: ["dashboard", "áttekintés", "statisztika", "napi fuvar", "függőben", "prioritás"],
    canDo: [
      "Egy helyen át tudod nézni a napi terhelést és a sürgős ügyeket.",
      "Azonnal látod, mennyi új, függőben lévő vagy módosított foglalás van.",
      "Gyorsabban tudod eldönteni, melyik menüpontra kell továbblépned.",
    ],
    whenToUse: [
      "Műszakkezdéskor, hogy lásd a teljes napi helyzetet.",
      "Amikor több partneri rendelés érkezett, és priorizálni kell.",
      "Mielőtt sofőrt vagy járművet osztasz ki, hogy lásd a teljes terhelést.",
    ],
    tips: [
      "Ha bármelyik szám feltűnően magas, mindig menj tovább a részletes nézetbe, ne a dashboard alapján dönts véglegesen.",
      "A piros vagy narancs figyelmeztető elemeket kezeld elsőként, mert ezek jellemzően működési kockázatot jeleznek.",
      "A dashboard gyors áttekintésre való, nem helyettesíti a részletes foglalási ellenőrzést.",
    ],
    warnings: [
      "A statisztika önmagában nem bizonyítja, hogy a foglalás adatminősége rendben van. A kritikus utakat mindig nyisd meg részletesen is.",
    ],
    related: ["Foglalások", "Értesítések", "Naptár & Menetrend"],
    icon: Activity,
    accent: "from-blue-500 to-indigo-600",
    steps: [
      {
        title: "Műszakkezdés ellenőrző kör",
        details: [
          "Nézd meg, van-e kiugróan magas függőben lévő foglalásszám.",
          "Ellenőrizd, érkezett-e új értesítés vagy partneri módosítás.",
          "Ha igen, előbb a módosított vagy határidős foglalásokkal foglalkozz, és csak utána a kényelmesen ráérőkkel.",
        ],
      },
      {
        title: "Prioritások kijelölése",
        details: [
          "Az aznapi és következő néhány órán belüli indulásokat mindig emeld előre a sorban.",
          "Ha ugyanarra az időintervallumra több VIP vagy partneri út esik, ellenőrizd a jármű- és sofőrfedezetet is.",
          "Ha bizonytalan vagy a sorrendben, a partneri módosítások és a még vissza nem igazolt utak élvezzenek elsőbbséget.",
        ],
      },
    ],
  },
  {
    id: "calendar",
    title: "Naptár & Menetrend",
    subtitle: "Időalapú tervezés, terhelés és ütközések áttekintése",
    summary:
      "A Naptár & Menetrend nézet arra való, hogy vizuálisan lásd az egyes napok és időszakok terheltségét. Ez a felület különösen fontos akkor, amikor nem egyetlen foglalást, hanem teljes napi vagy heti kapacitást kell fejben tartani.",
    keywords: ["naptár", "menetrend", "kapacitás", "ütközés", "havi nézet", "mai nap", "időpont"],
    canDo: [
      "Meg tudod nézni, melyik nap túlterhelt vagy éppen szabadabb.",
      "Azonnal észreveszed az időben közel eső, potenciálisan ütköző fuvarokat.",
      "Vizuálisan követhetővé válik a VIP, partneri vagy távolsági utak eloszlása.",
    ],
    whenToUse: [
      "Amikor időpontmódosítást kér a partner vagy az utas.",
      "Amikor meg kell nézni, maradt-e még kiosztható kapacitás adott napra.",
      "Amikor előre akarod látni, hogy egy következő nap operatívan mennyire lesz nehéz.",
    ],
    tips: [
      "A 'Ma' gombbal mindig térj vissza az aktuális napra, ha hosszabb böngészés után elvesztetted a fókuszt.",
      "Ha egy napon sok foglalás koncentrálódik, ellenőrizd külön a sofőröket és a járműveket is.",
      "A naptár kiváló előszűrő, de a végső döntéseket mindig a foglalási részletekkel együtt hozd meg.",
    ],
    warnings: [
      "A naptár nézetben egy időpontra sűrűsödő foglalás még nem jelenti automatikusan, hogy megoldható ugyanazzal az erőforrással. Utazási időkkel és pufferekkel is számolj.",
    ],
    related: ["Foglalások", "Járművek", "Sofőrök"],
    icon: Calendar,
    accent: "from-violet-500 to-fuchsia-600",
    steps: [
      {
        title: "Hónapok közötti navigáció",
        details: [
          "A felső nyilakkal válthatsz a megelőző és következő hónapok között.",
          "A 'Ma' gomb a jelenlegi dátumra visz vissza, ami különösen hasznos hosszabb tervezés után.",
          "Érdemes minden műszak elején végignézni az aktuális és a következő napot is.",
        ],
      },
      {
        title: "Foglalás megnyitása a naptárból",
        details: [
          "Ha egy kártyára vagy eseményre kattintasz, a rendszer a részletes foglalási adatokhoz visz.",
          "Itt ellenőrizni tudod az utast, az útvonalat, a létszámot, a megjegyzést és a kiosztott erőforrásokat.",
          "Módosítás előtt mindig nézd meg, hogy a változás más már kiosztott fuvarokat nem borít-e fel.",
        ],
      },
      {
        title: "Torlódás kezelése",
        details: [
          "Ha több indulás esik rövid időablakba, bontsd szét a napot partner, kategória vagy prioritás szerint.",
          "Először a repülőtéri és a VIP utakat biztosítsd be, utána a kevésbé időkritikus transzfereket.",
          "Szükség esetén jelezd a kapacitásigényt az üzemeltetés vagy az alvállalkozói oldal felé.",
        ],
      },
    ],
  },
  {
    id: "bookings",
    title: "Foglalások",
    subtitle: "Minden rendelés részletes kezelése egy helyen",
    summary:
      "A Foglalások a diszpécseri munka legfontosabb menüpontja. Itt jelenik meg minden új, módosított, megerősített, folyamatban lévő vagy lezárt rendelés. Ez a felület arra való, hogy a beérkező igényt ellenőrizd, feldolgozd, kioszd és végigkövesd.",
    keywords: [
      "foglalás",
      "új foglalás",
      "módosított foglalás",
      "megerősítés",
      "lemondás",
      "státusz",
      "utas",
      "járatszám",
      "ár jóváhagyás",
    ],
    canDo: [
      "Új foglalást ellenőrizhetsz és visszaigazolhatsz.",
      "Hozzárendelhetsz sofőrt és járművet.",
      "Nyomon követheted a státuszváltozásokat a létrehozástól a teljesítésig.",
      "Kereshetsz név, foglalási kód, partner vagy egyéb adat alapján.",
    ],
    whenToUse: [
      "Minden olyan esetben, amikor konkrét foglalást kell kezelni.",
      "Ha partneri módosítás után ellenőrizni akarod, minden adat konzisztens-e.",
      "Ha valaki telefonon érdeklődik egy rendelés állapotáról.",
    ],
    tips: [
      "A keresősávot használd bátran névre, kódra, cégre vagy akár emailre is.",
      "A státuszszűrések segítenek abban, hogy ne fulladjon rád az összes foglalás egyszerre.",
      "A megjegyzés mezőt ne hagyd figyelmen kívül, mert gyakran ide kerülnek az operatív csapdák.",
    ],
    warnings: [
      "A módosított foglalást ne tekintsd automatikusan kezelve csak azért, mert látszik a rendszerben. Ellenőrizni kell, hogy a kiosztott sofőr és jármű még mindig megfelelő-e.",
      "Lemondás után mindig győződj meg róla, hogy a felszabadult kapacitás ténylegesen újra felhasználható.",
    ],
    related: ["Értesítések", "Járművek", "Sofőrök", "Ügyfelek"],
    icon: ListChecks,
    accent: "from-emerald-500 to-teal-600",
    steps: [
      {
        title: "Új foglalás feldolgozása",
        details: [
          "Nyisd meg a foglalást, és ellenőrizd a felvételi és lerakási címet, a dátumot, az időt, az utasszámot és a csomagadatokat.",
          "Nézd meg, hogy a foglalás repülőtéri, városi, távolsági, VIP vagy partneri kategóriába esik-e.",
          "Ha minden rendben van, rendelj hozzá megfelelő járművet és sofőrt, majd állítsd a státuszt a megfelelő következő fázisba.",
        ],
      },
      {
        title: "Módosított foglalás ellenőrzése",
        details: [
          "Hasonlítsd össze, mi változott: időpont, cím, létszám, járatinformáció vagy megjegyzés.",
          "Vizsgáld meg, hogy a változás hatással van-e a járműkategóriára vagy a sofőr beosztására.",
          "Ha igen, végezd el a szükséges átszervezést, és csak utána tekintsd lezártnak a módosítás feldolgozását.",
        ],
      },
      {
        title: "Ár jóváhagyást igénylő utak kezelése",
        details: [
          "Bizonyos partnereknél a rendszer külön jelzi, ha díjmegadás vagy árjóváhagyás szükséges.",
          "Ilyenkor ellenőrizd az út paramétereit, majd rögzítsd vagy hagyd jóvá az árat a partneri elvárásnak megfelelően.",
          "A jóváhagyásra váró árakat mindig kezeld gyorsan, mert ezek blokkolhatják a további visszaigazolást.",
        ],
      },
    ],
  },
  {
    id: "notifications",
    title: "Értesítések",
    subtitle: "Új események, partneri módosítások és operatív figyelmeztetések",
    summary:
      "Az Értesítések menüpont nem dísznek van. Ez a felület mondja meg, mikor történt valami új a rendszerben: új foglalás, partneri módosítás, sofőri visszajelzés vagy egyéb foglalási esemény. Ha ezt nem figyeled, könnyű lemaradni kritikus változásokról.",
    keywords: ["értesítés", "partneri módosítás", "új esemény", "olvasatlan", "riasztás", "változás"],
    canDo: [
      "Megnézheted, milyen új vagy módosított esemény érkezett.",
      "Egy kattintással megnyithatod a kapcsolódó foglalást.",
      "Nyugtázhatod, hogy az adott értesítést már feldolgoztad.",
    ],
    whenToUse: [
      "Belépés után rögtön, majd a műszak során folyamatosan.",
      "Ha partneri módosítás vagy új rendelés érkezik.",
      "Ha úgy érzed, valami nem stimmel egy foglalás körül, és vissza akarod nézni az eseménysort.",
    ],
    tips: [
      "Az olvasatlan partneri módosításokat mindig magas prioritáson kezeld.",
      "Ha megnyitod az értesítésből a foglalást, utána térj vissza és ellenőrizd, hogy tényleg feldolgozottnak jelölted-e.",
      "Az értesítések jó eszközt adnak arra, hogy ne kelljen fejben tartani minden mozgást.",
    ],
    warnings: [
      "Az, hogy egy módosítás beérkezett, még nem jelenti, hogy operatívan is végrehajtódott. A sofőr kiosztása, a jármű és az időzítés ellenőrzése külön lépés.",
    ],
    related: ["Foglalások", "Irányítópult"],
    icon: Bell,
    accent: "from-amber-400 to-orange-500",
    steps: [
      {
        title: "Új értesítés kezelése",
        details: [
          "Olvasd el pontosan, mi történt: új rendelés jött be, egy meglévő módosult, vagy státusz esemény keletkezett.",
          "Nyisd meg a kapcsolódó foglalást, és ellenőrizd a tényleges következményét.",
          "Csak akkor tekintsd lezártnak az értesítést, ha a foglalás operatív oldala is rendben van.",
        ],
      },
      {
        title: "Partneri módosítás validálása",
        details: [
          "Különösen figyelj a cím, időpont, utasszám és megjegyzés változásaira.",
          "Ha az új paraméter más járműkategóriát vagy sofőrt igényel, azonnal rendezd át a kiosztást.",
          "A kritikus változásokat ne hagyd későbbre, mert hamar láncreakciót okozhatnak a napi menetrendben.",
        ],
      },
    ],
  },
  {
    id: "error-reports",
    title: "Hibabejelentés",
    subtitle: "Belső IT és rendszerjellegű problémajelzés",
    summary:
      "A Hibabejelentés fül arra való, hogy a rendszerben észlelt technikai hibákat, hiányzó működéseket vagy gyanús anomáliákat strukturáltan továbbítsd az IT vagy fejlesztői oldal felé. Minél pontosabban írsz le egy problémát, annál gyorsabban oldható meg.",
    keywords: ["hiba", "bug", "bejelentés", "support", "it", "anomália", "nem működik"],
    canDo: [
      "Új hibajegyet adhatsz fel részletes leírással.",
      "Visszanézheted a saját korábbi hibajegyeidet.",
      "Nyomon követheted, hogy a hiba nyitott, folyamatban lévő vagy megoldott állapotban van-e.",
    ],
    whenToUse: [
      "Ha a rendszer nem ment, hibás adatot mutat, vagy rossz helyre navigál.",
      "Ha egy partner vagy diszpécser nem tud elvégezni egy műveletet.",
      "Ha egy folyamat csak részben működik, vagy gyanúsan inkonzisztens eredményt ad.",
    ],
    tips: [
      "Mindig írd bele a foglalási kódot, ha a hiba konkrét rendeléshez kapcsolódik.",
      "Írd le, mit szerettél volna csinálni, mi történt helyette, és ezt mikor tapasztaltad.",
      "Ha ugyanaz a hiba több partnernél is előjött, azt külön emeld ki.",
    ],
    warnings: [
      "Az olyan hibajegy, hogy 'nem jó' vagy 'nem működik', önmagában kevés. A részletek nélkül a javítás lassul.",
    ],
    related: ["Foglalások", "Értesítések", "Beállítások"],
    icon: Bug,
    accent: "from-rose-500 to-red-600",
    steps: [
      {
        title: "Jó hibajegy feladása",
        details: [
          "Írd le röviden a problémát egyértelmű címmel.",
          "Rögzítsd a lépéseket: melyik menüpontban voltál, mire kattintottál, és mi történt.",
          "Ha van hibaüzenet, annak pontos szövegét másold be, ne csak körülírd.",
        ],
      },
      {
        title: "Sürgős hiba kezelése",
        details: [
          "Ha operációs leállást okoz, jelezd kritikus hibaként.",
          "Ilyenkor külön írd le, hogy hány foglalást vagy melyik partnert érinti.",
          "A kritikus problémákat a napi működés védelme miatt mindig soron kívül kell kezelni.",
        ],
      },
    ],
  },
  {
    id: "vehicles",
    title: "Járművek",
    subtitle: "Flotta, kapacitás és rendelkezésre állás kezelése",
    summary:
      "A Járművek menüpont alatt tartod kézben a teljes flottát. Itt látszik, melyik autó aktív, milyen kategóriába tartozik, mennyi utast és csomagot tud elvinni, illetve bevethető-e az adott időszakban.",
    keywords: ["jármű", "autó", "flotta", "rendszám", "kapacitás", "vip autó", "inaktív"],
    canDo: [
      "Új járművet rögzíthetsz vagy meglévőt módosíthatsz.",
      "Kategóriát, utas- és csomagkapacitást tudsz kezelni.",
      "Láthatod, hogy egy autó ideiglenesen kint van-e a forgalomból.",
    ],
    whenToUse: [
      "Sofőr- vagy járműkiosztás előtt.",
      "Ha az utasszám vagy csomagmennyiség megváltozik.",
      "Ha szerviz, kiesés vagy cserejármű miatt át kell szervezni a napot.",
    ],
    tips: [
      "A jármű kiválasztásánál ne csak a férőhelyet nézd, hanem a partner vagy az utas szintjét is.",
      "VIP vagy executive igény esetén ne standard járműben gondolkodj, még ha papíron el is férnének.",
      "A kapacitáshiányt könnyebb korán felismerni, mint az utolsó pillanatban menteni.",
    ],
    warnings: [
      "Ne hagyj aktív státuszban olyan járművet, ami ténylegesen nem küldhető ki. Ez hibás kiosztásokhoz vezethet.",
    ],
    related: ["Foglalások", "Sofőrök", "Naptár & Menetrend"],
    icon: CarFront,
    accent: "from-cyan-500 to-blue-600",
    steps: [
      {
        title: "Jármű kiválasztása foglaláshoz",
        details: [
          "Nézd meg az utasszámot, a csomagok számát, az út típusát és a partneri elvárást.",
          "Válassz olyan járművet, amely nem csak elég nagy, hanem minőségben is megfelelő a foglaláshoz.",
          "Ha bizonytalan vagy, inkább konzervatívabban tervezz, mintsem alulméretezd a kapacitást.",
        ],
      },
      {
        title: "Kieső jármű kezelése",
        details: [
          "Ha egy autó kiesik, állítsd a státuszát úgy, hogy más diszpécser se ossza ki véletlenül.",
          "Nézd át, mely jövőbeli foglalásokat érinti a kiesés.",
          "A kritikus utakat előbb mentsd meg másik autóval, és csak utána takarítsd a kevésbé sürgős tételeket.",
        ],
      },
    ],
  },
  {
    id: "drivers",
    title: "Sofőrök",
    subtitle: "Munkatársak, elérhetőségek és kioszthatóság kezelése",
    summary:
      "A Sofőrök menüpont alatt az összes bevethető munkatársat kezeled. Ez a felület nem csak telefonszámok tárolására jó, hanem arra is, hogy lásd, kit lehet kiosztani, ki milyen fuvarokra alkalmas, és melyik kolléga igényel külön figyelmet.",
    keywords: ["sofőr", "munkatárs", "kiosztás", "elérhetőség", "nyelvtudás", "aktív"],
    canDo: [
      "Új sofőrt rögzíthetsz vagy meglévőt módosíthatsz.",
      "Kezelheted az aktív státuszt és az elérhetőségeket.",
      "A kiosztásnál figyelembe veheted a nyelvtudást vagy speciális alkalmasságot.",
    ],
    whenToUse: [
      "Minden olyan esetben, amikor emberi erőforrást rendelsz út mellé.",
      "Ha VIP vagy idegen nyelvet igénylő utas érkezik.",
      "Ha betegség, csúszás vagy kapacitáshiány miatt át kell szervezni a beosztást.",
    ],
    tips: [
      "A telefonos elérhetőségeket tartsd naprakészen, mert ez a napi mentések egyik legfontosabb eszköze.",
      "VIP vagy külföldi ügyfél esetén gondolkodj előre a kommunikációs kockázatokban is.",
      "Ne csak azt nézd, ki szabad, hanem azt is, ki a legjobb választás az adott fuvarra.",
    ],
    warnings: [
      "A 'szabad' sofőr nem mindig jelent operatívan biztonságos választást, ha például előző fuvarból érkezik vagy a földrajzi helyzete nem megfelelő.",
    ],
    related: ["Foglalások", "Járművek", "Naptár & Menetrend"],
    icon: Users,
    accent: "from-indigo-500 to-purple-600",
    steps: [
      {
        title: "Sofőr kiosztása",
        details: [
          "Ellenőrizd, hogy a kolléga aktív-e, elérhető-e, és megfelelő-e az adott fuvarhoz.",
          "Vedd figyelembe a nyelvtudást, a partner érzékenységét és a várható út komplexitását is.",
          "Kiosztás után ellenőrizd, hogy a kapcsolódó foglalásban ténylegesen megjelent-e a sofőr neve.",
        ],
      },
      {
        title: "Átszervezés késés vagy kiesés esetén",
        details: [
          "Ha a sofőr kiesik vagy csúszik, előbb az időkritikus fuvarokat védd meg.",
          "Nézd meg, melyik kolléga tud a legkisebb láncreakcióval beugrani.",
          "Az átszervezés után értesíts minden releváns oldalt, hogy ne maradjon régi információ a rendszerben.",
        ],
      },
    ],
  },
  {
    id: "clients",
    title: "Ügyfelek",
    subtitle: "Partnercégek, szerződéses logika és külön elvárások",
    summary:
      "Az Ügyfelek menüpont a partneri oldal diszpécseri nézőpontja. Itt látszanak a vállalati ügyfelek, a visszatérő partnerek, és azok a sajátosságok, amelyek a napi feldolgozáskor számítanak. Ez a nézet segít abban, hogy ne ugyanolyan módon kezeld az összes céget, ha a működésük eltér.",
    keywords: ["ügyfél", "partner", "cég", "ni", "catl", "schaeffler", "ár", "partneri igény"],
    canDo: [
      "Átláthatod, mely foglalások mely partnerhez tartoznak.",
      "Kezelheted a partnerenként eltérő működési vagy árazási igényeket.",
      "Könnyebben vissza tudod követni, hogy egy adott cégnél mi számít érzékeny pontnak.",
    ],
    whenToUse: [
      "Ha egy partneri foglalásnál bizonytalan vagy az eljárásban.",
      "Ha eltérő árazás, jóváhagyás vagy működési szabály érvényes.",
      "Ha az ügyféloldali kommunikáció vagy prioritás miatt extra figyelem szükséges.",
    ],
    tips: [
      "A partner nevét mindig nézd meg, mielőtt szabványos döntést hozol, mert lehet egyedi logika a háttérben.",
      "Az árjóváhagyást igénylő partnereknél soha ne hagyd a döntést a nap végére.",
      "Érdemes megjegyezni, mely partnerek küldenek gyakran módosított vagy rövid határidejű utakat.",
    ],
    warnings: [
      "Partneri foglalásnál a hibás vagy elmaradt jóváhagyás nem csak egy fuvar problémája lehet, hanem számlázási és kapcsolatkezelési kockázat is.",
    ],
    related: ["Foglalások", "Értesítések", "Jelentések"],
    icon: Users,
    accent: "from-sky-500 to-indigo-600",
    steps: [
      {
        title: "Partneri foglalás ellenőrzése",
        details: [
          "Azonosítsd a céget és nézd meg, van-e speciális operatív vagy pénzügyi elvárás.",
          "Ellenőrizd, kell-e ármegadás vagy külön jóváhagyási lépés.",
          "Ha a partner érzékeny a válaszidőre, kezeld gyorsított prioritással.",
        ],
      },
      {
        title: "Eltérő igények kezelése",
        details: [
          "Bizonyos cégeknél fontos lehet a formálisabb kezelés, gyorsabb jóváhagyás vagy speciális járműszint.",
          "Mindig a partneri keretek között dönts, ne általános rutinból.",
          "Ha egyedi helyzetet látsz, dokumentáld megjegyzésben vagy jelezd a csapat felé.",
        ],
      },
    ],
  },
  {
    id: "routes",
    title: "Útvonalak",
    subtitle: "Mentett relációk és ismétlődő útminták",
    summary:
      "Az Útvonalak menüpont jelenleg zárt vagy előkészített állapotban lehet, de a szerepe egyértelmű: a visszatérő címkapcsolatok, tipikus relációk és standard menetminták egységes kezelése. Ha ez a modul teljesen megnyílik, jelentősen gyorsítja majd az ismétlődő utak feldolgozását.",
    keywords: ["útvonal", "reláció", "mentett cím", "ismétlődő út", "route"],
    canDo: [
      "A jövőben gyorsabban kezelhetők vele a visszatérő viszonylatok.",
      "Egységesíthetők lesznek a gyakori indulási és érkezési pontok.",
      "Csökkenthető a kézi címbeviteli hibák száma.",
    ],
    whenToUse: [
      "Ha ugyanaz a partner vagy utas gyakran ugyanoda utazik.",
      "Ha visszatérő útvonalaknál akarsz gyorsítani a feldolgozáson.",
      "Ha szabványos relációk mentésére lesz szükség a későbbi működésben.",
    ],
    tips: [
      "Amíg a modul nem aktív, a visszatérő relációkat a foglalási adatokból és a csapat rutinjából kell követni.",
      "Ha később megnyílik, érdemes lesz elsőként a leggyakoribb partneri útvonalakat rendbe tenni benne.",
    ],
    related: ["Foglalások", "Naptár & Menetrend"],
    icon: MapPin,
    accent: "from-slate-500 to-slate-700",
    steps: [
      {
        title: "Jelenlegi állapot értelmezése",
        details: [
          "Ha a menüpont lakatolt vagy nem használható, az nem hiba, hanem előkészített funkciót jelent.",
          "A napi munkában ettől még számolni kell a visszatérő relációkkal, csak most még más nézetekből dolgozol velük.",
        ],
      },
    ],
  },
  {
    id: "reports",
    title: "Jelentések",
    subtitle: "Teljesítmény, partneri elszámolás és működési visszanézés",
    summary:
      "A Jelentések menüpont célja, hogy a napi operációból kimutatható adatok legyenek: mennyi fuvar ment le, melyik partner hozott több utat, hogyan teljesítettek a sofőrök, és milyen volumenű bevételhez kapcsolódnak az egyes időszakok vagy partnerek.",
    keywords: ["jelentés", "statisztika", "kimutatás", "partneri elszámolás", "sofőr teljesítmény", "bevétel"],
    canDo: [
      "Havi, heti vagy napi bontásban visszanézheted a működést.",
      "Segít elszámolási és kapacitástervezési döntéseknél.",
      "Jobban látszik belőle, hol vannak visszatérő problémák vagy csúcsterhelések.",
    ],
    whenToUse: [
      "Havi zárások, partneri egyeztetések és belső áttekintések előtt.",
      "Ha meg akarod érteni, mely partnerek és időszakok terhelik legjobban a rendszert.",
      "Ha a jövőbeni kapacitást adat alapon akarod tervezni.",
    ],
    tips: [
      "A jelentés nem csak pénzügyi eszköz: operatív minőségi kontrollra is alkalmas.",
      "Érdemes figyelni a gyakori módosításokra, lemondásokra és sürgős újrafoglalásokra is, mert ezek sokat mondanak a működésről.",
    ],
    related: ["Ügyfelek", "Foglalások", "Sofőrök"],
    icon: BarChart3,
    accent: "from-rose-400 to-red-500",
    steps: [
      {
        title: "Kimutatások használata",
        details: [
          "Partnerenként nézd meg a forgalmat, a jóváhagyott árakat és a teljesített utak volumenét.",
          "Sofőrönként érdemes visszanézni a terhelést és a teljesítményt.",
          "A visszatérő torlódásokból előre tervezhető, hogy mikor kell több kapacitás.",
        ],
      },
    ],
  },
  {
    id: "settings",
    title: "Beállítások",
    subtitle: "Profil, rendszerállapot és érzékeny műveletek",
    summary:
      "A Beállítások menüpont alatt a saját felhasználói környezetedhez és a rendszer egyes kényesebb műveleteihez kapcsolódó lehetőségek találhatók. Itt kell különösen figyelni arra, hogy mit változtatsz, mert egyes akciók nagyobb hatással lehetnek az egész működésre.",
    keywords: ["beállítások", "profil", "rendszer", "felhasználó", "törlés", "biztonság"],
    canDo: [
      "Megnézheted a felhasználói és rendszerrel kapcsolatos alapinformációkat.",
      "Bizonyos adminisztratív vagy karbantartási műveleteket innen indíthatsz.",
      "Érzékeny műveletek előtt itt tudod ellenőrizni az állapotot és a következményeket.",
    ],
    whenToUse: [
      "Ha a saját profiloddal vagy hozzáféréseddel kapcsolatos információ kell.",
      "Ha rendszerjellegű műveletet kell végezni.",
      "Ha takarítás, törlés vagy egyéb nagy hatású akció előtt állsz.",
    ],
    tips: [
      "Ha valami nagy hatású műveletet indítasz innen, előtte mindig gondold végig, hogy van-e visszaút.",
      "A beállítási felületet kezeld körültekintően, főleg admin jogosultsággal.",
    ],
    warnings: [
      "A nagy hatású műveletek előtt mindig ellenőrizd még egyszer, hogy biztosan azt akarod-e végrehajtani. Ezek nem egyszerű nézetváltások, hanem éles rendszerhatással járhatnak.",
    ],
    related: ["Hibabejelentés", "Irányítópult"],
    icon: Settings,
    accent: "from-slate-600 to-slate-900",
    steps: [
      {
        title: "Biztonságos használat",
        details: [
          "Mielőtt érzékeny műveletet indítasz, ellenőrizd a jogosultsági szintedet és a várható következményt.",
          "Ha nem vagy biztos benne, hogy egy gomb mit okoz, kérdezz rá vagy nyiss hibajegyet, és ne kattints rutinból.",
        ],
      },
    ],
  },
];

const COMMON_WORKFLOWS: Workflow[] = [
  {
    title: "Új foglalás teljes feldolgozása",
    objective: "A cél, hogy az új rendelésből kiosztható, ellenőrzött, operatívan biztonságos út legyen.",
    relatedMenu: "Foglalások",
    steps: [
      "Nyisd meg a foglalást és ellenőrizd az alapadatokat: dátum, időpont, címek, utasszám, csomag, partner, megjegyzés.",
      "Döntsd el, milyen kategóriájú jármű és milyen szintű sofőr szükséges hozzá.",
      "Ellenőrizd a Naptár & Menetrend nézetben, hogy az időablak nem okoz-e ütközést.",
      "Oszd ki a megfelelő járművet és sofőrt, majd rögzítsd a státuszváltozást.",
      "Nézd meg, nincs-e nyitva kapcsolódó értesítés vagy árjóváhagyási feladat.",
    ],
  },
  {
    title: "Partneri módosítás kezelése",
    objective: "A cél, hogy a változás ne csak látszódjon, hanem ténylegesen át is legyen vezetve a működésben.",
    relatedMenu: "Értesítések -> Foglalások",
    steps: [
      "Olvasd el az értesítésben, pontosan mely mezők változtak.",
      "Nyisd meg a foglalást, és ellenőrizd, hogy az új paraméterekkel a meglévő kiosztás még működik-e.",
      "Szükség esetén módosíts járművet, sofőrt, időzítést vagy státuszt.",
      "Ha a változás kritikus, jelezd a csapatnak is, ne csak a rendszerre hagyatkozz.",
      "Csak utána tekintsd lezártnak az értesítést.",
    ],
  },
  {
    title: "Napi indulás előtti ellenőrzés",
    objective: "A cél, hogy a közelgő indulásoknál ne maradjon nyitott kockázat vagy hiányzó információ.",
    relatedMenu: "Irányítópult -> Naptár & Menetrend -> Foglalások",
    steps: [
      "Nézd meg a dashboardon a függőben lévő és módosított elemeket.",
      "A naptárban ellenőrizd a következő órák sűrűségét és a potenciális ütközéseket.",
      "Nyisd meg a kritikus foglalásokat, és nézd át a sofőr, jármű és megjegyzés mezőket.",
      "VIP, repülőtéri és partneri utaknál legyél különösen szigorú az ellenőrzésben.",
    ],
  },
  {
    title: "Kapacitáshiány vagy kiesés kezelése",
    objective: "A cél, hogy a láncreakció a lehető legkisebb legyen, és a legfontosabb utak megmaradjanak.",
    relatedMenu: "Járművek -> Sofőrök -> Naptár & Menetrend",
    steps: [
      "Azonosítsd, pontosan mely jármű vagy sofőr esett ki.",
      "Nézd meg, mely utak érintettek közvetlenül a napban.",
      "A legkritikusabb, időérzékeny vagy VIP utakat mentsd meg először.",
      "Szervezd át a kevésbé kritikus tételeket úgy, hogy a nap egésze működőképes maradjon.",
    ],
  },
  {
    title: "Technikai hiba szakszerű jelzése",
    objective: "A cél, hogy a hiba reprodukálható és gyorsan javítható legyen.",
    relatedMenu: "Hibabejelentés",
    steps: [
      "Írd le, melyik menüpontban és milyen lépés után jelentkezett a probléma.",
      "Rögzítsd a pontos hibaüzenetet vagy a hibás működés leírását.",
      "Ha foglalást érint, tedd bele a foglalási kódot is.",
      "Jelezd, hogy egyszeri vagy többször előforduló hibáról van-e szó.",
    ],
  },
];

const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: "Hol kezdjem, ha most léptem be a rendszerbe?",
    answer:
      "Először az Irányítópulton nézd meg a napi képet, utána az Értesítések alatt az olvasatlan vagy módosított elemeket. Ezzel gyorsan látni fogod, van-e valami azonnali teendő.",
  },
  {
    question: "Melyik menü alatt tudok egy konkrét foglalást teljesen kezelni?",
    answer:
      "A Foglalások alatt. Ott tudod megnyitni, ellenőrizni, módosítani, kiosztani és státuszban követni az adott rendelést.",
  },
  {
    question: "Mi a teendő, ha a partner módosította az időpontot vagy a címet?",
    answer:
      "Menj az Értesítésekhez, nyisd meg a kapcsolódó foglalást, ellenőrizd a változás hatását a kiosztott sofőrre és járműre, majd csak akkor tekintsd feldolgozottnak, ha az operatív oldal is rendben van.",
  },
  {
    question: "Hol látom, hogy melyik nap mennyire terhelt?",
    answer:
      "A Naptár & Menetrend nézetben. Ez a legjobb felület arra, hogy időalapon átlásd a sűrű napokat és az ütközéseket.",
  },
  {
    question: "Mit tegyek, ha nem tudom, milyen jármű kell egy úthoz?",
    answer:
      "A Foglalásoknál ellenőrizd az utasszámot, csomagokat, partneri szintet és megjegyzést, majd a Járművek nézetben válassz ezekhez megfelelő kategóriát. Ha bizonytalan vagy, ne a minimumra méretezz.",
  },
  {
    question: "Hol tudok technikai hibát jelezni?",
    answer:
      "A Hibabejelentés menüpontban. Ott minél pontosabban írd le, mit csináltál, mi történt, és melyik foglalás vagy partner érintett.",
  },
];

function normalizeText(value: string) {
  return value.toLocaleLowerCase("hu-HU");
}

function includesQuery(values: string[], query: string) {
  const normalizedQuery = normalizeText(query.trim());
  if (!normalizedQuery) return true;

  return values.some((value) => normalizeText(value).includes(normalizedQuery));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, query: string) {
  const trimmed = query.trim();
  if (!trimmed) return text;

  const regex = new RegExp(`(${escapeRegExp(trimmed)})`, "ig");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLocaleLowerCase("hu-HU") === trimmed.toLocaleLowerCase("hu-HU")) {
      return (
        <mark key={`${part}-${index}`} className="rounded-md bg-amber-200/70 px-1 py-0.5 text-slate-900">
          {part}
        </mark>
      );
    }

    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

export function DocumentationView() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ContentTab>("all");
  const [expandedSections, setExpandedSections] = useState<string[]>(["dashboard", "bookings", "notifications"]);

  const filteredSections = useMemo(() => {
    if (!query.trim()) return DOCUMENTATION_SECTIONS;

    return DOCUMENTATION_SECTIONS.filter((section) =>
      includesQuery(
        [
          section.title,
          section.subtitle,
          section.summary,
          ...section.keywords,
          ...section.canDo,
          ...section.whenToUse,
          ...section.tips,
          ...section.related,
          ...(section.warnings ?? []),
          ...section.steps.flatMap((step) => [step.title, ...step.details]),
        ],
        query
      )
    );
  }, [query]);

  const filteredWorkflows = useMemo(() => {
    if (!query.trim()) return COMMON_WORKFLOWS;

    return COMMON_WORKFLOWS.filter((workflow) =>
      includesQuery([workflow.title, workflow.objective, workflow.relatedMenu, ...workflow.steps], query)
    );
  }, [query]);

  const filteredFaq = useMemo(() => {
    if (!query.trim()) return FAQ_ENTRIES;

    return FAQ_ENTRIES.filter((entry) => includesQuery([entry.question, entry.answer], query));
  }, [query]);

  const totalMatches = filteredSections.length + filteredWorkflows.length + filteredFaq.length;
  const hasSearch = query.trim().length > 0;
  const noResults = hasSearch && totalMatches === 0;
  const visibleSections = activeTab === "faq" ? [] : filteredSections;
  const visibleWorkflows = activeTab === "menus" ? [] : filteredWorkflows;
  const visibleFaq = activeTab === "menus" || activeTab === "workflows" ? [] : filteredFaq;

  const toggleSection = (id: string) => {
    setExpandedSections((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const expandAllSections = () => {
    setExpandedSections(filteredSections.map((section) => section.id));
  };

  const collapseAllSections = () => {
    setExpandedSections([]);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto max-w-7xl pb-24">
      <div className="mb-8 rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-7 text-white shadow-2xl shadow-slate-900/15">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
          <BookOpen className="h-4 w-4 text-blue-200" />
          <span className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-100">Diszpécser Kézikönyv</span>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
              Részletes, kereshető belső dokumentáció a teljes bal oldali menühöz
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Ezt az oldalt úgy raktuk össze, hogy egy diszpécser ne csak azt tudja, melyik menü mire való, hanem azt is,
              hogy milyen helyzetben hova kell menni, milyen sorrendben érdemes dolgozni, mire kell külön figyelni, és
                hol lehet elrontani egy folyamatot. A kereső a teljes kézikönyvben dolgozik, így ha valaki például arra
                kíváncsi, hogy &quot;módosítás&quot;, &quot;sofőr kiosztás&quot; vagy &quot;ár jóváhagyás&quot;, akkor azonnal a releváns részeket kapja meg.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: "Menüpont", value: DOCUMENTATION_SECTIONS.length.toString(), hint: "külön részletes szekció" },
              { label: "Workflow", value: COMMON_WORKFLOWS.length.toString(), hint: "gyakori napi folyamat" },
              { label: "GYIK", value: FAQ_ENTRIES.length.toString(), hint: "gyors válasz kulcskérdésekre" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
                <div className="mt-2 text-3xl font-black text-white">{item.value}</div>
                <div className="mt-1 text-xs text-slate-400">{item.hint}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-900/[0.04]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Keresés a kézikönyvben</div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Találd meg gyorsan a keresett folyamatot vagy szabályt</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              A kereső a teljes dokumentációban dolgozik, a kapcsolódó workflow-kat és a GYIK blokkot is beleértve.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:max-w-md xl:min-w-[330px]">
            {[
              { label: "Menük", value: filteredSections.length },
              { label: "Workflow", value: filteredWorkflows.length },
              { label: "GYIK", value: filteredFaq.length },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
                <div className="mt-1 text-xl font-black text-slate-900">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Keress a dokumentációban: pl. új foglalás, partneri módosítás, sofőr kiosztás, ár jóváhagyás..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-12 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Keresés törlése"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "all" as const, label: "Minden" },
              { id: "menus" as const, label: "Csak menük" },
              { id: "workflows" as const, label: "Csak workflow-k" },
              { id: "faq" as const, label: "Csak GYIK" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                  activeTab === tab.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {QUICK_SEARCHES.map((item) => {
              const active = query.trim().toLocaleLowerCase("hu-HU") === item.toLocaleLowerCase("hu-HU");
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQuery(item)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    active
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  {item}
                </button>
              );
            })}

            {hasSearch ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                {totalMatches} találat
              </span>
            ) : (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">
                Tipp: keress például VIP-re vagy hibára
              </span>
            )}
          </div>
        </div>
      </div>

      {noResults ? (
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Search className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">Erre most nincs közvetlen találat</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Próbálj meg rövidebb kifejezést használni, vagy keress a folyamat kulcsszavára. Például a &quot;partneri módosítás&quot;
              helyett próbáld a &quot;módosítás&quot; vagy az &quot;értesítés&quot; szót.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-900/[0.03]">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Tartalomjegyzék</div>
              <div className="mt-4 space-y-2">
                {visibleSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className="flex w-full items-start gap-3 rounded-2xl border border-transparent bg-slate-50 px-3 py-3 text-left transition hover:border-slate-200 hover:bg-white"
                    >
                      <span className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${section.accent} text-white shadow-sm`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-slate-900">{highlightText(section.title, query)}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-slate-500">{highlightText(section.subtitle, query)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-900/[0.03]">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Gyors eligazítás</div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="font-bold text-slate-900">Ha konkrét foglalást kezelnél</div>
                  <div className="mt-1">Menj a Foglalásokhoz, és ott keresd ki a rendelést kód, név vagy partner alapján.</div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="font-bold text-slate-900">Ha valami megváltozott</div>
                  <div className="mt-1">Az Értesítések alatt nézd meg először, mi változott, majd nyisd meg a foglalást.</div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="font-bold text-slate-900">Ha nem működik valami</div>
                  <div className="mt-1">A Hibabejelentés menüpontban jelezd, minél pontosabb leírással.</div>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-8">
            <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/[0.04]">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Hogyan érdemes használni ezt az oldalt?</div>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Ne csak olvasd, munkaközben is használd</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Ez a dokumentáció akkor a leghasznosabb, ha egy valós helyzet közben nyitod meg. Például amikor jött egy
                    partneri módosítás, nem tudod melyik menüben kell utánamenni, vagy gyorsan meg akarod érteni, milyen
                    sorrendben érdemes dolgozni. A kereső nem csak címekben, hanem a teljes tartalomban keres.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:w-[360px] lg:grid-cols-1">
                  {[
                    { label: "1. Lépés", text: "Keress rá a helyzet kulcsszavára." },
                    { label: "2. Lépés", text: "Nyisd meg a releváns menüpont szekcióját." },
                    { label: "3. Lépés", text: "Kövesd a részletes lépéseket és figyelmeztetéseket." },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
                      <div className="mt-2 text-sm font-semibold text-slate-700">{item.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {activeTab !== "faq" ? (
              <section className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-900/[0.04]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Olvasási mód</div>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">Kezeld a hosszú tartalmat kényelmesebben</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={expandAllSections}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-white"
                    >
                      Minden menü lenyitása
                    </button>
                    <button
                      type="button"
                      onClick={collapseAllSections}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-white"
                    >
                      Menük összecsukása
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            {visibleWorkflows.length > 0 ? (
              <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/20">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Gyakori napi folyamatok</div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Lépésről lépésre, valós helyzetekre</h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  {visibleWorkflows.map((workflow) => (
                    <article key={workflow.title} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                          <h3 className="text-lg font-bold text-slate-900">{highlightText(workflow.title, query)}</h3>
                          <p className="mt-2 text-sm leading-7 text-slate-600">{highlightText(workflow.objective, query)}</p>
                        </div>
                        <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500">
                          {highlightText(workflow.relatedMenu, query)}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3">
                        {workflow.steps.map((step, index) => (
                          <div key={`${workflow.title}-${index}`} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/[0.02]">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
                              {index + 1}
                            </div>
                            <p className="text-sm leading-7 text-slate-700">{highlightText(step, query)}</p>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {visibleSections.map((section) => {
              const Icon = section.icon;
              const isExpanded = hasSearch || expandedSections.includes(section.id);

              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/[0.04]"
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="flex w-full flex-col gap-4 text-left"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${section.accent} text-white shadow-lg shadow-slate-900/10`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{highlightText(section.title, query)}</h2>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                              {isExpanded ? "Nyitva" : "Összecsukva"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium text-slate-500">{highlightText(section.subtitle, query)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="hidden flex-wrap gap-2 lg:flex">
                          {section.related.map((item) => (
                            <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
                              {highlightText(item, query)}
                            </span>
                          ))}
                        </div>
                        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition ${isExpanded ? "rotate-180" : ""}`}>
                          <ChevronDown className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </button>

                  {isExpanded ? (
                    <>
                      <div className="mt-6 border-t border-slate-100 pt-6">
                        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.95fr)]">
                          <div className="space-y-6">
                            <div>
                              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Mire való?</div>
                              <p className="mt-2 text-sm leading-7 text-slate-600">{highlightText(section.summary, query)}</p>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  Mit tudsz itt megcsinálni?
                                </div>
                                <div className="mt-4 space-y-3">
                                  {section.canDo.map((item) => (
                                    <div key={item} className="flex gap-3 text-sm leading-7 text-slate-600">
                                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                      <span>{highlightText(item, query)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                  <ChevronRight className="h-4 w-4 text-blue-600" />
                                  Mikor nyisd meg ezt a menüt?
                                </div>
                                <div className="mt-4 space-y-3">
                                  {section.whenToUse.map((item) => (
                                    <div key={item} className="flex gap-3 text-sm leading-7 text-slate-600">
                                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                      <span>{highlightText(item, query)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5">
                              <div className="flex items-center gap-2 text-sm font-bold text-blue-900">
                                <BookOpen className="h-4 w-4" />
                                Fontos gyakorlati tippek
                              </div>
                              <div className="mt-4 space-y-3">
                                {section.tips.map((tip) => (
                                  <div key={tip} className="flex gap-3 text-sm leading-7 text-blue-950/80">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                    <span>{highlightText(tip, query)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {section.warnings && section.warnings.length > 0 ? (
                              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
                                <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                                  <ShieldAlert className="h-4 w-4" />
                                  Mire kell különösen figyelni?
                                </div>
                                <div className="mt-4 space-y-3">
                                  {section.warnings.map((warning) => (
                                    <div key={warning} className="flex gap-3 text-sm leading-7 text-amber-950/80">
                                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                      <span>{highlightText(warning, query)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                              <div className="text-sm font-bold text-slate-900">Kulcsszavak ehhez a menühöz</div>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {section.keywords.map((keyword) => (
                                  <button
                                    key={`${section.id}-${keyword}`}
                                    type="button"
                                    onClick={() => setQuery(keyword)}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                                  >
                                    {highlightText(keyword, query)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Részletes működési lépések</div>
                        <div className="mt-4 grid gap-4">
                          {section.steps.map((step, index) => (
                            <article key={`${section.id}-${step.title}`} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                                  {index + 1}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="text-lg font-bold text-slate-900">{highlightText(step.title, query)}</h3>
                                  <div className="mt-4 space-y-3">
                                    {step.details.map((detail) => (
                                      <div key={detail} className="flex gap-3 text-sm leading-7 text-slate-700">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                                        <span>{highlightText(detail, query)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}
                </section>
              );
            })}

            {visibleFaq.length > 0 ? (
              <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-900/20">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">GYIK</div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Gyakran felmerülő kérdések</h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  {visibleFaq.map((entry) => (
                    <article key={entry.question} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                      <h3 className="text-base font-bold text-slate-900">{highlightText(entry.question, query)}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{highlightText(entry.answer, query)}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
