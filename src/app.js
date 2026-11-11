/* ================= SINAV YAPISI ================= */
/* Arayüz metinleri: src/dil.js içindeki DIL.tr / DIL.en sözlükleri, tx(anahtar, ...) ile okunur. */
document.documentElement.lang="tr";
const CHAPTERS = {
  1:{t:"Intro to Leadership & Management",p:1}, 2:{t:"Personality and Leadership",p:1}, 3:{t:"Leadership Approaches",p:2},
  4:{t:"Values-Based & Contemporary Leadership",p:2}, 5:{t:"Communication & Decision Making",p:1}, 6:{t:"Leadership Mission and Strategy",p:3},
  7:{t:"Goals and Motivational Leadership",p:1}, 8:{t:"Leadership and the Organization",p:2}, 9:{t:"Global Leadership",p:1},
  10:{t:"Leading Teams",p:2}, 11:{t:"Leading Innovation and Change",p:3}
};
const CH_ORDER=[1,2,3,4,5,6,7,8,9,10,11];
const PARTS = {
  1:{short:"Part 1", chs:[1,2,5,7,9]},
  2:{short:"Part 2", chs:[3,4,8,10]},
  3:{short:"Part 3", chs:[6,11]}
};
const partName=p=>tx("partName")[p-1], partDesc=p=>tx("partDesc")[p-1];
const SHORT={c1a:"P-O-L-C",c1b:"Mintzberg & Katz",c2a:"Personality",c2b:"Work attitudes",c3a:"Power",c3b:"Traits & behaviours",c4a:"Contemporary styles",c4b:"Values & ethics",c5a:"Communication",c5b:"Decision making",c6a:"Mission & vision",c6b:"Strategy levels",c6c:"Value chain · VRIO · BCG",c6d:"SWOT · PESTEL · Porter",c6e:"Intended vs realized",c7a:"Goals & CSR",c7b:"Motivation",c8a:"Structures",c8b:"Culture & DEI",c9a:"Hofstede & GLOBE",c9b:"Going global",c10a:"Tuckman",c10b:"Networks",c11a:"Innovative culture",c11b:"Change drivers",c11c:"Resistance",c11d:"Lewin & Kotter",c11e:"Schein"};
const QN=8, BAR=6, MAXP=100, GUESS=22.5, PASSP=61.25, TARGET=75, HAFTA_ORAN=.75;
const lvl=d=>tx("lvl")[d-1];
const grade=p=>Math.min(10,Math.max(1,1+9*(p-GUESS)/(MAXP-GUESS)));
const ond=s=>String(s).replace(".",tx("ondalik"));
const gf=g=>ond(g.toFixed(1));
const R=Math.random;
const pick=a=>a[Math.floor(R()*a.length)];
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

/* Denetimde onaylı düzeltmeler: banka sorusu (id) ya da vaka sorusu (<vaka>-<sıra>); o[0] doğru seçenek. Bilinmeyen id sessizce atlanır. */
(()=>{const L=typeof DUZELT!=="undefined"&&Array.isArray(DUZELT)?DUZELT:[],byId=new Map(BANK.map(q=>[q.id,q]));
 L.forEach(d=>{try{let h=byId.get(d.id);if(!h){const m=/^(.+)-(\d+)$/.exec(String(d.id||"")),c=m&&CASES.find(x=>x.id===m[1]);h=c?c.qs[+m[2]]:null;}
  if(!h){console.warn("DUZELT: bilinmeyen soru",d.id);return;}
  if(d.field==="q"||d.field==="x")h[d.field]=String(d.to);else if(d.field==="o"&&Number.isInteger(d.index)&&d.index>=0&&d.index<h.o.length)h.o[d.index]=String(d.to);else console.warn("DUZELT: geçersiz alan",d.id,d.field);}catch(e){console.warn("DUZELT",d&&d.id,e);}});})();
/* Derste kullanılan set sorularını ve vakalarını havuza kat. */
EK_SORULAR.forEach(q=>BANK.push(q));
EK_VAKALAR.forEach(c=>CASES.push(c));
const CASE=Object.fromEntries(CASES.map(c=>[c.id,c]));
const QBY=Object.fromEntries(BANK.map(q=>[q.id,q]));
/* Terim → tanım ve konu (tekrar kartları için): önce konu terimleri, sonra sözlük. */
const TERIM=Object.create(null);
UNITS.forEach(u=>u.terms.forEach(([t,d])=>{if(!TERIM[t])TERIM[t]={t,d,u:u.id};}));
GLOSS.forEach(g=>g.t.forEach(([t,d])=>{if(!TERIM[t])TERIM[t]={t,d,u:null};}));
const TERIMLER=tsTerimler(UNITS);
const partOf=ch=>CHAPTERS[ch].p;
/* İngilizce dersler: Türkçe kayıtla alan alan kaynaştırılır. Eksik, bozuk ya da biçimi tutmayan her alan Türkçesine düşer;
   adım sayısı, seçenek sayısı, terim ve kaynak bağları hep Türkçe kayıttan gelir (ilerleme ve kartlar dile bağlı değildir). */
function enKaynastir(tr,en,anahtar){
 if(anahtar==="terimler"||anahtar==="kaynak"||anahtar==="id"||anahtar==="ch")return tr;
 if(typeof tr==="string")return typeof en==="string"&&en.trim()?en:tr;
 if(Array.isArray(tr))return Array.isArray(en)&&en.length===tr.length?tr.map((x,i)=>enKaynastir(x,en[i])):tr;
 if(tr&&typeof tr==="object"){if(!en||typeof en!=="object"||Array.isArray(en))return tr;const o={};Object.keys(tr).forEach(k=>{o[k]=enKaynastir(tr[k],en[k],k);});return o;}
 return tr;}
const EN_DERS=(()=>{const o={chapters:{},lessons:{}},E=typeof DERSLER_EN!=="undefined"&&DERSLER_EN&&typeof DERSLER_EN==="object"?DERSLER_EN:{};
 ["chapters","lessons"].forEach(k=>{const kaynak=E[k]&&typeof E[k]==="object"?E[k]:{};Object.keys(DERSLER[k]).forEach(id=>{try{const e=kaynak[id];if(e&&typeof e==="object")o[k][id]=enKaynastir(DERSLER[k][id],e);}catch(err){}});});
 return o;})();
const icerik=()=>S.dil==="en"?EN_DERS:null;
const ders=uid=>{const e=icerik();return(e&&e.lessons[uid])||DERSLER.lessons[uid]||null;};
const ucAd=uid=>{const d=ders(uid);return d?d.ad:UNIT[uid].t;};
const chBilgi=ch=>{const e=icerik();return(e&&e.chapters[ch])||DERSLER.chapters[ch]||null;};
const chAd=ch=>{const c=chBilgi(ch);return c?c.ad:CHAPTERS[ch].t;};
const BLOKLAR=CH_ORDER.map(ch=>({ch,units:UNITS.filter(u=>u.ch===ch).map(u=>u.id)}));
function parcala(notes){const m=notes.match(/<div class="trap">[\s\S]*?<\/div>\s*$/),trap=m?m[0].trim():"",body=m?notes.slice(0,m.index):notes;return{trap,seg:body.split(/(?=<h4>)/).map(s=>s.trim()).filter(Boolean)};}
const NOT=Object.fromEntries(UNITS.map(u=>[u.id,parcala(u.notes)]));
const adimSayisi=uid=>{const d=DERSLER.lessons[uid];return d?d.adimlar.length:0;};
const TOPLAM_ADIM=UNITS.reduce((a,u)=>a+adimSayisi(u.id),0);

/* ---------- durum ---------- */
const LKEY="itmders.v1";
function freshPlan(){return{start:isoGun(pazartesi(new Date())),exam:PLAN_VARSAYILAN.exam,ok:false,skip:PLAN_VARSAYILAN.skip.slice(),tasi:{}};}
const bugunIso=()=>isoGun(new Date());
const bugunNo=()=>tkGun(Date.now());
const sinavNo=()=>tkIsoGun(S.plan.exam);
function fresh(){return{v:1,updated:0,u:{},wrong:[],seen:{},z:{},zk:null,view:"hafta",unit:"c1a",tab:"anlatim",aktif:null,kw:null,plan:freshPlan(),hafta:{},okul:{},kt:{},kaynakAcik:true,tk:tkYeni(),ts:tsYeni(),gp:gpVarsayilan(),hc:hcOnar(null),dil:"tr"};}
function normalize(s){const f=fresh();if(!s||typeof s!=="object")s={};const o=Object.assign(f,s);o.u={};
 o.tk=tkOnar(s.tk);o.ts=tsOnar(s.ts);o.gp=gpOnar(s.gp);o.hc=hcOnar(s.hc,isoGun(new Date()));
 if(o.dil!=="tr"&&o.dil!=="en")o.dil="tr";
 UNITS.forEach(u=>{o.u[u.id]=Object.assign({check:0,chal:0,checkN:0,chalN:0,hist:[],adim:{},pos:0,bitti:0},(s.u||{})[u.id]||{});if(!o.u[u.id].adim||typeof o.u[u.id].adim!=="object")o.u[u.id].adim={};});
 if(!Array.isArray(o.wrong))o.wrong=[];["seen","z","hafta","okul","kt"].forEach(k=>{if(!o[k]||typeof o[k]!=="object")o[k]={};});
 o.wrong=o.wrong.filter(w=>w&&w.q&&Array.isArray(w.q.o)&&UNIT[w.q.u]);
 o.plan=Object.assign(freshPlan(),o.plan||{});if(!Array.isArray(o.plan.skip))o.plan.skip=[];if(!o.plan.tasi||typeof o.plan.tasi!=="object")o.plan.tasi={};
 if(!VIEWS.has(o.view)||(o.view==="kontrol"&&!o.kw))o.view="hafta";if(!UNIT[o.unit])o.unit="c1a";if(!TABS.has(o.tab))o.tab="anlatim";return o;}
const VIEWS=new Set(["hafta","bugun","takvim","dersler","unit","cases","terms","mistakes","grading","teshis","ayar","kontrol"]);
const TABS=new Set(["anlatim","notlar","cards","check","chal","practice"]);
let S=(()=>{try{return normalize(JSON.parse(localStorage.getItem(LKEY)||"null"));}catch(e){return normalize(null);}})();
/* Sözlük okuyucu: değer metin, dizi ya da (parametreli cümleler için) fonksiyon olabilir. İngilizcede eksik anahtar Türkçesine düşer. */
function tx(k,...a){const L=DIL[S.dil]||DIL.tr,v=k in L?L[k]:DIL.tr[k];return typeof v==="function"?v(...a):v;}
let HF=null;
let TDB=null,UID=null,syncState="local",dbTimer=null,dbChain=Promise.resolve();
function haftalar(){if(!HF)HF=haftalarKur(S.plan,BLOKLAR);return HF;}
function planDegisti(){HF=null;}
function trim(){Object.keys(S.z).forEach(k=>{if(S.z[k]&&S.z[k].done&&k!==S.zk)delete S.z[k];});S.wrong=S.wrong.slice(-80);
 UNITS.forEach(u=>{S.u[u.id].hist=S.u[u.id].hist.slice(-40);});
 const ks=Object.entries(S.seen);if(ks.length>700){ks.sort((a,b)=>a[1]-b[1]);ks.slice(0,ks.length-600).forEach(([k])=>delete S.seen[k]);}
 tkBuda(S.tk,bugunNo());S.hc=hcOnar(S.hc,bugunIso());}
function cloudBody(){const o=JSON.parse(JSON.stringify(S));let b=JSON.stringify(o);
 if(b.length>240000){o.wrong=o.wrong.slice(-20);o.z={};o.zk=null;b=JSON.stringify(o);}
 if(b.length>240000){o.seen={};b=JSON.stringify(o);}
 if(b.length>240000){tkBuda(o.tk,bugunNo(),400);b=JSON.stringify(o);}return b;}
function save(){S.updated=Date.now();trim();try{localStorage.setItem(LKEY,JSON.stringify(S));}catch(e){}
 if(TDB&&UID){clearTimeout(dbTimer);dbTimer=setTimeout(()=>{const b=cloudBody(),up=S.updated;dbChain=dbChain.then(()=>TDB.doc(`data/users/${UID}/itmders`).set({json:b,updated:up})).then(()=>{syncState="cloud";paintPills();}).catch(()=>{syncState="local";paintPills();});},1500);}}
(async()=>{try{
 if(!(window.claude&&window.claude.use))return;
 const [d,u]=await Promise.all([claude.use("db").catch(()=>null),claude.use("user").catch(()=>null)]);
 TDB=d;UID=u?await u.id().catch(()=>null):null;
 if(TDB&&UID){try{const snap=await TDB.doc(`data/users/${UID}/itmders`).get();
   if(snap.exists){const r=JSON.parse((snap.data()||{}).json||"null");
     if(r&&(r.updated||0)>(S.updated||0)){S=normalize(r);planDegisti();try{localStorage.setItem(LKEY,JSON.stringify(S));}catch(e){}render();toast(tx("toast.yuklendi"));}
     else if((S.updated||0)>((r&&r.updated)||0))save();}
   else if(S.updated)save();
   syncState="cloud";}catch(e){syncState="local";}}
 paintPills();
}catch(e){}})();

/* ---------- soru motoru ---------- */
function mat(src,u,d,id,cs){const n=src.o.length,p=shuffle([...Array(n).keys()]);return{id,u,d,q:src.q,o:p.map(i=>src.o[i]),a:p.indexOf(0),x:src.x||"",cs:cs||null,set:!!src.set};}
function newUsed(){return{ids:new Set(),q:new Set()};}
function drawQ(uid,d,used){
 const order=d===1?[1,2,3]:d===2?[2,3,1]:[3,2,1],now=Date.now();
 for(const dd of order){
  const items=[];
  BANK.forEach(q=>{if(q.u!==uid||q.d!==dd||used.ids.has(q.id)||used.q.has(q.q))return;const ts=S.seen[q.id];items.push({w:!ts?1:(now-ts<36e5*36?.15:.5),s:q});});
  if(!items.length)continue;
  let r=R()*items.reduce((a,b)=>a+b.w,0),it=items[0];for(const x of items){if(r<x.w){it=x;break;}r-=x.w;}
  used.ids.add(it.s.id);used.q.add(it.s.q);return mat(it.s,uid,dd,it.s.id);}
 return null;}
function caseQ(cs,i){const s=cs.qs[i];return Object.assign(mat(s,s.u,3,cs.id+"-q"+i,cs.id),{set:!!cs.set});}
/* Tekrar kartı: yanlış → 0 (kart yoksa açılır); doğru → yalnız kartı varsa 1 (emin değil) ya da 2. Uzun vaka soruları kart olmaz. */
const kartAnahtar=q=>(q.mini?"a:":"q:")+q.id;
function tkIsle(q,ok,emin){if(q.cs)return;const key=kartAnahtar(q);
 if(!ok)tkCevapla(S.tk,key,0,bugunNo(),sinavNo());else if(tkKart(S.tk,key))tkCevapla(S.tk,key,emin===false?1:2,bugunNo(),sinavNo());}
function record(q,ok,pickIdx,kind,emin){
 const st=S.u[q.u];if(!st)return;st.hist.push({ok,d:q.d,k:kind,t:Date.now()});
 S.ts=tsKaydet(S.ts,{q,secilen:pickIdx,emin:emin===true||emin===false?emin:null,t:Date.now()},TERIMLER);
 tkIsle(q,ok,emin);
 S.seen[q.id]=Date.now();if(q.cs)S.seen[q.cs]=Date.now();
 if(!ok){S.wrong=S.wrong.filter(w=>w.q.id!==q.id);S.wrong.push({q,pick:pickIdx,t:Date.now()});}
 else if(kind==="redo"){S.wrong=S.wrong.filter(w=>w.q.id!==q.id);}}
