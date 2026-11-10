/* ================= SINAV YAPISI ================= */
document.documentElement.lang="tr";
const CHAPTERS = {
  1:{t:"Intro to Leadership & Management",p:1}, 2:{t:"Personality and Leadership",p:1}, 3:{t:"Leadership Approaches",p:2},
  4:{t:"Values-Based & Contemporary Leadership",p:2}, 5:{t:"Communication & Decision Making",p:1}, 6:{t:"Leadership Mission and Strategy",p:3},
  7:{t:"Goals and Motivational Leadership",p:1}, 8:{t:"Leadership and the Organization",p:2}, 9:{t:"Global Leadership",p:1},
  10:{t:"Leading Teams",p:2}, 11:{t:"Leading Innovation and Change",p:3}
};
const CH_ORDER=[1,2,3,4,5,6,7,8,9,10,11];
const PARTS = {
  1:{name:"Part 1 · Çoktan seçmeli", short:"Part 1", chs:[1,2,5,7,9], desc:"20 soru · 4 seçenek · her biri 2 puan"},
  2:{name:"Part 2 · Mini vakalar", short:"Part 2", chs:[3,4,8,10], desc:"15 soru · 4 seçenek · her biri 2 puan"},
  3:{name:"Part 3 · Uzun vakalar", short:"Part 3", chs:[6,11], desc:"2 vaka · 6 soru · 6 seçenek · her biri 5 puan"}
};
const SHORT={c1a:"P-O-L-C",c1b:"Mintzberg & Katz",c2a:"Personality",c2b:"Work attitudes",c3a:"Power",c3b:"Traits & behaviours",c4a:"Contemporary styles",c4b:"Values & ethics",c5a:"Communication",c5b:"Decision making",c6a:"Mission & vision",c6b:"Strategy levels",c6c:"Value chain · VRIO · BCG",c6d:"SWOT · PESTEL · Porter",c6e:"Intended vs realized",c7a:"Goals & CSR",c7b:"Motivation",c8a:"Structures",c8b:"Culture & DEI",c9a:"Hofstede & GLOBE",c9b:"Going global",c10a:"Tuckman",c10b:"Networks",c11a:"Innovative culture",c11b:"Change drivers",c11c:"Resistance",c11d:"Lewin & Kotter",c11e:"Schein"};
const QN=8, BAR=6, MAXP=100, GUESS=22.5, PASSP=61.25, TARGET=75, HAFTA_ORAN=.75;
const LVL={1:"Hatırlama",2:"Uygulama",3:"Sınav tuzağı"};
const grade=p=>Math.min(10,Math.max(1,1+9*(p-GUESS)/(MAXP-GUESS)));
const gf=g=>g.toFixed(1).replace(".",",");
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
const ders=uid=>DERSLER.lessons[uid]||null;
const ucAd=uid=>{const d=ders(uid);return d?d.ad:UNIT[uid].t;};
const chBilgi=ch=>DERSLER.chapters[ch]||null;
const chAd=ch=>{const c=chBilgi(ch);return c?c.ad:CHAPTERS[ch].t;};
const BLOKLAR=CH_ORDER.map(ch=>({ch,units:UNITS.filter(u=>u.ch===ch).map(u=>u.id)}));
function parcala(notes){const m=notes.match(/<div class="trap">[\s\S]*?<\/div>\s*$/),trap=m?m[0].trim():"",body=m?notes.slice(0,m.index):notes;return{trap,seg:body.split(/(?=<h4>)/).map(s=>s.trim()).filter(Boolean)};}
const NOT=Object.fromEntries(UNITS.map(u=>[u.id,parcala(u.notes)]));
const adimSayisi=uid=>{const d=ders(uid);return d?d.adimlar.length:0;};
const TOPLAM_ADIM=UNITS.reduce((a,u)=>a+adimSayisi(u.id),0);

/* ---------- durum ---------- */
const LKEY="itmders.v1";
function freshPlan(){return{start:isoGun(pazartesi(new Date())),exam:PLAN_VARSAYILAN.exam,ok:false,skip:PLAN_VARSAYILAN.skip.slice(),tasi:{}};}
const bugunIso=()=>isoGun(new Date());
const bugunNo=()=>tkGun(Date.now());
const sinavNo=()=>tkIsoGun(S.plan.exam);
function fresh(){return{v:1,updated:0,u:{},wrong:[],seen:{},z:{},zk:null,view:"hafta",unit:"c1a",tab:"anlatim",aktif:null,kw:null,plan:freshPlan(),hafta:{},okul:{},kt:{},kaynakAcik:true,tk:tkYeni(),ts:tsYeni(),gp:gpVarsayilan(),hc:hcOnar(null)};}
function normalize(s){const f=fresh();if(!s||typeof s!=="object")s={};const o=Object.assign(f,s);o.u={};
 o.tk=tkOnar(s.tk);o.ts=tsOnar(s.ts);o.gp=gpOnar(s.gp);o.hc=hcOnar(s.hc,isoGun(new Date()));
 UNITS.forEach(u=>{o.u[u.id]=Object.assign({check:0,chal:0,checkN:0,chalN:0,hist:[],adim:{},pos:0,bitti:0},(s.u||{})[u.id]||{});if(!o.u[u.id].adim||typeof o.u[u.id].adim!=="object")o.u[u.id].adim={};});
 if(!Array.isArray(o.wrong))o.wrong=[];["seen","z","hafta","okul","kt"].forEach(k=>{if(!o[k]||typeof o[k]!=="object")o[k]={};});
 o.wrong=o.wrong.filter(w=>w&&w.q&&Array.isArray(w.q.o)&&UNIT[w.q.u]);
 o.plan=Object.assign(freshPlan(),o.plan||{});if(!Array.isArray(o.plan.skip))o.plan.skip=[];if(!o.plan.tasi||typeof o.plan.tasi!=="object")o.plan.tasi={};
 if(!VIEWS.has(o.view)||(o.view==="kontrol"&&!o.kw))o.view="hafta";if(!UNIT[o.unit])o.unit="c1a";if(!TABS.has(o.tab))o.tab="anlatim";return o;}
const VIEWS=new Set(["hafta","bugun","takvim","dersler","unit","cases","terms","mistakes","grading","teshis","ayar","kontrol"]);
const TABS=new Set(["anlatim","notlar","cards","check","chal","practice"]);
let S=(()=>{try{return normalize(JSON.parse(localStorage.getItem(LKEY)||"null"));}catch(e){return normalize(null);}})();
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
     if(r&&(r.updated||0)>(S.updated||0)){S=normalize(r);planDegisti();try{localStorage.setItem(LKEY,JSON.stringify(S));}catch(e){}render();toast("İlerlemen hesabından yüklendi");}
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
const STATUS={new:["","Başlanmadı"],study:["prove","Anlatımda"],test:["test","Teste hazır"],done:["done","Tamam"]};
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
function haftaDurum(w){const g=haftaGorevleri(w),d=g.filter(x=>x.ok).length,pct=g.length?d/g.length:0,now=buPazartesi(),zaman=w.iso<now?"gecmis":w.iso===now?"bu":"gelecek";
 let etiket;if(w.kind==="tatil")etiket=["","Okul yok"];else if(w.kind==="sinav"&&!g.length)etiket=["ink","Sınav"];else if(g.length&&d===g.length)etiket=["done","Tamam"];else if(zaman==="gecmis"&&g.length)etiket=["study","Geride"];else if(zaman==="bu")etiket=["prove","Bu hafta"];else etiket=["","Sırada"];
 return{g,d,pct,zaman,etiket};}
function gecikenler(){const now=buPazartesi();return haftalar().filter(w=>w.iso<now).flatMap(w=>w.units.filter(u=>!konuTamam(u)).map(u=>({u,w})));}
function gunKaldi(){const t=new Date(),e=isoDan(S.plan.exam);t.setHours(12,0,0,0);return Math.round((e-t)/864e5);}
const trTarih=(d,o)=>d.toLocaleDateString("tr-TR",o||{day:"numeric",month:"short"});
function aralik(w){const a=isoDan(w.iso),b=gunEkle(a,6);return a.getMonth()===b.getMonth()?`${a.getDate()}–${trTarih(b)}`:`${trTarih(a)} – ${trTarih(b)}`;}
const hIsim=w=>w.kind==="tatil"?"Okul yok":w.kind==="sinav"?"Sınav haftası":`Hafta ${w.no}`;

/* ---------- küçük yardımcılar ---------- */
let toastT=null;
function toast(t){const el=document.getElementById("toast");el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>el.hidden=true,2600);}
const yuzde=x=>Math.round(x*100);
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function scale(marks){
 const GL={0:"",23:"1,0",50:"4,2",62:"5,5",75:"7,1",100:"10"};
 const axis=[0,23,50,62,75,100].map(v=>`<i style="left:${v}%">${v}${GL[v]?`<span class="g"> · ${GL[v]}</span>`:""}</i>`).join("");
 const mk=marks.map(x=>{const pos=Math.max(0,Math.min(100,x.v));return`<div class="mk ${x.cls||""} ${pos<12?"edgeL":pos>88?"edgeR":""}" style="left:${pos}%"><span>${x.label}</span></div>`;}).join("");
 return`<div class="scale"><div class="track"><div class="zone"></div><div class="zone pass"></div><div class="zone goal"></div>${mk}</div><div class="axis">${axis}</div></div>
 <div class="legend"><span><i class="lg-guess"></i>0–23 puan: tahmin düzeyi</span><span><i class="lg-pass"></i>≈62+: geçer (5,5)</span><span><i class="lg-goal"></i>75+: hedefin</span><span>Eksen: 100 üzerinden puan · tahmini not</span></div>`;}
function caseBlock(id,open){const c=CASE[id];if(!c)return"";return`<details class="casebox" lang="en" ${open?"open":""}><summary><span class="mono">Uzun vaka</span> ${c.title}</summary>${c.text.map(p=>`<p>${p}</p>`).join("")}</details>`;}
function qCard(q,o){
 const answered=o.chosen!=null,L="ABCDEF";
 const opts=q.o.map((t,k)=>{let cls="opt";if(answered||o.mode==="review"){if(k===q.a)cls+=" right";else if(k===o.chosen)cls+=" wrong";}
  return`<button class="${cls}" data-act="ans" data-i="${k}" ${o.mode==="review"||answered?"disabled":""}><span class="L">${L[k]}</span><span lang="en">${t}</span></button>`;}).join("");
 const fb=answered||o.mode==="review"?`<div class="fb">${o.chosen==null?`<b class="no">Boş bırakıldı.</b>`:o.chosen===q.a?`<b class="ok">Doğru.</b>`:`<b class="no">Olmadı. Doğrusu ${L[q.a]}.</b>`} ${q.x}</div>`:"";
 const etiketler=q.mini?`<span class="lvl l2">Anlama sorusu</span><span class="tag">Sınav dilinde</span>`:`<span class="lvl l${q.d}">${q.cs?"Uzun vaka":LVL[q.d]}</span><span class="tag">Ders ${UNIT[q.u].ch} · ${SHORT[q.u]}</span><span class="tag">${qpts(q)} puan</span>${q.set?`<span class="tag">Ders seti</span>`:""}`;
 const emin=o.emin&&!answered&&o.mode==="quiz"?eminDugme(q):"";
 const neden=(answered||o.mode==="review")&&o.chosen!=null&&o.chosen!==q.a?hcNedenBlok(q,o.chosen):"";
 return`<article class="q"><div class="meta"><span class="row" style="gap:6px">${etiketler}</span><span class="mono">${o.num?`Soru ${o.num}${o.total?" / "+o.total:""}`:""}</span></div>${q.cs?caseBlock(q.cs,o.caseOpen!==false):""}<div class="stem" lang="en">${q.q}</div><div class="opts">${opts}</div>${emin}${fb}${neden}${o.foot||""}</article>`;}
/* "Emin değilim": cevaptan önce basılır, varsayılan emin; her soruda kendiliğinden sıfırlanır (soru id'sine bağlı). */
let EMINSIZ=null;
const eminMi=q=>EMINSIZ!==q.id;
function eminDugme(q){const u=EMINSIZ===q.id;
 return`<div class="eminrow"><button class="mini emin" data-act="emin" data-q="${esc(q.id)}" aria-pressed="${u}">Emin değilim <kbd>X</kbd></button><span class="muted">${u?"Cevabın “emin değilim” diye kaydedilecek.":"Emin değilsen cevaplamadan önce işaretle."}</span></div>`;}

/* ---------- üst bant ---------- */
function paintPills(){const W=haftalar(),dl=W.length?gunKaldi():null,w=W.length?buHaftaW():null,d=w?haftaDurum(w):null;
 const gun=dl==null?`<span class="pill"><b>!</b>Tarihleri kontrol et</span>`:`<span class="pill"><b>${Math.max(0,dl)}</b>${dl>0?"gün kaldı":dl===0?"Sınav bugün":"Sınav tarihi geçti"}</span>`;
 document.getElementById("pills").innerHTML=`${gun}${d&&d.g.length?`<span class="pill soft">Bu hafta <b>%${yuzde(d.pct)}</b></span>`:""}<span class="pill soft" title="${syncState==="cloud"?"İlerlemen Claude hesabına kaydediliyor":"İlerlemen bu tarayıcıda saklanıyor"}"><i class="dot ${syncState==="cloud"?"on":""}"></i>${syncState==="cloud"?"Eşitlendi":"Burada kayıtlı"}</span>`;}
