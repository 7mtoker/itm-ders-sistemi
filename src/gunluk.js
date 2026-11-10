/* ================= GÜNLÜK PLAN: haftalık görevler → günler, telafi, tempo, takvim (ICS) =================
   Saf fonksiyonlar: DOM yok, depolama yok, saat okunmaz ("bugün" hep argüman). plan.js'ten sonra birleştirilir
   ve onun tarih yardımcılarını (isoGun, isoDan, pazartesi, gunEkle, gecerliIso) kullanır. */

/* Gün içi sıralama: okul → anlatım → kontrol → vaka → zorlu → hata → haftalık kontrol en sonda. */
const gpSira={okul:0,anlatim:1,kontrol:2,vaka:3,zorlu:4,hata:5,hk:6};
/* Gecikmiş işler bir günün kapasitesinin en fazla bu kadarını alır: yeni konu öğrenme zamanı korunur. */
const gpGecikmisOran=0.4;
const gpMaxDk=600;

function gpVarsayilan(){return{musaitlik:[45,45,45,45,45,60,0],dersGunu:null};}

/* Sayıya çevrilebilen değer (sayı ya da sayısal metin) → sayı, değilse null. */
function gpSayi(x){
 if(typeof x==="number")return Number.isFinite(x)?x:null;
 if(typeof x==="string"&&x.trim()!==""){const n=Number(x);return Number.isFinite(n)?n:null;}
 return null;}

/* Görev dakikası: negatif/bozuk → 0, tam sayıya yuvarlanır. */
function gpDk(x){const n=gpSayi(x);return n===null||n<0?0:Math.round(n);}

/* Güvenilmeyen JSON → geçerli ayar. Hiç hata fırlatmaz (getter/Proxy hataları dahil). */
function gpOnar(x){
 try{
  const v=gpVarsayilan();
  if(!x||typeof x!=="object")return v;
  const m=x.musaitlik;
  if(Array.isArray(m))for(let i=0;i<7;i++){const n=gpSayi(m[i]);if(n!==null)v.musaitlik[i]=Math.min(gpMaxDk,Math.max(0,Math.round(n)));}
  const g=gpSayi(x.dersGunu);
  if(g!==null&&Number.isInteger(g)&&g>=0&&g<=6)v.dersGunu=g;
  return v;
 }catch(e){return gpVarsayilan();}}

/* Sıra numarası; `in` yerine kendi alanı kontrol edilir ("toString" gibi adlar bilinen tür sayılmasın). */
function gpRutbe(k){return Object.prototype.hasOwnProperty.call(gpSira,k)?gpSira[k]:4;}
function gpBilinen(k){return Object.prototype.hasOwnProperty.call(gpSira,k);}

function gpGun(iso,n){return isoGun(gunEkle(isoDan(iso),n));}
function gpHaftaGunu(iso){return(isoDan(iso).getDay()+6)%7;}
function gpToplam(a){return a.reduce((s,t)=>s+t.dk,0);}