const qpts=q=>q.cs?5:2;
/* Anlatım soruları her açılışta aynı sırada gelsin diye sabit karıştırma. */
function sabitSira(n,str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}
 const a=[...Array(n).keys()],r=()=>{h=Math.imul(h^(h>>>15),h|1);h^=h+Math.imul(h^(h>>>7),h|61);return((h^(h>>>14))>>>0)/4294967296;};
 for(let i=n-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function adimSoru(uid,i){const a=ders(uid).adimlar[i].soru,p=sabitSira(a.o.length,uid+"|"+i);return{id:`${uid}-adim-${i}`,u:uid,d:2,q:a.q,o:p.map(k=>a.o[k]),a:p.indexOf(0),x:a.x,cs:null,mini:true};}
const Z=()=>S.zk?(S.z[S.zk]||null):null;

/* ---------- ilerleme ---------- */
function unitInfo(uid){
 const st=S.u[uid],d=ders(uid),top=d?d.adimlar.length:0,yap=d?d.adimlar.filter((_,i)=>st.adim[i]!=null).length:0,bit=top>0&&yap===top,checkOk=st.check>=BAR,chalOk=st.chal>=BAR;
 let status;if(bit&&checkOk&&chalOk)status="done";else if(bit)status="test";else if(yap>0)status="study";else status="new";
 const h=st.hist.slice(-12);let p=.25;if(h.length>=3)p=(h.filter(x=>x.ok).length+.5)/(h.length+1);if(status==="done")p=Math.max(p,.85);
 return{status,p,top,yap,bit,checkOk,chalOk,st,olcum:h.length>=3};}
const STATUS_CLS={new:"",study:"prove",test:"test",done:"done"};
const durumEtiket=s=>[STATUS_CLS[s],tx("st."+s)];
function allInfo(){return UNITS.map(u=>Object.assign({u},unitInfo(u.id)));}
function projected(inf){return inf.reduce((a,i)=>a+i.u.pts*i.p,0);}
const konuTamam=uid=>{const i=unitInfo(uid);return i.bit&&i.checkOk;};
const vakaYapildi=ch=>CASES.some(c=>c.ch===ch&&S.seen[c.id]);
const haftaGecti=iso=>((S.hafta[iso]||{}).kontrol||[]).some(k=>k.sc/k.n>=HAFTA_ORAN);
const buPazartesi=()=>isoGun(pazartesi(new Date()));
function buHaftaW(){const W=haftalar(),now=buPazartesi();return W.find(w=>w.iso===now)||(now<W[0].iso?W[0]:W[W.length-1]);}
function aktifHafta(){const W=haftalar();return W.find(w=>w.iso===S.aktif)||buHaftaW();}
function sonBlokMu(ch,w){return !haftalar().some(x=>x.iso>w.iso&&x.chs.includes(ch));}
function haftaGorevleri(w){const t=[];
 if(w.units.length){
  w.chs.forEach(ch=>t.push({k:"okul",ch,ok:!!S.okul[ch]}));
  w.units.forEach(uid=>{t.push({k:"anlatim",uid,ok:unitInfo(uid).bit});t.push({k:"kontrol",uid,ok:S.u[uid].check>=BAR});});
  w.chs.filter(ch=>[6,11].includes(ch)&&sonBlokMu(ch,w)).forEach(ch=>t.push({k:"vaka",ch,ok:vakaYapildi(ch)}));
  t.push({k:"hk",ok:haftaGecti(w.iso)});
 }else if(w.kind==="tekrar"){
  t.push({k:"zorlu",ok:UNITS.every(u=>S.u[u.id].chal>=BAR)});
  t.push({k:"hata",ok:S.wrong.length===0});
  [6,11].forEach(ch=>t.push({k:"vaka",ch,ok:vakaYapildi(ch)}));
  t.push({k:"hk",ok:haftaGecti(w.iso)});
 }
 return t;}
/* etiket: [css sınıfı, sözlük anahtarı]; ekrana tx(etiket[1]) yazılır. */
function haftaDurum(w){const g=haftaGorevleri(w),d=g.filter(x=>x.ok).length,pct=g.length?d/g.length:0,now=buPazartesi(),zaman=w.iso<now?"gecmis":w.iso===now?"bu":"gelecek";
 let etiket;if(w.kind==="tatil")etiket=["","et.okulyok"];else if(w.kind==="sinav"&&!g.length)etiket=["ink","et.sinav"];else if(g.length&&d===g.length)etiket=["done","et.tamam"];else if(zaman==="gecmis"&&g.length)etiket=["study","et.geride"];else if(zaman==="bu")etiket=["prove","et.bu"];else etiket=["","et.sirada"];
 return{g,d,pct,zaman,etiket};}
function gecikenler(){const now=buPazartesi();return haftalar().filter(w=>w.iso<now).flatMap(w=>w.units.filter(u=>!konuTamam(u)).map(u=>({u,w})));}
function gunKaldi(){const t=new Date(),e=isoDan(S.plan.exam);t.setHours(12,0,0,0);return Math.round((e-t)/864e5);}
const trTarih=(d,o)=>d.toLocaleDateString(tx("locale"),o||{day:"numeric",month:"short"});
const uzunTarih=d=>trTarih(d,{day:"numeric",month:"long",year:"numeric"});
function aralik(w){const a=isoDan(w.iso),b=gunEkle(a,6);return a.getMonth()===b.getMonth()?`${a.getDate()}–${trTarih(b)}`:`${trTarih(a)} – ${trTarih(b)}`;}
const hIsim=w=>w.kind==="tatil"?tx("et.okulyok"):w.kind==="sinav"?tx("h.sinavHaftasi"):tx("h.haftaN",w.no);

/* ---------- küçük yardımcılar ---------- */
let toastT=null;
function toast(t){const el=document.getElementById("toast");el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>el.hidden=true,2600);}
const yuzde=x=>Math.round(x*100);
const yz=x=>tx("pct",yuzde(x));
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function scale(marks){
 const GL={0:"",23:"1.0",50:"4.2",62:"5.5",75:"7.1",100:"10"};
 const axis=[0,23,50,62,75,100].map(v=>`<i style="left:${v}%">${v}${GL[v]?`<span class="g"> · ${ond(GL[v])}</span>`:""}</i>`).join("");
 const mk=marks.map(x=>{const pos=Math.max(0,Math.min(100,x.v));return`<div class="mk ${x.cls||""} ${pos<12?"edgeL":pos>88?"edgeR":""}" style="left:${pos}%"><span>${x.label}</span></div>`;}).join("");
 return`<div class="scale"><div class="track"><div class="zone"></div><div class="zone pass"></div><div class="zone goal"></div>${mk}</div><div class="axis">${axis}</div></div>
 <div class="legend"><span><i class="lg-guess"></i>${tx("sc.guess")}</span><span><i class="lg-pass"></i>${tx("sc.pass")}</span><span><i class="lg-goal"></i>${tx("sc.goal")}</span><span>${tx("sc.axis")}</span></div>`;}
function caseBlock(id,open){const c=CASE[id];if(!c)return"";return`<details class="casebox" lang="en" ${open?"open":""}><summary><span class="mono">${tx("uzunVaka")}</span> ${c.title}</summary>${c.text.map(p=>`<p>${p}</p>`).join("")}</details>`;}
function qCard(q,o){
 const answered=o.chosen!=null,L="ABCDEF";
 const opts=q.o.map((t,k)=>{let cls="opt";if(answered||o.mode==="review"){if(k===q.a)cls+=" right";else if(k===o.chosen)cls+=" wrong";}
  return`<button class="${cls}" data-act="ans" data-i="${k}" ${o.mode==="review"||answered?"disabled":""}><span class="L">${L[k]}</span><span lang="en">${t}</span></button>`;}).join("");
 const fb=answered||o.mode==="review"?`<div class="fb">${o.chosen==null?`<b class="no">${tx("q.bos")}</b>`:o.chosen===q.a?`<b class="ok">${tx("q.dogru")}</b>`:`<b class="no">${tx("q.yanlis",L[q.a])}</b>`} ${q.x}</div>`:"";
 const etiketler=q.mini?`<span class="lvl l2">${tx("q.anlama")}</span><span class="tag">${tx("q.sinavDili")}</span>`:`<span class="lvl l${q.d}">${q.cs?tx("uzunVaka"):lvl(q.d)}</span><span class="tag">${tx("dersN",UNIT[q.u].ch)} · ${SHORT[q.u]}</span><span class="tag">${tx("nPuan",qpts(q))}</span>${q.set?`<span class="tag">${tx("dersSeti")}</span>`:""}`;
 const emin=o.emin&&!answered&&o.mode==="quiz"?eminDugme(q):"";
 const neden=(answered||o.mode==="review")&&o.chosen!=null&&o.chosen!==q.a?hcNedenBlok(q,o.chosen):"";
 return`<article class="q"><div class="meta"><span class="row" style="gap:6px">${etiketler}</span><span class="mono">${o.num?tx("q.soruN",o.num,o.total):""}</span></div>${q.cs?caseBlock(q.cs,o.caseOpen!==false):""}<div class="stem" lang="en">${q.q}</div><div class="opts">${opts}</div>${emin}${fb}${neden}${o.foot||""}</article>`;}
/* "Emin değilim": cevaptan önce basılır, varsayılan emin; her soruda kendiliğinden sıfırlanır (soru id'sine bağlı). */
let EMINSIZ=null;
const eminMi=q=>EMINSIZ!==q.id;
function eminDugme(q){const u=EMINSIZ===q.id;
 return`<div class="eminrow"><button class="mini emin" data-act="emin" data-q="${esc(q.id)}" aria-pressed="${u}">${tx("emin.btn")} <kbd>X</kbd></button><span class="muted">${u?tx("emin.acik"):tx("emin.kapali")}</span></div>`;}

/* ---------- üst bant ---------- */
function dilSec(){return`<span class="seg dilsec" role="group" aria-label="${tx("dil.aria")}">${[["tr","TR","Türkçe"],["en","EN","English"]].map(([d,k,ad])=>`<button data-act="dil" data-d="${d}" aria-pressed="${S.dil===d}" lang="${d}" title="${ad}">${k}</button>`).join("")}</span>`;}
function paintPills(){const W=haftalar(),dl=W.length?gunKaldi():null,w=W.length?buHaftaW():null,d=w?haftaDurum(w):null;
 const gun=dl==null?`<span class="pill"><b>!</b>${tx("pill.tarih")}</span>`:`<span class="pill"><b>${Math.max(0,dl)}</b>${tx("pill.kalan",dl)}</span>`;
 document.getElementById("pills").innerHTML=`${gun}${d&&d.g.length?`<span class="pill soft">${tx("nav.hafta")} <b>${yz(d.pct)}</b></span>`:""}<span class="pill soft" title="${syncState==="cloud"?tx("sync.bulutT"):tx("sync.yerelT")}"><i class="dot ${syncState==="cloud"?"on":""}"></i>${syncState==="cloud"?tx("sync.bulut"):tx("sync.yerel")}</span>${dilSec()}`;}
function paintBrand(){const b=document.getElementById("brand");if(b)b.innerHTML=tx("brand");document.title=tx("title");}
function paintRail(){const inf=Object.fromEntries(allInfo().map(i=>[i.u.id,i])),el=document.getElementById("rail"),sl=el.scrollLeft;
 const m=(v,x)=>`<button class="chip main" data-act="go" data-v="${v}" aria-pressed="${S.view===v}">${tx("nav."+v)}${x||""}</button>`;
 let h=m("hafta")+m("bugun")+m("takvim")+m("dersler")+m("cases")+m("terms")+m("mistakes",S.wrong.length?` (${S.wrong.length})`:"")+m("teshis")+m("grading")+m("ayar");
 CH_ORDER.forEach(ch=>{h+=`<span class="chgap">${tx("dersN",ch)}</span>`;UNITS.filter(u=>u.ch===ch).forEach(u=>{const i=inf[u.id];
  h+=`<button class="chip" data-act="unit" data-u="${u.id}" aria-pressed="${S.view==="unit"&&S.unit===u.id}"><small><i class="dot st-${i.status}"></i>${i.yap}/${i.top}</small><span lang="en">${SHORT[u.id]}</span></button>`;});});
 el.innerHTML=h;el.scrollLeft=sl;if(el.setAttribute)el.setAttribute("aria-label",tx("rail.aria"));
 const on=el.querySelector('[aria-pressed="true"]');if(on&&on.scrollIntoView&&S.view==="unit")on.scrollIntoView({block:"nearest",inline:"nearest"});}

/* ---------- haftalık ekran ---------- */
function serit(aktif){const W=haftalar();return`<div class="serit" role="group" aria-label="${tx("serit.aria")}">${W.map(w=>{const d=haftaDurum(w),cls=[w.kind,d.zaman==="bu"?"bu":"",d.g.length&&d.d===d.g.length?"tamam":"",d.etiket[1]==="et.geride"?"geride":""].join(" ");
  const alt=w.kind==="tatil"?"–":w.kind==="sinav"&&!w.units.length?tx("et.sinav"):w.kind==="tekrar"?tx("serit.tekrar"):w.kind==="bos"?tx("serit.bos"):w.chs.map(c=>tx("dKisa")+c).join(" ");
  return`<button class="hf ${cls}" data-act="hsec" data-iso="${w.iso}" aria-pressed="${w.iso===aktif.iso}" title="${hIsim(w)} · ${aralik(w)}"><b>${trTarih(isoDan(w.iso),{day:"numeric"})}<small>${trTarih(isoDan(w.iso),{month:"short"})}</small></b><span>${alt}</span></button>`;}).join("")}</div>`;}
function tarihBanner(){return`<section class="banner"><div><div class="eyebrow">${tx("banner.eyebrow")}</div><h3>${tx("banner.h")}</h3><p>${tx("banner.p",uzunTarih(isoDan(S.plan.exam)))}</p></div>
 <div class="row"><label class="sr" for="b-exam">${tx("sinavTarihi")}</label><input type="date" id="b-exam" value="${S.plan.exam}"><button class="btn primary" data-act="ponay">${tx("banner.btn")}</button></div></section>`;}
function konuSatir(uid){const u=UNIT[uid],i=unitInfo(uid),[cls,lab]=durumEtiket(i.status),d=ders(uid);
 const mini=(t,yazi,ok)=>`<button class="mini ${ok?"ok":""}" data-act="unit" data-u="${uid}" data-t="${t}">${yazi}</button>`;
 return`<div class="konu"><div class="konu-t"><button class="linkbtn" data-act="unit" data-u="${uid}"><i class="dot st-${i.status}"></i>${ucAd(uid)}</button><span class="konu-alt"><span class="tag ${cls}">${lab}</span>${d?`<span>${tx("nDk",d.sure)}</span>`:""}<span>${tx("nPuan",u.pts)}</span></span></div>
 <div class="konu-adim">${mini("anlatim",`${tx("tab.anlatim")} ${i.yap}/${i.top}`,i.bit)}${mini("check",`${tx("tab.check")} ${i.st.checkN?i.st.check+"/8":"–"}`,i.checkOk)}${mini("chal",`${tx("tab.chal")} ${i.st.chalN?i.st.chal+"/8":"–"}`,i.chalOk)}</div></div>`;}