function paintRail(){const inf=Object.fromEntries(allInfo().map(i=>[i.u.id,i])),el=document.getElementById("rail"),sl=el.scrollLeft;
 const m=(v,t,x)=>`<button class="chip main" data-act="go" data-v="${v}" aria-pressed="${S.view===v}">${t}${x||""}</button>`;
 let h=m("hafta","Bu hafta")+m("bugun","Bugün")+m("takvim","Takvim")+m("dersler","Dersler")+m("cases","Vakalar")+m("terms","Terimler")+m("mistakes","Hatalar",S.wrong.length?` (${S.wrong.length})`:"")+m("teshis","Teşhis")+m("grading","Sınav")+m("ayar","Ayarlar");
 CH_ORDER.forEach(ch=>{h+=`<span class="chgap">Ders ${ch}</span>`;UNITS.filter(u=>u.ch===ch).forEach(u=>{const i=inf[u.id];
  h+=`<button class="chip" data-act="unit" data-u="${u.id}" aria-pressed="${S.view==="unit"&&S.unit===u.id}"><small><i class="dot st-${i.status}"></i>${i.yap}/${i.top}</small><span lang="en">${SHORT[u.id]}</span></button>`;});});
 el.innerHTML=h;el.scrollLeft=sl;
 const on=el.querySelector('[aria-pressed="true"]');if(on&&on.scrollIntoView&&S.view==="unit")on.scrollIntoView({block:"nearest",inline:"nearest"});}

/* ---------- haftalık ekran ---------- */
function serit(aktif){const W=haftalar();return`<div class="serit" role="group" aria-label="Haftalar">${W.map(w=>{const d=haftaDurum(w),cls=[w.kind,d.zaman==="bu"?"bu":"",d.g.length&&d.d===d.g.length?"tamam":"",d.etiket[1]==="Geride"?"geride":""].join(" ");
  const alt=w.kind==="tatil"?"–":w.kind==="sinav"&&!w.units.length?"Sınav":w.kind==="tekrar"?"Tekrar":w.kind==="bos"?"Boş":w.chs.map(c=>"D"+c).join(" ");
  return`<button class="hf ${cls}" data-act="hsec" data-iso="${w.iso}" aria-pressed="${w.iso===aktif.iso}" title="${hIsim(w)} · ${aralik(w)}"><b>${trTarih(isoDan(w.iso),{day:"numeric"})}<small>${trTarih(isoDan(w.iso),{month:"short"})}</small></b><span>${alt}</span></button>`;}).join("")}</div>`;}
function tarihBanner(){return`<section class="banner"><div><div class="eyebrow">Önce bunu netleştir</div><h3>Sınav tarihin kaç?</h3><p>AUAS akademik takvimine göre ikinci dönem 9 Kasım 2026 – 29 Ocak 2027 arasında, Noel tatili 21 Aralık – 3 Ocak. Sınavının kesin günü rooster.hva.nl'de yazar. Sen kendi tarihini girene kadar plan, sınavın <b>${trTarih(isoDan(S.plan.exam),{day:"numeric",month:"long",year:"numeric"})}</b> haftasında olduğunu varsayar.</p></div>
 <div class="row"><label class="sr" for="b-exam">Sınav tarihi</label><input type="date" id="b-exam" value="${S.plan.exam}"><button class="btn primary" data-act="ponay">Tarihi kaydet</button></div></section>`;}
function konuSatir(uid){const u=UNIT[uid],i=unitInfo(uid),[cls,lab]=STATUS[i.status],d=ders(uid);
 const mini=(t,yazi,ok)=>`<button class="mini ${ok?"ok":""}" data-act="unit" data-u="${uid}" data-t="${t}">${yazi}</button>`;
 return`<div class="konu"><div class="konu-t"><button class="linkbtn" data-act="unit" data-u="${uid}"><i class="dot st-${i.status}"></i>${ucAd(uid)}</button><span class="konu-alt"><span class="tag ${cls}">${lab}</span>${d?`<span>${d.sure} dk</span>`:""}<span>${u.pts} puan</span></span></div>
 <div class="konu-adim">${mini("anlatim",`Anlatım ${i.yap}/${i.top}`,i.bit)}${mini("check",`Kontrol ${i.st.checkN?i.st.check+"/8":"–"}`,i.checkOk)}${mini("chal",`Zorlu ${i.st.chalN?i.st.chal+"/8":"–"}`,i.chalOk)}</div></div>`;}
function chBlok(ch,w){const c=chBilgi(ch),uids=w.units.filter(u=>UNIT[u].ch===ch),tik=!!S.okul[ch];
 const vaka=[6,11].includes(ch)&&sonBlokMu(ch,w)?`<div class="konu"><div class="konu-t"><button class="linkbtn" data-act="go" data-v="cases"><i class="dot ${vakaYapildi(ch)?"st-done":"st-new"}"></i>Bir uzun vaka çöz</button><span class="konu-alt"><span>Part 3 sınavda bu formatta gelir</span></span></div></div>`:"";
 return`<section class="panel chders"><div class="eyebrow">Ders ${ch} · ${PARTS[partOf(ch)].short}</div><h3>${chAd(ch)}</h3><p class="sub" lang="en">${CHAPTERS[ch].t}</p>
 ${c?`<div class="giris">${c.giris}${c.baglanti}</div>`:""}
 <div class="okulbox"><button class="tik ${tik?"ok":""}" data-act="okul" data-ch="${ch}" aria-pressed="${tik}" aria-label="Okuldaki dersi işledim"></button><div class="okulmetin"><b>Okuldaki dersi işledim</b>
 ${c?`<details><summary>Derse hazırlık</summary><dl><dt>Dersten önce</dt><dd>${c.okul.once}</dd><dt>Derste dikkat et</dt><dd><ul>${c.okul.odak.map(x=>`<li>${x}</li>`).join("")}</ul></dd><dt>Dersten sonra</dt><dd>${c.okul.sonra}</dd></dl></details>`:""}</div></div>
 <div class="konular">${uids.map(konuSatir).join("")}${vaka}</div></section>`;}
function hkPanel(w){const r=S.hafta[w.iso]||{},k=r.kontrol||[],key="hafta:"+w.iso,z=S.z[key],devam=z&&!z.done,gecti=haftaGecti(w.iso),tekrar=w.kind==="tekrar",eski=tekrar?0:Math.min(3,haftalar().filter(x=>x.iso<w.iso).flatMap(x=>x.units).length),hazir=w.units.every(u=>unitInfo(u).bit);
 const n=tekrar?15:10,bar=Math.ceil(n*HAFTA_ORAN);
 return`<section class="panel hk"><div class="hk-t"><div class="eyebrow">Haftalık kontrol</div><h3>${tekrar?"Genel tekrar kontrolü":"Bu hafta oturdu mu?"}</h3><p class="sub">${tekrar?`${n} soru, en zayıf konularından seçilir.`:eski?`${n} soru: ${n-eski} tanesi bu haftadan, ${eski} tanesi en zayıf eski konularından.`:`${n} soru, bu haftanın konularından.`} Baraj ${bar}/${n}.${!tekrar&&!hazir?" Anlatımları bitirince çözmen daha anlamlı olur.":""}</p>
 ${k.length?`<div class="row denemeler">${k.slice(-6).map(x=>`<span class="tag ${x.sc/x.n>=HAFTA_ORAN?"done":"study"}">${x.sc}/${x.n} · ${trTarih(new Date(x.t))}</span>`).join("")}</div>`:""}</div>
 <div class="row"><button class="btn ${gecti?"":"primary"}" data-act="hstart" data-iso="${w.iso}" data-devam="${devam?1:0}">${devam?`Devam et · ${z.ans.filter(a=>a!=null).length}/${z.qs.length}`:k.length?"Yeni sorularla tekrar çöz":"Kontrole başla"}</button></div></section>`;}
function notPanel(w){const r=S.hafta[w.iso]||{};return`<section class="panel"><label class="eyebrow" for="hnot">Haftanın notu</label><textarea id="hnot" data-iso="${w.iso}" rows="3" placeholder="Hoca neyi vurguladı, nerede takıldın, sınava dair ne söylendi?">${esc(r.not||"")}</textarea></section>`;}
function sonrakiGorev(w){const g=haftaGorevleri(w).filter(x=>!x.ok&&x.k!=="okul")[0];if(!g)return null;
 if(g.k==="anlatim")return{t:`Devam et: ${ucAd(g.uid)}`,attr:`data-act="unit" data-u="${g.uid}" data-t="anlatim"`};
 if(g.k==="kontrol")return{t:`Kontrol testi: ${ucAd(g.uid)}`,attr:`data-act="unit" data-u="${g.uid}" data-t="check"`};
 if(g.k==="vaka")return{t:"Uzun vaka çöz",attr:`data-act="go" data-v="cases"`};
 if(g.k==="hk")return{t:"Haftalık kontrole başla",attr:`data-act="hstart" data-iso="${w.iso}" data-devam="${S.z["hafta:"+w.iso]&&!S.z["hafta:"+w.iso].done?1:0}"`};
 if(g.k==="zorlu"){const u=UNITS.find(x=>S.u[x.id].chal<BAR);return{t:`Zorlu test: ${ucAd(u.id)}`,attr:`data-act="unit" data-u="${u.id}" data-t="chal"`};}
 if(g.k==="hata")return{t:"Hatalarını temizle",attr:`data-act="go" data-v="mistakes"`};
 return null;}

/* ---------- günlük plan, telafi, takvim dosyası (gunluk.js) ---------- */
const GP_DK={okul:0,kontrol:8,vaka:20,hk:10,zorlu:10,hata:10};
const GUN_AD=["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"],GUN_UZUN=["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];
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
 if(t.k==="okul")return{t:`Okulda Ders ${t.ch}`,attr:`data-act="go" data-v="hafta"`};
 if(t.k==="anlatim")return{t:`Anlatım: ${ucAd(t.uid)}`,attr:`data-act="unit" data-u="${t.uid}" data-t="anlatim"`};
 if(t.k==="kontrol")return{t:`Kontrol testi: ${ucAd(t.uid)}`,attr:`data-act="unit" data-u="${t.uid}" data-t="check"`};
 if(t.k==="vaka")return{t:`Uzun vaka: Ders ${t.ch}`,attr:`data-act="go" data-v="cases"`};
 if(t.k==="hk"){const z=S.z["hafta:"+w.iso];return{t:"Haftalık kontrol",attr:`data-act="hstart" data-iso="${w.iso}" data-devam="${z&&!z.done?1:0}"`};}
 if(t.k==="zorlu"){const u=UNITS.find(x=>S.u[x.id].chal<BAR);return u?{t:`Zorlu test: ${ucAd(u.id)}`,attr:`data-act="unit" data-u="${u.id}" data-t="chal"`}:{t:"Zorlu testler",attr:`data-act="go" data-v="hafta"`};}
 if(t.k==="hata")return{t:"Hatalarını temizle",attr:`data-act="go" data-v="mistakes"`};
 return{t:"Haftanın görevi",attr:`data-act="go" data-v="hafta"`};}
function gorevSatir(t,w){const b=gorevBag(t,w);
 return`<div class="konu"><div class="konu-t"><button class="linkbtn" ${b.attr}><i class="dot ${t.gecikmis?"st-study":"st-new"}"></i>${b.t}</button><span class="konu-alt">${t.dk?`<span>${t.dk} dk</span>`:""}${t.gecikmis?`<span class="tag study">Geriden</span>`:""}</span></div></div>`;}