/* ---------- 1. Haftalık görevleri günlere yerleştirme ---------- */
function gpHaftaPlani({gorevler=[],haftaIso,bugun,musaitlik,dersGunu=null,gecikmis=[]}={}){
 const ayar=gpOnar({musaitlik,dersGunu}),L=ayar.dersGunu;
 const kopya=(t,gec)=>{const c=Object.assign({},t,{dk:t.k==="okul"?0:gpDk(t.dk)});if(gec)c.gecikmis=true;return c;};
 const acik=(Array.isArray(gorevler)?gorevler:[]).filter(t=>t&&typeof t==="object"&&!t.ok).map(t=>kopya(t,false));
 /* Gecikmişler en eskiden yeniye: `hafta` (ISO) varsa ona göre, yoksa verilen sırayla (en yeni sayılır). */
 const gecAcik=(Array.isArray(gecikmis)?gecikmis:[]).filter(t=>t&&typeof t==="object"&&!t.ok)
  .map((t,i)=>({t:kopya(t,true),a:typeof t.hafta==="string"?t.hafta:"9999",i}))
  .sort((x,y)=>x.a<y.a?-1:x.a>y.a?1:x.i-y.i).map(x=>x.t);
 const sigmayan=[],bitir=gunler=>({gunler,sigmayan,acikDk:gpToplam(sigmayan)});
 if(!gecerliIso(haftaIso)){sigmayan.push(...acik,...gecAcik);return bitir([]);}

 const pzt=isoGun(pazartesi(isoDan(haftaIso))),bg=gecerliIso(bugun)?bugun:pzt;
 const gunler=[0,1,2,3,4,5,6].map(i=>{const iso=gpGun(pzt,i);
  return{iso,gun:i,kapasite:ayar.musaitlik[i],dk:0,gorevler:[],durum:iso<bg?"gecmis":iso===bg?"bugun":"gelecek"};});
 const gecerli=gunler.filter(g=>g.durum!=="gecmis").map(g=>g.gun); // geçmişe asla yazılmaz; kalanlar buraya kayar
 const bos=i=>gunler[i].kapasite-gunler[i].dk;
 const sigar=(i,dk)=>gunler[i].kapasite>0&&bos(i)>=dk; // kapasitesi 0 olan gün dinlenme günüdür: 0 dk'lık iş bile konmaz
 let sira=0;
 const koy=(t,i)=>{t._s=sira++;gunler[i].gorevler.push(t);gunler[i].dk+=t.dk;return i;};
 /* Yük dağıtımı: en çok boş kapasitesi olan gün, eşitlikte en erken gün (Pazartesi'yi doldurmak yerine). */
 const enBos=(ad,dk)=>{let en=-1;for(const i of ad)if(sigar(i,dk)&&(en<0||bos(i)>bos(en)))en=i;return en;};
 const enErken=(ad,dk)=>{for(const i of ad)if(sigar(i,dk))return i;return -1;};
 const ilkBulunan=(...adimlar)=>{for(const f of adimlar){const i=f();if(i>=0)return i;}return -1;};
 const tur=k=>acik.filter(t=>t.k===k);
 const anlatimGunu=new Map(); // uid → yerleştiği gün (yerleşemediyse -1)

 /* okul: ders günü, 0 dk. Ders günü bilinmiyorsa haftanın ilk planlanabilir gününe hatırlatma.
    Ders günü geçtiyse (kaçırılmış) yerleştirilemez → sigmayan (0 dk, açığı büyütmez). */
 for(const t of tur("okul")){
  const i=L===null?(gecerli.length?gecerli[0]:-1):(gecerli.includes(L)?L:-1);
  if(i<0)sigmayan.push(t);else koy(t,i);}

 /* hk: kapasitesi yeten son güne önce rezerve edilir; diğer işler mümkünse o güne kadar biter. */
 const hkGunleri=[];
 for(const t of tur("hk")){let i=-1;for(let j=gecerli.length-1;j>=0;j--)if(sigar(gecerli[j],t.dk)){i=gecerli[j];break;}
  if(i<0)sigmayan.push(t);else hkGunleri.push(koy(t,i));}
 const sinir=hkGunleri.length?Math.min(...hkGunleri):6;
 const once=gecerli.filter(i=>i<=sinir),dersSonrasi=ad=>ad.filter(i=>L===null||i>=L);

 /* anlatım: ders gününde/sonrasında, tercihen ardından kontrol testine yer kalan bir güne; olmazsa en erken. */
 for(const t of tur("anlatim")){
  const k=acik.find(x=>x.k==="kontrol"&&x.uid===t.uid);
  const sonrasiVar=i=>!k||once.some(j=>j>i&&sigar(j,k.dk));
  const i=ilkBulunan(()=>enBos(dersSonrasi(once).filter(sonrasiVar),t.dk),()=>enBos(dersSonrasi(once),t.dk),
   ()=>enBos(dersSonrasi(gecerli),t.dk),()=>enErken(once,t.dk),()=>enErken(gecerli,t.dk));
  anlatimGunu.set(t.uid,i);
  if(i<0)sigmayan.push(t);else koy(t,i);}

 /* kontrol: anlatımdan en az bir gün sonra (aralıklı tekrar etkisi); yer yoksa aynı gün; asla önce değil. */
 const kontrolKoy=(t,havuz,ekSart)=>{
  const a=anlatimGunu.has(t.uid)?anlatimGunu.get(t.uid):null;
  if(a===-1){sigmayan.push(t);return;} // anlatımı yerleşemeyen konunun testi de bekler
  let i;
  if(a===null)i=ilkBulunan(()=>enBos(havuz.filter(j=>j<=sinir).filter(ekSart),t.dk),()=>enBos(havuz.filter(ekSart),t.dk));
  else i=ilkBulunan(()=>enBos(havuz.filter(j=>j>a&&j<=sinir).filter(ekSart),t.dk),()=>enBos(havuz.filter(j=>j>a).filter(ekSart),t.dk),
   ()=>havuz.includes(a)&&sigar(a,t.dk)&&ekSart(a)?a:-1);
  if(i<0)sigmayan.push(t);else koy(t,i);};
 for(const t of tur("kontrol"))kontrolKoy(t,gecerli,()=>true);

 /* vaka: konu anlatımlarından sonra, hk'dan önce. Diğer işler: hk'dan önce, en boş güne. */
 const sonAnlatim=Math.max(-1,...[...anlatimGunu.values()]);
 for(const t of tur("vaka")){
  const i=ilkBulunan(()=>enBos(once.filter(j=>j>=sonAnlatim&&(L===null||j>=L)),t.dk),()=>enBos(dersSonrasi(once),t.dk),
   ()=>enBos(once,t.dk),()=>enBos(gecerli,t.dk));
  if(i<0)sigmayan.push(t);else koy(t,i);}
 for(const t of acik.filter(x=>!gpBilinen(x.k)||x.k==="zorlu"||x.k==="hata")){
  const i=ilkBulunan(()=>enBos(once,t.dk),()=>enBos(gecerli,t.dk));
  if(i<0)sigmayan.push(t);else koy(t,i);}

 /* gecikmiş: yalnız haftanın kendi işlerinden artan kapasiteye, gün başına en çok %40, en eski önce,
    en erken uygun güne (borç biriktikçe öğrenme zorlaşır). */
 const gecKul=[0,0,0,0,0,0,0],tavan=i=>Math.floor(gunler[i].kapasite*gpGecikmisOran)-gecKul[i];
 const gecSart=dk=>i=>tavan(i)>=dk;
 for(const t of gecAcik){
  if(t.k==="kontrol"&&anlatimGunu.has(t.uid)){
   const n=sigmayan.length;kontrolKoy(t,gecerli,gecSart(t.dk));
   if(sigmayan.length===n)gecKul[gunler.findIndex(g=>g.gorevler.includes(t))]+=t.dk;
   continue;}
  const i=enErken(gecerli.filter(gecSart(t.dk)),t.dk);
  if(t.k==="anlatim")anlatimGunu.set(t.uid,i);
  if(i<0)sigmayan.push(t);else{koy(t,i);gecKul[i]+=t.dk;}}

 gunler.forEach(g=>{
  g.gorevler.sort((a,b)=>(a.gecikmis?1:0)-(b.gecikmis?1:0)||gpRutbe(a.k)-gpRutbe(b.k)||a._s-b._s);
  g.gorevler.forEach(t=>{delete t._s;});});
 sigmayan.forEach(t=>{delete t._s;});
 return bitir(gunler);}