function chBlok(ch,w){const c=chBilgi(ch),uids=w.units.filter(u=>UNIT[u].ch===ch),tik=!!S.okul[ch];
 const vaka=[6,11].includes(ch)&&sonBlokMu(ch,w)?`<div class="konu"><div class="konu-t"><button class="linkbtn" data-act="go" data-v="cases"><i class="dot ${vakaYapildi(ch)?"st-done":"st-new"}"></i>${tx("ch.vaka")}</button><span class="konu-alt"><span>${tx("ch.vakaAlt")}</span></span></div></div>`:"";
 return`<section class="panel chders"><div class="eyebrow">${tx("dersN",ch)} · ${PARTS[partOf(ch)].short}</div><h3>${chAd(ch)}</h3><p class="sub" lang="en">${CHAPTERS[ch].t}</p>
 ${c?`<div class="giris">${c.giris}${c.baglanti}</div>`:""}
 <div class="okulbox"><button class="tik ${tik?"ok":""}" data-act="okul" data-ch="${ch}" aria-pressed="${tik}" aria-label="${tx("okul.tik")}"></button><div class="okulmetin"><b>${tx("okul.tik")}</b>
 ${c?`<details><summary>${tx("okul.hazirlik")}</summary><dl><dt>${tx("okul.once")}</dt><dd>${c.okul.once}</dd><dt>${tx("okul.odak")}</dt><dd><ul>${c.okul.odak.map(x=>`<li>${x}</li>`).join("")}</ul></dd><dt>${tx("okul.sonra")}</dt><dd>${c.okul.sonra}</dd></dl></details>`:""}</div></div>
 <div class="konular">${uids.map(konuSatir).join("")}${vaka}</div></section>`;}
function hkPanel(w){const r=S.hafta[w.iso]||{},k=r.kontrol||[],key="hafta:"+w.iso,z=S.z[key],devam=z&&!z.done,gecti=haftaGecti(w.iso),tekrar=w.kind==="tekrar",eski=tekrar?0:Math.min(3,haftalar().filter(x=>x.iso<w.iso).flatMap(x=>x.units).length),hazir=w.units.every(u=>unitInfo(u).bit);
 const n=tekrar?15:10,bar=Math.ceil(n*HAFTA_ORAN);
 return`<section class="panel hk"><div class="hk-t"><div class="eyebrow">${tx("hk.ad")}</div><h3>${tekrar?tx("hk.hTekrar"):tx("hk.h")}</h3><p class="sub">${tx("hk.sub",{tekrar,n,eski,bar,erken:!tekrar&&!hazir})}</p>
 ${k.length?`<div class="row denemeler">${k.slice(-6).map(x=>`<span class="tag ${x.sc/x.n>=HAFTA_ORAN?"done":"study"}">${x.sc}/${x.n} · ${trTarih(new Date(x.t))}</span>`).join("")}</div>`:""}</div>
 <div class="row"><button class="btn ${gecti?"":"primary"}" data-act="hstart" data-iso="${w.iso}" data-devam="${devam?1:0}">${devam?tx("hk.devam",z.ans.filter(a=>a!=null).length,z.qs.length):k.length?tx("hk.yeniden"):tx("hk.basla")}</button></div></section>`;}
function notPanel(w){const r=S.hafta[w.iso]||{};return`<section class="panel"><label class="eyebrow" for="hnot">${tx("not.ad")}</label><textarea id="hnot" data-iso="${w.iso}" rows="3" placeholder="${tx("not.ph")}">${esc(r.not||"")}</textarea></section>`;}
function sonrakiGorev(w){const g=haftaGorevleri(w).filter(x=>!x.ok&&x.k!=="okul")[0];if(!g)return null;
 if(g.k==="anlatim")return{t:tx("sn.anlatim",ucAd(g.uid)),attr:`data-act="unit" data-u="${g.uid}" data-t="anlatim"`};
 if(g.k==="kontrol")return{t:tx("gv.kontrol",ucAd(g.uid)),attr:`data-act="unit" data-u="${g.uid}" data-t="check"`};
 if(g.k==="vaka")return{t:tx("sn.vaka"),attr:`data-act="go" data-v="cases"`};
 if(g.k==="hk")return{t:tx("sn.hk"),attr:`data-act="hstart" data-iso="${w.iso}" data-devam="${S.z["hafta:"+w.iso]&&!S.z["hafta:"+w.iso].done?1:0}"`};
 if(g.k==="zorlu"){const u=UNITS.find(x=>S.u[x.id].chal<BAR);return{t:tx("gv.zorlu",ucAd(u.id)),attr:`data-act="unit" data-u="${u.id}" data-t="chal"`};}
 if(g.k==="hata")return{t:tx("gv.hata"),attr:`data-act="go" data-v="mistakes"`};
 return null;}

/* ---------- günlük plan, telafi, takvim dosyası (gunluk.js) ---------- */
const GP_DK={okul:0,kontrol:8,vaka:20,hk:10,zorlu:10,hata:10};
const gunAd=i=>tx("gunKisa")[i],gunUzun=i=>tx("gunUzun")[i];
function gorevDk(t){return t.k==="anlatim"?((ders(t.uid)||{}).sure||15):(GP_DK[t.k]||0);}
const GECMIS_TUR=["anlatim","kontrol","vaka"];
function gecmisGorevler(once){const gor=new Set(),out=[];
 haftalar().filter(x=>x.iso<once).forEach(x=>haftaGorevleri(x).forEach(t=>{if(t.ok||!GECMIS_TUR.includes(t.k))return;const k=t.k+"|"+(t.uid||t.ch);if(gor.has(k))return;gor.add(k);out.push(Object.assign({},t,{dk:gorevDk(t),hafta:x.iso}));}));
 return out;}
function gunPlani(){const W=haftalar();if(!W.length)return null;const w=buHaftaW(),buMu=w.iso===buPazartesi();
 const gorevler=haftaGorevleri(w).map(t=>Object.assign({},t,{dk:gorevDk(t)}));
 const p=gpHaftaPlani({gorevler,haftaIso:w.iso,bugun:bugunIso(),musaitlik:S.gp.musaitlik,dersGunu:S.gp.dersGunu,gecikmis:buMu?gecmisGorevler(w.iso):[]});
 return Object.assign({w,buMu},p,{bugun:p.gunler.find(g=>g.durum==="bugun")||null});}
function gorevBag(t,w){
 if(t.k==="okul")return{t:tx("gv.okul",t.ch),attr:`data-act="go" data-v="hafta"`};
 if(t.k==="anlatim")return{t:tx("gv.anlatim",ucAd(t.uid)),attr:`data-act="unit" data-u="${t.uid}" data-t="anlatim"`};
 if(t.k==="kontrol")return{t:tx("gv.kontrol",ucAd(t.uid)),attr:`data-act="unit" data-u="${t.uid}" data-t="check"`};
 if(t.k==="vaka")return{t:tx("gv.vaka",t.ch),attr:`data-act="go" data-v="cases"`};
 if(t.k==="hk"){const z=S.z["hafta:"+w.iso];return{t:tx("hk.ad"),attr:`data-act="hstart" data-iso="${w.iso}" data-devam="${z&&!z.done?1:0}"`};}
 if(t.k==="zorlu"){const u=UNITS.find(x=>S.u[x.id].chal<BAR);return u?{t:tx("gv.zorlu",ucAd(u.id)),attr:`data-act="unit" data-u="${u.id}" data-t="chal"`}:{t:tx("gv.zorlular"),attr:`data-act="go" data-v="hafta"`};}
 if(t.k==="hata")return{t:tx("gv.hata"),attr:`data-act="go" data-v="mistakes"`};
 return{t:tx("gv.diger"),attr:`data-act="go" data-v="hafta"`};}
function gorevSatir(t,w){const b=gorevBag(t,w);
 return`<div class="konu"><div class="konu-t"><button class="linkbtn" ${b.attr}><i class="dot ${t.gecikmis?"st-study":"st-new"}"></i>${b.t}</button><span class="konu-alt">${t.dk?`<span>${tx("nDk",t.dk)}</span>`:""}${t.gecikmis?`<span class="tag study">${tx("gp.geriden")}</span>`:""}</span></div></div>`;}
function gunSerit(p){if(!p||!p.gunler.length)return"";const sigmayan=p.sigmayan.filter(t=>t.k!=="okul");
 const hucre=g=>{const d=isoDan(g.iso),n=g.gorevler.length;return`<div class="gn ${g.durum}${g.kapasite===0?" dinlen":""}" role="listitem" aria-label="${tx("gp.hucreAria",gunUzun(g.gun),d.getDate(),n,g.dk)}"><b>${gunAd(g.gun)}</b><span class="mono">${d.getDate()}</span><small>${g.kapasite===0?tx("gp.dinlen"):tx("gp.dolu",g.dk,g.kapasite)}</small><i>${n?tx("gp.nIs",n):tx("gp.bos")}</i></div>`;};
 const liste=p.gunler.filter(g=>g.gorevler.length).map(g=>`<div class="gpgun"><div class="eyebrow">${gunUzun(g.gun)}${g.durum==="bugun"?tx("gp.bugunEk"):""}</div><div class="konular">${g.gorevler.map(t=>gorevSatir(t,p.w)).join("")}</div></div>`).join("");
 return`<section class="panel gunplan"><div class="eyebrow">${tx("gp.baslik")}</div><div class="gunler" role="list">${p.gunler.map(hucre).join("")}</div>
 ${liste?`<details class="kaynakbox gpd"><summary>${tx("gp.liste")}</summary>${liste}</details>`:""}
 ${sigmayan.length?`<p class="sub" style="margin:10px 0 0">${tx("gp.sigmadi",sigmayan.length,p.acikDk)}</p>`:""}</section>`;}
function telafiKarar(){const W=haftalar(),now=buPazartesi(),kalanDk={};
 W.forEach(w=>{kalanDk[w.iso]=haftaGorevleri(w).filter(t=>!t.ok&&t.k!=="okul"&&(w.iso>=now||GECMIS_TUR.includes(t.k))).reduce((a,t)=>a+gorevDk(t),0);});
 return gpTelafi({haftalar:W,kalanDk,bugun:bugunIso(),musaitlik:S.gp.musaitlik});}
function telafiCumle(T){const k=T.karar,bit=k.bitisIso?trTarih(isoDan(k.bitisIso),{day:"numeric",month:"long"}):null;
 return tx("telafi.cumle",k,bit,yuzde(Math.min(1,k.yuk)));}
/* icsMesaj ve yedekMesaj sözlük anahtarı tutar: dil değişince mesaj da çevrilir. */
let icsMesaj="",icsMetin="";
async function icsAktar(){const adlar={};UNITS.forEach(u=>{adlar[u.id]=String(ucAd(u.id)).replace(/<[^>]+>/g,"");});
 const data=gpIcs({haftalar:haftalar(),sinavIso:S.plan.exam,dersGunu:S.gp.dersGunu,adlar,uretildi:Date.now(),dil:S.dil}),filename="itm-plan.ics";icsMetin="";
 try{if(window.claude&&typeof window.claude.use==="function"){const dl=await window.claude.use("downloads");if(dl&&typeof dl.save==="function"){await dl.save({filename,data});icsMesaj="ics.kayit";render();return;}}}catch(e){}
 try{if(typeof Blob!=="undefined"&&typeof URL!=="undefined"&&URL.createObjectURL&&document.createElement){const a=document.createElement("a"),u=URL.createObjectURL(new Blob([data],{type:"text/calendar;charset=utf-8"}));a.href=u;a.download=filename;a.style.display="none";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);icsMesaj="ics.indir";render();return;}}catch(e){}
 icsMetin=data;icsMesaj="ics.kopya";render();}
function gecikenPanel(w){const G=gecikenler();if(!G.length)return"";const ilk=G.slice(0,6);
 const T=telafiKarar();
 return`<section class="panel geciken"><div class="eyebrow">${tx("gc.ad")}</div><h3>${tx("gc.h",G.length)}</h3><p class="sub">${tx("gc.sub")}</p><p class="telafi ${T.karar.durum}"><b>${tx("gc.durum."+(T.karar.durum==="rahat"||T.karar.durum==="sinirda"?T.karar.durum:"yetmez"))}</b> ${telafiCumle(T)}</p><div class="konular">${ilk.map(x=>`<div class="konu"><div class="konu-t"><button class="linkbtn" data-act="unit" data-u="${x.u}"><i class="dot st-${unitInfo(x.u).status}"></i>${ucAd(x.u)}</button><span class="konu-alt"><span class="tag study">${hIsim(x.w)}</span></span></div></div>`).join("")}</div>${G.length>6?`<p class="sub" style="margin:10px 0 0">${tx("gc.daha",G.length-6)}</p>`:""}</section>`;}
function tekrarIcerik(w){const bekleyen=UNITS.filter(u=>S.u[u.id].chal<BAR);
 return`<section class="panel"><div class="eyebrow">${tx("h.genelTekrar")}</div><h3>${tx("tk.h")}</h3><p class="sub">${tx("tk.sub")}</p>
 <div class="konular"><div class="konu"><div class="konu-t"><b>${tx("gv.zorlular")}</b><span class="konu-alt"><span class="tag ${bekleyen.length?"prove":"done"}">${bekleyen.length?tx("tk.bekliyor",bekleyen.length):tx("tk.hepsi")}</span></span></div>${bekleyen.length?`<div class="konu-adim">${bekleyen.slice(0,8).map(u=>`<button class="mini" data-act="unit" data-u="${u.id}" data-t="chal" lang="en">${SHORT[u.id]}</button>`).join("")}</div>`:""}</div>
 <div class="konu"><div class="konu-t"><button class="linkbtn" data-act="go" data-v="mistakes"><i class="dot ${S.wrong.length?"st-study":"st-done"}"></i>${tx("tk.hata")}</button><span class="konu-alt"><span>${tx("tk.listede",S.wrong.length)}</span></span></div></div>
 ${[6,11].map(ch=>`<div class="konu"><div class="konu-t"><button class="linkbtn" data-act="go" data-v="cases"><i class="dot ${vakaYapildi(ch)?"st-done":"st-new"}"></i>${tx("tk.vaka",ch)}</button></div></div>`).join("")}
 <div class="konu"><div class="konu-t"><button class="linkbtn" data-act="go" data-v="terms"><i class="dot st-new"></i>${tx("tk.terim")}</button><span class="konu-alt"><span>${tx("nTerim",ALLT.length)}</span></span></div></div></div></section>`;}