function gunSerit(p){if(!p||!p.gunler.length)return"";const sigmayan=p.sigmayan.filter(t=>t.k!=="okul");
 const hucre=g=>{const d=isoDan(g.iso),n=g.gorevler.length;return`<div class="gn ${g.durum}${g.kapasite===0?" dinlen":""}" role="listitem" aria-label="${GUN_UZUN[g.gun]} ${d.getDate()}: ${n} görev, ${g.dk} dakika"><b>${GUN_AD[g.gun]}</b><span class="mono">${d.getDate()}</span><small>${g.kapasite===0?"dinlen":`${g.dk}/${g.kapasite} dk`}</small><i>${n?n+" iş":"boş"}</i></div>`;};
 const liste=p.gunler.filter(g=>g.gorevler.length).map(g=>`<div class="gpgun"><div class="eyebrow">${GUN_UZUN[g.gun]}${g.durum==="bugun"?" · bugün":""}</div><div class="konular">${g.gorevler.map(t=>gorevSatir(t,p.w)).join("")}</div></div>`).join("");
 return`<section class="panel gunplan"><div class="eyebrow">Bu haftanın günleri</div><div class="gunler" role="list">${p.gunler.map(hucre).join("")}</div>
 ${liste?`<details class="kaynakbox gpd"><summary>Günlere göre görevler</summary>${liste}</details>`:""}
 ${sigmayan.length?`<p class="sub" style="margin:10px 0 0">${sigmayan.length} görev (yaklaşık ${p.acikDk} dk) bu haftaya sığmadı. Günlük sürelerini Ayarlar'dan artırabilirsin.</p>`:""}</section>`;}
function telafiKarar(){const W=haftalar(),now=buPazartesi(),kalanDk={};
 W.forEach(w=>{kalanDk[w.iso]=haftaGorevleri(w).filter(t=>!t.ok&&t.k!=="okul"&&(w.iso>=now||GECMIS_TUR.includes(t.k))).reduce((a,t)=>a+gorevDk(t),0);});
 return gpTelafi({haftalar:W,kalanDk,bugun:bugunIso(),musaitlik:S.gp.musaitlik});}
function telafiCumle(T){const k=T.karar,o=k.oneri,bit=k.bitisIso?trTarih(isoDan(k.bitisIso),{day:"numeric",month:"long"}):null;let s;
 if(k.durum==="rahat")s=`Bu tempoyla yetişirsin${bit?`: kalan iş yaklaşık ${bit} günü biter`:""}.`;
 else if(k.durum==="sinirda")s=`Yetişir ama pay az: en sıkışık dönemde planlı zamanının yüzde ${yuzde(Math.min(1,k.yuk))} kadarı dolu${bit?`, iş ${bit} günü biter`:""}. Bir gün aksarsa geride kalırsın.`;
 else{s="Bu tempoyla sınava yetişmiyor.";
  if(o.tip==="haftaSonu")s+=` ${o.gunler.map(i=>GUN_UZUN[i]).join(" ve ")} günlerine ${o.dk} dakika çalışma koyarsan yetişir.`;
  else if(o.tip==="dkArtir"&&o.gunlukEk!=null)s+=` Çalıştığın her güne ${o.gunlukEk} dakika eklersen yetişir.`;
  else s+=" Günlük süreyi artırmak tek başına yetmiyor; sınav tarihini ve günlük sürelerini Ayarlar'da kontrol et.";}
 if(k.gerekliGunlukDk!=null&&k.gerekliGunlukDk>0)s+=` Ortalama günde ${k.gerekliGunlukDk} dakika gerekiyor.`;
 return s;}
let icsMesaj="",icsMetin="";
async function icsAktar(){const adlar={};UNITS.forEach(u=>{adlar[u.id]=String(ucAd(u.id)).replace(/<[^>]+>/g,"");});
 const data=gpIcs({haftalar:haftalar(),sinavIso:S.plan.exam,dersGunu:S.gp.dersGunu,adlar,uretildi:Date.now()}),filename="itm-plan.ics";icsMetin="";
 try{if(window.claude&&typeof window.claude.use==="function"){const dl=await window.claude.use("downloads");if(dl&&typeof dl.save==="function"){await dl.save({filename,data});icsMesaj="Takvim dosyası kaydedildi: itm-plan.ics";render();return;}}}catch(e){}
 try{if(typeof Blob!=="undefined"&&typeof URL!=="undefined"&&URL.createObjectURL&&document.createElement){const a=document.createElement("a"),u=URL.createObjectURL(new Blob([data],{type:"text/calendar;charset=utf-8"}));a.href=u;a.download=filename;a.style.display="none";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);icsMesaj="İndirme başladı: itm-plan.ics. Dosyayı takvim uygulamanla aç.";render();return;}}catch(e){}
 icsMetin=data;icsMesaj="İndirme açılmadı. Aşağıdaki metni kopyala, itm-plan.ics adıyla kaydet.";render();}
function gecikenPanel(w){const G=gecikenler();if(!G.length)return"";const ilk=G.slice(0,6);
 const T=telafiKarar();
 return`<section class="panel geciken"><div class="eyebrow">Telafi</div><h3>${G.length} konu geride kaldı</h3><p class="sub">Önce bunları kapat, sonra bu haftaya geç. Biten konu listeden kendiliğinden düşer.</p><p class="telafi ${T.karar.durum}"><b>${T.karar.durum==="rahat"?"Yetişir.":T.karar.durum==="sinirda"?"Sınırda.":"Yetişmiyor."}</b> ${telafiCumle(T)}</p><div class="konular">${ilk.map(x=>`<div class="konu"><div class="konu-t"><button class="linkbtn" data-act="unit" data-u="${x.u}"><i class="dot st-${unitInfo(x.u).status}"></i>${ucAd(x.u)}</button><span class="konu-alt"><span class="tag study">${hIsim(x.w)}</span></span></div></div>`).join("")}</div>${G.length>6?`<p class="sub" style="margin:10px 0 0">ve ${G.length-6} konu daha. Tamamı Takvim ekranında.</p>`:""}</section>`;}
function tekrarIcerik(w){const bekleyen=UNITS.filter(u=>S.u[u.id].chal<BAR);
 return`<section class="panel"><div class="eyebrow">Genel tekrar</div><h3>Son haftanın işi</h3><p class="sub">Yeni konu yok. Zayıf yerleri kapat, zor soru tarzına alış.</p>
 <div class="konular"><div class="konu"><div class="konu-t"><b>Zorlu testler</b><span class="konu-alt"><span class="tag ${bekleyen.length?"prove":"done"}">${bekleyen.length?bekleyen.length+" konu bekliyor":"Hepsi geçildi"}</span></span></div>${bekleyen.length?`<div class="konu-adim">${bekleyen.slice(0,8).map(u=>`<button class="mini" data-act="unit" data-u="${u.id}" data-t="chal" lang="en">${SHORT[u.id]}</button>`).join("")}</div>`:""}</div>
 <div class="konu"><div class="konu-t"><button class="linkbtn" data-act="go" data-v="mistakes"><i class="dot ${S.wrong.length?"st-study":"st-done"}"></i>Hatalarını sıfırla</button><span class="konu-alt"><span>${S.wrong.length} soru listede</span></span></div></div>
 ${[6,11].map(ch=>`<div class="konu"><div class="konu-t"><button class="linkbtn" data-act="go" data-v="cases"><i class="dot ${vakaYapildi(ch)?"st-done":"st-new"}"></i>Ders ${ch} için uzun vaka çöz</button></div></div>`).join("")}
 <div class="konu"><div class="konu-t"><button class="linkbtn" data-act="go" data-v="terms"><i class="dot st-new"></i>Terim alıştırması yap</button><span class="konu-alt"><span>${ALLT.length} terim</span></span></div></div></div></section>`;}