/* ---------- 2. Telafi / yetişir mi ---------- */
/* Hafta günlük kapasiteleri: sınav haftası 0, tatil yarım, bu haftanın geçmiş günleri 0. */
function gpGunKapasiteleri(w,m,buPzt,bugunGun){
 return[0,1,2,3,4,5,6].map(i=>w.kind==="sinav"||(w.iso===buPzt&&i<bugunGun)?0:w.kind==="tatil"?Math.floor(m[i]/2):m[i]);}

/* İş haftanın başında "gelir" (ders o hafta işlenir), tek son tarih var: sınav haftası.
   Bu yüzden yetişir ⇔ her j için (j. haftadan itibaren gelen iş) ≤ (j. haftadan itibaren kapasite).
   yuk = bu oranların en büyüğü; ≤1 ise yetişir. Bitiş günü günlük benzetimle bulunur. */
function gpSimule(kalan,m,buPzt,bugunGun,gecikmisDk,bg){
 const kap=kalan.map(x=>gpGunKapasiteleri(x.w,m,buPzt,bugunGun));
 let yuk=0,isS=0,kapS=0;
 for(let j=kalan.length-1;j>=0;j--){isS+=kalan[j].isDk+(j===0?gecikmisDk:0);kapS+=kap[j].reduce((a,b)=>a+b,0);
  if(isS>0)yuk=Math.max(yuk,kapS>0?isS/kapS:Infinity);}
 if(!kalan.length&&gecikmisDk>0)yuk=Infinity;
 let birikim=gecikmisDk,gelecek=kalan.reduce((s,x)=>s+x.isDk,0),bitisIso=birikim+gelecek===0?bg:null;
 for(let j=0;j<kalan.length&&bitisIso===null;j++){
  birikim+=kalan[j].isDk;gelecek-=kalan[j].isDk;
  for(let i=0;i<7;i++){const c=kap[j][i];
   if(birikim>0&&c>0){birikim-=Math.min(c,birikim);if(birikim===0&&gelecek===0){bitisIso=gpGun(kalan[j].w.iso,i);break;}}}}
 return{yuk,bitisIso,kap};}