function vHafta(){const W=haftalar();
 if(!W.length)return`<div class="page"><section class="panel empty"><h3>${tx("h.uyusmuyor")}</h3><p>${tx("h.uyusmuyorP")}</p><button class="btn primary" data-act="go" data-v="ayar">${tx("h.duzelt")}</button></section></div>`;
 const w=aktifHafta(),d=haftaDurum(w),i=W.indexOf(w),sn=sonrakiGorev(w),buMu=w.iso===buHaftaW().iso;
 const baslik=w.kind==="tatil"?tx("h.tatil"):w.kind==="tekrar"?tx("h.genelTekrar"):w.kind==="bos"?tx("h.bos"):w.kind==="sinav"&&!w.units.length?tx("h.sinavHaftasi"):w.chs.map(ch=>`${tx("dersN",ch)}: ${chAd(ch)}`).join(" · ");
 const alt=w.kind==="tatil"?tx("h.tatilAlt"):w.kind==="bos"?tx("h.bosAlt"):w.kind==="tekrar"?tx("h.tekrarAlt"):w.kind==="sinav"&&!w.units.length?tx("h.sinavAlt"):tx("h.dersAlt",w.units.length,w.units.reduce((a,u)=>a+(ders(u)?ders(u).sure:0),0));
 const orta=w.units.length?w.chs.map(ch=>chBlok(ch,w)).join(""):w.kind==="tekrar"?tekrarIcerik(w):w.kind==="sinav"?`<section class="panel"><h3>${tx("h.giderken")}</h3><ul class="rules-list">${tx("h.giderkenL").map(x=>`<li>${x}</li>`).join("")}</ul><div class="row" style="margin-top:12px"><button class="btn" data-act="go" data-v="grading">${tx("h.kurallar")}</button><button class="btn" data-act="go" data-v="mistakes">${tx("h.hatalarim")}</button></div></section>`:"";
 const gp=gunPlani();
 return`<div class="page">${S.plan.ok?"":tarihBanner()}${bugunKisa(gp)}${serit(w)}
 <section class="hero wk"><div class="row" style="justify-content:space-between"><div class="eyebrow">${hIsim(w)}${w.no?" / "+W.filter(x=>x.no).length:""} · ${aralik(w)}</div><div class="row" style="gap:6px"><span class="tag ${d.etiket[0]}">${tx(d.etiket[1])}</span><button class="btn sm" data-act="hkay" data-d="-1" ${i===0?"disabled":""} aria-label="${tx("h.onceki")}">‹</button>${buMu?"":`<button class="btn sm" data-act="hbu">${tx("h.buHaftaya")}</button>`}<button class="btn sm" data-act="hkay" data-d="1" ${i===W.length-1?"disabled":""} aria-label="${tx("h.sonraki")}">›</button></div></div>
 <h2>${baslik}</h2><p>${alt}</p>
 ${d.g.length?`<div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${yuzde(d.pct)}"><i style="width:${yuzde(d.pct)}%"></i></div><div class="meter-t">${tx("h.gorevBitti",d.d,d.g.length)}</div>`:""}
 ${sn?`<div class="row"><button class="btn primary" ${sn.attr}>${sn.t}</button></div>`:d.g.length?`<div class="row"><span class="tag done">${tx("h.hepsiBitti")}</span></div>`:""}</section>
 ${buMu&&gp&&gp.buMu?gunSerit(gp):""}${buMu?gecikenPanel(w):""}${orta}${w.units.length||w.kind==="tekrar"?hkPanel(w):""}${w.kind==="tatil"?"":notPanel(w)}</div>`;}

/* ---------- takvim ve durum ---------- */
function vTakvim(){const W=haftalar();if(!W.length)return vHafta();
 const inf=allInfo(),pp=projected(inf),pg=grade(pp),bitenAdim=inf.reduce((a,i)=>a+i.yap,0),biten=inf.filter(i=>i.bit&&i.checkOk).length,olcu=inf.filter(i=>i.olcum).length,G=gecikenler();
 const satir=W.map(w=>{const d=haftaDurum(w),konu=w.units.length?w.chs.map(ch=>`${tx("dersN",ch)}: ${chAd(ch)}`).join(" · "):w.kind==="tatil"?tx("et.okulyok"):w.kind==="tekrar"?tx("h.genelTekrar"):w.kind==="sinav"?tx("et.sinav"):tx("tv.serbest");
  return`<button class="hsatir ${d.zaman==="bu"?"bu":""}" data-act="hsec" data-iso="${w.iso}" data-git="1"><span class="mono hs-t">${aralik(w)}</span><span class="hs-k"><b>${konu}</b>${w.units.length?`<small>${w.units.map(u=>SHORT[u]).join(" · ")}</small>`:""}</span><span class="hs-s">${d.g.length?`<span class="minibar"><i style="width:${yuzde(d.pct)}%"></i></span>`:""}<span class="tag ${d.etiket[0]}">${tx(d.etiket[1])}</span></span></button>`;}).join("");
 const chs=CH_ORDER.map(c=>{const us=inf.filter(i=>i.u.ch===c),n=us.reduce((a,i)=>a+i.u.pts,0),p=us.reduce((a,i)=>a+i.u.pts*i.p,0)/n,olc=us.some(i=>i.olcum);
  return`<div class="chb"><div class="t"><b>${tx("dersN",c)} · ${chAd(c)}</b><span class="muted">${PARTS[partOf(c)].short} · ${tx("nPuan",n)}</span></div><div class="bar"><i class="${p>=.75?"ok":p>=.6?"mid":""}" style="width:${yuzde(p)}%"></i><span class="goal" title="${tx("tv.hedefT")}"></span></div><div class="num">${olc?yz(p):tx("tv.olculmedi")}</div></div>`;}).join("");
 return`<div class="page"><section class="panel"><div class="eyebrow">${tx("tv.eyebrow")}</div><h3>${tx("serit.aria")}</h3><p class="sub">${tx("tv.sub")}</p><div class="hliste">${satir}</div><div class="row" style="margin-top:12px"><button class="btn" data-act="go" data-v="ayar">${tx("tv.duzenle")}</button></div></section>
 <section class="panel"><div class="eyebrow">${tx("tv.durum")}</div><div class="stand" style="margin-top:10px"><div class="stat"><div class="eyebrow">${tx("tv.biten")}</div><b class="${biten===28?"c-good":""}">${biten}</b><span>${tx("tv.bitenAlt")}</span></div><div class="stat"><div class="eyebrow">${tx("tab.anlatim")}</div><b>${bitenAdim}</b><span>${tx("tv.adimAlt",TOPLAM_ADIM,G.length)}</span></div><div class="stat tg"><div class="eyebrow">${tx("tv.tahmin")}</div><b>${Math.round(pp)}</b><span>${olcu?tx("tv.notAlt",gf(pg),olcu):tx("tv.henuz")}</span></div></div>
 ${scale([{v:pp,label:tx("tv.suAn",Math.round(pp)),cls:"proj"}])}<p class="muted" style="margin:6px 0 0;font-size:14px">${tx("tv.tahminP")}</p></section>
 <section class="panel"><h3>${tx("tv.derslereGore")}</h3><p class="sub">${tx("tv.derslereGoreP")}</p><div class="chbars">${chs}</div></section></div>`;}

/* ---------- ders listesi ---------- */
function haftasi(ch){const w=haftalar().filter(x=>x.chs.includes(ch));return w.length?w.map(x=>aralik(x)).join(", "):tx("dl.yok");}
function vDersler(){return`<div class="page"><section class="panel"><div class="eyebrow">${tx("dl.eyebrow")}</div><h3>${tx("dl.h")}</h3><p class="sub">${tx("dl.sub")}</p></section>
 ${CH_ORDER.map(ch=>{const c=chBilgi(ch),us=UNITS.filter(u=>u.ch===ch),bit=us.filter(u=>konuTamam(u.id)).length;return`<section class="panel chders"><div class="row" style="justify-content:space-between"><div class="eyebrow">${tx("dersN",ch)} · ${PARTS[partOf(ch)].short} · ${tx("nPuan",us.reduce((a,u)=>a+u.pts,0))}</div><span class="tag ${bit===us.length?"done":""}">${tx("dl.nKonu",bit,us.length)}</span></div><h3>${chAd(ch)}</h3><p class="sub"><span lang="en">${CHAPTERS[ch].t}</span> · ${haftasi(ch)}</p>${c?`<div class="giris">${c.giris}</div>`:""}<div class="konular">${us.map(u=>konuSatir(u.id)).join("")}</div></section>`;}).join("")}</div>`;}

/* ---------- konu ekranı ---------- */
let P=null, FC=null;
function vUnit(){const u=UNIT[S.unit],i=unitInfo(u.id),[cls,lab]=durumEtiket(i.status),d=ders(u.id);
 const tabs=[["anlatim",`<span class="sc ${i.bit?"ok":""}">${i.yap}/${i.top}</span>`],["notlar",""],["cards",""],["check",`<span class="sc ${i.checkOk?"ok":""}">${i.st.check}/8</span>`],["chal",`<span class="sc ${i.chalOk?"ok":""}">${i.st.chal}/8</span>`],["practice",""]];
 let body="";
 if(S.tab==="anlatim")body=vAnlatim(u);else if(S.tab==="notlar")body=vNotlar(u,i);else if(S.tab==="cards")body=vCards(u);else if(S.tab==="check"||S.tab==="chal")body=vQuizTab(u,i,S.tab);else body=vPractice(u);
 return`<div class="page"><div class="uhead"><div class="eyebrow">${tx("dersN",u.ch)} · ${chAd(u.ch)} · ${PARTS[partOf(u.ch)].short}</div><h2>${ucAd(u.id)}</h2><div class="row" style="gap:8px"><span class="tag ${cls}">${lab}</span>${d?`<span class="tag">${tx("nDk",d.sure)}</span>`:""}<span class="tag">${tx("u.sinavda",u.pts)}</span></div></div>
 <div class="steps" role="tablist">${tabs.map(([k,x])=>`<button class="step" role="tab" aria-selected="${S.tab===k}" data-act="tab" data-t="${k}">${tx("tab."+k)}${x}</button>`).join("")}</div>${body}</div>`;}
function vAnlatim(u){const d=ders(u.id);if(!d)return vNotlar(u,unitInfo(u.id));const st=S.u[u.id],n=d.adimlar.length,p=Math.min(Math.max(st.pos||0,0),n+1);st.pos=p;
 const strip=s=>s.replace(/<[^>]+>/g,"");
 const nav=`<nav class="adimnav" aria-label="${tx("an.navAria")}"><button class="an yazi ${p===0?"cur":""}" data-act="apos" data-p="0" ${p===0?'aria-current="step"':""}>${tx("an.giris")}</button>${d.adimlar.map((a,i)=>{const c=st.adim[i],q=c!=null?adimSoru(u.id,i):null;return`<button class="an ${p===i+1?"cur":""} ${c!=null?(c===q.a?"ok":"no"):""}" data-act="apos" data-p="${i+1}" title="${esc(strip(a.baslik))}" aria-label="${tx("an.adimAria",i+1)}: ${esc(strip(a.baslik))}" ${p===i+1?'aria-current="step"':""}>${i+1}</button>`;}).join("")}<button class="an yazi ${p===n+1?"cur":""}" data-act="apos" data-p="${n+1}" ${p===n+1?'aria-current="step"':""}>${tx("an.ozet")}</button></nav>`;
 return nav+(p===0?vGiris(u,d):p>n?vOzet(u,d):vAdim(u,d,st,p-1));}
function vGiris(u,d){return`<article class="panel adim"><div class="eyebrow">${tx("an.neden")}</div><div class="anl">${d.neden}</div>
 <h4>${tx("an.sonunda")}</h4><ul class="hedef">${d.hedefler.map(x=>`<li>${x}</li>`).join("")}</ul>
 <h4>${tx("an.sinavda")}</h4><div class="anl kucuk">${d.sinavda}</div>
 <h4>${tx("an.adimlar")}</h4><ol class="adimliste">${d.adimlar.map((a,i)=>`<li><button class="linkbtn" data-act="apos" data-p="${i+1}">${a.baslik}</button></li>`).join("")}</ol>
 <div class="row" style="margin-top:6px"><button class="btn primary" data-act="apos" data-p="1" data-next>${tx("an.basla")} <kbd>Enter</kbd></button></div></article>`;}
function vAdim(u,d,st,i){const a=d.adimlar[i],q=adimSoru(u.id,i),ch=st.adim[i]!=null?st.adim[i]:null,son=i===d.adimlar.length-1,terim=u.terms.filter(t=>a.terimler.includes(t[0])),kay=a.kaynak.map(k=>NOT[u.id].seg[k]).join("");
 const foot=`<div class="qfoot"><button class="btn" data-act="apos" data-p="${i}" data-prev>${tx("geri")}</button>${ch!=null?`<button class="btn primary" data-act="apos" data-p="${i+2}" data-next>${son?tx("an.ozeteGec"):tx("an.sonrakiAdim")} <kbd>Enter</kbd></button>`:`<span class="muted" style="font-size:14px">${tx("an.yanitla")}</span>`}</div>`;
 return`<article class="panel adim"><div class="eyebrow">${tx("an.adimN",i+1,d.adimlar.length)}</div><h3>${a.baslik}</h3><div class="anl">${a.anlatim}</div>
 <div class="ornek"><div class="eyebrow">${tx("an.ornek")}</div>${a.ornek}</div>
 ${terim.length?`<div class="adimterim"><div class="eyebrow">${tx("an.terimler")}</div><div class="terms" lang="en">${terim.map(([x,y])=>`<div><b>${x}${dinle(x)}</b><span>${y}</span></div>`).join("")}</div></div>`:""}
 <details class="kaynakbox" ${S.kaynakAcik?"open":""}><summary>${tx("an.kursNotu")}</summary><div class="notes" lang="en">${kay}</div></details></article>
 ${qCard(q,{mode:"quiz",chosen:ch,mini:true,foot}).replace(/data-act="ans"/g,'data-act="sans"')}${hcAdimPanel(u,d,i,ch!=null)}`;}
function vOzet(u,d){const st=S.u[u.id],tam=d.adimlar.every((_,i)=>st.adim[i]!=null),eksik=d.adimlar.findIndex((_,i)=>st.adim[i]==null),dogru=d.adimlar.filter((_,i)=>st.adim[i]!=null&&st.adim[i]===adimSoru(u.id,i).a).length;
 return`<article class="panel adim"><div class="eyebrow">${tx("an.ozet")}</div><h3>${tx("oz.h")}</h3><ul class="hedef">${d.ozet.map(x=>`<li>${x}</li>`).join("")}</ul>
 <div class="aklinda">${d.aklinda}</div>
 <h4>${tx("oz.tuzaklar")}</h4><div class="tuzak">${d.tuzaklar.map(t=>`<div class="tz"><div class="tz-y"><span class="eyebrow">${tx("oz.yanlis")}</span>${t.yanlis}</div><div class="tz-d"><span class="eyebrow">${tx("oz.dogrusu")}</span>${t.dogru}</div></div>`).join("")}</div>
 ${NOT[u.id].trap?`<details class="kaynakbox"><summary>${tx("oz.sinavNotu")}</summary><div class="notes" lang="en">${NOT[u.id].trap}</div></details>`:""}
 </article>
 <section class="panel"><div class="eyebrow">${tx("sonrakiAdim")}</div><h3>${tam?tx("oz.bitti",dogru,d.adimlar.length):tx("oz.eksikH")}</h3><p class="sub">${tam?tx("oz.bittiP"):tx("oz.eksikP")}</p><div class="row">${tam?`<button class="btn primary" data-act="tab" data-t="check">${tx("oz.kontrole")}</button><button class="btn" data-act="tab" data-t="cards">${tx("oz.kartlara")}</button><button class="btn" data-act="asifirla">${tx("oz.bastan")}</button>`:`<button class="btn primary" data-act="apos" data-p="${eksik+1}">${tx("oz.eksikBtn")}</button>`}</div></section>`;}
function vNotlar(u,i){const next=i.checkOk?"chal":"check";
 return`<div class="lgrid"><section class="panel notes" lang="en">${u.notes}<h4>Key terms</h4><div class="terms">${u.terms.map(([a,b])=>`<div><b>${a}</b><span>${b}</span></div>`).join("")}</div></section>
 <aside class="side"><div class="panel"><div class="eyebrow">${tx("sonrakiAdim")}</div><h3 style="margin-top:6px">${tx("nt.h."+next)}</h3><p class="sub">${tx("nt.p."+next)}</p><button class="btn primary" data-act="tab" data-t="${next}">${tx("nt.btn."+next)}</button><button class="btn" style="margin-top:8px" data-act="tab" data-t="cards">${tx("nt.kartlar")}</button></div>
 <div class="panel"><div class="eyebrow">${tx("nt.ilerleme")}</div><table class="data" style="margin-top:6px"><tr><td>${tx("nt.enIyiCheck")}</td><td class="num">${i.st.check}/8</td></tr><tr><td>${tx("nt.enIyiChal")}</td><td class="num">${i.st.chal}/8</td></tr><tr><td>${tx("nt.son")}</td><td class="num">${i.st.hist.length?tx("pct",Math.round(i.st.hist.slice(-10).filter(x=>x.ok).length/Math.min(10,i.st.hist.length)*100)):"–"}</td></tr></table></div></aside></div>`;}
function vCards(u){
 if(!FC||FC.u!==u.id)FC={u:u.id,order:shuffle(u.terms.map((_,k)=>k)),i:0,flip:false,again:0,known:0};
 if(FC.i>=FC.order.length)return`<section class="panel empty"><h3>${tx("fc.bitti")}</h3><p>${tx("fc.sonuc",FC.known,FC.again)}</p><div class="row" style="justify-content:center"><button class="btn primary" data-act="fcreset">${tx("fc.yeniden")}</button><button class="btn" data-act="tab" data-t="check">${tx("fc.kontrole")}</button></div></section>`;
 const [a,b]=u.terms[FC.order[FC.i]];
 return`<section class="fcwrap"><div class="row" style="justify-content:space-between"><span class="mono muted">${tx("kartN",FC.i+1,FC.order.length)}</span><button class="btn sm" data-act="fcreset">${tx("fc.karistir")}</button></div>
 <button class="fcard ${FC.flip?"flip":""}" data-act="fcflip" aria-label="${tx("fc.cevir")}"><div class="fin2"><div class="face front"><span class="mono muted">${tx("fc.on")}</span><b lang="en">${a}</b><span class="mono muted">${tx("fc.ipucu")}</span></div><div class="face back"><span class="mono muted" lang="en">${a}</span><p lang="en">${b}</p></div></div></button>
 <div class="row" style="justify-content:center"><button class="btn bad" data-act="fcnext" data-k="0">${tx("fc.tekrar")} <kbd>1</kbd></button><button class="btn good" data-act="fcnext" data-k="1">${tx("fc.biliyorum")} <kbd>2</kbd></button></div></section>`;}
function vQuizTab(u,i,kind){const key=kind+":"+u.id,z=S.z[key];
 if(z){S.zk=key;return quizRunner(z);}
 const best=kind==="check"?i.st.check:i.st.chal,n=kind==="check"?i.st.checkN:i.st.chalN;
 return`<section class="panel qintro"><div class="eyebrow">${tx("tab."+kind)}</div><h3>${tx("qi.h."+kind)}</h3>
 <ul class="rules-list"><li>${tx("qi.l1."+kind)}</li><li>${tx("qi.l2")}</li><li>${tx("qi.l3")}</li></ul>
 <p class="muted" style="margin:0">${n?tx("qi.enIyi",best,n,best>=BAR):tx("qi.yok")}</p>
 <div class="row"><button class="btn primary" data-act="startquiz" data-k="${kind}">${tx("qi.btn."+kind)}</button></div></section>`;}
function quizRunner(z){
 if(z.done&&z.kind==="kars"){const sc=z.ans.filter((a,k)=>a===z.qs[k].a).length,miss=z.qs.map((q,k)=>[q,z.ans[k]]).filter(([q,a])=>a!==q.a);
  return`<section class="panel"><div class="score"><div class="big ${sc/z.qs.length>=HAFTA_ORAN?"c-good":"c-bad"}">${sc}/${z.qs.length}</div><div><h3>${miss.length?tx("ks.hKacti"):tx("ks.hTam")}</h3><p class="sub" style="margin:0">${miss.length?tx("ks.pKacti"):tx("ks.pTam")}</p></div></div>
  <div class="row" style="margin-top:14px"><button class="btn primary" data-act="karsbit">${tx("ks.don")}</button></div></section>
  ${miss.length?`<h3 style="margin-top:4px">${tx("qr.kacirdiklarin")}</h3><div class="review">${miss.map(([q,a])=>qCard(q,{mode:"review",chosen:a,caseOpen:false})).join("")}</div>`:""}`;}
 if(z.done){const sc=z.ans.filter((a,k)=>a===z.qs[k].a).length,bar=Math.ceil(z.qs.length*HAFTA_ORAN),ok=sc>=bar,miss=z.qs.map((q,k)=>[q,z.ans[k]]).filter(([q,a])=>a!==q.a),redo=z.kind==="redo",hafta=z.kind==="hafta";
  const nextBtn=z.kind==="check"&&ok?`<button class="btn primary" data-act="tab" data-t="chal">${tx("qr.zorluya")}</button>`:(z.kind==="chal"||hafta)&&ok?`<button class="btn primary" data-act="go" data-v="hafta" data-iso="${z.week||""}">${tx("qr.haftama")}</button>`:"";
  const baslik=redo?tx("qr.duzeldi",sc,z.qs.length):ok?tx("qr.ustunde"):tx("qr.altinda",bar,z.qs.length);
  const aciklama=redo?tx("qr.pRedo"):ok?(z.kind==="check"?tx("qr.pCheck"):hafta?tx("qr.pHafta"):tx("qr.pChal")):tx("qr.pAlt");
  const tekrar=redo?`<button class="btn" data-act="go" data-v="mistakes">${tx("qr.hatalara")}</button>`:hafta?`<button class="btn ${ok?"":"primary"}" data-act="hstart" data-iso="${z.week}" data-devam="0">${tx("qr.yeniTekrar")}</button>${ok?"":`<button class="btn" data-act="go" data-v="hafta" data-iso="${z.week}">${tx("qr.haftama")}</button>`}`:`<button class="btn ${ok?"":"primary"}" data-act="startquiz" data-k="${z.kind}">${tx("qr.yeniDene")}</button>${!ok?`<button class="btn" data-act="tab" data-t="anlatim">${tx("qr.anlatima")}</button>`:""}`;
  return`<section class="panel"><div class="score"><div class="big ${ok?"c-good":"c-bad"}">${sc}/${z.qs.length}</div><div><h3>${baslik}</h3><p class="sub" style="margin:0">${aciklama}</p></div></div>
  <div class="row" style="margin-top:14px">${nextBtn}${tekrar}</div></section>
  ${miss.length?`<h3 style="margin-top:4px">${tx("qr.kacirdiklarin")}</h3><div class="review">${miss.map(([q,a])=>qCard(q,{mode:"review",chosen:a,caseOpen:false})).join("")}</div>`:""}`;}
 const q=z.qs[z.i],ch=z.ans[z.i],answered=ch!=null,last=z.i===z.qs.length-1;
 const foot=`<div class="qfoot"><div class="prog"><i style="width:${(z.i+(answered?1:0))/z.qs.length*100}%"></i></div>${answered?`<button class="btn primary" data-act="qnext" data-next>${last?tx("qr.sonuc"):tx("qr.sonrakiSoru")} <kbd>Enter</kbd></button>`:`<span class="muted" style="font-size:13px">${tx("qr.tuslar","ABCDEF"[q.o.length-1])}</span>`}</div>`;
 return qCard(q,{mode:"quiz",chosen:ch,num:z.i+1,total:z.qs.length,foot,emin:z.kind!=="redo"});}
function startQuiz(kind,uid){const used=newUsed();
 const ds=kind==="check"?[1,1,1,1,2,2,2,2]:[2,2,2,2,3,3,3,3];
 let qs=ds.map(d=>drawQ(uid,d,used)).filter(Boolean);
 if(kind==="chal"&&[6,11].includes(UNIT[uid].ch)){const cq=[];CASES.forEach(c=>c.qs.forEach((s,i)=>{if(s.u===uid)cq.push([c,i]);}));shuffle(cq).slice(0,2).forEach(([c,i],k)=>{qs[qs.length-1-k]=caseQ(c,i);});}
 const key=kind+":"+uid;S.z[key]={kind,u:uid,qs,ans:qs.map(()=>null),i:0,done:false};S.zk=key;save();}
function zayifSirala(ids){return ids.map(id=>({id,p:unitInfo(id).p+R()*.05})).sort((a,b)=>a.p-b.p).map(x=>x.id);}
function karmaSoru(ids,n,ds,used){const out=[];if(!ids.length)return out;let i=0;for(let g=0;out.length<n&&g<n*ids.length*3;g++){const q=drawQ(ids[i%ids.length],ds[out.length%ds.length],used);if(q)out.push(q);i++;}return out;}
function haftaKontrolKur(w){const used=newUsed();let qs;
 if(w.kind==="tekrar"&&!w.units.length)qs=karmaSoru(zayifSirala(UNITS.map(u=>u.id)).slice(0,15),15,[2,3,2,3,1],used);
 else{const eski=zayifSirala(haftalar().filter(x=>x.iso<w.iso).flatMap(x=>x.units)).slice(0,3),nCur=eski.length?10-eski.length:10;qs=karmaSoru(shuffle(w.units),nCur,[1,2,2,3],used).concat(karmaSoru(eski,eski.length,[2,2,3],used));qs=shuffle(qs);}
 const key="hafta:"+w.iso;S.z[key]={kind:"hafta",week:w.iso,u:null,qs,ans:qs.map(()=>null),i:0,done:false};S.zk=key;S.kw=w.iso;S.view="kontrol";save();}
function vKontrol(){const key="hafta:"+S.kw,z=S.z[key],w=haftalar().find(x=>x.iso===S.kw);if(!z)return vHafta();S.zk=key;
 return`<div class="page"><div class="row" style="justify-content:space-between"><div class="eyebrow">${tx("hk.ad")}${w?` · ${aralik(w)}`:""}</div>${z.done?"":`<button class="btn sm" data-act="go" data-v="hafta" data-iso="${S.kw}">${tx("hk.ara")}</button>`}</div>${quizRunner(z)}</div>`;}
function vPractice(u){
 if(!P||P.u!==u.id)P={u:u.id,q:null,ans:null,n:0,ok:0};
 if(!P.q)P.q=nextPractice();
 const q=P.q,answered=P.ans!=null;
 const foot=`<div class="qfoot"><span class="muted" style="font-size:14px">${P.n?tx("pr.oturum",P.n,P.ok):tx("pr.aciklama")}</span>${answered?`<button class="btn primary" data-act="pnext" data-next>${tx("sonraki")} <kbd>Enter</kbd></button>`:""}</div>`;
 return q?qCard(q,{mode:"quiz",chosen:P.ans,foot,emin:true}):`<div class="panel empty">${tx("pr.yok")}</div>`;}
function nextPractice(){const u=UNIT[P.u];
 if([6,11].includes(u.ch)&&R()<.35){const cq=[];CASES.forEach(c=>c.qs.forEach((s,i)=>{if(s.u===u.id)cq.push([c,i]);}));if(cq.length){const [c,i]=pick(cq);return caseQ(c,i);}}
 const h=S.u[P.u].hist.slice(-12);const miss=h.filter(x=>!x.ok).map(x=>x.d);return drawQ(P.u,pick([1,2,2,3,3,...miss]),newUsed());}

/* ---------- uzun vakalar ---------- */
let CZ=null;
function vCases(){
 if(CZ){const c=CASE[CZ.id],done=CZ.ans.every(a=>a!=null),sc=CZ.ans.filter((a,k)=>a===CZ.qs[k].a).length;
  return`<div class="page"><div class="row" style="justify-content:space-between"><div><div class="eyebrow">${tx("dersN",c.ch)} · ${tx("uzunVaka")}${c.set?" · "+tx("dersSeti"):""}</div><h2 style="font-size:30px">${c.title}</h2></div><button class="btn" data-act="cz-close">${tx("cz.hepsi")}</button></div>
  <section class="panel casefull" lang="en">${c.text.map(p=>`<p>${p}</p>`).join("")}</section>
  ${CZ.qs.map((q,k)=>qCard(q,{mode:"quiz",chosen:CZ.ans[k],num:k+1,total:CZ.qs.length,caseOpen:false}).replace(/data-act="ans"/g,`data-act="czans" data-k="${k}"`).replace(/<details class="casebox"[\s\S]*?<\/details>/,"")).join("")}
  ${done?`<section class="panel"><div class="score"><div class="big ${sc/CZ.qs.length>=.75?"c-good":"c-bad"}">${sc}/${CZ.qs.length}</div><div><h3>${tx("cz.puan",CZ.qs.length*5,sc*5)}</h3><p class="sub" style="margin:0">${tx("cz.taktik")}</p></div></div><div class="row" style="margin-top:12px"><button class="btn primary" data-act="cz-open" data-id="${c.id}">${tx("cz.yeniden")}</button><button class="btn" data-act="cz-close">${tx("cz.baska")}</button></div></section>`:""}</div>`;}
 return`<div class="page"><section class="panel"><div class="eyebrow">${tx("cz.eyebrow")}</div><h3>${tx("cz.h")}</h3><p class="sub">${tx("cz.sub")}</p></section>
 ${[6,11].map(ch=>`<section class="panel"><h3>${tx("dersN",ch)} · ${chAd(ch)}</h3><div class="days" style="margin-top:10px">${CASES.filter(c=>c.ch===ch).map(c=>{const seen=S.seen[c.id];return`<div class="day"><h4><span lang="en">${c.title}</span>${seen?`<span class="tag done">${tx("cz.cozuldu")}</span>`:""}</h4><div class="fin">${tx("cz.ozet",c.qs.length,c.qs.length*5)}${c.set?" · "+tx("dersSeti"):""}</div><button data-act="cz-open" data-id="${c.id}">${tx("cz.coz")}</button></div>`;}).join("")}</div></section>`).join("")}</div>`;}

/* ---------- hatalar ---------- */
function vMistakes(){const z=S.z.redo&&!S.z.redo.done||S.z.redo&&S.zk==="redo"?S.z.redo:null;
 if(z){S.zk="redo";return`<div class="page"><div class="eyebrow">${tx("ms.yeniden")}</div>${quizRunner(z)}</div>`;}
 const w=S.wrong.slice().reverse();
 return`<div class="page"><section class="panel"><h3>${tx("ms.h")}</h3><p class="sub">${tx("ms.sub")}</p><div class="row"><button class="btn primary" data-act="redo" ${w.length?"":"disabled"}>${tx("ms.btn",Math.min(10,w.length))}</button></div></section>
 <div class="review">${w.length?w.map(x=>qCard(x.q,{mode:"review",chosen:x.pick,caseOpen:false})).join(""):`<div class="panel empty">${tx("ms.yok")}</div>`}</div></div>`;}

/* ---------- sınav bilgisi ---------- */
let calcN=75;
function vGrading(){const g=grade(calcN);
 return`<div class="page"><section class="panel"><div class="eyebrow">${tx("g.eyebrow",uzunTarih(isoDan(S.plan.exam)))}</div><h3>${tx("g.h")}</h3>
 <div class="tscroll"><table class="data"><tr>${tx("g.th").map((x,k)=>`<th${k===3?' class="num"':""}>${x}</th>`).join("")}</tr>${[1,2,3].map(p=>`<tr><td><b>${partName(p)}</b></td><td>${partDesc(p)}</td><td>${PARTS[p].chs.map(c=>tx("dKisa")+c).join(", ")}</td><td class="num">${p===1?40:30}</td></tr>`).join("")}<tr><td><b>${tx("g.toplam")}</b></td><td>${tx("g.soru41")}</td><td></td><td class="num"><b>100</b></td></tr></table></div>
 <p class="muted" style="margin:12px 0 0">${tx("g.p1")}</p>
 <div class="tscroll" style="margin-top:14px"><table class="data"><tr><th>${tx("g.duzeyTh")}</th><th>${tx("g.olcerTh")}</th></tr>${[1,2,3].map(d=>`<tr><td><span class="lvl l${d}">${lvl(d)}</span></td><td>${tx("g.duzey")[d-1]}</td></tr>`).join("")}<tr><td><span class="lvl l3">${tx("uzunVaka")}</span></td><td>${tx("g.duzey")[3]}</td></tr></table></div></section>
 <section class="panel"><h3>${tx("g.sansH")}</h3><p class="sub">${tx("g.sansP")}</p>
 <div class="formula">${tx("g.formul")}</div>
 <div class="calc"><label for="calcn" class="eyebrow">${tx("g.calcLabel")}</label><input type="range" id="calcn" min="0" max="100" value="${calcN}"><div class="out"><b id="calcg" class="${g>=7?"c-good":g>=5.5?"c-warn":"c-bad"}">${gf(g)}</b><span id="calct">${tx("g.calct",calcN)}</span></div></div>
 ${scale([{v:calcN,label:`${calcN} → ${gf(g)}`,cls:"you"}])}
 <p class="muted" style="margin:12px 0 0">${tx("g.p2")}</p></section>
 <section class="panel"><h3>${tx("g.kuralH")}</h3><p class="sub">${tx("g.kuralP")}</p><ul class="rules-list">${tx("g.kurallar").map(x=>`<li>${x}</li>`).join("")}</ul></section></div>`;}

/* ---------- ayarlar ---------- */
let resetOnay=false,yedekMesaj="";
function vAyar(){const W=haftalar(),p=S.plan;
 const secenek=W.filter(w=>w.kind!=="tatil");
 const tatil=W.filter(w=>w.kind!=="sinav").map(w=>`<button class="mini ${w.kind==="tatil"?"kapali":""}" data-act="ptatil" data-iso="${w.iso}" aria-pressed="${w.kind==="tatil"}">${aralik(w)}</button>`).join("");
 const esleme=CH_ORDER.map(ch=>`<tr><td><b>${tx("dersN",ch)}</b> <span class="muted">${chAd(ch)}</span></td><td><label class="sr" for="tasi-${ch}">${tx("ay.tasiLabel",ch)}</label><select id="tasi-${ch}" data-tasi="${ch}"><option value="">${tx("ay.otomatik")}${(()=>{const x=W.filter(w=>w.chs.includes(ch));return x.length?" · "+aralik(x[0]):"";})()}</option>${secenek.map(w=>`<option value="${w.iso}" ${p.tasi[ch]===w.iso?"selected":""}>${hIsim(w)} · ${aralik(w)}</option>`).join("")}</select></td></tr>`).join("");
 return`<div class="page"><section class="panel"><div class="eyebrow">${tx("nav.takvim")}</div><h3>${tx("ay.tarihler")}</h3><p class="sub">${tx("ay.tarihlerP")}</p>
 <div class="form2"><label for="p-exam">${tx("sinavTarihi")}<input type="date" id="p-exam" value="${p.exam}"></label><label for="p-start">${tx("ay.baslangic")}<input type="date" id="p-start" value="${p.start}"></label></div>
 ${p.ok?`<p class="muted" style="margin:10px 0 0;font-size:14px">${tx("ay.kayitli")}</p>`:`<div class="row" style="margin-top:12px"><button class="btn primary" data-act="ponay2">${tx("ay.onayla")}</button><span class="muted" style="font-size:14px">${tx("ay.tahmin")}</span></div>`}</section>
 <section class="panel"><h3>${tx("ay.tatilH")}</h3><p class="sub">${tx("ay.tatilP")}</p><div class="row tatilr">${tatil||`<span class="muted">${tx("ay.once")}</span>`}</div></section>
 <section class="panel"><h3>${tx("ay.esleH")}</h3><p class="sub">${tx("ay.esleP")}</p><div class="tscroll"><table class="data">${esleme}</table></div></section>
 <section class="panel"><h3>${tx("ay.sureH")}</h3><p class="sub">${tx("ay.sureP")}</p>
 <div class="gpform">${tx("gunUzun").map((g,i)=>`<label for="gpm-${i}">${g}<input type="number" id="gpm-${i}" data-gpm="${i}" min="0" max="600" step="5" inputmode="numeric" value="${S.gp.musaitlik[i]}"></label>`).join("")}</div>
 <div class="form2" style="margin-top:12px"><label for="gp-ders">${tx("ay.dersGunu")}<select id="gp-ders" data-gpders="1"><option value="">${tx("ay.bilmiyorum")}</option>${tx("gunUzun").map((g,i)=>`<option value="${i}" ${S.gp.dersGunu===i?"selected":""}>${g}</option>`).join("")}</select></label></div></section>
 <section class="panel"><h3>${tx("ay.icsH")}</h3><p class="sub">${tx("ay.icsP")}</p><div class="row"><button class="btn" data-act="ics">${tx("ay.icsH")}</button>${icsMesaj?`<span class="muted" style="font-size:14px">${esc(tx(icsMesaj))}</span>`:""}</div>${icsMetin?`<label class="sr" for="icsmetin">${tx("ay.icsMetin")}</label><textarea id="icsmetin" rows="6" readonly>${esc(icsMetin)}</textarea>`:""}</section>
 <section class="panel"><h3>${tx("ay.dilH")}</h3><p class="sub">${tx("ay.dilP")}</p><div class="row">${dilSec()}</div></section>
 <section class="panel"><h3>${tx("ay.yedekH")}</h3><p class="sub">${tx("ay.yedekP")}</p><label class="sr" for="yedek">${tx("ay.yedekLabel")}</label><textarea id="yedek" rows="3" placeholder="${tx("ay.yedekPh")}"></textarea><div class="row" style="margin-top:10px"><button class="btn" data-act="ykopya">${tx("ay.yedekKopya")}</button><button class="btn" data-act="yal">${tx("ay.yedekYukle")}</button>${yedekMesaj?`<span class="muted" style="font-size:14px">${tx(yedekMesaj)}</span>`:""}</div></section>
 <section class="panel"><h3>${tx("ay.sifirlaH")}</h3><p class="sub">${tx("ay.sifirlaP")}</p>${resetOnay?`<div class="confirm"><b>${tx("ay.eminMisin")}</b><div class="row"><button class="btn" data-act="rvazgec">${tx("ay.vazgec")}</button><button class="btn bad" data-act="revet">${tx("ay.evet")}</button></div></div>`:`<button class="btn" data-act="rsor">${tx("ay.sifirlaBtn")}</button>`}</section></div>`;}

/* ---------- terimler ---------- */
let KT={mode:"list",grp:-1,q:null,ans:null,n:0,ok:0};
const ALLT=GLOSS.flatMap((g,gi)=>g.t.map(([t,d])=>({t,d,gi})));
function ktPick(){const pool=KT.grp<0?ALLT:ALLT.filter(x=>x.gi===KT.grp);
 const w=pool.map(x=>{const s=S.kt[x.t]||[0,0];return Math.max(.25,1+2*s[1]-.6*s[0])*(KT.q&&KT.q.t===x.t?0:1);});
 let r=R()*w.reduce((a,b)=>a+b,0),c=pool[0];for(let i=0;i<pool.length;i++){r-=w[i];if(r<=0){c=pool[i];break;}}
 let others=shuffle(ALLT.filter(x=>x.gi===c.gi&&x.t!==c.t));if(others.length<3)others=others.concat(shuffle(ALLT.filter(x=>x.gi!==c.gi)));
 const o=shuffle([c].concat(others.slice(0,3)));KT.q={t:c.t,d:c.d,gi:c.gi,o:o.map(x=>x.t),a:o.indexOf(c)};KT.ans=null;}
function vTerms(){const seg=`<div class="seg">${["list","drill","compare"].map(m=>`<button data-act="kt-mode" data-m="${m}" aria-pressed="${KT.mode===m}">${tx("kt.mod."+m)}</button>`).join("")}</div>`;
 const grps=`<div class="row ktg"><button class="btn sm ${KT.grp<0?"primary":""}" data-act="kt-grp" data-g="-1">${tx("kt.tumu")} ${ALLT.length}</button>${GLOSS.map((g,i)=>`<button class="btn sm ${KT.grp===i?"primary":""}" data-act="kt-grp" data-g="${i}" lang="en">${g.g}</button>`).join("")}</div>`;
 const head=`<section class="panel"><div class="eyebrow">${tx("kt.eyebrow")}</div><h3>${tx("nav.terms")}</h3><p class="sub">${tx("kt.sub",ALLT.length)}</p>${seg}</section>`;
 let body="";
 if(KT.mode==="list"){body=`<section class="panel"><label class="sr" for="ktq">${tx("kt.ara")}</label><input id="ktq" class="ktq" type="search" placeholder="${tx("kt.araPh")}" autocomplete="off">${GLOSS.map((g,i)=>`<div class="ktgrp" data-g="${i}" lang="en"><h4>${g.g} <span class="tag">${g.ch}</span></h4><div class="terms">${g.t.map(([t,d])=>{const s=S.kt[t];return`<div class="ktrow"><b>${t}${s&&s[1]>s[0]?` <span class="tag study" lang="${S.dil}">${tx("kt.tekrar")}</span>`:""}</b><span>${d}</span></div>`;}).join("")}</div></div>`).join("")}<div class="row" style="margin-top:16px"><button class="btn primary" data-act="kt-mode" data-m="drill">${tx("kt.basla")}</button></div></section>`;}
 else if(KT.mode==="compare"){body=`<section class="panel"><p class="sub">${tx("kt.farkP")}</p><div class="terms" lang="en">${COMPARE.map(([a,b])=>`<div><b>${a}</b><span>${b}</span></div>`).join("")}</div></section>`;}
 else{if(!KT.q)ktPick();const q=KT.q,L="ABCD",done=KT.ans!=null;
  const opts=q.o.map((t,k)=>{let cls="opt";if(done){if(k===q.a)cls+=" right";else if(k===KT.ans)cls+=" wrong";}return`<button class="${cls}" data-act="ktans" data-i="${k}" ${done?"disabled":""}><span class="L">${L[k]}</span><span lang="en">${t}</span></button>`;}).join("");
  const wrongDef=done&&KT.ans!==q.a?(ALLT.find(x=>x.t===q.o[KT.ans])||{}).d:"";
  const fb=done?`<div class="fb">${KT.ans===q.a?`<b class="ok">${tx("q.dogru")}</b>`:`<b class="no">${tx("kt.yanlis",`<span lang="en">${q.t}</span>`)}</b> <br><span class="muted" lang="en">${q.o[KT.ans]}: ${wrongDef}</span>`}</div><div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn primary" data-act="kt-next" data-next>${tx("kt.sonraki")} <kbd>Enter</kbd></button></div>`:"";
  body=`<section>${grps}</section><article class="q"><div class="meta"><span class="row" style="gap:6px"><span class="tag" lang="en">${GLOSS[q.gi].g} · ${GLOSS[q.gi].ch}</span></span><span class="mono">${KT.n?tx("kt.skor",KT.n,KT.ok):tx("kt.hangi")}</span></div><div class="stem" lang="en">${q.d}</div><div class="opts">${opts}</div>${fb}</article>`;}
 return`<div class="page">${head}${body}</div>`;}

