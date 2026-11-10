// ===== tekrar.js — sınav odaklı aralıklı tekrar motoru ("Bugün" kuyruğu) =====
// Saf mantık: DOM yok, depolama yok, Date.now()/Math.random() yok. Her fonksiyon
// "bugün"ü (tam sayı gün numarası) argüman olarak alır, böylece test edilebilir ve
// cihazlar arasında aynı sonucu verir.
//
// Durum (JSON, bulut belgesinde yer kaplamasın diye kompakt):
//   {v:1, k:{[anahtar]: [due, ivl, ease, reps, lapses, last]}, g:{[gün]: tekrarSayısı}}
//   due    : kartın vadesinin geldiği gün numarası
//   ivl    : son planlanan aralık (gün) = due - last
//   ease   : kolaylık katsayısı ×100 tam sayı (250 = 2.5); tam sayı = daha kısa JSON
//   reps   : üst üste doğru cevap sayısı (yanlışta 0'lanır)
//   lapses : toplam unutma (yanlış) sayısı
//   last   : son cevap günü (-1 = hiç cevaplanmadı)

const TK_EASE0 = 250;     // başlangıç kolaylığı (SM-2: 2.5)
const TK_EASE_MIN = 130;  // SM-2 tabanı: daha düşüğü kartı sonsuz kısa aralığa hapseder
const TK_EASE_MAX = 300;  // tavan: "emin" cevaplar aralığı uçurmasın
const TK_IVL_MAX = 365;   // tek bir aralık en fazla 1 yıl
const TK_PENCERE = 7;     // sınavdan önceki son 7 gün = "son tekrar penceresi"
const TK_SON = 3;         // son 3 günde riskli unutulmuş kartlar her gün gelir (bkz. tkVade)
const TK_G_GUN = 90;      // st.g'de tutulan gün sayısı
const TK_LIMIT = 20;      // varsayılan günlük kuyruk uzunluğu
const TK_MAX_KART = 900;  // varsayılan kart sınırı (tkBuda)

// --- yardımcılar -----------------------------------------------------------

// FNV-1a 32 bit: deterministik "rastgelelik" (jitter, sıralama eşitliği) için.
function tkHash(s) {
  let h = 2166136261;
  s = String(s);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Yerel takvim günü numarası. Yerel yıl/ay/gün'ü UTC gece yarısına çevirip 864e5'e
// bölüyoruz: yaz saati geçişinde gün 23/25 saat sürse bile sonuç tam sayı ve ardışık.
// (ms/864e5 gibi saf bölme DST'de ve saat dilimi farkında kayardı.)
function tkGun(ms) {
  const d = new Date(ms);
  if (isNaN(d.getTime())) return NaN;
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
}

// 'YYYY-MM-DD' -> gün numarası (sınav tarihini çevirmek için); geçersizse null.
function tkIsoGun(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof iso === 'string' ? iso : '');
  if (!m) return null;
  const y = +m[1], mo = +m[2] - 1, d = +m[3];
  const t = Date.UTC(y, mo, d), dt = new Date(t);
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo || dt.getUTCDate() !== d) return null;
  return Math.floor(t / 864e5);
}

function tkYeni() { return { v: 1, k: {}, g: {} }; }

// '__proto__' anahtarı düz nesneye atanınca prototipi değiştirir: hiç kabul etme.
function tkAnahtarOk(key) {
  return typeof key === 'string' && key.length > 0 && key.length <= 300 && key !== '__proto__';
}

// Prototipten gelen 'constructor' vb. kart sanılmasın diye sadece kendi özelliği.
function tkKart(st, key) {
  return st && st.k && Object.prototype.hasOwnProperty.call(st.k, key) ? st.k[key] : null;
}

function tkTur(key) { const i = key.indexOf(':'); return i < 0 ? '' : key.slice(0, i); }

// Sınav "etkin" mi? Sadece sınav gününden ÖNCE. Sınav günü ve sonrası: null gibi davran.
function tkSinavE(sinavGun, bugun) {
  return typeof sinavGun === 'number' && Number.isFinite(sinavGun) && bugun < sinavGun ? Math.floor(sinavGun) : null;
}

