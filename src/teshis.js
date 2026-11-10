/* ================= TESHIS MOTORU: why points are lost, not just where =================
 Pure logic: no DOM, no storage, no clock, no randomness. Time always comes in as `t` / `now` (ms).

 STATE (plain JSON, store as-is):
   { v:1, c:{ "<unit>|<A>|<B>": [n, t] }, e:{ "<unit>": [sr, sw, ur, uw, tSw, tUr] } }
   c  confusion pairs. Key = unit id + the two concept names, A < B (unordered pair), joined by "|".
      A concept is a glossary term name ("PESTEL") or, when no term matched, "~" + the normalised,
      truncated option text ("~a support activity in the company's value"). n = net confusion count
      (+1 per wrong answer mixing them, -1 per right answer on a question offering both), t = last seen.
      At most tsMAX_CIFT (150) pairs; on overflow the lowest n goes first, ties oldest first.
   e  confidence calibration per unit: sr = sure+right, sw = sure+wrong (dangerous: does not know that
      they do not know), ur = unsure+right (fragile), uw = unsure+wrong; tSw / tUr = last time of a
      sw / ur answer (0 = never). When sr+sw+ur+uw exceeds 80 all four are halved, so old habits fade.

 FUNCTIONS
   tsYeni() -> fresh state.
   tsOnar(x) -> valid state from anything (object or JSON string); never throws.
   tsTerimler(units) -> [name] all glossary names of all units (deduplicated). Pass this as `terimler`.
   tsKavram(optionText, terimler) -> best term name mentioned in the text, or null.
      terimler: array of names or [name, definition] pairs. Case-insensitive, whole-word (a plural "s"
      is tolerated), longest match wins. "A (EQ)" also matches "A" and "EQ"; "X / Y" yields X and Y.
   tsKaydet(st, {q, secilen, emin, t}, terimler) -> state (same object when st was valid; ALWAYS use
      the return value). q = question {id,u,d,q,o,a}; correct index = q.a, or 0 when q.a is missing
      (raw bank stores the right answer at o[0]). secilen = chosen option index in q.o.
      emin = true | false | null (null = confidence not asked, calibration untouched).
   tsProfil(histByUnit, units) -> profile P, indexable as P[part][d]:
      P = { 0:Part, 1:Part, 2:Part, 3:Part }   part 0 = all parts together
      Part = { pts, ptsGor, 0:Cell, 1:Cell, 2:Cell, 3:Cell }   level 0 = all levels together
        pts = exam points of all units in the part, ptsGor = points of units that have history
      Cell = { n, ok, acc, est }  acc = ok/n (null when n=0), est = (ok+1)/(n+2) (add-one smoothing)
      Exam parts: 1 = ch 1,2,5,7,9; 2 = ch 3,4,8,10; 3 = ch 6,11. histByUnit: {unitId: [{ok,d,k,t}]}.
   tsOneriler(st, {histByUnit, units, compare, now, limit=5}) -> [Insight], highest puan first.
      Every insight: { tip, puan }  puan = estimated exam points recoverable (2 decimals).
      Nothing backed by fewer than 2 observations is ever returned. Thresholds: karisma n>=2;
      eminYanlis sw>=2 and oran>=0.25; kirilgan ur>=3 and oran>=0.4; duzey n>=4 and fark>=0.15.
      Older evidence counts less (half weight after 14 days, floor 0.15); pass now=undefined to disable.
      tip "karisma":    { u, a, b, hamA, hamB, n, son, kar }
         a / b = concept names (hamX true = raw option text, not a glossary term, "~" stripped),
         n = net confusions, son = last seen ms, kar = [title, explanation] from COMPARE or null.
      tip "eminYanlis": { u, sr, sw, ur, uw, oran, son }  oran = smoothed sure-wrong share of sure answers
      tip "kirilgan":   { u, sr, sw, ur, uw, oran, son }  oran = smoothed unsure share of right answers
      tip "duzey":      { parca, d, n, ok, est, ort, fark }
         est = this part+level smoothed accuracy, ort = student's overall smoothed accuracy, fark = ort-est
   tsKarsitSorular(cift, sorular, limit=8) -> [question id]
      cift = {a, b, u} (a "karisma" insight works as-is). Questions whose options mention both concepts
      first (exact contrast: one in the right option, the other in a distractor ranks highest, same unit
      and harder d next), then questions of unit u mentioning either concept.

 INTEGRATION: on every answered question call  st = tsKaydet(st, {q, secilen, emin, t:now}, TERIMLER)
 with TERIMLER = tsTerimler(units) computed once; persist st. Call tsOneriler for the advice screen.
======================================================================================= */