/* ---------- telaffuz ---------- */
const sesVar=()=>typeof window!=="undefined"&&!!window.speechSynthesis&&typeof window.SpeechSynthesisUtterance==="function";
function dinle(t){if(!sesVar())return"";const s=esc(String(t).replace(/<[^>]+>/g,""));return`<button class="dinle" data-act="dinle" data-s="${s}" aria-label="${tx("dn.btn")}: ${s}" title="${tx("dn.title")}" lang="${S.dil}">${tx("dn.btn")}</button>`;}

/* ---------- Bugün: tekrar sırası, günün görevleri, öneriler ---------- */
function birimOf(k){const t=tkTur(k),v=k.slice(t.length+1);
 if(t==="t"){const x=TERIM[v];return x?x.u:null;}
 if(t==="q"){const q=QBY[v];return q?q.u:null;}
 if(t==="a"){const m=/^(.+)-adim-\d+$/.exec(v);return m?m[1]:null;}
 return null;}
function adimCoz(v){const m=/^(.+)-adim-(\d+)$/.exec(v);if(!m||!UNIT[m[1]])return null;const d=ders(m[1]),i=+m[2];return d&&d.adimlar[i]&&d.adimlar[i].soru?{uid:m[1],i}:null;}
function cozulur(k){const t=tkTur(k),v=k.slice(t.length+1);
 if(t==="t")return!!TERIM[v];
 if(t==="q"){const q=QBY[v];return!!(q&&UNIT[q.u]&&Array.isArray(q.o)&&q.o.length>1);}
 if(t==="a")return!!adimCoz(v);
 return false;}