// Sınav tavanı: `from` gününde planlanan `due`yu sınava göre kısalt.
//  - Kart pencereden (E-7..E-1) önce cevaplandıysa pencerenin İÇİNE düşsün:
//    temiz kartlar E-7..E-1'e, unutulmuş kartlar E-7..E-4'e (ikinci tekrara yer kalsın).
//    Gün, anahtarın hash'iyle seçilir: yük 7 güne yayılır, hep aynı güne yığılmaz.
//  - Pencere içinde cevaplanan, unutulmuş ve henüz toparlanmamış (art arda 2 doğru yok) kart en geç E-1'de tekrar gelir (2. tekrar).
//  - Hiçbir kart sınav gününü (E) aşmaz.
function tkSinir(key, due, from, lapses, E, reps) {
  const h = tkHash(key);
  let cap;
  if (from < E - TK_PENCERE) cap = lapses > 0 ? E - 4 - (h % 4) : E - 1 - (h % TK_PENCERE);
  else if (lapses > 0 && !(reps >= 2) && from <= E - 2) cap = E - 1; // yalnız henüz toparlanmamış kart
  else cap = E;
  return Math.min(due, Math.max(cap, from + 1));
}

// Kartın "etkin" vadesi. Saklanan due'yu sınav kurallarıyla anlık yeniden süzer;
// böylece sınav tarihi sonradan girilir/değişirse eski kartlar da doğru davranır.
function tkVade(key, c, bugun, E) {
  if (E === null) return c[0];
  // Son 3 gün: yalnız HÂLÂ riskli kartlar her gün zorlanır: unutulmuş ve o günden beri
  // art arda iki kez doğru bilinmemiş (reps < 2). Ömür boyu unutma sayısı iyi bir ölçü değil:
  // 10 haftada hemen her kart bir kez unutulur ve hepsini zorlamak günde yüzlerce tekrar eder.
  if (bugun >= E - TK_SON && c[5] !== bugun && c[4] >= 1 && c[3] < 2) return Math.min(c[0], bugun);
  return tkSinir(key, c[0], c[5], c[4], E, c[3]);
}

// --- kart işlemleri --------------------------------------------------------

// Kartı bugün vadeli olarak ekler; varsa dokunmaz. Kartı döndürür (geçersiz anahtar: null).
function tkEkle(st, key, bugun) {
  if (!tkAnahtarOk(key)) return null;
  let c = tkKart(st, key);
  if (!c) { c = [bugun, 0, TK_EASE0, 0, 0, -1]; st.k[key] = c; }
  return c;
}

function tkSil(st, key) {
  if (tkKart(st, key)) delete st.k[key];
}

// Cevap kaydı. not: 0 = yanlış, 1 = doğru ama emin değil, 2 = doğru ve emin.
function tkCevapla(st, key, not, bugun, sinavGun) {
  const c = tkEkle(st, key, bugun);
  if (!c) return null;
  not = not === 2 ? 2 : not === 1 ? 1 : 0;
  let [due, ivl, ease, reps, lapses, last] = c;
  const ayniGun = last === bugun;
  const E = tkSinavE(sinavGun, bugun);
  let nd;
  if (not === 0) {
    // Aynı gün ikinci kez yanlış: unutma bir kez sayılır (bugün zaten düşmüşse).
    if (!(ayniGun && reps === 0 && lapses > 0)) { lapses++; ease = Math.max(TK_EASE_MIN, ease - 20); }
    reps = 0; nd = bugun + 1; // unutma: aralık 1 güne döner
  } else if (ayniGun) {
    // Aynı gün tekrar doğru: hafıza bugün zaten test edildi, büyütme yok; planı koru.
    nd = due > bugun ? due : bugun + Math.max(1, ivl);
  } else {
    reps++;
    // Erken tekrarda (ör. sınav penceresi zorladı) gerçekten geçen süre esas alınır.
    const base = last >= 0 ? Math.max(1, Math.min(ivl, bugun - last)) : 1;
    let n;
    if (reps === 1) n = 1;
    else if (reps === 2) n = not === 2 ? 3 : 2;
    else n = not === 2 ? Math.max(base + 1, Math.round(base * ease / 100)) : Math.max(base + 1, Math.round(base * 1.2));
    ease = not === 2 ? Math.min(TK_EASE_MAX, ease + 5) : Math.max(TK_EASE_MIN, ease - 15);
    // ±%10 jitter (≥4 gün): aynı gün eklenen kartlar hep birlikte gelmesin.
    // Hash anahtar+tekrar sayısından: deterministik ama her tekrarda farklı.
    if (n >= 4) n = Math.max(4, Math.round(n * (1 + ((tkHash(key + '|' + reps) % 2001) - 1000) / 10000)));
    nd = bugun + Math.min(TK_IVL_MAX, n);
  }
  if (E !== null) nd = tkSinir(key, nd, bugun, lapses, E, reps);
  c[0] = nd; c[1] = nd - bugun; c[2] = ease; c[3] = reps; c[4] = lapses; c[5] = bugun;
  st.g[bugun] = (+st.g[bugun] || 0) + 1;
  return c;
}