function vHafta(){const W=haftalar();
 if(!W.length)return`<div class="page"><section class="panel empty"><h3>Tarihler uyuşmuyor</h3><p>Başlangıç sınavdan sonra olamaz.</p><button class="btn primary" data-act="go" data-v="ayar">Tarihleri düzelt</button></section></div>`;
 const w=aktifHafta(),d=haftaDurum(w),i=W.indexOf(w),sn=sonrakiGorev(w),buMu=w.iso===buHaftaW().iso;
 const baslik=w.kind==="tatil"?"Bu hafta okul yok":w.kind==="tekrar"?"Genel tekrar":w.kind==="bos"?"Planda ders yok":w.kind==="sinav"&&!w.units.length?"Sınav haftası":w.chs.map(ch=>`Ders ${ch}: ${chAd(ch)}`).join(" · ");
 const alt=w.kind==="tatil"?"Geride kalan konun varsa telafi için iyi bir fırsat.":w.kind==="bos"?"Bu haftayı telafi ve zayıf konular için kullan.":w.kind==="tekrar"?"Zorlu testler, hatalar, uzun vakalar ve terimler.":w.kind==="sinav"&&!w.units.length?"Yeni konu açma. Hatalarına ve terimlere bak, sınav kurallarını oku.":`${w.units.length} konu · yaklaşık ${w.units.reduce((a,u)=>a+(ders(u)?ders(u).sure:0),0)} dakika anlatım.`;
 const orta=w.units.length?w.chs.map(ch=>chBlok(ch,w)).join(""):w.kind==="tekrar"?tekrarIcerik(w):w.kind==="sinav"?`<section class="panel"><h3>Sınava giderken</h3><ul class="rules-list"><li>Geçerli pasaport, kimlik, ehliyet veya oturum izni ile okul kartını yanına al.</li><li>AUAS kullanıcı adını ve şifreni ezbere bil.</li><li>Soru boş kalırsa 0 alırsın, hepsini işaretle.</li></ul><div class="row" style="margin-top:12px"><button class="btn" data-act="go" data-v="grading">Sınav kurallarının tamamı</button><button class="btn" data-act="go" data-v="mistakes">Hatalarıma bak</button></div></section>`:"";
 const gp=gunPlani();
 return`<div class="page">${S.plan.ok?"":tarihBanner()}${bugunKisa(gp)}${serit(w)}
 <section class="hero wk"><div class="row" style="justify-content:space-between"><div class="eyebrow">${hIsim(w)}${w.no?" / "+W.filter(x=>x.no).length:""} · ${aralik(w)}</div><div class="row" style="gap:6px"><span class="tag ${d.etiket[0]}">${d.etiket[1]}</span><button class="btn sm" data-act="hkay" data-d="-1" ${i===0?"disabled":""} aria-label="Önceki hafta">‹</button>${buMu?"":`<button class="btn sm" data-act="hbu">Bu haftaya dön</button>`}<button class="btn sm" data-act="hkay" data-d="1" ${i===W.length-1?"disabled":""} aria-label="Sonraki hafta">›</button></div></div>
 <h2>${baslik}</h2><p>${alt}</p>
 ${d.g.length?`<div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${yuzde(d.pct)}"><i style="width:${yuzde(d.pct)}%"></i></div><div class="meter-t"><b>${d.d}</b> / ${d.g.length} görev bitti</div>`:""}
 ${sn?`<div class="row"><button class="btn primary" ${sn.attr}>${sn.t}</button></div>`:d.g.length?`<div class="row"><span class="tag done">Bu haftanın bütün görevleri bitti</span></div>`:""}</section>
 ${buMu&&gp&&gp.buMu?gunSerit(gp):""}${buMu?gecikenPanel(w):""}${orta}${w.units.length||w.kind==="tekrar"?hkPanel(w):""}${w.kind==="tatil"?"":notPanel(w)}</div>`;}

/* ---------- takvim ve durum ---------- */
function vTakvim(){const W=haftalar();if(!W.length)return vHafta();
 const inf=allInfo(),pp=projected(inf),pg=grade(pp),bitenAdim=inf.reduce((a,i)=>a+i.yap,0),biten=inf.filter(i=>i.bit&&i.checkOk).length,olcu=inf.filter(i=>i.olcum).length,G=gecikenler();
 const satir=W.map(w=>{const d=haftaDurum(w),konu=w.units.length?w.chs.map(ch=>`Ders ${ch}: ${chAd(ch)}`).join(" · "):w.kind==="tatil"?"Okul yok":w.kind==="tekrar"?"Genel tekrar":w.kind==="sinav"?"Sınav":"Serbest hafta";
  return`<button class="hsatir ${d.zaman==="bu"?"bu":""}" data-act="hsec" data-iso="${w.iso}" data-git="1"><span class="mono hs-t">${aralik(w)}</span><span class="hs-k"><b>${konu}</b>${w.units.length?`<small>${w.units.map(u=>SHORT[u]).join(" · ")}</small>`:""}</span><span class="hs-s">${d.g.length?`<span class="minibar"><i style="width:${yuzde(d.pct)}%"></i></span>`:""}<span class="tag ${d.etiket[0]}">${d.etiket[1]}</span></span></button>`;}).join("");
 const chs=CH_ORDER.map(c=>{const us=inf.filter(i=>i.u.ch===c),n=us.reduce((a,i)=>a+i.u.pts,0),p=us.reduce((a,i)=>a+i.u.pts*i.p,0)/n,olc=us.some(i=>i.olcum);
  return`<div class="chb"><div class="t"><b>Ders ${c} · ${chAd(c)}</b><span class="muted">${PARTS[partOf(c)].short} · ${n} puan</span></div><div class="bar"><i class="${p>=.75?"ok":p>=.6?"mid":""}" style="width:${yuzde(p)}%"></i><span class="goal" title="%75 hedef"></span></div><div class="num">${olc?"%"+yuzde(p):"ölçülmedi"}</div></div>`;}).join("");
 return`<div class="page"><section class="panel"><div class="eyebrow">Sınava kadar</div><h3>Haftalar</h3><p class="sub">Bir haftaya dokununca görevleri açılır. Okulun sırası farklıysa Ayarlar'dan dersi başka haftaya taşı.</p><div class="hliste">${satir}</div><div class="row" style="margin-top:12px"><button class="btn" data-act="go" data-v="ayar">Takvimi düzenle</button></div></section>
 <section class="panel"><div class="eyebrow">Durumun</div><div class="stand" style="margin-top:10px"><div class="stat"><div class="eyebrow">Biten konu</div><b class="${biten===28?"c-good":""}">${biten}</b><span>/ 28 konu (anlatım ve kontrol)</span></div><div class="stat"><div class="eyebrow">Anlatım</div><b>${bitenAdim}</b><span>/ ${TOPLAM_ADIM} adım${G.length?` · ${G.length} konu geride`:""}</span></div><div class="stat tg"><div class="eyebrow">Tahmini puan</div><b>${Math.round(pp)}</b><span>${olcu?`not ≈${gf(pg)} · ${olcu}/28 konu ölçüldü`:"henüz ölçülmedi"}</span></div></div>
 ${scale([{v:pp,label:`Şu an ≈${Math.round(pp)}`,cls:"proj"}])}<p class="muted" style="margin:6px 0 0;font-size:14px">Tahmin son cevaplarına göre hesaplanır. Çalışmadığın konular şans düzeyinde sayılır, o yüzden başta düşük görünür.</p></section>
 <section class="panel"><h3>Derslere göre</h3><p class="sub">Son cevaplarına göre tahmini doğru oranı. Siyah çizgi %75 hedefin.</p><div class="chbars">${chs}</div></section></div>`;}

/* ---------- ders listesi ---------- */
function haftasi(ch){const w=haftalar().filter(x=>x.chs.includes(ch));return w.length?w.map(x=>aralik(x)).join(", "):"Takvimde yok";}
function vDersler(){return`<div class="page"><section class="panel"><div class="eyebrow">Müfredat</div><h3>11 ders, 28 konu</h3><p class="sub">Her konu adım adım anlatılır: Türkçe açıklama, örnek, kursun İngilizce notu ve bir anlama sorusu. Sonra Kontrol ve Zorlu testler gelir.</p></section>
 ${CH_ORDER.map(ch=>{const c=chBilgi(ch),us=UNITS.filter(u=>u.ch===ch),bit=us.filter(u=>konuTamam(u.id)).length;return`<section class="panel chders"><div class="row" style="justify-content:space-between"><div class="eyebrow">Ders ${ch} · ${PARTS[partOf(ch)].short} · ${us.reduce((a,u)=>a+u.pts,0)} puan</div><span class="tag ${bit===us.length?"done":""}">${bit}/${us.length} konu</span></div><h3>${chAd(ch)}</h3><p class="sub"><span lang="en">${CHAPTERS[ch].t}</span> · ${haftasi(ch)}</p>${c?`<div class="giris">${c.giris}</div>`:""}<div class="konular">${us.map(u=>konuSatir(u.id)).join("")}</div></section>`;}).join("")}</div>`;}

/* ---------- konu ekranı ---------- */
let P=null, FC=null;
function vUnit(){const u=UNIT[S.unit],i=unitInfo(u.id),[cls,lab]=STATUS[i.status],d=ders(u.id);
 const tabs=[["anlatim","Anlatım",`<span class="sc ${i.bit?"ok":""}">${i.yap}/${i.top}</span>`],["notlar","Notlar",""],["cards","Kartlar",""],["check","Kontrol",`<span class="sc ${i.checkOk?"ok":""}">${i.st.check}/8</span>`],["chal","Zorlu",`<span class="sc ${i.chalOk?"ok":""}">${i.st.chal}/8</span>`],["practice","Serbest",""]];
 let body="";
 if(S.tab==="anlatim")body=vAnlatim(u);else if(S.tab==="notlar")body=vNotlar(u,i);else if(S.tab==="cards")body=vCards(u);else if(S.tab==="check"||S.tab==="chal")body=vQuizTab(u,i,S.tab);else body=vPractice(u);
 return`<div class="page"><div class="uhead"><div class="eyebrow">Ders ${u.ch} · ${chAd(u.ch)} · ${PARTS[partOf(u.ch)].short}</div><h2>${ucAd(u.id)}</h2><div class="row" style="gap:8px"><span class="tag ${cls}">${lab}</span>${d?`<span class="tag">${d.sure} dk</span>`:""}<span class="tag">Sınavda ${u.pts} puan</span></div></div>
 <div class="steps" role="tablist">${tabs.map(([k,l,x])=>`<button class="step" role="tab" aria-selected="${S.tab===k}" data-act="tab" data-t="${k}">${l}${x}</button>`).join("")}</div>${body}</div>`;}
function vAnlatim(u){const d=ders(u.id);if(!d)return vNotlar(u,unitInfo(u.id));const st=S.u[u.id],n=d.adimlar.length,p=Math.min(Math.max(st.pos||0,0),n+1);st.pos=p;
 const strip=s=>s.replace(/<[^>]+>/g,"");
 const nav=`<nav class="adimnav" aria-label="Anlatım adımları"><button class="an yazi ${p===0?"cur":""}" data-act="apos" data-p="0" ${p===0?'aria-current="step"':""}>Giriş</button>${d.adimlar.map((a,i)=>{const c=st.adim[i],q=c!=null?adimSoru(u.id,i):null;return`<button class="an ${p===i+1?"cur":""} ${c!=null?(c===q.a?"ok":"no"):""}" data-act="apos" data-p="${i+1}" title="${esc(strip(a.baslik))}" aria-label="Adım ${i+1}: ${esc(strip(a.baslik))}" ${p===i+1?'aria-current="step"':""}>${i+1}</button>`;}).join("")}<button class="an yazi ${p===n+1?"cur":""}" data-act="apos" data-p="${n+1}" ${p===n+1?'aria-current="step"':""}>Özet</button></nav>`;
 return nav+(p===0?vGiris(u,d):p>n?vOzet(u,d):vAdim(u,d,st,p-1));}
function vGiris(u,d){return`<article class="panel adim"><div class="eyebrow">Bu konu neden önemli</div><div class="anl">${d.neden}</div>
 <h4>Bu konunun sonunda</h4><ul class="hedef">${d.hedefler.map(x=>`<li>${x}</li>`).join("")}</ul>
 <h4>Sınavda</h4><div class="anl kucuk">${d.sinavda}</div>
 <h4>Adımlar</h4><ol class="adimliste">${d.adimlar.map((a,i)=>`<li><button class="linkbtn" data-act="apos" data-p="${i+1}">${a.baslik}</button></li>`).join("")}</ol>
 <div class="row" style="margin-top:6px"><button class="btn primary" data-act="apos" data-p="1" data-next>Derse başla <kbd>Enter</kbd></button></div></article>`;}
function vAdim(u,d,st,i){const a=d.adimlar[i],q=adimSoru(u.id,i),ch=st.adim[i]!=null?st.adim[i]:null,son=i===d.adimlar.length-1,terim=u.terms.filter(t=>a.terimler.includes(t[0])),kay=a.kaynak.map(k=>NOT[u.id].seg[k]).join("");
 const foot=`<div class="qfoot"><button class="btn" data-act="apos" data-p="${i}" data-prev>Geri</button>${ch!=null?`<button class="btn primary" data-act="apos" data-p="${i+2}" data-next>${son?"Özete geç":"Sonraki adım"} <kbd>Enter</kbd></button>`:`<span class="muted" style="font-size:14px">İlerlemek için soruyu yanıtla. A–D tuşları da çalışır.</span>`}</div>`;
 return`<article class="panel adim"><div class="eyebrow">Adım ${i+1} / ${d.adimlar.length}</div><h3>${a.baslik}</h3><div class="anl">${a.anlatim}</div>
 <div class="ornek"><div class="eyebrow">Örnek</div>${a.ornek}</div>
 ${terim.length?`<div class="adimterim"><div class="eyebrow">Bu adımın terimleri</div><div class="terms" lang="en">${terim.map(([x,y])=>`<div><b>${x}${dinle(x)}</b><span>${y}</span></div>`).join("")}</div></div>`:""}
 <details class="kaynakbox" ${S.kaynakAcik?"open":""}><summary>Kursun İngilizce notu</summary><div class="notes" lang="en">${kay}</div></details></article>
 ${qCard(q,{mode:"quiz",chosen:ch,mini:true,foot}).replace(/data-act="ans"/g,'data-act="sans"')}${hcAdimPanel(u,d,i,ch!=null)}`;}
function vOzet(u,d){const st=S.u[u.id],tam=d.adimlar.every((_,i)=>st.adim[i]!=null),eksik=d.adimlar.findIndex((_,i)=>st.adim[i]==null),dogru=d.adimlar.filter((_,i)=>st.adim[i]!=null&&st.adim[i]===adimSoru(u.id,i).a).length;
 return`<article class="panel adim"><div class="eyebrow">Özet</div><h3>Aklında kalması gerekenler</h3><ul class="hedef">${d.ozet.map(x=>`<li>${x}</li>`).join("")}</ul>
 <div class="aklinda">${d.aklinda}</div>
 <h4>Sınav tuzakları</h4><div class="tuzak">${d.tuzaklar.map(t=>`<div class="tz"><div class="tz-y"><span class="eyebrow">Yanlış</span>${t.yanlis}</div><div class="tz-d"><span class="eyebrow">Doğrusu</span>${t.dogru}</div></div>`).join("")}</div>
 ${NOT[u.id].trap?`<details class="kaynakbox"><summary>Kursun İngilizce sınav notu</summary><div class="notes" lang="en">${NOT[u.id].trap}</div></details>`:""}
 </article>
 <section class="panel"><div class="eyebrow">Sonraki adım</div><h3>${tam?`Anlatım bitti, anlama soruların ${dogru}/${d.adimlar.length}`:"Anlatımda eksik adım var"}</h3><p class="sub">${tam?"Şimdi 8 soruluk Kontrol testi: baraj 6/8. Takvimdeki konu bununla kapanır.":"Bütün adımların sorularını yanıtlayınca konu tamamlanmış sayılır."}</p><div class="row">${tam?`<button class="btn primary" data-act="tab" data-t="check">Kontrol testine geç</button><button class="btn" data-act="tab" data-t="cards">Önce kartlara bak</button><button class="btn" data-act="asifirla">Anlatımı baştan yap</button>`:`<button class="btn primary" data-act="apos" data-p="${eksik+1}">Eksik adıma git</button>`}</div></section>`;}
function vNotlar(u,i){const next=i.checkOk?"chal":"check";
 return`<div class="lgrid"><section class="panel notes" lang="en">${u.notes}<h4>Key terms</h4><div class="terms">${u.terms.map(([a,b])=>`<div><b>${a}</b><span>${b}</span></div>`).join("")}</div></section>
 <aside class="side"><div class="panel"><div class="eyebrow">Sonraki adım</div><h3 style="margin-top:6px">${next==="check"?"Bildiğini sına":"Zorlu teste geç"}</h3><p class="sub">${next==="check"?"8 soru, çoğu hatırlama ve uygulama. Baraj 6/8.":"Sınavın mini vaka ve tuzak tarzında 8 zor soru. Baraj 6/8."}</p><button class="btn primary" data-act="tab" data-t="${next}">${next==="check"?"Kontrolü":"Zorluyu"} başlat</button><button class="btn" style="margin-top:8px" data-act="tab" data-t="cards">Önce terim kartları</button></div>
 <div class="panel"><div class="eyebrow">İlerleme</div><table class="data" style="margin-top:6px"><tr><td>En iyi Kontrol</td><td class="num">${i.st.check}/8</td></tr><tr><td>En iyi Zorlu</td><td class="num">${i.st.chal}/8</td></tr><tr><td>Son cevaplar</td><td class="num">${i.st.hist.length?"%"+Math.round(i.st.hist.slice(-10).filter(x=>x.ok).length/Math.min(10,i.st.hist.length)*100):"–"}</td></tr></table></div></aside></div>`;}
function vCards(u){
 if(!FC||FC.u!==u.id)FC={u:u.id,order:shuffle(u.terms.map((_,k)=>k)),i:0,flip:false,again:0,known:0};
 if(FC.i>=FC.order.length)return`<section class="panel empty"><h3>Deste bitti</h3><p>${FC.known} biliyorum · ${FC.again} tekrar.</p><div class="row" style="justify-content:center"><button class="btn primary" data-act="fcreset">Karıştır, yeniden</button><button class="btn" data-act="tab" data-t="check">Kontrole geç</button></div></section>`;
 const [a,b]=u.terms[FC.order[FC.i]];
 return`<section class="fcwrap"><div class="row" style="justify-content:space-between"><span class="mono muted">Kart ${FC.i+1} / ${FC.order.length}</span><button class="btn sm" data-act="fcreset">Karıştır</button></div>
 <button class="fcard ${FC.flip?"flip":""}" data-act="fcflip" aria-label="Kartı çevir"><div class="fin2"><div class="face front"><span class="mono muted">Anlamını yüksek sesle söyle, sonra çevir</span><b lang="en">${a}</b><span class="mono muted">tıkla ya da boşluk tuşu</span></div><div class="face back"><span class="mono muted" lang="en">${a}</span><p lang="en">${b}</p></div></div></button>
 <div class="row" style="justify-content:center"><button class="btn bad" data-act="fcnext" data-k="0">Tekrar <kbd>1</kbd></button><button class="btn good" data-act="fcnext" data-k="1">Biliyorum <kbd>2</kbd></button></div></section>`;}
function vQuizTab(u,i,kind){const key=kind+":"+u.id,z=S.z[key];
 if(z){S.zk=key;return quizRunner(z);}
 const best=kind==="check"?i.st.check:i.st.chal,n=kind==="check"?i.st.checkN:i.st.chalN;
 return`<section class="panel qintro"><div class="eyebrow">${kind==="check"?"Kontrol":"Zorlu"}</div><h3>${kind==="check"?"Gerçekten biliyor musun?":"Sınav düzeyinde başarabilir misin?"}</h3>
 <ul class="rules-list"><li>${kind==="check"?"Çoğu hatırlama ve uygulama sorusu":"Çoğu mini vaka ve sınav tuzağı sorusu"}, her denemede yeniden seçilir.</li><li>Her sorudan sonra cevabı ve açıklamayı görürsün.</li><li>Baraj <b>6/8 (%75)</b>, bütün sınav için hedef temponla aynı.</li></ul>
 <p class="muted" style="margin:0">${n?`En iyi sonucun <b>${best}/8</b>, ${n} deneme. ${best>=BAR?"Geçtin.":"Henüz geçmedin."}`:"Henüz deneme yok."}</p>
 <div class="row"><button class="btn primary" data-act="startquiz" data-k="${kind}">${kind==="check"?"Kontrolü":"Zorluyu"} başlat · 8 soru</button></div></section>`;}
function quizRunner(z){
 if(z.done&&z.kind==="kars"){const sc=z.ans.filter((a,k)=>a===z.qs[k].a).length,miss=z.qs.map((q,k)=>[q,z.ans[k]]).filter(([q,a])=>a!==q.a);
  return`<section class="panel"><div class="score"><div class="big ${sc/z.qs.length>=HAFTA_ORAN?"c-good":"c-bad"}">${sc}/${z.qs.length}</div><div><h3>${miss.length?"Fark henüz tam oturmadı.":"Bu farkı ayırt edebiliyorsun."}</h3><p class="sub" style="margin:0">${miss.length?"Kaçırdıklarını oku; yanlışlar tekrar sırana eklendi.":"Doğru cevaplar karışıklık sayacını düşürdü."}</p></div></div>
  <div class="row" style="margin-top:14px"><button class="btn primary" data-act="karsbit">Bugün ekranına dön</button></div></section>
  ${miss.length?`<h3 style="margin-top:4px">Kaçırdıkların</h3><div class="review">${miss.map(([q,a])=>qCard(q,{mode:"review",chosen:a,caseOpen:false})).join("")}</div>`:""}`;}
 if(z.done){const sc=z.ans.filter((a,k)=>a===z.qs[k].a).length,ok=sc>=Math.ceil(z.qs.length*HAFTA_ORAN),miss=z.qs.map((q,k)=>[q,z.ans[k]]).filter(([q,a])=>a!==q.a),redo=z.kind==="redo",hafta=z.kind==="hafta";
  const nextBtn=z.kind==="check"&&ok?`<button class="btn primary" data-act="tab" data-t="chal">Zorlu teste geç</button>`:(z.kind==="chal"||hafta)&&ok?`<button class="btn primary" data-act="go" data-v="hafta" data-iso="${z.week||""}">Haftama dön</button>`:"";
  const baslik=redo?`${sc}/${z.qs.length} düzeldi`:ok?"Barajın üstündesin.":`Baraj ${Math.ceil(z.qs.length*HAFTA_ORAN)}/${z.qs.length}, biraz daha var.`;
  const aciklama=redo?"Doğru bildiklerin hata listesinden silindi.":ok?(z.kind==="check"?"Temel oturmuş. Şimdi sınav düzeyinde kanıtla.":hafta?"Bu haftanın kontrolü tamam.":"Konuyu bitirdin."):"Aşağıdaki kaçırdıklarına bak, anlatıma dön, yeni sorularla yeniden dene.";
  const tekrar=redo?`<button class="btn" data-act="go" data-v="mistakes">Hatalara dön</button>`:hafta?`<button class="btn ${ok?"":"primary"}" data-act="hstart" data-iso="${z.week}" data-devam="0">Yeni sorularla tekrar</button>${ok?"":`<button class="btn" data-act="go" data-v="hafta" data-iso="${z.week}">Haftama dön</button>`}`:`<button class="btn ${ok?"":"primary"}" data-act="startquiz" data-k="${z.kind}">Yeni sorularla dene</button>${!ok?`<button class="btn" data-act="tab" data-t="anlatim">Anlatıma dön</button>`:""}`;
  return`<section class="panel"><div class="score"><div class="big ${ok?"c-good":"c-bad"}">${sc}/${z.qs.length}</div><div><h3>${baslik}</h3><p class="sub" style="margin:0">${aciklama}</p></div></div>
  <div class="row" style="margin-top:14px">${nextBtn}${tekrar}</div></section>
  ${miss.length?`<h3 style="margin-top:4px">Kaçırdıkların</h3><div class="review">${miss.map(([q,a])=>qCard(q,{mode:"review",chosen:a,caseOpen:false})).join("")}</div>`:""}`;}
 const q=z.qs[z.i],ch=z.ans[z.i],answered=ch!=null,last=z.i===z.qs.length-1;
 const foot=`<div class="qfoot"><div class="prog"><i style="width:${(z.i+(answered?1:0))/z.qs.length*100}%"></i></div>${answered?`<button class="btn primary" data-act="qnext" data-next>${last?"Sonucu gör":"Sonraki soru"} <kbd>Enter</kbd></button>`:`<span class="muted" style="font-size:13px">A–${"ABCDEF"[q.o.length-1]} tuşlarıyla cevapla</span>`}</div>`;
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
 return`<div class="page"><div class="row" style="justify-content:space-between"><div class="eyebrow">Haftalık kontrol${w?` · ${aralik(w)}`:""}</div>${z.done?"":`<button class="btn sm" data-act="go" data-v="hafta" data-iso="${S.kw}">Ara ver, sonra devam et</button>`}</div>${quizRunner(z)}</div>`;}
function vPractice(u){
 if(!P||P.u!==u.id)P={u:u.id,q:null,ans:null,n:0,ok:0};
 if(!P.q)P.q=nextPractice();
 const q=P.q,answered=P.ans!=null;
 const foot=`<div class="qfoot"><span class="muted" style="font-size:14px">${P.n?`Bu oturumda ${P.n} soruda ${P.ok} doğru`:"Serbest alıştırma: yanlış yaptığın zorluktan daha sık soru gelir."}</span>${answered?`<button class="btn primary" data-act="pnext" data-next>Sonraki <kbd>Enter</kbd></button>`:""}</div>`;
 return q?qCard(q,{mode:"quiz",chosen:P.ans,foot,emin:true}):`<div class="panel empty">Soru bulunamadı.</div>`;}
function nextPractice(){const u=UNIT[P.u];
 if([6,11].includes(u.ch)&&R()<.35){const cq=[];CASES.forEach(c=>c.qs.forEach((s,i)=>{if(s.u===u.id)cq.push([c,i]);}));if(cq.length){const [c,i]=pick(cq);return caseQ(c,i);}}
 const h=S.u[P.u].hist.slice(-12);const miss=h.filter(x=>!x.ok).map(x=>x.d);return drawQ(P.u,pick([1,2,2,3,3,...miss]),newUsed());}

/* ---------- uzun vakalar ---------- */
let CZ=null;
function vCases(){
 if(CZ){const c=CASE[CZ.id],done=CZ.ans.every(a=>a!=null),sc=CZ.ans.filter((a,k)=>a===CZ.qs[k].a).length;
  return`<div class="page"><div class="row" style="justify-content:space-between"><div><div class="eyebrow">Ders ${c.ch} · Uzun vaka${c.set?" · Ders seti":""}</div><h2 style="font-size:30px">${c.title}</h2></div><button class="btn" data-act="cz-close">Bütün vakalar</button></div>
  <section class="panel casefull" lang="en">${c.text.map(p=>`<p>${p}</p>`).join("")}</section>
  ${CZ.qs.map((q,k)=>qCard(q,{mode:"quiz",chosen:CZ.ans[k],num:k+1,total:CZ.qs.length,caseOpen:false}).replace(/data-act="ans"/g,`data-act="czans" data-k="${k}"`).replace(/<details class="casebox"[\s\S]*?<\/details>/,"")).join("")}
  ${done?`<section class="panel"><div class="score"><div class="big ${sc/CZ.qs.length>=.75?"c-good":"c-bad"}">${sc}/${CZ.qs.length}</div><div><h3>${CZ.qs.length*5} üzerinden ${sc*5} puan</h3><p class="sub" style="margin:0">Sınav taktiği: seçeneklerin hepsi aynı uzun cümleyle bitebilir. Onu görmezden gel, yalnızca ilk kısmı karşılaştır.</p></div></div><div class="row" style="margin-top:12px"><button class="btn primary" data-act="cz-open" data-id="${c.id}">Bu vakayı yeniden çöz</button><button class="btn" data-act="cz-close">Başka vaka seç</button></div></section>`:""}</div>`;}
 return`<div class="page"><section class="panel"><div class="eyebrow">Part 3 · 30 puan</div><h3>Uzun vakalar</h3><p class="sub">Sınavda Ders 6'dan bir, Ders 11'den bir vaka gelir; üçer soru, altı seçenek, soru başına 5 puan. Önce soruyu oku, sonra vakada cevabı belirleyen o tek cümleyi ara.</p></section>
 ${[6,11].map(ch=>`<section class="panel"><h3>Ders ${ch} · ${chAd(ch)}</h3><div class="days" style="margin-top:10px">${CASES.filter(c=>c.ch===ch).map(c=>{const seen=S.seen[c.id];return`<div class="day"><h4><span lang="en">${c.title}</span>${seen?`<span class="tag done">çözüldü</span>`:""}</h4><div class="fin">${c.qs.length} soru · ${c.qs.length*5} puan${c.set?" · Ders seti":""}</div><button data-act="cz-open" data-id="${c.id}">Bu vakayı çöz</button></div>`;}).join("")}</div></section>`).join("")}</div>`;}

/* ---------- hatalar ---------- */
function vMistakes(){const z=S.z.redo&&!S.z.redo.done||S.z.redo&&S.zk==="redo"?S.z.redo:null;
 if(z){S.zk="redo";return`<div class="page"><div class="eyebrow">Hataları yeniden çöz</div>${quizRunner(z)}</div>`;}
 const w=S.wrong.slice().reverse();
 return`<div class="page"><section class="panel"><h3>Hataların</h3><p class="sub">Yanlış yaptığın her soru, en yenisi üstte. Liste boşalana kadar çöz: doğru bildiğin soru listeden çıkar.</p><div class="row"><button class="btn primary" data-act="redo" ${w.length?"":"disabled"}>${Math.min(10,w.length)} hatayı yeniden çöz</button></div></section>
 <div class="review">${w.length?w.map(x=>qCard(x.q,{mode:"review",chosen:x.pick,caseOpen:false})).join(""):`<div class="panel empty">Henüz kayıtlı hata yok.</div>`}</div></div>`;}

/* ---------- sınav bilgisi ---------- */
let calcN=75;
function vGrading(){const g=grade(calcN);
 return`<div class="page"><section class="panel"><div class="eyebrow">Introduction to Management · Final sınavı · Senin tarihin: ${trTarih(isoDan(S.plan.exam),{day:"numeric",month:"long",year:"numeric"})}</div><h3>Sınav nasıl kurulu</h3>
 <div class="tscroll"><table class="data"><tr><th>Bölüm</th><th>Biçim</th><th>Dersler</th><th class="num">Puan</th></tr>${[1,2,3].map(p=>`<tr><td><b>${PARTS[p].name}</b></td><td>${PARTS[p].desc}</td><td>${PARTS[p].chs.map(c=>"D"+c).join(", ")}</td><td class="num">${p===1?40:30}</td></tr>`).join("")}<tr><td><b>Toplam</b></td><td>41 soru</td><td></td><td class="num"><b>100</b></td></tr></table></div>
 <p class="muted" style="margin:12px 0 0">Part 1 <b>hatırlamayı</b> ölçer: tanımlar, listeler, sınıflandırma. Part 2 ve 3 <b>anlamayı</b> ölçer: kavramı senaryoda tanıma. Kaynak sayfada “40 soru” yazıyor ama bölümler 41 ediyor (20 + 15 + 6); puan her durumda 100. Önemliyse hocana sor.</p>
 <div class="tscroll" style="margin-top:14px"><table class="data"><tr><th>Bu sitedeki düzey</th><th>Neyi ölçer</th></tr><tr><td><span class="lvl l1">Hatırlama</span></td><td>Tanım, liste, bir modelin parçaları</td></tr><tr><td><span class="lvl l2">Uygulama</span></td><td>Kısa senaryo: bu hangi kavram?</td></tr><tr><td><span class="lvl l3">Sınav tuzağı</span></td><td>Yarısı yanlış iki parçalı seçenekler, benzer kavramlar, “hangisi doğru?”</td></tr><tr><td><span class="lvl l3">Uzun vaka</span></td><td>Altı seçenekli uzun vaka; çoğu zaman her seçenek aynı cümleyle biter</td></tr></table></div></section>
 <section class="panel"><h3>Şans düzeltmesi (tahmin)</h3><p class="sub">Sınavda Sınav Kurulu'nun belirlediği bir şans oranı uygulanır. Kesin formül yayımlanmadığı için burada standart düzeltme kullanılıyor: körlemesine işaretleme yaklaşık 22,5 puan getirir (Part 1-2'nin ¼'ü, Part 3'ün ⅙'sı), not buradan ölçeklenir. Notu tahmin olarak gör, puan kesindir.</p>
 <div class="formula">not ≈ 1 + 9 × (puan − 22,5) ÷ 77,5 · en az 1,0</div>
 <div class="calc"><label for="calcn" class="eyebrow">Şu kadar puan alırsam…</label><input type="range" id="calcn" min="0" max="100" value="${calcN}"><div class="out"><b id="calcg" class="${g>=7?"c-good":g>=5.5?"c-warn":"c-bad"}">${gf(g)}</b><span id="calct">100 üzerinden ${calcN} puan</span></div></div>
 ${scale([{v:calcN,label:`${calcN} → ${gf(g)}`,cls:"you"}])}
 <p class="muted" style="margin:12px 0 0">Bu tahminde yaklaşık 62 puan 5,5 eder, 75 puan (hedefin) yaklaşık 7,1. Boş soru her zaman 0 getirir, hepsini işaretle.</p></section>
 <section class="panel"><h3>Uygulama kuralları</h3><p class="sub">Sitenin kaynağı 6 Kasım 2026 sınavını anlatıyor. Bütünleme için kurallar değiştiyse okulun duyurusu geçerlidir.</p><ul class="rules-list"><li>Bireysel, merkezi sınav; okul bilgisayarında (Windows) <b>ANS</b> üzerinden. AUAS kullanıcı adını ve şifreni ezbere bil.</li><li>Sınav ITM notunun <b>%100</b>'ü. <b>5,5</b> ve üstü geçer.</li><li><b>2 saat</b> (ek süre hariç). <b>Kapalı kitap</b>: hesap makinesi ve karalama kâğıdı yok.</li><li>Yanına geçerli <b>pasaport</b>, AEA kimlik kartı, AEA ehliyeti veya Hollanda oturum izni (süresi 6 aydan fazla geçmemiş) ve okul kartını al. Kimliğin fotoğrafı sayılmaz.</li><li>3 saatten kısa sınavlarda, özel izin yoksa tuvalete çıkılmaz.</li><li>Sonuçlar 15 iş günü içinde SIS'te görünür. Kendi hocanla sınav incelemesi ayarlayabilirsin.</li></ul></section></div>`;}

/* ---------- ayarlar ---------- */
let resetOnay=false,yedekMesaj="";
function vAyar(){const W=haftalar(),p=S.plan;
 const secenek=W.filter(w=>w.kind!=="tatil");
 const tatil=W.filter(w=>w.kind!=="sinav").map(w=>`<button class="mini ${w.kind==="tatil"?"kapali":""}" data-act="ptatil" data-iso="${w.iso}" aria-pressed="${w.kind==="tatil"}">${aralik(w)}</button>`).join("");
 const esleme=CH_ORDER.map(ch=>`<tr><td><b>Ders ${ch}</b> <span class="muted">${chAd(ch)}</span></td><td><label class="sr" for="tasi-${ch}">Ders ${ch} haftası</label><select id="tasi-${ch}" data-tasi="${ch}"><option value="">Otomatik${(()=>{const x=W.filter(w=>w.chs.includes(ch));return x.length?" · "+aralik(x[0]):"";})()}</option>${secenek.map(w=>`<option value="${w.iso}" ${p.tasi[ch]===w.iso?"selected":""}>${hIsim(w)} · ${aralik(w)}</option>`).join("")}</select></td></tr>`).join("");
 return`<div class="page"><section class="panel"><div class="eyebrow">Takvim</div><h3>Tarihler</h3><p class="sub">Tarihi değiştirince haftalar yeniden dizilir, ilerlemen silinmez.</p>
 <div class="form2"><label for="p-exam">Sınav tarihi<input type="date" id="p-exam" value="${p.exam}"></label><label for="p-start">Plan başlangıcı<input type="date" id="p-start" value="${p.start}"></label></div>
 ${p.ok?`<p class="muted" style="margin:10px 0 0;font-size:14px">Tarihi sen kaydettin.</p>`:`<div class="row" style="margin-top:12px"><button class="btn primary" data-act="ponay2">Bu tarihi onayla</button><span class="muted" style="font-size:14px">Tarih henüz bir tahmin.</span></div>`}</section>
 <section class="panel"><h3>Okulun olmadığı haftalar</h3><p class="sub">İşaretlediğin haftaya ders koyulmaz, konular kalan haftalara yayılır.</p><div class="row tatilr">${tatil||`<span class="muted">Önce tarihleri düzelt.</span>`}</div></section>
 <section class="panel"><h3>Okul sırasıyla eşleştir</h3><p class="sub">Okulda bir ders başka haftada işleniyorsa buradan taşı. Otomatik seçenek dersleri yükü dengeleyerek sırayla dağıtır.</p><div class="tscroll"><table class="data">${esleme}</table></div></section>
 <section class="panel"><h3>Günlük çalışma süren</h3><p class="sub">Her gün ayırabildiğin dakika. Görevler günlere buna göre dağılır; 0 yazdığın gün dinlenme günüdür.</p>
 <div class="gpform">${GUN_UZUN.map((g,i)=>`<label for="gpm-${i}">${g}<input type="number" id="gpm-${i}" data-gpm="${i}" min="0" max="600" step="5" inputmode="numeric" value="${S.gp.musaitlik[i]}"></label>`).join("")}</div>
 <div class="form2" style="margin-top:12px"><label for="gp-ders">Okulda ders günü<select id="gp-ders" data-gpders="1"><option value="">Bilmiyorum</option>${GUN_UZUN.map((g,i)=>`<option value="${i}" ${S.gp.dersGunu===i?"selected":""}>${g}</option>`).join("")}</select></label></div></section>
 <section class="panel"><h3>Takvime aktar</h3><p class="sub">Haftalık planı ve sınav gününü telefonunun ya da bilgisayarının takvimine ekle (.ics dosyası).</p><div class="row"><button class="btn" data-act="ics">Takvime aktar</button>${icsMesaj?`<span class="muted" style="font-size:14px">${esc(icsMesaj)}</span>`:""}</div>${icsMetin?`<label class="sr" for="icsmetin">Takvim dosyasının metni</label><textarea id="icsmetin" rows="6" readonly>${esc(icsMetin)}</textarea>`:""}</section>
 <section class="panel"><h3>Yedek</h3><p class="sub">İlerlemeni metin olarak kopyala ya da başka cihazdan yapıştır.</p><label class="sr" for="yedek">Yedek metni</label><textarea id="yedek" rows="3" placeholder="Yedek metnini buraya yapıştır"></textarea><div class="row" style="margin-top:10px"><button class="btn" data-act="ykopya">Yedeği kopyala</button><button class="btn" data-act="yal">Yedeği yükle</button>${yedekMesaj?`<span class="muted" style="font-size:14px">${yedekMesaj}</span>`:""}</div></section>
 <section class="panel"><h3>Sıfırla</h3><p class="sub">Bütün ilerlemeni siler, geri alınamaz.</p>${resetOnay?`<div class="confirm"><b>Her şey silinsin mi?</b><div class="row"><button class="btn" data-act="rvazgec">Vazgeç</button><button class="btn bad" data-act="revet">Evet, sil</button></div></div>`:`<button class="btn" data-act="rsor">İlerlemeyi sıfırla</button>`}</section></div>`;}

/* ---------- terimler ---------- */
let KT={mode:"list",grp:-1,q:null,ans:null,n:0,ok:0};
const ALLT=GLOSS.flatMap((g,gi)=>g.t.map(([t,d])=>({t,d,gi})));
function ktPick(){const pool=KT.grp<0?ALLT:ALLT.filter(x=>x.gi===KT.grp);
 const w=pool.map(x=>{const s=S.kt[x.t]||[0,0];return Math.max(.25,1+2*s[1]-.6*s[0])*(KT.q&&KT.q.t===x.t?0:1);});
 let r=R()*w.reduce((a,b)=>a+b,0),c=pool[0];for(let i=0;i<pool.length;i++){r-=w[i];if(r<=0){c=pool[i];break;}}
 let others=shuffle(ALLT.filter(x=>x.gi===c.gi&&x.t!==c.t));if(others.length<3)others=others.concat(shuffle(ALLT.filter(x=>x.gi!==c.gi)));
 const o=shuffle([c].concat(others.slice(0,3)));KT.q={t:c.t,d:c.d,gi:c.gi,o:o.map(x=>x.t),a:o.indexOf(c)};KT.ans=null;}
function vTerms(){const seg=`<div class="seg"><button data-act="kt-mode" data-m="list" aria-pressed="${KT.mode==="list"}">Liste</button><button data-act="kt-mode" data-m="drill" aria-pressed="${KT.mode==="drill"}">Alıştırma</button><button data-act="kt-mode" data-m="compare" aria-pressed="${KT.mode==="compare"}">Farklar</button></div>`;
 const grps=`<div class="row ktg"><button class="btn sm ${KT.grp<0?"primary":""}" data-act="kt-grp" data-g="-1">Tümü ${ALLT.length}</button>${GLOSS.map((g,i)=>`<button class="btn sm ${KT.grp===i?"primary":""}" data-act="kt-grp" data-g="${i}" lang="en">${g.g}</button>`).join("")}</div>`;
 const head=`<section class="panel"><div class="eyebrow">Kelime hazinesi · bütün dersler</div><h3>Terimler</h3><p class="sub">Bu ${ALLT.length} terim sınav sorularının neredeyse hepsinde karşına çıkar. Listeyi bir kez oku, sonra tanım gördüğün an doğru kelime aklına gelene kadar alıştırma yap. Yanlış yaptığın terimler daha sık gelir.</p>${seg}</section>`;
 let body="";
 if(KT.mode==="list"){body=`<section class="panel"><label class="sr" for="ktq">Terim ara</label><input id="ktq" class="ktq" type="search" placeholder="Terim ya da tanımdaki bir kelimeyi ara" autocomplete="off">${GLOSS.map((g,i)=>`<div class="ktgrp" data-g="${i}" lang="en"><h4>${g.g} <span class="tag">${g.ch}</span></h4><div class="terms">${g.t.map(([t,d])=>{const s=S.kt[t];return`<div class="ktrow"><b>${t}${s&&s[1]>s[0]?` <span class="tag study" lang="tr">tekrar</span>`:""}</b><span>${d}</span></div>`;}).join("")}</div></div>`).join("")}<div class="row" style="margin-top:16px"><button class="btn primary" data-act="kt-mode" data-m="drill">Alıştırmayı başlat</button></div></section>`;}
 else if(KT.mode==="compare"){body=`<section class="panel"><p class="sub">Sınav, birbirine benzeyen iki kavramın farkını sormayı sever.</p><div class="terms" lang="en">${COMPARE.map(([a,b])=>`<div><b>${a}</b><span>${b}</span></div>`).join("")}</div></section>`;}
 else{if(!KT.q)ktPick();const q=KT.q,L="ABCD",done=KT.ans!=null;
  const opts=q.o.map((t,k)=>{let cls="opt";if(done){if(k===q.a)cls+=" right";else if(k===KT.ans)cls+=" wrong";}return`<button class="${cls}" data-act="ktans" data-i="${k}" ${done?"disabled":""}><span class="L">${L[k]}</span><span lang="en">${t}</span></button>`;}).join("");
  const wrongDef=done&&KT.ans!==q.a?(ALLT.find(x=>x.t===q.o[KT.ans])||{}).d:"";
  const fb=done?`<div class="fb">${KT.ans===q.a?`<b class="ok">Doğru.</b>`:`<b class="no">Olmadı. Doğrusu: <span lang="en">${q.t}</span>.</b> <br><span class="muted" lang="en">${q.o[KT.ans]}: ${wrongDef}</span>`}</div><div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn primary" data-act="kt-next" data-next>Sonraki terim <kbd>Enter</kbd></button></div>`:"";
  body=`<section>${grps}</section><article class="q"><div class="meta"><span class="row" style="gap:6px"><span class="tag" lang="en">${GLOSS[q.gi].g} · ${GLOSS[q.gi].ch}</span></span><span class="mono">${KT.n?`${KT.n} soruda ${KT.ok} doğru`:"Hangi terim?"}</span></div><div class="stem" lang="en">${q.d}</div><div class="opts">${opts}</div>${fb}</article>`;}
 return`<div class="page">${head}${body}</div>`;}