function bgCoz(k){if(!cozulur(k))return null;const t=tkTur(k),v=k.slice(t.length+1);
 if(t==="t"){const x=TERIM[v];return{tur:"t",key:k,t:x.t,d:x.d,u:x.u};}
 if(t==="q"){const s=QBY[v];return{tur:"q",key:k,q:mat(s,s.u,s.d||2,s.id)};}
 const a=adimCoz(v);return{tur:"a",key:k,q:adimSoru(a.uid,a.i)};}
function tekrarSirasi(){return tkKuyruk(S.tk,bugunNo(),{limit:40,sinavGun:sinavNo(),birimOf}).keys.filter(cozulur).slice(0,20);}
let BG=null;
function bgKur(){BG={gun:bugunNo(),keys:tekrarSirasi(),i:0,cur:null,flip:false,ans:null,say:[0,0,0]};bgYukle();}
function bgYukle(){BG.flip=false;BG.ans=null;BG.cur=null;while(BG.i<BG.keys.length&&!(BG.cur=bgCoz(BG.keys[BG.i])))BG.i++;}
function bugunKisa(gp){const n=tekrarSirasi().length,m=gp&&gp.bugun?gp.bugun.gorevler.length:0;
 return`<section class="panel bugunk"><div class="bk-t"><div class="eyebrow">${tx("nav.bugun")}</div><b>${tx("bg.kisa",n,m)}</b></div><button class="btn primary sm" data-act="go" data-v="bugun">${tx("bg.gec")}</button></section>`;}
function bgKart(){
 if(!BG.keys.length)return`<section class="panel empty"><h3>${tx("bg.yok")}</h3><p>${tx("bg.yokP")}</p></section>`;
 if(!BG.cur)return`<section class="panel empty"><h3>${tx("bg.bitti")}</h3><p>${tx("bg.sonuc",BG.say[2],BG.say[1],BG.say[0])}</p><div class="row" style="justify-content:center"><button class="btn" data-act="bgyenile">${tx("bg.yenile")}</button></div></section>`;
 const c=BG.cur,num=tx("kartN",BG.i+1,BG.keys.length);
 if(c.tur==="t")return`<article class="q tkart"><div class="meta"><span class="row" style="gap:6px"><span class="lvl l1">${tx("bg.terim")}</span>${c.u?`<span class="tag" lang="en">${SHORT[c.u]}</span>`:""}</span><span class="mono">${num}</span></div>
  <div class="tk-on"><b lang="en">${c.t}</b>${dinle(c.t)}</div>
  ${BG.flip?`<p class="tk-arka" lang="en">${c.d}</p><div class="row tk-not"><button class="btn bad" data-act="bgnot" data-n="0">${tx("bg.n0")} <kbd>1</kbd></button><button class="btn" data-act="bgnot" data-n="1">${tx("bg.n1")} <kbd>2</kbd></button><button class="btn good" data-act="bgnot" data-n="2">${tx("bg.n2")} <kbd>3</kbd></button></div>`
  :`<p class="muted" style="margin:0">${tx("bg.soyle")}</p><div class="row"><button class="btn primary" data-act="bgac" data-next>${tx("bg.goster")} <kbd>Enter</kbd></button></div>`}</article>`;
 const answered=BG.ans!=null;
 const foot=`<div class="qfoot"><span class="mono muted">${num}</span>${answered?`<button class="btn primary" data-act="bgnext" data-next>${tx("sonraki")} <kbd>Enter</kbd></button>`:`<span class="muted" style="font-size:13px">${tx("qr.tuslar","ABCDEF"[c.q.o.length-1])}</span>`}</div>`;
 return qCard(c.q,{mode:"quiz",chosen:BG.ans,foot,emin:true});}