function gpTelafi({haftalar=[],kalanDk={},bugun,musaitlik}={}){
 const m=gpOnar({musaitlik}).musaitlik;
 const W=(Array.isArray(haftalar)?haftalar:[]).filter(w=>w&&gecerliIso(w.iso)).slice().sort((a,b)=>a.iso<b.iso?-1:a.iso>b.iso?1:0);
 const bg=gecerliIso(bugun)?bugun:(W[0]?W[0].iso:"1970-01-01");
 const buPzt=isoGun(pazartesi(isoDan(bg))),bugunGun=gpHaftaGunu(bg);
 const kal=iso=>gpDk(kalanDk&&typeof kalanDk==="object"?kalanDk[iso]:0);
 const sinavI=W.findIndex(w=>w.kind==="sinav"),ufuk=sinavI<0?W:W.slice(0,sinavI+1); // sınavdan sonrası sayılmaz
 let gecikmisDk=0;const kalan=[];
 for(const w of ufuk){if(w.iso<buPzt)gecikmisDk+=kal(w.iso);else kalan.push({w,isDk:kal(w.iso)});}

 const sim=gpSimule(kalan,m,buPzt,bugunGun,gecikmisDk,bg);
 const satirlar=kalan.map((x,j)=>{const kapasiteDk=sim.kap[j].reduce((a,b)=>a+b,0);
  return{iso:x.w.iso,kind:x.w.kind,kapasiteDk,isDk:x.isDk,fark:kapasiteDk-x.isDk};});
 const toplam={kapasiteDk:satirlar.reduce((s,r)=>s+r.kapasiteDk,0),isDk:satirlar.reduce((s,r)=>s+r.isDk,0)+gecikmisDk,gecikmisDk};
 toplam.fark=toplam.kapasiteDk-toplam.isDk;

 /* Gereken günlük dk: her gün (tatil günü yarım ağırlık, sınav haftası 0) eşit çalışılırsa gereken en az dakika. */
 let gerekliGunlukDk=0,isS=0,gunS=0;
 for(let j=kalan.length-1;j>=0;j--){isS+=kalan[j].isDk+(j===0?gecikmisDk:0);
  const w=kalan[j].w;for(let i=0;i<7;i++)if(!(w.kind==="sinav"||(w.iso===buPzt&&i<bugunGun)))gunS+=w.kind==="tatil"?0.5:1;
  if(isS>0)gerekliGunlukDk=gunS>0&&gerekliGunlukDk!==null?Math.max(gerekliGunlukDk,Math.ceil(isS/gunS)):null;}
 if(!kalan.length&&gecikmisDk>0)gerekliGunlukDk=null;

 const yetisir=sim.yuk<=1;
 /* sinirda: yetişiyor ama en sıkışık dönemde kapasitenin %85'inden fazlası dolu (hastalık/aksilik payı yok). */
 const durum=!yetisir?"yetismez":sim.yuk>0.85?"sinirda":"rahat";
 let oneri={tip:"tamam"};
 if(!yetisir){
  /* Belirtilen günlere eşit ek dakika: yetişmeyi sağlayan en küçük değer (ikili arama), 600'de bile olmazsa null. */
  const enAzEk=gunler=>{const dene=x=>gpSimule(kalan,m.map((v,i)=>gunler.includes(i)?v+x:v),buPzt,bugunGun,gecikmisDk,bg).yuk<=1;
   if(!gunler.length||!dene(gpMaxDk))return null;let lo=1,hi=gpMaxDk;while(lo<hi){const o=(lo+hi)>>1;if(dene(o))hi=o;else lo=o+1;}return lo;};
  const aktif=m.map((v,i)=>v>0?i:-1).filter(i=>i>=0),bosHS=[5,6].filter(i=>m[i]===0);
  const gunlukEk=enAzEk(aktif.length?aktif:[0,1,2,3,4,5,6]),hs=bosHS.length?enAzEk(bosHS):null;
  /* Küçük bir artış yetiyorsa onu öner; değilse boş hafta sonu günlerini makul bir süreyle (≤180 dk) kullan. */
  if(gunlukEk!==null&&gunlukEk<=15)oneri={tip:"dkArtir",gunlukEk};
  else if(hs!==null&&hs<=180)oneri={tip:"haftaSonu",dk:hs,gunler:bosHS};
  else oneri={tip:"dkArtir",gunlukEk};}
 return{haftalar:satirlar,toplam,karar:{durum,gerekliGunlukDk,bitisIso:yetisir?sim.bitisIso:null,oneri,yuk:sim.yuk}};}