/* ---------- telaffuz ---------- */
const sesVar=()=>typeof window!=="undefined"&&!!window.speechSynthesis&&typeof window.SpeechSynthesisUtterance==="function";
function dinle(t){if(!sesVar())return"";const s=esc(String(t).replace(/<[^>]+>/g,""));return`<button class="dinle" data-act="dinle" data-s="${s}" aria-label="Dinle: ${s}" title="Telaffuzu dinle" lang="tr">Dinle</button>`;}

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
 return`<section class="panel bugunk"><div class="bk-t"><div class="eyebrow">Bugün</div><b>Bugün: ${n} tekrar, ${m} görev</b></div><button class="btn primary sm" data-act="go" data-v="bugun">Bugüne geç</button></section>`;}
function bgKart(){
 if(!BG.keys.length)return`<section class="panel empty"><h3>Bugün tekrar yok</h3><p>Yeni kartlar anlatım adımlarından ve yanlış cevaplarından gelir.</p></section>`;
 if(!BG.cur)return`<section class="panel empty"><h3>Bugünün tekrarı bitti</h3><p>${BG.say[2]} bildin · ${BG.say[1]} zorlandın · ${BG.say[0]} bilmedin.</p><div class="row" style="justify-content:center"><button class="btn" data-act="bgyenile">Sırayı yenile</button></div></section>`;
 const c=BG.cur,num=`Kart ${BG.i+1} / ${BG.keys.length}`;
 if(c.tur==="t")return`<article class="q tkart"><div class="meta"><span class="row" style="gap:6px"><span class="lvl l1">Terim</span>${c.u?`<span class="tag" lang="en">${SHORT[c.u]}</span>`:""}</span><span class="mono">${num}</span></div>
  <div class="tk-on"><b lang="en">${c.t}</b>${dinle(c.t)}</div>
  ${BG.flip?`<p class="tk-arka" lang="en">${c.d}</p><div class="row tk-not"><button class="btn bad" data-act="bgnot" data-n="0">Bilmedim <kbd>1</kbd></button><button class="btn" data-act="bgnot" data-n="1">Zorlandım <kbd>2</kbd></button><button class="btn good" data-act="bgnot" data-n="2">Bildim <kbd>3</kbd></button></div>`
  :`<p class="muted" style="margin:0">Anlamını aklından söyle, sonra tanımı aç.</p><div class="row"><button class="btn primary" data-act="bgac" data-next>Tanımı göster <kbd>Enter</kbd></button></div>`}</article>`;
 const answered=BG.ans!=null;
 const foot=`<div class="qfoot"><span class="mono muted">${num}</span>${answered?`<button class="btn primary" data-act="bgnext" data-next>Sonraki <kbd>Enter</kbd></button>`:`<span class="muted" style="font-size:13px">A–${"ABCDEF"[c.q.o.length-1]} tuşlarıyla cevapla</span>`}</div>`;
 return qCard(c.q,{mode:"quiz",chosen:BG.ans,foot,emin:true});}