let ONERI=[];
const histByUnit=()=>Object.fromEntries(UNITS.map(u=>[u.id,S.u[u.id].hist]));
function oneriler(limit){return tsOneriler(S.ts,{histByUnit:histByUnit(),units:UNITS,compare:COMPARE,now:Date.now(),limit});}
const sayi=x=>ond(Math.round(x*10)/10);
const konuAd=u=>UNIT[u]?ucAd(u):tx("genel");
const kavram=(x,ham)=>ham?`“<span lang="en">${esc(x)}</span>”`:`<b lang="en">${esc(x)}</b>`;
function oneriCumle(o){const p=sayi(o.puan);
 if(o.tip==="karisma")return tx("on.karisma",konuAd(o.u),kavram(o.a,o.hamA),kavram(o.b,o.hamB),o.n,p);
 if(o.tip==="eminYanlis")return tx("on.eminYanlis",konuAd(o.u),o.sr+o.sw,o.sw,p);
 if(o.tip==="kirilgan")return tx("on.kirilgan",konuAd(o.u),o.sr+o.ur,o.ur,p);
 if(o.tip==="duzey")return tx("on.duzey",PARTS[o.parca].short,o.d,o.n,o.ok,yuzde(o.ok/o.n),yuzde(o.ort),p);
 return tx("on.diger");}
function oneriListe(L){ONERI=L;
 if(!L.length)return`<p class="muted" style="margin:0">${tx("on.yok")}</p>`;
 return`<ol class="oneri">${L.map((o,i)=>`<li><p>${oneriCumle(o)}</p>${o.tip==="karisma"?`<div class="row"><button class="btn sm" data-act="kars" data-i="${i}">${tx("on.calis")}</button></div>`:""}</li>`).join("")}</ol>`;}
function vBugun(){const g=bugunNo(),oz=tkOzet(S.tk,g,sinavNo()),z=S.z.kars;
 if(z){S.zk="kars";return`<div class="page"><div class="row" style="justify-content:space-between"><div class="eyebrow">${tx("ks.ad")} · <span lang="en">${esc(z.a)}</span> / <span lang="en">${esc(z.b)}</span></div>${z.done?"":`<button class="btn sm" data-act="karsbit">${tx("ks.birak")}</button>`}</div>${z.kar?`<section class="panel"><div class="eyebrow" lang="en">${esc(z.kar[0])}</div><p lang="en" style="margin:6px 0 0">${esc(z.kar[1])}</p></section>`:""}${quizRunner(z)}</div>`;}
 if(!BG||BG.gun!==g)bgKur();
 const p=gunPlani(),bg=p&&p.buMu?p.bugun:null,mx=Math.max(1,...oz.hafta),hg=gpHaftaGunu(bugunIso()),n=BG.keys.length,i=Math.min(BG.i,n);
 const tahmin=`<div class="tahmin" role="img" aria-label="${tx("bg.tahminAria",oz.hafta.join(", "))}">${oz.hafta.map((x,k)=>`<div><i style="height:${Math.round(x/mx*100)}%"></i><b>${x}</b><small>${k===0?tx("bg.bugunKisa"):gunAd((hg+k)%7)}</small></div>`).join("")}</div>`;
 return`<div class="page"><section class="hero wk"><div class="eyebrow">${tx("nav.bugun")} · ${trTarih(new Date(),{weekday:"long",day:"numeric",month:"long"})}</div><h2>${tx("bg.h",n,bg&&bg.gorevler.length?bg.gorevler.length:0)}</h2>
 ${n?`<div class="meter" role="progressbar" aria-label="${tx("bg.ilerlemeAria")}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${yuzde(i/n)}"><i style="width:${yuzde(i/n)}%"></i></div>`:""}<div class="meter-t">${n?tx("bg.kart",i,n):""}${n&&oz.seri?" · ":""}${oz.seri?tx("bg.seri",oz.seri):""}</div>
 <details class="kaynakbox"><summary>${tx("bg.yuk")}</summary>${tahmin}<p class="muted" style="margin:6px 0 0;font-size:14px">${tx("bg.yukP",oz.toplam,oz.olgun)}</p></details></section>
 ${bgKart()}
 <section class="panel"><div class="eyebrow">${tx("bg.gorevler")}</div><h3>${bg&&bg.gorevler.length?tx("bg.isVar",bg.dk):tx("bg.isYok")}</h3>${bg&&bg.gorevler.length?`<div class="konular">${bg.gorevler.map(t=>gorevSatir(t,p.w)).join("")}</div>`:`<p class="sub" style="margin:0">${!p||!p.buMu?tx("bg.planDisi"):bg&&bg.kapasite===0?tx("bg.dinlenme"):tx("bg.baskaGun")}</p>`}<div class="row" style="margin-top:12px"><button class="btn" data-act="go" data-v="hafta">${tx("bg.haftaya")}</button></div></section>
 <section class="panel"><div class="eyebrow">${tx("bg.nerede")}</div><h3>${tx("bg.uc")}</h3>${oneriListe(oneriler(3))}<div class="row" style="margin-top:12px"><button class="btn" data-act="go" data-v="teshis">${tx("bg.tamTeshis")}</button></div></section></div>`;}

/* ---------- Teşhis ---------- */
function vTeshis(){const P=tsProfil(histByUnit(),UNITS),E=S.ts.e,top=[0,0,0,0];Object.values(E).forEach(v=>{for(let i=0;i<4;i++)top[i]+=v[i];});const tN=top.reduce((a,b)=>a+b,0);
 const hc=c=>c.n?`<b>${yz(c.acc)}</b> <small class="muted">${c.ok}/${c.n}</small>`:`<span class="muted">–</span>`;
 const satir=p=>`<tr><td><b>${p?PARTS[p].short:tx("ts.hepsi")}</b>${p?` <small class="muted">${PARTS[p].chs.map(c=>tx("dKisa")+c).join(", ")}</small>`:""}</td>${[1,2,3,0].map(d=>`<td class="num">${hc(P[p][d])}</td>`).join("")}</tr>`;
 const kal=tx("ts.kal"),kcls=["good","bad","warn",""];
 const us=Object.keys(E).filter(u=>UNIT[u]).sort((a,b)=>E[b][1]-E[a][1]||E[b][2]-E[a][2]).slice(0,8);
 return`<div class="page"><section class="panel"><div class="eyebrow">${tx("nav.teshis")}</div><h3>${tx("ts.h")}</h3><p class="sub">${tx("ts.sub")}</p><div class="tscroll"><table class="data"><tr><th>${tx("g.th")[0]}</th>${[1,2,3].map(d=>`<th class="num">${lvl(d)}</th>`).join("")}<th class="num">${tx("ts.hepsi")}</th></tr>${[1,2,3,0].map(satir).join("")}</table></div></section>
 <section class="panel"><h3>${tx("ts.eminH")}</h3><p class="sub">${tx("ts.eminP")} ${tN?tx("ts.nCevap",tN):tx("ts.cevapYok")}</p><div class="kalib">${kal.map(([t,a],i)=>`<div class="kl ${kcls[i]}"><b>${top[i]}</b><div><div class="eyebrow">${t}</div><p>${a}</p></div></div>`).join("")}</div>
 ${us.length?`<div class="tscroll" style="margin-top:12px"><table class="data"><tr><th>${tx("ts.konu")}</th>${kal.map(([t])=>`<th class="num">${t}</th>`).join("")}</tr>${us.map(u=>`<tr><td>${ucAd(u)}</td>${[0,1,2,3].map(i=>`<td class="num">${E[u][i]}</td>`).join("")}</tr>`).join("")}</table></div>`:""}</section>
 <section class="panel"><h3>${tx("ts.tumH")}</h3><p class="sub">${tx("ts.tumP")}</p>${oneriListe(oneriler(10))}</section></div>`;}