/* ---------- 3. Gerçek tempo ---------- */
function gpTempo(olaylar,bugun){
 const sonuc={dkAktifGun:0,aktifGun:0,toplamDk:0,son7Dk:0,onceki7Dk:0,trend:"sabit",gunluk:[]};
 if(!gecerliIso(bugun))return sonuc;
 const gunler=new Map();for(let i=13;i>=0;i--)gunler.set(gpGun(bugun,-i),0);
 for(const e of Array.isArray(olaylar)?olaylar:[]){
  const t=e&&typeof e==="object"?gpSayi(e.t):null;if(t===null)continue;
  const d=new Date(t);if(isNaN(d.getTime()))continue;
  const iso=isoGun(d);if(gunler.has(iso))gunler.set(iso,gunler.get(iso)+gpDk(e.dk));} // pencere dışı/gelecek olaylar sayılmaz
 sonuc.gunluk=[...gunler].map(([iso,dk])=>({iso,dk}));
 sonuc.gunluk.forEach((g,i)=>{sonuc.toplamDk+=g.dk;if(g.dk>0)sonuc.aktifGun++;if(i>=7)sonuc.son7Dk+=g.dk;else sonuc.onceki7Dk+=g.dk;});
 sonuc.dkAktifGun=sonuc.aktifGun?Math.round(sonuc.toplamDk/sonuc.aktifGun):0;
 /* Gürültüye karşı eşik: en az 30 dk ya da önceki haftanın %15'i kadar fark olmalı. */
 const fark=sonuc.son7Dk-sonuc.onceki7Dk,esik=Math.max(30,sonuc.onceki7Dk*0.15);
 sonuc.trend=fark>esik?"artiyor":fark<-esik?"azaliyor":"sabit";
 return sonuc;}

