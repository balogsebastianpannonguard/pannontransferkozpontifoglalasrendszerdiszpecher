"use client";

// Hangos értesítési hang Web Audio-val (nincs külön hangfájl).
// A böngészők csak felhasználói interakció (kattintás, billentyű) után engedik a hanglejátszást,
// ezért egy közös AudioContext-et használunk, amelyet az első interakció "felold".

type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || (window as AudioWindow).webkitAudioContext;
  if (!AudioCtx) return null;
  ctx = new AudioCtx();
  // Kompresszor + erős fő hangerő: hangos, de nem torzul szét.
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -14;
  compressor.knee.value = 6;
  compressor.ratio.value = 6;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.15;
  master = ctx.createGain();
  master.gain.value = 1;
  master.connect(compressor);
  compressor.connect(ctx.destination);
  return ctx;
}

/** Felhasználói interakcióból hívandó: engedélyezi a hanglejátszást ezen a lapon. */
export function unlockAlertAudio(): void {
  const c = getContext();
  if (c && c.state !== "running") void c.resume().catch(() => {});
}

export function isAlertAudioReady(): boolean {
  return !!ctx && ctx.state === "running";
}

function beep(c: AudioContext, out: GainNode, freq: number, start: number, length: number) {
  // Négyszög + háromszög hullám keveréke: jól hallható, "csengő" hang.
  for (const [type, level] of [["square", 0.32], ["triangle", 0.75]] as const) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.012);
    gain.gain.setValueAtTime(level, start + length - 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(gain);
    gain.connect(out);
    osc.start(start);
    osc.stop(start + length + 0.02);
  }
}

/**
 * Hangos, kb. 3 másodperces riasztó dallam (háromszor ismételt "di-dam-di-dam").
 * Visszaadja, hogy sikerült-e lejátszani (zárolt hangnál false).
 */
export async function playAlertSound(): Promise<boolean> {
  const c = getContext();
  if (!c || !master) return false;
  if (c.state !== "running") {
    // Zárolt (még nem volt interakció) lapon a resume nem teljesül — ne várjunk rá a végtelenségig.
    await Promise.race([c.resume().catch(() => {}), new Promise((r) => setTimeout(r, 400))]);
    if (!isAlertAudioReady()) return false;
  }
  const notes = [1318.5, 987.8, 1318.5, 987.8];
  const noteLength = 0.2;
  const gap = 0.045;
  const pause = 0.32;
  let t = c.currentTime + 0.03;
  for (let round = 0; round < 3; round += 1) {
    for (const freq of notes) {
      beep(c, master, freq, t, noteLength);
      t += noteLength + gap;
    }
    t += pause;
  }
  return true;
}