let ONERI=[];
const histByUnit=()=>Object.fromEntries(UNITS.map(u=>[u.id,S.u[u.id].hist]));
function oneriler(limit){return tsOneriler(S.ts,{histByUnit:histByUnit(),units:UNITS,compare:COMPARE,now:Date.now(),limit});}
const sayi=x=>String(Math.round(x*10)/10).replace(".",",");
const konuAd=u=>UNIT[u]?ucAd(u):"Genel";
const kavram=(x,ham)=>ham?`“<span lang="en">${esc(x)}</span>”`:`<b lang="en">${esc(x)}</b>`;
function oneriCumle(o){const p=sayi(o.puan);
 if(o.tip==="karisma")return`${konuAd(o.u)}: ${kavram(o.a,o.hamA)} ile ${kavram(o.b,o.hamB)} kavramlarını ${o.n} kez karıştırdın. Bu farkı oturtursan yaklaşık ${p} puan kazanırsın.`;
 if(o.tip==="eminYanlis")return`${konuAd(o.u)}: emin olduğun ${o.sr+o.sw} cevabın ${o.sw} tanesi yanlıştı. Bilmediğini fark etmediğin yer burası; yaklaşık ${p} puan riskte.`;
 if(o.tip==="kirilgan")return`${konuAd(o.u)}: doğru bildiğin ${o.sr+o.ur} sorunun ${o.ur} tanesinde emin değildin. Bilgi henüz oturmadı; yaklaşık ${p} puan riskte.`;
 if(o.tip==="duzey")return`${PARTS[o.parca].short}, ${LVL[o.d].toLocaleLowerCase("tr")} sorularında ${o.n} sorunun ${o.ok} tanesini bildin (%${yuzde(o.ok/o.n)}); genel ortalaman yaklaşık %${yuzde(o.ort)}. Bu açığı kapatırsan yaklaşık ${p} puan kazanırsın.`;
 return"Bu konuda bir eksik görünüyor.";}