/* ---------- 4. Takvim dışa aktarma (RFC 5545) ---------- */
function gpIcsKacis(s){return String(s).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\r\n|\r|\n/g,"\\n");}
function gpUtf8Bayt(ch){const c=ch.codePointAt(0);return c<0x80?1:c<0x800?2:c<0x10000?3:4;}
/* 75 oktet katlama: UTF-8 bayt sayılır, kod noktası bölünmez (for..of vekil çiftleri birlikte gezer).
   Devam satırının başındaki boşluk da 75'e dahildir. */
function gpIcsKatla(satir){
 let out="",uz=0;
 for(const ch of satir){const b=gpUtf8Bayt(ch);if(uz+b>75){out+="\r\n ";uz=1;}out+=ch;uz+=b;}
 return out;}
function gpIcsTarih(iso){return iso.replace(/-/g,"");}
function gpIcsZaman(u){
 let d=new Date(u==null?0:u);
 if(isNaN(d.getTime())||d.getUTCFullYear()<1970||d.getUTCFullYear()>9999)d=new Date(0); // saat okunmaz: bozuksa sabit epoch
 return d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");}

function gpIcs({haftalar=[],sinavIso,dersGunu=null,adlar={},uretildi}={}){
 const g=gpOnar({dersGunu}).dersGunu,gun=g===null?0:g,stamp=gpIcsZaman(uretildi);
 const ad=u=>adlar&&typeof adlar==="object"&&typeof adlar[u]==="string"&&adlar[u]?adlar[u]:String(u);
 const satir=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//ITM Ders Sistemi//Gunluk Plan//TR","CALSCALE:GREGORIAN","METHOD:PUBLISH",
  "X-WR-CALNAME:"+gpIcsKacis("ITM Çalışma Planı")];
 /* UID yalnız haftanın Pazartesi'sinden türetilir: ders günü değişip yeniden içe aktarılırsa olay güncellenir, çoğalmaz. */
 const olay=(uid,iso,ozet,aciklama)=>{satir.push("BEGIN:VEVENT","UID:"+uid,"DTSTAMP:"+stamp,
  "DTSTART;VALUE=DATE:"+gpIcsTarih(iso),"DTEND;VALUE=DATE:"+gpIcsTarih(gpGun(iso,1)),
  "SUMMARY:"+gpIcsKacis(ozet),"DESCRIPTION:"+gpIcsKacis(aciklama),"TRANSP:TRANSPARENT","END:VEVENT");};
 for(const w of Array.isArray(haftalar)?haftalar:[]){
  if(!w||(w.kind!=="ders"&&w.kind!=="tekrar")||!gecerliIso(w.iso))continue;
  const pzt=isoGun(pazartesi(isoDan(w.iso))),units=Array.isArray(w.units)?w.units:[],chs=Array.isArray(w.chs)?w.chs:[];
  const ders=w.kind==="ders"&&chs.length;
  olay(`itm-hafta-${pzt}@itm-ders-sistemi`,gpGun(pzt,gun),`ITM Hafta ${w.no}: `+(ders?"Ders "+chs.join(", "):"Tekrar"),
   units.length?units.map(u=>"• "+ad(u)).join("\n"):"Tekrar haftası: zorlu sorular ve hata defteri.");}
 if(gecerliIso(sinavIso))olay("itm-sinav@itm-ders-sistemi",sinavIso,"ITM Sınavı","Introduction to Management sınavı. Başarılar!");
 satir.push("END:VCALENDAR");
 return satir.map(gpIcsKatla).join("\r\n")+"\r\n";}