/* ---------- çalışma arkadaşı (hoca.js): yalnız sample yetkisi varsa görünür ---------- */
let HC=null,HC_GIZLI=false,HC_AKIS=0;
const HCD=Object.create(null),TASLAK=Object.create(null),HCQ=Object.create(null);
const hcAktif=()=>!!HC&&!HC_GIZLI;
function guvenliRender(){const a=document.activeElement;if(HC_AKIS>0||(a&&(a.tagName==="TEXTAREA"||a.tagName==="INPUT")))return;render();}
hcHazir().then(f=>{HC=f;if(f)guvenliRender();},()=>{});
const strip=s=>String(s==null?"":s).replace(/<[^>]+>/g,"");
/* Hata kaydı mesaj yerine kod tutar; mesaj çizim anında o anki dilde üretilir. */
function hcCikti(key){const r=HCD[key];if(!r)return"";
 const par=t=>hcParagraflar(t).map(p=>`<p>${esc(p).replace(/\n/g,"<br>")}</p>`).join("");
 if(r.durum==="yuk")return r.metin?`<div class="hcmetin">${par(r.metin)}</div>`:`<p class="muted">${r.json?tx("hc.kontrol"):tx("hc.yaziyor")}</p>`;
 if(r.durum==="hata")return`<p class="hchata" role="alert">${esc(hcHataMesaj(r.kod,S.dil))}</p>${r.metin?`<div class="hcmetin">${par(r.metin)}</div>`:""}`;
 if(r.sonuc){const s=r.sonuc,li=(b,L)=>L.length?`<div class="eyebrow">${b}</div><ul>${L.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:"";
  return`<div class="hcsonuc"><p class="hcpuan"><b>${s.puan}/3</b> ${tx("hc.puan")[s.puan]}</p>${li(tx("hc.dogru"),s.dogru)}${li(tx("hc.eksik"),s.eksik)}${li(tx("hc.yanlis"),s.yanlis)}${s.ipucu?`<p><b>${tx("hc.ipucu")}</b> ${esc(s.ipucu)}</p>`:""}${s.ornek?`<div class="ornek"><div class="eyebrow">${tx("hc.ornek")}</div><p lang="en">${esc(s.ornek)}</p></div>`:""}</div>`;}
 return`<div class="hcmetin">${par(r.metin)}</div>${r.kesik?`<p class="muted">${tx("hc.kesik")}</p>`:""}`;}
function hcBoya(key,hedef){const el=document.getElementById(hedef);if(el)el.innerHTML=hcCikti(key);}
async function hcIste(key,istem,json,hedef){if(!hcAktif()||(HCD[key]&&HCD[key].durum==="yuk"))return;
 const k=hcKullan(S.hc,bugunIso());
 if(!k.ok){HCD[key]={durum:"hata",kod:"gunluk_sinir"};hcBoya(key,hedef);return;}
 S.hc=k.st;save();HCD[key]={durum:"yuk",metin:"",json};HC_AKIS++;hcBoya(key,hedef);
 let r;try{r=await hcCalistir(HC,istem,{json,tier:json?"default":"quick",onText:json?undefined:p=>{const x=HCD[key];if(x&&x.durum==="yuk"&&p&&typeof p.text==="string"){x.metin=p.text;hcBoya(key,hedef);}}});}catch(e){r=hcHata("upstream_error");}finally{HC_AKIS--;}
 if(!r.ok){if(r.gizle)HC_GIZLI=true;HCD[key]={durum:"hata",kod:r.kod,metin:r.kismi||""};}
 else if(json){const c=hcCozAnlat(r.deger);HCD[key]=c?{durum:"bitti",sonuc:c}:{durum:"hata",kod:"invalid_json"};}
 else HCD[key]={durum:"bitti",metin:r.text,kesik:r.kesik};
 if(HC_GIZLI)guvenliRender();else hcBoya(key,hedef);}
function hcAdimBaglam(uid,i){const u=UNIT[uid],a=ders(uid).adimlar[i];
 return{konu:strip(ucAd(uid)),adimBaslik:strip(a.baslik),notMetni:a.kaynak.map(k=>NOT[uid].seg[k]).join("")||u.notes,terimler:u.terms.filter(t=>a.terimler.includes(t[0])),a,dil:S.dil};}
function hcAdimPanel(u,d,i,cevaplandi){if(!hcAktif())return"";const id=`${u.id}-${i}`,kA="anlat:"+id,kB="baska:"+id,kS="soru:"+id;
 const anlat=cevaplandi?`<h3>${tx("hc.anlatH")}</h3><p class="sub">${tx("hc.anlatP")}</p><label class="sr" for="hc-anlat">${tx("hc.anlatLabel")}</label><textarea id="hc-anlat" data-hc="${kA}" rows="4" maxlength="1500" placeholder="${tx("hc.anlatPh")}">${esc(TASLAK[kA]||"")}</textarea><div class="row" style="margin-top:10px"><button class="btn primary" data-act="hcanlat" data-k="${id}">${tx("hc.kontrolEt")}</button><button class="btn" data-act="hcbaska" data-k="${id}">${tx("hc.baska")}</button></div><div class="hcout" id="hco-anlat" aria-live="polite">${hcCikti(kA)}</div><div class="hcout" id="hco-baska" aria-live="polite">${hcCikti(kB)}</div>`:"";
 return`<section class="panel hc" aria-label="${tx("hc.ad")}"><div class="eyebrow">${tx("hc.ad")}</div>${anlat}<div class="hcsor"><label class="sr" for="hc-soru">${tx("hc.soruLabel")}</label><input id="hc-soru" type="text" data-hc="${kS}" data-hcsor="1" maxlength="1500" placeholder="${tx("hc.soruPh")}" value="${esc(TASLAK[kS]||"")}" autocomplete="off"><button class="btn" data-act="hcsor" data-k="${id}">${tx("hc.sor")}</button></div><div class="hcout" id="hco-soru" aria-live="polite">${hcCikti(kS)}</div></section>`;}
function hcNot(q){const m=q.mini&&/^(.+)-adim-(\d+)$/.exec(q.id);if(m&&ders(m[1])&&ders(m[1]).adimlar[+m[2]])return hcAdimBaglam(m[1],+m[2]).notMetni;return UNIT[q.u]?UNIT[q.u].notes:"";}
function hcNedenBlok(q,chosen){if(!hcAktif())return"";const key="neden:"+q.id+":"+chosen,r=HCD[key];HCQ[key]={q,chosen};
 return`<div class="hcneden">${!r||r.durum==="hata"?`<button class="btn sm" data-act="hcneden" data-k="${esc(key)}">${tx("hc.neden")}</button>`:""}<div class="hcout" id="hco-${tkHash(key)}" aria-live="polite">${hcCikti(key)}</div></div>`;}
function hcTikla(a,b){const kid=b.dataset.k||"";
 if(a==="hcneden"){const x=HCQ[kid];if(!x)return;hcIste(kid,hcIstemNeden({notMetni:hcNot(x.q),soru:strip(x.q.q),secenekler:x.q.o.map(strip),dogruIdx:x.q.a,secilenIdx:x.chosen,dil:S.dil}),false,"hco-"+tkHash(kid));return;}
 const m=/^(.+)-(\d+)$/.exec(kid);if(!m||!ders(m[1])||!ders(m[1]).adimlar[+m[2]])return;const c=hcAdimBaglam(m[1],+m[2]);
 if(a==="hcanlat"){const el=document.getElementById("hc-anlat"),t=(el?el.value:TASLAK["anlat:"+kid]||"").trim();if(t.length<10){toast(tx("toast.yaz"));return;}hcIste("anlat:"+kid,hcIstemAnlat(Object.assign({},c,{ogrenciMetni:t})),true,"hco-anlat");}
 else if(a==="hcbaska")hcIste("baska:"+kid,hcIstemBaska(Object.assign({},c,{mevcutAnlatim:strip(c.a.anlatim)})),false,"hco-baska");
 else if(a==="hcsor"){const el=document.getElementById("hc-soru"),t=(el?el.value:TASLAK["soru:"+kid]||"").trim();if(t.length<3){toast(tx("toast.sorunuYaz"));return;}hcIste("soru:"+kid,hcIstemSoru(Object.assign({},c,{soruMetni:t})),false,"hco-soru");}}

/* ---------- çizim ---------- */
function render(){for(const k in HCQ)delete HCQ[k];document.documentElement.lang=S.dil;paintBrand();paintPills();paintRail();const main=document.getElementById("main"),v=S.view;
 main.innerHTML=v==="bugun"?vBugun():v==="teshis"?vTeshis():v==="hafta"?vHafta():v==="takvim"?vTakvim():v==="dersler"?vDersler():v==="mistakes"?vMistakes():v==="grading"?vGrading():v==="cases"?vCases():v==="terms"?vTerms():v==="ayar"?vAyar():v==="kontrol"?vKontrol():vUnit();}
function scrollTop(){window.scrollTo({top:0});}
function scrollToQ(){const el=document.querySelector("#main .q");if(el){const r=el.getBoundingClientRect();if(r.top<0||r.top>window.innerHeight*.6)el.scrollIntoView({block:"start"});}}
function dersBittiMi(uid){const st=S.u[uid];if(!st.bitti&&unitInfo(uid).bit){st.bitti=Date.now();toast(tx("toast.anlatimBitti",ucAd(uid).replace(/<[^>]+>/g,"")));}}
function finishQuiz(z){if(z.kind==="redo"||z.kind==="kars")return;const sc=z.ans.filter((a,k)=>a===z.qs[k].a).length;
 if(z.kind==="hafta"){const r=S.hafta[z.week]=S.hafta[z.week]||{not:"",kontrol:[]};r.kontrol=(r.kontrol||[]).concat([{t:Date.now(),sc,n:z.qs.length}]).slice(-10);return;}
 const st=S.u[z.u],was=unitInfo(z.u).status;
 if(z.kind==="check"){st.check=Math.max(st.check,sc);st.checkN++;}else{st.chal=Math.max(st.chal,sc);st.chalN++;}
 if(was!=="done"&&unitInfo(z.u).status==="done")toast(tx("toast.konuTamam",ucAd(z.u).replace(/<[^>]+>/g,"")));}

/* ---------- olaylar ---------- */
document.addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b||b.disabled)return;const a=b.dataset.act;
 if(a==="go"){S.view=b.dataset.v;if(S.view==="hafta")S.aktif=b.dataset.iso||null;if(S.view==="bugun"&&(!BG||!BG.cur||BG.i===0))BG=null;if(S.view==="mistakes"&&S.z.redo&&S.z.redo.done){delete S.z.redo;if(S.zk==="redo")S.zk=null;}save();render();scrollTop();}
 else if(a==="dil"){const d=b.dataset.d==="en"?"en":"tr";if(d!==S.dil){S.dil=d;save();render();}}
 else if(a==="unit"){S.view="unit";if(S.unit!==b.dataset.u){P=null;FC=null;}S.unit=b.dataset.u;S.tab=b.dataset.t||"anlatim";save();render();scrollTop();}
 else if(a==="tab"){S.tab=b.dataset.t;save();render();scrollTop();}
 else if(a==="apos"){const st=S.u[S.unit];st.pos=+b.dataset.p;save();render();scrollTop();}
 else if(a==="sans"){const uid=S.unit,st=S.u[uid],i=st.pos-1;if(st.adim[i]!=null)return;const v=+b.dataset.i,q=adimSoru(uid,i);st.adim[i]=v;record(q,v===q.a,v,"adim");
  ((ders(uid).adimlar[i]||{}).terimler||[]).forEach(t=>{if(TERIM[t])tkEkle(S.tk,"t:"+t,bugunNo());});dersBittiMi(uid);save();render();}
 else if(a==="asifirla"){const uid=S.unit,st=S.u[uid];st.adim={};st.pos=0;st.bitti=0;save();render();scrollTop();toast(tx("toast.bastan"));}
 else if(a==="startquiz"){startQuiz(b.dataset.k,S.unit);render();scrollTop();}
 else if(a==="ans"){const val=+b.dataset.i;
  if(S.view==="bugun"&&!S.z.kars&&BG&&BG.cur&&BG.cur.q){if(BG.ans!=null)return;const q=BG.cur.q,ok=val===q.a,em=eminMi(q);EMINSIZ=null;BG.ans=val;BG.say[ok?(em?2:1):0]++;record(q,ok,val,"tekrar",em);save();render();return;}
  if(S.view==="unit"&&S.tab==="practice"&&P&&P.q){if(P.ans!=null)return;const em=eminMi(P.q);EMINSIZ=null;P.ans=val;P.n++;const ok=val===P.q.a;if(ok)P.ok++;record(P.q,ok,val,"practice",em);save();render();return;}
  const z=Z();if(!z||z.done||z.ans[z.i]!=null)return;const q=z.qs[z.i],em=z.kind==="redo"?null:eminMi(q);EMINSIZ=null;z.ans[z.i]=val;record(q,val===q.a,val,z.kind,em);save();render();}
 else if(a==="emin"){EMINSIZ=EMINSIZ===b.dataset.q?null:b.dataset.q;render();}
 else if(a==="bgac"){if(BG)BG.flip=true;render();}
 else if(a==="bgnot"){if(!BG||!BG.cur)return;const n=+b.dataset.n;tkCevapla(S.tk,BG.cur.key,n,bugunNo(),sinavNo());BG.say[n]++;BG.i++;bgYukle();save();render();}
 else if(a==="bgnext"){if(!BG)return;BG.i++;bgYukle();render();scrollToQ();}
 else if(a==="bgyenile"){bgKur();render();}
 else if(a==="kars"){const o=ONERI[+b.dataset.i];if(!o)return;const qs=tsKarsitSorular(o,BANK,6).map(id=>QBY[id]).filter(Boolean).map(s=>mat(s,s.u,s.d||2,s.id));
  if(!qs.length){toast(tx("toast.farkYok"));return;}
  S.z.kars={kind:"kars",u:null,qs,ans:qs.map(()=>null),i:0,done:false,kar:o.kar,a:o.a,b:o.b};S.zk="kars";S.view="bugun";save();render();scrollTop();}
 else if(a==="karsbit"){delete S.z.kars;if(S.zk==="kars")S.zk=null;S.view="bugun";save();render();scrollTop();}
 else if(a==="dinle"){try{const s=window.speechSynthesis,u=new window.SpeechSynthesisUtterance(b.dataset.s||"");u.lang="en-US";u.rate=.9;s.cancel();s.speak(u);}catch(err){}}
 else if(a==="ics"){icsAktar();}
 else if(a==="hcanlat"||a==="hcbaska"||a==="hcsor"||a==="hcneden"){hcTikla(a,b);}
 else if(a==="qnext"){const z=Z();if(!z)return;if(z.i<z.qs.length-1){z.i++;}else{z.done=true;finishQuiz(z);}save();render();scrollToQ();if(z.done)scrollTop();}
 else if(a==="pnext"){P.q=nextPractice();P.ans=null;render();scrollToQ();}
 else if(a==="fcflip"){FC.flip=!FC.flip;render();}
 else if(a==="fcnext"){if(b.dataset.k==="1")FC.known++;else{FC.again++;FC.order.push(FC.order[FC.i]);}FC.i++;FC.flip=false;render();}
 else if(a==="fcreset"){FC=null;render();}
 else if(a==="cz-open"){const c=CASE[b.dataset.id];CZ={id:c.id,qs:c.qs.map((_,i)=>caseQ(c,i)),ans:c.qs.map(()=>null)};S.view="cases";save();render();scrollTop();}
 else if(a==="cz-close"){CZ=null;render();scrollTop();}
 else if(a==="czans"){const k=+b.dataset.k,val=+b.dataset.i;if(!CZ||CZ.ans[k]!=null)return;CZ.ans[k]=val;record(CZ.qs[k],val===CZ.qs[k].a,val,"case");save();render();}
 else if(a==="kt-mode"){KT.mode=b.dataset.m;if(KT.mode==="drill"&&KT.ans!=null)ktPick();render();scrollTop();}
 else if(a==="kt-grp"){KT.grp=+b.dataset.g;ktPick();render();}
 else if(a==="kt-next"){ktPick();render();}
 else if(a==="ktans"){if(KT.ans!=null)return;const q=KT.q;KT.ans=+b.dataset.i;KT.n++;const ok=KT.ans===q.a;if(ok)KT.ok++;const s=S.kt[q.t]||[0,0];s[ok?0:1]++;S.kt[q.t]=s;save();render();}
 else if(a==="redo"){const w=S.wrong.slice().reverse().slice(0,10);const qs=w.map(x=>{const n=x.q.o.length,p=shuffle([...Array(n).keys()]);return Object.assign({},x.q,{o:p.map(i=>x.q.o[i]),a:p.indexOf(x.q.a)});});S.z.redo={kind:"redo",u:null,qs,ans:qs.map(()=>null),i:0,done:false};S.zk="redo";save();render();scrollTop();}
 else if(a==="okul"){const ch=b.dataset.ch;if(S.okul[ch])delete S.okul[ch];else S.okul[ch]=Date.now();save();render();}
 else if(a==="hsec"){S.aktif=b.dataset.iso;if(b.dataset.git){S.view="hafta";scrollTop();}save();render();}
 else if(a==="hbu"){S.aktif=null;save();render();}
 else if(a==="hkay"){const W=haftalar(),i=W.indexOf(aktifHafta()),j=Math.min(W.length-1,Math.max(0,i+ +b.dataset.d));S.aktif=W[j].iso;save();render();}
 else if(a==="hstart"){const iso=b.dataset.iso,w=haftalar().find(x=>x.iso===iso);if(!w)return;if(b.dataset.devam==="1"){S.kw=iso;S.zk="hafta:"+iso;S.view="kontrol";save();}else haftaKontrolKur(w);render();scrollTop();}
 else if(a==="ponay"||a==="ponay2"){const el=document.getElementById(a==="ponay"?"b-exam":"p-exam"),v=el?el.value:"";if(!gecerliIso(v)){toast(tx("toast.tarih"));return;}if(pazartesi(isoDan(v))<pazartesi(isoDan(S.plan.start))){toast(tx("toast.sinavOnce"));return;}S.plan.exam=v;S.plan.ok=true;planDegisti();S.aktif=null;save();render();toast(tx("toast.takvimKuruldu"));}
 else if(a==="ptatil"){const iso=b.dataset.iso,sk=new Set(S.plan.skip);if(sk.has(iso))sk.delete(iso);else sk.add(iso);S.plan.skip=[...sk];planDegisti();save();render();}
 else if(a==="ykopya"){const m=JSON.stringify(S);const bitti=t=>{yedekMesaj=t;render();};const el=()=>document.getElementById("yedek");
  const secim=()=>{const x=el();if(x){x.value=m;x.select();}};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(m).then(()=>bitti("yd.kopyalandi"),()=>{secim();yedekMesaj="yd.sec";}); else{secim();yedekMesaj="yd.sec";}}
 else if(a==="yal"){const x=document.getElementById("yedek");try{const v=JSON.parse(x.value);if(!v||typeof v!=="object"||!v.u||!v.plan)throw 0;S=normalize(v);planDegisti();yedekMesaj="yd.yuklendi";save();render();}catch(err){yedekMesaj="yd.gecersiz";render();}}
 else if(a==="rsor"){resetOnay=true;render();}
 else if(a==="rvazgec"){resetOnay=false;render();}
 else if(a==="revet"){resetOnay=false;const dil=S.dil;S=normalize(null);S.dil=dil;planDegisti();P=null;FC=null;CZ=null;save();render();scrollTop();toast(tx("toast.sifirlandi"));}
});
document.addEventListener("change",e=>{const t=e.target;
 if(t.id==="p-exam"||t.id==="p-start"){if(!gecerliIso(t.value)){toast(tx("toast.tarih"));render();return;}const yeni=Object.assign({},S.plan,t.id==="p-exam"?{exam:t.value}:{start:t.value});if(pazartesi(isoDan(yeni.start))>pazartesi(isoDan(yeni.exam))){toast(tx("toast.baslangic"));render();return;}if(t.id==="p-exam")S.plan.exam=t.value;else S.plan.start=t.value;planDegisti();S.aktif=null;save();render();}
 else if(t.dataset&&t.dataset.gpm!=null){if(String(t.value).trim()===""){render();return;}const m=S.gp.musaitlik.slice();m[+t.dataset.gpm]=t.value;S.gp=gpOnar({musaitlik:m,dersGunu:S.gp.dersGunu});save();render();}
 else if(t.dataset&&t.dataset.gpders){S.gp=gpOnar({musaitlik:S.gp.musaitlik,dersGunu:t.value===""?null:+t.value});save();render();}
 else if(t.dataset&&t.dataset.tasi){const ch=t.dataset.tasi;if(t.value)S.plan.tasi[ch]=t.value;else delete S.plan.tasi[ch];planDegisti();save();render();}});
document.addEventListener("toggle",e=>{if(e.target.classList&&e.target.classList.contains("kaynakbox")&&e.target.closest(".adim")&&!e.target.closest(".adim").querySelector(".aklinda"))S.kaynakAcik=e.target.open;},true);
document.addEventListener("input",e=>{const t=e.target;
 if(t.dataset&&t.dataset.hc){TASLAK[t.dataset.hc]=String(t.value).slice(0,1500);return;}
 if(t.id==="ktq"){const v=t.value.toLowerCase().trim();document.querySelectorAll("#main .ktgrp").forEach(g=>{let any=0;g.querySelectorAll(".ktrow").forEach(r=>{const m=!v||r.textContent.toLowerCase().includes(v);r.hidden=!m;if(m)any=1;});g.hidden=!any;});return;}
 if(t.id==="hnot"){const iso=t.dataset.iso,r=S.hafta[iso]=S.hafta[iso]||{not:"",kontrol:[]};r.not=t.value.slice(0,4000);clearTimeout(notT);notT=setTimeout(save,500);return;}
 if(t.id==="calcn"){calcN=+t.value;const g=grade(calcN),gb=document.getElementById("calcg");gb.textContent=gf(g);gb.className=g>=7?"c-good":g>=5.5?"c-warn":"c-bad";document.getElementById("calct").textContent=tx("g.calct",calcN);const mk=document.querySelector("#main .scale .mk");if(mk){const pos=calcN;mk.style.left=pos+"%";mk.className=`mk you ${pos<12?"edgeL":pos>88?"edgeR":""}`;mk.querySelector("span").textContent=`${calcN} → ${gf(g)}`;}}});
let notT=null;
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.dataset&&e.target.dataset.hcsor){const btn=document.querySelector('#main [data-act="hcsor"]');if(btn){e.preventDefault();btn.click();}return;}
 if(e.target.closest&&e.target.closest("input,textarea,select"))return;if(e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase(),map={a:0,b:1,c:2,d:3,e:4,f:5,"1":0,"2":1,"3":2,"4":3,"5":4,"6":5};
 if(k==="x"){const btn=document.querySelector('#main [data-act="emin"]');if(btn){btn.click();e.preventDefault();}return;}
 if(S.view==="bugun"&&BG&&BG.cur&&BG.cur.tur==="t"&&BG.flip&&(k==="1"||k==="2"||k==="3")){const btn=document.querySelector(`#main [data-act="bgnot"][data-n="${+k-1}"]`);if(btn){btn.click();e.preventDefault();}return;}
 if(S.view==="unit"&&S.tab==="cards"&&FC){if(k===" "){e.preventDefault();FC.flip=!FC.flip;render();return;}if(k==="1"||k==="2"){const btn=document.querySelector(`#main [data-act="fcnext"][data-k="${k==="2"?1:0}"]`);if(btn){btn.click();e.preventDefault();}return;}}
 if(k in map){const btn=document.querySelector(`#main [data-act="ans"][data-i="${map[k]}"]:not([disabled]),#main [data-act="sans"][data-i="${map[k]}"]:not([disabled]),#main [data-act="ktans"][data-i="${map[k]}"]:not([disabled])`);if(btn){btn.click();e.preventDefault();}}
 else if(k==="enter"||k==="arrowright"){const btn=document.querySelector("#main [data-next]:not([disabled])");if(btn&&!(k==="enter"&&document.activeElement&&document.activeElement.tagName==="BUTTON"&&document.activeElement!==btn)){btn.click();e.preventDefault();}}
 else if(k==="arrowleft"){const btn=document.querySelector("#main [data-prev]:not([disabled])");if(btn){btn.click();e.preventDefault();}}});
setInterval(paintPills,6e4);
render();