function oneriListe(L){ONERI=L;
 if(!L.length)return`<p class="muted" style="margin:0">Henüz yeterli veri yok. Biraz daha soru çözünce burada nerede puan kaybettiğin görünür.</p>`;
 return`<ol class="oneri">${L.map((o,i)=>`<li><p>${oneriCumle(o)}</p>${o.tip==="karisma"?`<div class="row"><button class="btn sm" data-act="kars" data-i="${i}">Bu farkı çalış</button></div>`:""}</li>`).join("")}</ol>`;}
function vBugun(){const g=bugunNo(),oz=tkOzet(S.tk,g,sinavNo()),z=S.z.kars;
 if(z){S.zk="kars";return`<div class="page"><div class="row" style="justify-content:space-between"><div class="eyebrow">Fark çalışması · <span lang="en">${esc(z.a)}</span> / <span lang="en">${esc(z.b)}</span></div>${z.done?"":`<button class="btn sm" data-act="karsbit">Bırak</button>`}</div>${z.kar?`<section class="panel"><div class="eyebrow" lang="en">${esc(z.kar[0])}</div><p lang="en" style="margin:6px 0 0">${esc(z.kar[1])}</p></section>`:""}${quizRunner(z)}</div>`;}
 if(!BG||BG.gun!==g)bgKur();
 const p=gunPlani(),bg=p&&p.buMu?p.bugun:null,mx=Math.max(1,...oz.hafta),hg=gpHaftaGunu(bugunIso()),n=BG.keys.length,i=Math.min(BG.i,n);
 const tahmin=`<div class="tahmin" role="img" aria-label="Önümüzdeki 7 günün tekrar sayıları: ${oz.hafta.join(", ")}">${oz.hafta.map((x,k)=>`<div><i style="height:${Math.round(x/mx*100)}%"></i><b>${x}</b><small>${k===0?"bugün":GUN_AD[(hg+k)%7]}</small></div>`).join("")}</div>`;
 return`<div class="page"><section class="hero wk"><div class="eyebrow">Bugün · ${trTarih(new Date(),{weekday:"long",day:"numeric",month:"long"})}</div><h2>${n?`${n} tekrar`:"Bugün tekrar yok"}${bg&&bg.gorevler.length?`, ${bg.gorevler.length} görev`:""}</h2>
 ${n?`<div class="meter" role="progressbar" aria-label="Tekrar ilerlemesi" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${yuzde(i/n)}"><i style="width:${yuzde(i/n)}%"></i></div>`:""}<div class="meter-t">${n?`<b>${i}</b> / ${n} kart`:""}${n&&oz.seri?" · ":""}${oz.seri?`<b>${oz.seri}</b> gün üst üste çalıştın`:""}</div>
 <details class="kaynakbox"><summary>Önümüzdeki 7 günün tekrar yükü</summary>${tahmin}<p class="muted" style="margin:6px 0 0;font-size:14px">Toplam ${oz.toplam} kart; ${oz.olgun} tanesi en az bir haftalık aralığa ulaştı.</p></details></section>
 ${bgKart()}
 <section class="panel"><div class="eyebrow">Günün görevleri</div><h3>${bg&&bg.gorevler.length?`Bugün yaklaşık ${bg.dk} dakikalık iş`:"Bugün planlı görev yok"}</h3>${bg&&bg.gorevler.length?`<div class="konular">${bg.gorevler.map(t=>gorevSatir(t,p.w)).join("")}</div>`:`<p class="sub" style="margin:0">${!p||!p.buMu?"Bu hafta planın dışında.":bg&&bg.kapasite===0?"Bugün dinlenme günün.":"Haftanın görevleri başka günlere yerleşti."}</p>`}<div class="row" style="margin-top:12px"><button class="btn" data-act="go" data-v="hafta">Haftaya bak</button></div></section>
 <section class="panel"><div class="eyebrow">Nerede puan kaybediyorsun</div><h3>En önemli 3 öneri</h3>${oneriListe(oneriler(3))}<div class="row" style="margin-top:12px"><button class="btn" data-act="go" data-v="teshis">Tam teşhis</button></div></section></div>`;}

/* ---------- Teşhis ---------- */
function vTeshis(){const P=tsProfil(histByUnit(),UNITS),E=S.ts.e,top=[0,0,0,0];Object.values(E).forEach(v=>{for(let i=0;i<4;i++)top[i]+=v[i];});const tN=top.reduce((a,b)=>a+b,0);
 const hc=c=>c.n?`<b>%${yuzde(c.acc)}</b> <small class="muted">${c.ok}/${c.n}</small>`:`<span class="muted">–</span>`;
 const satir=p=>`<tr><td><b>${p?PARTS[p].short:"Hepsi"}</b>${p?` <small class="muted">${PARTS[p].chs.map(c=>"D"+c).join(", ")}</small>`:""}</td>${[1,2,3,0].map(d=>`<td class="num">${hc(P[p][d])}</td>`).join("")}</tr>`;
 const kal=[["Emin, doğru","Bildiğini biliyorsun. Burası sağlam.",0,"good"],["Emin, yanlış","Bilmediğini fark etmiyorsun. En tehlikelisi bu: sınavda emin olup yanlış işaretlersin ve o konuya bir daha bakmazsın.",1,"bad"],["Emin değilken doğru","Doğru ama kırılgan: yarım bilgi ya da şans. Sınav stresinde kayabilir.",2,"warn"],["Emin değilken yanlış","Eksiğinin farkındasın. Tekrarla kapanır.",3,""]];
 const us=Object.keys(E).filter(u=>UNIT[u]).sort((a,b)=>E[b][1]-E[a][1]||E[b][2]-E[a][2]).slice(0,8);
 return`<div class="page"><section class="panel"><div class="eyebrow">Teşhis</div><h3>Doğru oranın: bölüm ve düzey</h3><p class="sub">Her konunun son 40 cevabından. Hücrede doğru oranı ve kaç sorudan hesaplandığı yazar.</p><div class="tscroll"><table class="data"><tr><th>Bölüm</th><th class="num">Hatırlama</th><th class="num">Uygulama</th><th class="num">Sınav tuzağı</th><th class="num">Hepsi</th></tr>${[1,2,3,0].map(satir).join("")}</table></div></section>
 <section class="panel"><h3>Ne kadar eminsin?</h3><p class="sub">Testlerde emin olmadığın soruda cevaplamadan önce “Emin değilim” düğmesine bas. Cevapların dört gruba ayrılır. ${tN?`Şu ana kadar ${tN} cevap.`:"Henüz kayıtlı cevap yok."}</p><div class="kalib">${kal.map(([t,a,i,c])=>`<div class="kl ${c}"><b>${top[i]}</b><div><div class="eyebrow">${t}</div><p>${a}</p></div></div>`).join("")}</div>
 ${us.length?`<div class="tscroll" style="margin-top:12px"><table class="data"><tr><th>Konu</th><th class="num">Emin, doğru</th><th class="num">Emin, yanlış</th><th class="num">Emin değilken doğru</th><th class="num">Emin değilken yanlış</th></tr>${us.map(u=>`<tr><td>${ucAd(u)}</td>${[0,1,2,3].map(i=>`<td class="num">${E[u][i]}</td>`).join("")}</tr>`).join("")}</table></div>`:""}</section>
 <section class="panel"><h3>Bütün öneriler</h3><p class="sub">Puan, o sorunu kapatırsan geri kazanabileceğin tahmini sınav puanıdır.</p>${oneriListe(oneriler(10))}</section></div>`;}

/* ---------- çalışma arkadaşı (hoca.js): yalnız sample yetkisi varsa görünür ---------- */
let HC=null,HC_GIZLI=false,HC_AKIS=0;
const HCD=Object.create(null),TASLAK=Object.create(null),HCQ=Object.create(null);
const hcAktif=()=>!!HC&&!HC_GIZLI;
function guvenliRender(){const a=document.activeElement;if(HC_AKIS>0||(a&&(a.tagName==="TEXTAREA"||a.tagName==="INPUT")))return;render();}
hcHazir().then(f=>{HC=f;if(f)guvenliRender();},()=>{});
const strip=s=>String(s==null?"":s).replace(/<[^>]+>/g,"");
function hcCikti(key){const r=HCD[key];if(!r)return"";
 const par=t=>hcParagraflar(t).map(p=>`<p>${esc(p).replace(/\n/g,"<br>")}</p>`).join("");
 if(r.durum==="yuk")return r.metin?`<div class="hcmetin">${par(r.metin)}</div>`:`<p class="muted">${r.json?"Kontrol ediliyor…":"Yazıyor…"}</p>`;
 if(r.durum==="hata")return`<p class="hchata" role="alert">${esc(r.mesaj)}</p>${r.metin?`<div class="hcmetin">${par(r.metin)}</div>`:""}`;
 if(r.sonuc){const s=r.sonuc,li=(b,L)=>L.length?`<div class="eyebrow">${b}</div><ul>${L.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:"";
  return`<div class="hcsonuc"><p class="hcpuan"><b>${s.puan}/3</b> ${["Henüz olmadı.","Bir doğru fikir var, büyük eksikler var.","Büyük ölçüde doğru, küçük eksikler var.","Tam ve doğru."][s.puan]}</p>${li("Doğru olanlar",s.dogru)}${li("Eksik kalanlar",s.eksik)}${li("Yanlış olanlar",s.yanlis)}${s.ipucu?`<p><b>İpucu:</b> ${esc(s.ipucu)}</p>`:""}${s.ornek?`<div class="ornek"><div class="eyebrow">Örnek cevap</div><p lang="en">${esc(s.ornek)}</p></div>`:""}</div>`;}
 return`<div class="hcmetin">${par(r.metin)}</div>${r.kesik?`<p class="muted">Cevap kısaltıldı.</p>`:""}`;}
function hcBoya(key,hedef){const el=document.getElementById(hedef);if(el)el.innerHTML=hcCikti(key);}
async function hcIste(key,istem,json,hedef){if(!hcAktif()||(HCD[key]&&HCD[key].durum==="yuk"))return;
 const k=hcKullan(S.hc,bugunIso());
 if(!k.ok){HCD[key]={durum:"hata",mesaj:hcHataMesaj("gunluk_sinir")};hcBoya(key,hedef);return;}
 S.hc=k.st;save();HCD[key]={durum:"yuk",metin:"",json};HC_AKIS++;hcBoya(key,hedef);
 let r;try{r=await hcCalistir(HC,istem,{json,tier:json?"default":"quick",onText:json?undefined:p=>{const x=HCD[key];if(x&&x.durum==="yuk"&&p&&typeof p.text==="string"){x.metin=p.text;hcBoya(key,hedef);}}});}catch(e){r=hcHata("upstream_error");}finally{HC_AKIS--;}
 if(!r.ok){if(r.gizle)HC_GIZLI=true;HCD[key]={durum:"hata",mesaj:r.mesaj,metin:r.kismi||""};}
 else if(json){const c=hcCozAnlat(r.deger);HCD[key]=c?{durum:"bitti",sonuc:c}:{durum:"hata",mesaj:hcHataMesaj("invalid_json")};}
 else HCD[key]={durum:"bitti",metin:r.text,kesik:r.kesik};
 if(HC_GIZLI)guvenliRender();else hcBoya(key,hedef);}
