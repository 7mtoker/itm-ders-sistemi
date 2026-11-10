// Kaynak HTML'deki müfredat verisini JSON'a çıkarır. Kullanım: node arac/cikar.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KAYNAK = path.join(ROOT, 'kaynak');
const html = fs.readFileSync(path.join(KAYNAK, 'orijinal.html'), 'utf8');
const lines = html.split(/\r?\n/);
const start = lines.findIndex((l) => l.startsWith('const UNITS = ['));
const end = lines.findIndex((l) => l.startsWith('/* ================= EXAM STRUCTURE'));
if (start < 0 || end < 0) throw new Error('veri sınırları bulunamadı');

const code = lines.slice(start, end).join('\n') + '\n;globalThis.__veri={UNITS,BANK,CASES,GLOSS,COMPARE,RMOCK,RCASE};';
const ctx = vm.createContext({});
vm.runInContext(code, ctx, { timeout: 5000 });
const { UNITS, BANK, CASES, GLOSS, COMPARE, RMOCK, RCASE } = JSON.parse(JSON.stringify(ctx.__veri));

export function segmentlere(notes) {
  const m = notes.match(/<div class="trap">[\s\S]*?<\/div>\s*$/);
  const trap = m ? m[0].trim() : '';
  const body = m ? notes.slice(0, m.index) : notes;
  const parts = body.split(/(?=<h4>)/).map((s) => s.trim()).filter(Boolean);
  return {
    trap,
    segments: parts.map((h, i) => ({ i, baslik: (h.match(/^<h4>(.*?)<\/h4>/) || [])[1] || 'Giriş', html: h })),
  };
}

const birim = UNITS.map((u) => {
  const { segments, trap } = segmentlere(u.notes);
  return { id: u.id, ch: u.ch, pts: u.pts, t: u.t, segments, trap, terms: u.terms };
});

const PAKETLER = { A: [1, 2, 3], B: [4, 5, 7], C: [6], D: [8, 9, 10], E: [11] };
const glossCh = (g) => (String(g.ch).match(/\d+/g) || []).map(Number);

for (const [ad, chs] of Object.entries(PAKETLER)) {
  const uds = birim.filter((u) => chs.includes(u.ch));
  const ids = new Set(uds.map((u) => u.id));
  const paket = {
    paket: ad,
    chapters: chs,
    units: uds,
    bank: BANK.filter((b) => ids.has(b.u)).map((b) => ({ id: b.id, u: b.u, d: b.d, q: b.q, o: b.o, x: b.x })),
    caseQuestions: CASES.filter((c) => chs.includes(c.ch)).flatMap((c) =>
      c.qs.map((q) => ({ case: c.title, u: q.u, q: q.q, o: q.o, x: q.x }))),
    glossary: GLOSS.filter((g) => glossCh(g).some((c) => chs.includes(c))),
    compare: COMPARE,
  };
  fs.writeFileSync(path.join(KAYNAK, `paket-${ad}.json`), JSON.stringify(paket, null, 1));
}

// Soru denetimi için
const rmDup = {};
const rmock = [];
RMOCK.forEach((s, si) =>
  s.qs.forEach((q, qi) => {
    const key = `${si}-${qi}`;
    const dupOf = rmDup[q.q] ?? null;
    if (!dupOf) rmDup[q.q] = key;
    rmock.push({ key, set: s.name, sec: q.sec, cs: q.cs, skip: q.skip, dupOf, q: q.q, o: q.o, a: q.a, x: q.x });
  }));
fs.writeFileSync(
  path.join(KAYNAK, 'sorular-mock.json'),
  JSON.stringify({
    units: birim.map((u) => ({ id: u.id, ch: u.ch, t: u.t, terms: u.terms.map((t) => t[0]) })),
    rcase: RCASE.map((c, i) => ({ i, title: c.title, ch: c.ch })),
    questions: rmock,
  }, null, 1));
fs.writeFileSync(
  path.join(KAYNAK, 'sorular-banka.json'),
  JSON.stringify({
    units: birim.map((u) => ({ id: u.id, ch: u.ch, t: u.t, notes: u.segments.map((s) => s.html).join('\n'), trap: u.trap, terms: u.terms })),
    bank: BANK,
    cases: CASES,
    rcase: RCASE,
  }, null, 1));
fs.writeFileSync(path.join(KAYNAK, 'birimler.json'), JSON.stringify(birim, null, 1));

const n = (o) => JSON.stringify(o).length;
console.log({
  units: birim.length,
  segments: birim.reduce((a, u) => a + u.segments.length, 0),
  terms: birim.reduce((a, u) => a + u.terms.length, 0),
  bank: BANK.length,
  cases: CASES.length,
  caseQs: CASES.reduce((a, c) => a + c.qs.length, 0),
  gloss: GLOSS.reduce((a, g) => a + g.t.length, 0),
  compare: COMPARE.length,
  rmock: rmock.length,
  rmockSkip: rmock.filter((q) => q.skip).length,
  rmockDup: rmock.filter((q) => q.dupOf).length,
  rmockCase: rmock.filter((q) => q.cs >= 0).length,
  rcase: RCASE.length,
  bytes: { bank: n(BANK), cases: n(CASES), rmock: n(RMOCK), rcase: n(RCASE) },
  segmentPerUnit: Object.fromEntries(birim.map((u) => [u.id, u.segments.length])),
  rcaseKeys: Object.keys(RCASE[0]),
  caseKeys: Object.keys(CASES[0]),
  bankByD: [1, 2, 3].map((d) => BANK.filter((b) => b.d === d).length),
});