// --- kuyruk ----------------------------------------------------------------

// Öncelik sırasındaki listeyi karıştırır: art arda aynı ünite gelmesin (mümkünse),
// türler (t/q/a) dönüşümlü olsun. Açgözlü seçim + zorunlu adım: bir ünite kalanların
// yarısından fazlaysa şimdi ondan almazsak sonra yan yana gelmek kaçınılmaz olur.
function tkKaristir(items) {
  const out = [], rem = items.slice();
  let pu = null, pt = null;
  while (rem.length) {
    const say = new Map();
    let U = null, cU = 0;
    for (const x of rem) if (x.u !== null) {
      const n = (say.get(x.u) || 0) + 1; say.set(x.u, n);
      if (n > cU) { cU = n; U = x.u; }
    }
    let i = -1;
    if (U !== null && U !== pu && cU * 2 > rem.length) i = rem.findIndex(x => x.u === U);
    if (i < 0) i = rem.findIndex(x => (x.u === null || x.u !== pu) && x.t !== pt);
    if (i < 0) i = rem.findIndex(x => x.u === null || x.u !== pu);
    if (i < 0) i = 0;
    const x = rem.splice(i, 1)[0];
    out.push(x.key); pu = x.u; pt = x.t;
  }
  return out;
}

// Bugünün kuyruğu. o = {limit, sinavGun, birimOf(key) -> ünite id | null}
function tkKuyruk(st, bugun, o) {
  o = o || {};
  const limit = typeof o.limit === 'number' && o.limit > 0 ? Math.floor(o.limit) : TK_LIMIT;
  const E = tkSinavE(o.sinavGun, bugun);
  const birimOf = typeof o.birimOf === 'function' ? o.birimOf : null;
  const pencere = E !== null && bugun >= E - TK_PENCERE;
  const vadeli = [];
  let gecikmis = 0;
  for (const key of Object.keys(st.k)) {
    const c = st.k[key], v = tkVade(key, c, bugun, E);
    if (v > bugun) continue;
    if (v < bugun) gecikmis++;
    // Öncelik: aralığına göre ne kadar geciktiği (1 günlük kartın 1 gün gecikmesi,
    // 30 günlük kartınkinden ağır). Pencerede henüz görülmemiş kartlara +1: limit
    // dar olsa bile "son haftada en az bir kez" garantisi önce onlara gider.
    let p = (bugun - v + 1) / Math.max(1, c[1]);
    if (pencere && c[5] < E - TK_PENCERE) p += 1;
    vadeli.push({ key, p, l: c[4], h: tkHash(key) });
  }
  vadeli.sort((a, b) => b.p - a.p || b.l - a.l || a.h - b.h || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const sec = vadeli.slice(0, limit).map(x => {
    let u = null;
    if (birimOf) { try { const r = birimOf(x.key); u = r == null ? null : String(r); } catch (e) { u = null; } }
    return { key: x.key, u, t: tkTur(x.key) };
  });
  return { keys: tkKaristir(sec), vadesi: vadeli.length, gecikmis };
}

// --- özet ------------------------------------------------------------------

function tkOzet(st, bugun, sinavGun) {
  const E = tkSinavE(sinavGun, bugun);
  const hafta = [0, 0, 0, 0, 0, 0, 0];
  let toplam = 0, olgun = 0;
  for (const key of Object.keys(st.k)) {
    const c = st.k[key], d = tkVade(key, c, bugun, E) - bugun;
    toplam++;
    if (c[1] >= 7) olgun++;
    if (d <= 0) hafta[0]++; else if (d < 7) hafta[d]++;
  }
  // Seri: bugün henüz çalışılmadıysa dünden geriye say (seri gün içinde "kırılmış" görünmesin).
  const g = st.g, var_ = d => Object.prototype.hasOwnProperty.call(g, d) && g[d] > 0;
  let d = var_(bugun) ? bugun : bugun - 1, seri = 0;
  while (var_(d)) { seri++; d--; }
  return { toplam, vadesi: hafta[0], yarin: hafta[1], hafta, olgun, seri, bugunYapilan: var_(bugun) ? g[bugun] : 0 };
}

// --- bakım -----------------------------------------------------------------

// Durumu sınırlı tutar: kart sayısı > maxKart ise önce hiç unutulmamış, en olgun
// (ivl büyük) kartları atar — bunlar en az risklidir. st.g son 90 güne kırpılır.
function tkBuda(st, bugun, maxKart) {
  const max = typeof maxKart === 'number' && maxKart >= 0 ? Math.floor(maxKart) : TK_MAX_KART;
  const keys = Object.keys(st.k);
  if (keys.length > max) {
    keys.sort((a, b) => {
      const x = st.k[a], y = st.k[b];
      return (x[4] > 0) - (y[4] > 0) || y[1] - x[1] || y[3] - x[3] || (a < b ? -1 : a > b ? 1 : 0);
    });
    for (let i = 0; i < keys.length - max; i++) delete st.k[keys[i]];
  }
  for (const d of Object.keys(st.g)) if (+d <= bugun - TK_G_GUN) delete st.g[d];
  return st;
}

// Güvenilmeyen JSON'dan geçerli durum. Asla fırlatmaz; bozuk kartlar onarılır ya da atılır.
function tkSayi(v, def, min, max) {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : def;
}

function tkKartOnar(a) {
  if (!Array.isArray(a) || a.length < 6) return null;
  // due anlamsızsa kart kurtarılamaz (ne zaman sorulacağı bilinmez): at.
  if (typeof a[0] !== 'number' || !Number.isFinite(a[0]) || Math.abs(a[0]) > 1e7) return null;
  return [
    Math.round(a[0]),
    tkSayi(a[1], 0, 0, 3650),
    tkSayi(a[2], TK_EASE0, TK_EASE_MIN, TK_EASE_MAX),
    tkSayi(a[3], 0, 0, 1e4),
    tkSayi(a[4], 0, 0, 1e4),
    tkSayi(a[5], -1, -1, 1e7),
  ];
}

function tkOnar(x) {
  const st = tkYeni();
  try {
    if (!x || typeof x !== 'object' || Array.isArray(x)) return st;
    const k = x.k, g = x.g;
    if (k && typeof k === 'object' && !Array.isArray(k)) {
      for (const key of Object.keys(k)) {
        if (!tkAnahtarOk(key)) continue;
        const c = tkKartOnar(k[key]);
        if (c) st.k[key] = c;
      }
    }
    if (g && typeof g === 'object' && !Array.isArray(g)) {
      for (const d of Object.keys(g)) {
        const v = g[d];
        if (/^-?\d{1,8}$/.test(d) && typeof v === 'number' && Number.isFinite(v) && v >= 1) st.g[+d] = Math.min(1e6, Math.floor(v));
      }
    }
  } catch (e) { /* kısmi sonuç yeter; asla fırlatma */ }
  return st;
}