const tsMAX_CIFT = 150;
const tsPARCA = {1:1, 2:1, 5:1, 7:1, 9:1, 3:2, 4:2, 8:2, 10:2, 6:3, 11:3};
const tsGUN = 864e5;
const tsYARI_OMUR = 14 * tsGUN;   // advice weight halves every two weeks without new evidence
const tsHAM_UZUNLUK = 40;          // raw option text fallback is cut to ~40 chars

function tsYeni(){ return {v:1, c:{}, e:{}}; }

/* lowercase, curly quotes unified, possessive "'s" dropped, everything but letters/digits -> space */
function tsNorm(s){
 return String(s == null ? "" : s).toLowerCase().replace(/[‘’ʼ`]/g, "'")
  .replace(/'s\b/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function tsKisalt(s){
 const n = tsNorm(s);
 if (n.length <= tsHAM_UZUNLUK) return n;
 const k = n.slice(0, tsHAM_UZUNLUK), b = k.lastIndexOf(" ");
 return b > 15 ? k.slice(0, b) : k;
}

/* whole-word containment on normalised text; a trailing plural "s" in the text is tolerated */
function tsIcerir(metinN, kavramN){
 if (!kavramN) return false;
 const m = " " + metinN + " ";
 return m.includes(" " + kavramN + " ") || m.includes(" " + kavramN + "s ");
}

function tsTerimler(units){
 const out = [], gor = new Set();
 for (const u of Array.isArray(units) ? units : []) for (const t of (u && Array.isArray(u.terms)) ? u.terms : []) {
  const ad = String(Array.isArray(t) ? t[0] : t || "").trim();
  if (ad && !gor.has(ad.toLowerCase())) { gor.add(ad.toLowerCase()); out.push(ad); }
 }
 return out;
}

/* [[normalisedAlias, returnedName]] for one glossary name */
function tsTakmaAdlar(ad){
 const out = [];
 const parcalar = ad.includes("/") ? ad.split("/").map(x => x.trim()).filter(Boolean) : [ad];
 for (const p of parcalar) {
  const ad2 = parcalar.length > 1 ? p : ad;   // "Theory X / Theory Y" -> two separate concepts
  out.push([tsNorm(p), ad2]);
  const parantezsiz = p.replace(/\([^)]*\)/g, " ");
  // "Macro (general, external) environment" -> "macro environment", but "Culture (Hofstede)" must not
  // become the bare word "culture": a stripped alias needs two words
  if (parantezsiz !== p && tsNorm(parantezsiz).includes(" ")) out.push([tsNorm(parantezsiz), ad2]);
  // only acronyms inside parentheses become aliases: "(EQ)" yes, "(Hofstede)" / "(general, external)" no
  for (const m of p.matchAll(/\(([^)]*)\)/g)) if (/^[A-Z0-9-]{2,8}$/.test(m[1].trim())) out.push([tsNorm(m[1]), ad2]);
 }
 return out.filter(x => x[0]);
}

function tsKavram(optionText, terimler){
 const metin = tsNorm(optionText);
 if (!metin || !Array.isArray(terimler)) return null;
 let en = null, enUz = 0;
 for (const t of terimler) {
  const ad = String(Array.isArray(t) ? t[0] : t || "").trim();
  if (!ad) continue;
  for (const [takma, donen] of tsTakmaAdlar(ad))
   if (takma.length > enUz && tsIcerir(metin, takma)) { en = donen; enUz = takma.length; }
 }
 return en;
}

function tsAnahtar(u, a, b){
 const temiz = x => String(x).replace(/\|/g, " ");
 const [x, y] = [temiz(a), temiz(b)].sort();
 return temiz(u) + "|" + x + "|" + y;
}

function tsGecerliMi(st){
 return !!st && typeof st === "object" && st.v === 1 && !!st.c && typeof st.c === "object" && !Array.isArray(st.c)
  && !!st.e && typeof st.e === "object" && !Array.isArray(st.e);
}

/* keys that would touch Object.prototype when used on a plain object */
function tsKotuAnahtar(k){ return k === "__proto__" || k === "constructor" || k === "prototype"; }

function tsSayi(x){ const n = Number(x); return Number.isFinite(n) && n >= 0 ? n : 0; }

/* the pair just recorded (koru) is never evicted, otherwise a new pair with n=1 would vanish at once */
function tsBuda(c, koru){
 const k = Object.keys(c).filter(x => x !== koru);
 if (k.length <= tsMAX_CIFT) return;
 k.sort((p, q) => (c[p][0] - c[q][0]) || (c[p][1] - c[q][1]));
 const fazla = k.length + (koru in c ? 1 : 0) - tsMAX_CIFT;
 for (let i = 0; i < fazla; i++) delete c[k[i]];
}

function tsOnar(x){
 const s = tsYeni();
 try {
  if (typeof x === "string") x = JSON.parse(x);
  if (!x || typeof x !== "object") return s;
  if (x.c && typeof x.c === "object" && !Array.isArray(x.c)) for (const k of Object.keys(x.c)) {
   const p = k.split("|"), v = x.c[k];
   if (k.length > 300 || tsKotuAnahtar(k) || p.length !== 3 || !p[0] || !p[1] || !p[2] || p[1] === p[2] || !Array.isArray(v)) continue;
   const n = Math.floor(tsSayi(v[0]));
   if (n > 0) s.c[tsAnahtar(p[0], p[1], p[2])] = [Math.min(n, 999), tsSayi(v[1])];
  }
  if (x.e && typeof x.e === "object" && !Array.isArray(x.e)) for (const u of Object.keys(x.e)) {
   const v = x.e[u];
   if (!Array.isArray(v) || u.length > 40 || tsKotuAnahtar(u)) continue;
   const r = [0, 1, 2, 3].map(i => Math.min(Math.floor(tsSayi(v[i])), 999)).concat([tsSayi(v[4]), tsSayi(v[5])]);
   if (r[0] + r[1] + r[2] + r[3] > 0) s.e[u] = r;
  }
  tsBuda(s.c);
 } catch (_) { return tsYeni(); }
 return s;
}

function tsKaydet(st, cevap, terimler){
 const s = tsGecerliMi(st) ? st : tsOnar(st);
 const q = cevap && cevap.q;
 if (!q || !Array.isArray(q.o) || q.o.length < 2) return s;
 const a = Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length ? q.a : 0;
 const sec = cevap.secilen;
 if (!Number.isInteger(sec) || sec < 0 || sec >= q.o.length) return s;
 const ok = sec === a, t = tsSayi(cevap.t), u = tsKotuAnahtar(String(q.u)) ? "?" : String(q.u || "?");

 if (cevap.emin === true || cevap.emin === false) {
  const h = s.e[u] || (s.e[u] = [0, 0, 0, 0, 0, 0]);
  const i = cevap.emin ? (ok ? 0 : 1) : (ok ? 2 : 3);
  h[i]++;
  if (i === 1) h[4] = t;
  if (i === 2) h[5] = t;
  if (h[0] + h[1] + h[2] + h[3] > 80) for (let j = 0; j < 4; j++) h[j] = Math.round(h[j] / 2);
 }

 const dogru = tsKavram(q.o[a], terimler);
 if (!ok) {
  const secilen = tsKavram(q.o[sec], terimler);
  let A = dogru || "~" + tsKisalt(q.o[a]), B = secilen || "~" + tsKisalt(q.o[sec]);
  // both options name the same term (e.g. "PESTEL, threat" vs "PESTEL, opportunity"): the real
  // difference is in the wording, so keep the raw texts instead of a meaningless X-vs-X pair
  if (A === B) { A = "~" + tsKisalt(q.o[a]); B = "~" + tsKisalt(q.o[sec]); }
  if (A === B || A === "~" || B === "~") return s;
  const k = tsAnahtar(u, A, B), eski = s.c[k];
  s.c[k] = [(eski ? eski[0] : 0) + 1, t];
  tsBuda(s.c, k);
 } else if (dogru) {
  // a right answer while the confusing distractor was on screen is evidence the mix-up is resolving
  for (let j = 0; j < q.o.length; j++) {
   if (j === a) continue;
   const d = tsKavram(q.o[j], terimler);
   if (!d || d === dogru) continue;
   const k = tsAnahtar(u, dogru, d);
   if (s.c[k] && --s.c[k][0] <= 0) delete s.c[k];
  }
 }
 return s;
}

function tsHucre(){ return {n:0, ok:0, acc:null, est:0.5}; }

function tsProfil(histByUnit, units){
 const P = {};
 for (let p = 0; p <= 3; p++) P[p] = {pts:0, ptsGor:0, 0:tsHucre(), 1:tsHucre(), 2:tsHucre(), 3:tsHucre()};
 const H = histByUnit && typeof histByUnit === "object" ? histByUnit : {};
 for (const u of Array.isArray(units) ? units : []) {
  const p = u && tsPARCA[u.ch];
  if (!p) continue;
  const pts = tsSayi(u.pts), h = Array.isArray(H[u.id]) ? H[u.id] : [];
  P[p].pts += pts; P[0].pts += pts;
  if (h.length) { P[p].ptsGor += pts; P[0].ptsGor += pts; }
  for (const r of h) {
   if (!r || typeof r !== "object") continue;
   const d = [1, 2, 3].includes(r.d) ? r.d : 0, ok = r.ok ? 1 : 0;
   for (const pp of [p, 0]) for (const dd of d ? [d, 0] : [0]) { P[pp][dd].n++; P[pp][dd].ok += ok; }
  }
 }
 for (let p = 0; p <= 3; p++) for (let d = 0; d <= 3; d++) {
  const c = P[p][d];
  c.acc = c.n ? c.ok / c.n : null;
  c.est = (c.ok + 1) / (c.n + 2);
 }
 return P;
}

/* weight of evidence last seen at t: 1 now, 0.5 after two weeks, never below 0.15 */
function tsTazelik(t, now){
 if (!Number.isFinite(now) || !t) return 1;
 return Math.max(0.15, Math.min(1, Math.pow(0.5, Math.max(0, now - t) / tsYARI_OMUR)));
}

/* finds the COMPARE row whose "X vs Y" title names both concepts (either order) */
function tsKarsilastir(a, b, compare){
 const A = tsNorm(a), B = tsNorm(b);
 if (!A || !B) return null;
 const eslesir = (kavram, taraf) => !!taraf && (tsIcerir(kavram, taraf) || tsIcerir(taraf, kavram));
 for (const r of Array.isArray(compare) ? compare : []) {
  if (!Array.isArray(r) || typeof r[0] !== "string") continue;
  const s = r[0].split(/\s+vs\.?\s+/i);
  if (s.length !== 2) continue;
  const L = tsNorm(s[0]), R = tsNorm(s[1]);
  if ((eslesir(A, L) && eslesir(B, R)) || (eslesir(A, R) && eslesir(B, L))) return [r[0], String(r[1] || "")];
 }
 return null;
}

function tsOneriler(st, opt){
 const s = tsGecerliMi(st) ? st : tsOnar(st);
 const o = opt || {}, now = Number(o.now), limit = Number.isInteger(o.limit) && o.limit > 0 ? o.limit : 5;
 const units = Array.isArray(o.units) ? o.units : [];
 const puanOf = {};
 for (const u of units) if (u && u.id) puanOf[u.id] = tsSayi(u.pts);
 const ptsU = u => (u in puanOf ? puanOf[u] : 100 / 28);   // unknown unit: average share
 const kanit = n => n / (n + 1);                             // 2 obs -> .67, 9 obs -> .9
 const yuvarla = x => Math.round(x * 100) / 100;
 const out = [];

 // Each wrong answer on a contrast costs roughly an eighth of the unit's points, capped at half.
 for (const k of Object.keys(s.c)) {
  const [n, t] = s.c[k], [u, a, b] = k.split("|");
  if (n < 2) continue;
  const hamA = a[0] === "~", hamB = b[0] === "~", A = hamA ? a.slice(1) : a, B = hamB ? b.slice(1) : b;
  out.push({tip:"karisma", u, a:A, b:B, hamA, hamB, n, son:t,
   kar:(hamA || hamB) ? null : tsKarsilastir(A, B, o.compare),
   puan:yuvarla(ptsU(u) * Math.min(0.5, 0.12 * n) * tsTazelik(t, now))});
 }

 for (const u of Object.keys(s.e)) {
  const [sr, sw, ur, uw, tSw, tUr] = s.e[u];
  const oran = (sw + 1) / (sr + sw + 2);
  // a strong student still slips now and then; flag only when sure answers fail at least ~1 in 4
  if (sw >= 2 && oran >= 0.25) {
   // the share of sure answers that fail is roughly the share of the unit's points silently lost
   out.push({tip:"eminYanlis", u, sr, sw, ur, uw, oran:yuvarla(oran), son:tSw,
    puan:yuvarla(ptsU(u) * oran * kanit(sw) * tsTazelik(tSw, now))});
  }
  const oranK = (ur + 1) / (ur + sr + 2);
  if (ur >= 3 && oranK >= 0.4) {
   // fragile answers were still right, so only a smaller share of points is at risk
   out.push({tip:"kirilgan", u, sr, sw, ur, uw, oran:yuvarla(oranK), son:tUr,
    puan:yuvarla(ptsU(u) * 0.3 * oranK * kanit(ur) * tsTazelik(tUr, now))});
  }
 }

 // Part+level cells clearly below the student's own average. Points at stake = points of the studied
 // units in that part x share of that part's answers at this level x accuracy gap. No recency factor:
 // the host already keeps only the last 40 answers per unit.
 const P = tsProfil(o.histByUnit, units), ort = P[0][0].est;
 for (let p = 1; p <= 3; p++) for (let d = 1; d <= 3; d++) {
  const c = P[p][d], fark = ort - c.est;
  if (c.n < 4 || fark < 0.15) continue;
  out.push({tip:"duzey", parca:p, d, n:c.n, ok:c.ok, est:yuvarla(c.est), ort:yuvarla(ort), fark:yuvarla(fark),
   puan:yuvarla(P[p].ptsGor * (c.n / P[p][0].n) * fark * kanit(c.n))});
 }

 return out.filter(x => x.puan > 0)
  .sort((x, y) => (y.puan - x.puan) || ((y.n || y.sw || y.ur || 0) - (x.n || x.sw || x.ur || 0)))
  .slice(0, limit);
}

function tsKarsitSorular(cift, sorular, limit){
 const lim = Number.isInteger(limit) && limit > 0 ? limit : 8;
 if (!cift || !Array.isArray(sorular)) return [];
 const A = tsNorm(String(cift.a || "").replace(/^~/, "")), B = tsNorm(String(cift.b || "").replace(/^~/, ""));
 if (!A && !B) return [];
 const u = cift.u, aday = [];
 sorular.forEach((q, i) => {
  if (!q || !Array.isArray(q.o) || q.id == null) return;
  const dogru = Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length ? q.a : 0;
  const on = q.o.map(tsNorm), kok = tsNorm(q.q);
  const aIdx = on.map((x, j) => tsIcerir(x, A) ? j : -1).filter(j => j >= 0);
  const bIdx = on.map((x, j) => tsIcerir(x, B) ? j : -1).filter(j => j >= 0);
  let p = 0;
  if (A && B && aIdx.length && bIdx.length) {
   // both named in separate options = a real contrast; only inside one option = weaker
   p = aIdx.some(x => bIdx.some(y => y !== x)) ? 100 : 50;
   // exact contrast: one concept is the answer, the other a distractor
   if ((aIdx.includes(dogru) && bIdx.some(j => j !== dogru)) || (bIdx.includes(dogru) && aIdx.some(j => j !== dogru))) p += 20;
   if (q.u === u) p += 10;
  } else if (q.u === u && (aIdx.length || bIdx.length || tsIcerir(kok, A) || tsIcerir(kok, B))) {
   p = 10;
  }
  if (p) aday.push({id:q.id, p:p + (q.d || 0), i});
 });
 return aday.sort((x, y) => (y.p - x.p) || (x.i - y.i)).slice(0, lim).map(x => x.id);
}