function hcAdimBaglam(uid,i){const u=UNIT[uid],a=ders(uid).adimlar[i];
 return{konu:strip(ucAd(uid)),adimBaslik:strip(a.baslik),notMetni:a.kaynak.map(k=>NOT[uid].seg[k]).join("")||u.notes,terimler:u.terms.filter(t=>a.terimler.includes(t[0])),a};}
function hcAdimPanel(u,d,i,cevaplandi){if(!hcAktif())return"";const id=`${u.id}-${i}`,kA="anlat:"+id,kB="baska:"+id,kS="soru:"+id;
 const anlat=cevaplandi?`<h3>Kendi cümlenle anlat</h3><p class="sub">Bu adımı kendi cümlelerinle yaz. Ders notuna göre kontrol edilir; dil hatası sayılmaz.</p><label class="sr" for="hc-anlat">Açıklaman</label><textarea id="hc-anlat" data-hc="${kA}" rows="4" maxlength="1500" placeholder="Türkçe ya da İngilizce yazabilirsin">${esc(TASLAK[kA]||"")}</textarea><div class="row" style="margin-top:10px"><button class="btn primary" data-act="hcanlat" data-k="${id}">Kontrol et</button><button class="btn" data-act="hcbaska" data-k="${id}">Başka türlü anlat</button></div><div class="hcout" id="hco-anlat" aria-live="polite">${hcCikti(kA)}</div><div class="hcout" id="hco-baska" aria-live="polite">${hcCikti(kB)}</div>`:"";
 return`<section class="panel hc" aria-label="Çalışma arkadaşı"><div class="eyebrow">Çalışma arkadaşı</div>${anlat}<div class="hcsor"><label class="sr" for="hc-soru">Bu adımla ilgili sorun</label><input id="hc-soru" type="text" data-hc="${kS}" data-hcsor="1" maxlength="1500" placeholder="Soru sor: bu adımda ne anlamadın?" value="${esc(TASLAK[kS]||"")}" autocomplete="off"><button class="btn" data-act="hcsor" data-k="${id}">Sor</button></div><div class="hcout" id="hco-soru" aria-live="polite">${hcCikti(kS)}</div></section>`;}
function hcNot(q){const m=q.mini&&/^(.+)-adim-(\d+)$/.exec(q.id);if(m&&ders(m[1])&&ders(m[1]).adimlar[+m[2]])return hcAdimBaglam(m[1],+m[2]).notMetni;return UNIT[q.u]?UNIT[q.u].notes:"";}
function hcNedenBlok(q,chosen){if(!hcAktif())return"";const key="neden:"+q.id+":"+chosen,r=HCD[key];HCQ[key]={q,chosen};
 return`<div class="hcneden">${!r||r.durum==="hata"?`<button class="btn sm" data-act="hcneden" data-k="${esc(key)}">Neden yanlış?</button>`:""}<div class="hcout" id="hco-${tkHash(key)}" aria-live="polite">${hcCikti(key)}</div></div>`;}
function hcTikla(a,b){const kid=b.dataset.k||"";
 if(a==="hcneden"){const x=HCQ[kid];if(!x)return;hcIste(kid,hcIstemNeden({notMetni:hcNot(x.q),soru:strip(x.q.q),secenekler:x.q.o.map(strip),dogruIdx:x.q.a,secilenIdx:x.chosen}),false,"hco-"+tkHash(kid));return;}
 const m=/^(.+)-(\d+)$/.exec(kid);if(!m||!ders(m[1])||!ders(m[1]).adimlar[+m[2]])return;const c=hcAdimBaglam(m[1],+m[2]);
 if(a==="hcanlat"){const el=document.getElementById("hc-anlat"),t=(el?el.value:TASLAK["anlat:"+kid]||"").trim();if(t.length<10){toast("Önce birkaç cümle yaz");return;}hcIste("anlat:"+kid,hcIstemAnlat(Object.assign({},c,{ogrenciMetni:t})),true,"hco-anlat");}
 else if(a==="hcbaska")hcIste("baska:"+kid,hcIstemBaska(Object.assign({},c,{mevcutAnlatim:strip(c.a.anlatim)})),false,"hco-baska");
 else if(a==="hcsor"){const el=document.getElementById("hc-soru"),t=(el?el.value:TASLAK["soru:"+kid]||"").trim();if(t.length<3){toast("Önce sorunu yaz");return;}hcIste("soru:"+kid,hcIstemSoru(Object.assign({},c,{soruMetni:t})),false,"hco-soru");}}

/* ---------- çizim ---------- */
function render(){for(const k in HCQ)delete HCQ[k];paintPills();paintRail();const main=document.getElementById("main"),v=S.view;
 main.innerHTML=v==="bugun"?vBugun():v==="teshis"?vTeshis():v==="hafta"?vHafta():v==="takvim"?vTakvim():v==="dersler"?vDersler():v==="mistakes"?vMistakes():v==="grading"?vGrading():v==="cases"?vCases():v==="terms"?vTerms():v==="ayar"?vAyar():v==="kontrol"?vKontrol():vUnit();}
function scrollTop(){window.scrollTo({top:0});}
function scrollToQ(){const el=document.querySelector("#main .q");if(el){const r=el.getBoundingClientRect();if(r.top<0||r.top>window.innerHeight*.6)el.scrollIntoView({block:"start"});}}
function dersBittiMi(uid){const st=S.u[uid];if(!st.bitti&&unitInfo(uid).bit){st.bitti=Date.now();toast(`Anlatım bitti: ${ucAd(uid).replace(/<[^>]+>/g,"")}`);}}
function finishQuiz(z){if(z.kind==="redo"||z.kind==="kars")return;const sc=z.ans.filter((a,k)=>a===z.qs[k].a).length;
 if(z.kind==="hafta"){const r=S.hafta[z.week]=S.hafta[z.week]||{not:"",kontrol:[]};r.kontrol=(r.kontrol||[]).concat([{t:Date.now(),sc,n:z.qs.length}]).slice(-10);return;}
 const st=S.u[z.u],was=unitInfo(z.u).status;
 if(z.kind==="check"){st.check=Math.max(st.check,sc);st.checkN++;}else{st.chal=Math.max(st.chal,sc);st.chalN++;}
 if(was!=="done"&&unitInfo(z.u).status==="done")toast(`Konu tamam: ${ucAd(z.u).replace(/<[^>]+>/g,"")}`);}

/* ---------- olaylar ---------- */
document.addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b||b.disabled)return;const a=b.dataset.act;
 if(a==="go"){S.view=b.dataset.v;if(S.view==="hafta")S.aktif=b.dataset.iso||null;if(S.view==="bugun"&&(!BG||!BG.cur||BG.i===0))BG=null;if(S.view==="mistakes"&&S.z.redo&&S.z.redo.done){delete S.z.redo;if(S.zk==="redo")S.zk=null;}save();render();scrollTop();}
 else if(a==="unit"){S.view="unit";if(S.unit!==b.dataset.u){P=null;FC=null;}S.unit=b.dataset.u;S.tab=b.dataset.t||"anlatim";save();render();scrollTop();}
 else if(a==="tab"){S.tab=b.dataset.t;save();render();scrollTop();}
 else if(a==="apos"){const st=S.u[S.unit];st.pos=+b.dataset.p;save();render();scrollTop();}
 else if(a==="sans"){const uid=S.unit,st=S.u[uid],i=st.pos-1;if(st.adim[i]!=null)return;const v=+b.dataset.i,q=adimSoru(uid,i);st.adim[i]=v;record(q,v===q.a,v,"adim");
  ((ders(uid).adimlar[i]||{}).terimler||[]).forEach(t=>{if(TERIM[t])tkEkle(S.tk,"t:"+t,bugunNo());});dersBittiMi(uid);save();render();}
 else if(a==="asifirla"){const uid=S.unit,st=S.u[uid];st.adim={};st.pos=0;st.bitti=0;save();render();scrollTop();toast("Anlatım baştan başlıyor");}
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
  if(!qs.length){toast("Bu fark için soru bulunamadı");return;}
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
 else if(a==="ponay"||a==="ponay2"){const el=document.getElementById(a==="ponay"?"b-exam":"p-exam"),v=el?el.value:"";if(!gecerliIso(v)){toast("Geçerli bir tarih seç");return;}if(pazartesi(isoDan(v))<pazartesi(isoDan(S.plan.start))){toast("Sınav, plan başlangıcından önce olamaz");return;}S.plan.exam=v;S.plan.ok=true;planDegisti();S.aktif=null;save();render();toast("Takvim bu tarihe göre kuruldu");}
 else if(a==="ptatil"){const iso=b.dataset.iso,sk=new Set(S.plan.skip);if(sk.has(iso))sk.delete(iso);else sk.add(iso);S.plan.skip=[...sk];planDegisti();save();render();}
 else if(a==="ykopya"){const m=JSON.stringify(S);const bitti=t=>{yedekMesaj=t;render();};const el=()=>document.getElementById("yedek");
  const secim=()=>{const x=el();if(x){x.value=m;x.select();}};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(m).then(()=>bitti("Yedek panoya kopyalandı."),()=>{secim();yedekMesaj="Metni kutudan seçip kopyala.";}); else{secim();yedekMesaj="Metni kutudan seçip kopyala.";}}
 else if(a==="yal"){const x=document.getElementById("yedek");try{const v=JSON.parse(x.value);if(!v||typeof v!=="object"||!v.u||!v.plan)throw 0;S=normalize(v);planDegisti();yedekMesaj="Yedek yüklendi.";save();render();}catch(err){yedekMesaj="Bu metin geçerli bir yedek değil.";render();}}
 else if(a==="rsor"){resetOnay=true;render();}
 else if(a==="rvazgec"){resetOnay=false;render();}
 else if(a==="revet"){resetOnay=false;S=normalize(null);planDegisti();P=null;FC=null;CZ=null;save();render();scrollTop();toast("İlerleme sıfırlandı");}
});
document.addEventListener("change",e=>{const t=e.target;
 if(t.id==="p-exam"||t.id==="p-start"){if(!gecerliIso(t.value)){toast("Geçerli bir tarih seç");render();return;}const yeni=Object.assign({},S.plan,t.id==="p-exam"?{exam:t.value}:{start:t.value});if(pazartesi(isoDan(yeni.start))>pazartesi(isoDan(yeni.exam))){toast("Başlangıç sınavdan sonra olamaz");render();return;}if(t.id==="p-exam")S.plan.exam=t.value;else S.plan.start=t.value;planDegisti();S.aktif=null;save();render();}
 else if(t.dataset&&t.dataset.gpm!=null){if(String(t.value).trim()===""){render();return;}const m=S.gp.musaitlik.slice();m[+t.dataset.gpm]=t.value;S.gp=gpOnar({musaitlik:m,dersGunu:S.gp.dersGunu});save();render();}
 else if(t.dataset&&t.dataset.gpders){S.gp=gpOnar({musaitlik:S.gp.musaitlik,dersGunu:t.value===""?null:+t.value});save();render();}
 else if(t.dataset&&t.dataset.tasi){const ch=t.dataset.tasi;if(t.value)S.plan.tasi[ch]=t.value;else delete S.plan.tasi[ch];planDegisti();save();render();}});
document.addEventListener("toggle",e=>{if(e.target.classList&&e.target.classList.contains("kaynakbox")&&e.target.closest(".adim")&&!e.target.closest(".adim").querySelector(".aklinda"))S.kaynakAcik=e.target.open;},true);
document.addEventListener("input",e=>{const t=e.target;
 if(t.dataset&&t.dataset.hc){TASLAK[t.dataset.hc]=String(t.value).slice(0,1500);return;}
 if(t.id==="ktq"){const v=t.value.toLowerCase().trim();document.querySelectorAll("#main .ktgrp").forEach(g=>{let any=0;g.querySelectorAll(".ktrow").forEach(r=>{const m=!v||r.textContent.toLowerCase().includes(v);r.hidden=!m;if(m)any=1;});g.hidden=!any;});return;}
 if(t.id==="hnot"){const iso=t.dataset.iso,r=S.hafta[iso]=S.hafta[iso]||{not:"",kontrol:[]};r.not=t.value.slice(0,4000);clearTimeout(notT);notT=setTimeout(save,500);return;}
 if(t.id==="calcn"){calcN=+t.value;const g=grade(calcN),gb=document.getElementById("calcg");gb.textContent=gf(g);gb.className=g>=7?"c-good":g>=5.5?"c-warn":"c-bad";document.getElementById("calct").textContent=`100 üzerinden ${calcN} puan`;const mk=document.querySelector("#main .scale .mk");if(mk){const pos=calcN;mk.style.left=pos+"%";mk.className=`mk you ${pos<12?"edgeL":pos>88?"edgeR":""}`;mk.querySelector("span").textContent=`${calcN} → ${gf(g)}`;}}});
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
