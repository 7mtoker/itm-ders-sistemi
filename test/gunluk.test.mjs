import fs from 'node:fs'; import vm from 'node:vm'; import assert from 'node:assert';
const c=vm.createContext({console});
vm.runInContext(fs.readFileSync('src/plan.js','utf8')+'\n'+fs.readFileSync('src/gunluk.js','utf8')+
 ';globalThis.A={haftalarKur,isoDan,isoGun,gpHaftaPlani,gpTelafi,gpTempo,gpIcs,gpVarsayilan,gpOnar}',c);
const {haftalarKur:H,gpHaftaPlani:HP,gpTelafi:TL,gpTempo:TM,gpIcs:ICS,gpVarsayilan,gpOnar}=c.A;
const j=x=>JSON.parse(JSON.stringify(x)); // vm nesnelerini bu realm'e taşır (deepStrictEqual prototip karşılaştırır)

/* ================= 1. gpHaftaPlani: her kural, her senaryoda özellik olarak ================= */
const PZT='2026-11-09',gunIso=i=>['2026-11-09','2026-11-10','2026-11-11','2026-11-12','2026-11-13','2026-11-14','2026-11-15'][i];
const hafta=(uids=['u1','u2'],ch=4,ek={})=>[
 {id:'okul',k:'okul',ch,dk:90},
 ...uids.flatMap(u=>[{id:'a-'+u,k:'anlatim',uid:u,dk:ek.a??30},{id:'k-'+u,k:'kontrol',uid:u,dk:ek.k??15}]),
 {id:'vaka',k:'vaka',ch,dk:ek.v??25},{id:'hk',k:'hk',dk:ek.hk??20}];

/* Her sonuç için genel değişmezler. g = girdi. */
function ozellik(r,g,lbl){
 const R=j(r),ayar=j(gpOnar({musaitlik:g.musaitlik,dersGunu:g.dersGunu})),bg=g.bugun;
 assert.strictEqual(R.gunler.length,7,lbl+' 7 gun');
 const gun={},gecAlt={},yer=t=>gun[t.id];
 R.gunler.forEach((d,i)=>{
  assert.strictEqual(d.gun,i,lbl);assert.strictEqual(c.A.isoDan(d.iso).getDay(),(i+1)%7,lbl+' gun sirasi');
  assert.strictEqual(d.durum,d.iso<bg?'gecmis':d.iso===bg?'bugun':'gelecek',lbl+' durum');
  assert.strictEqual(d.kapasite,ayar.musaitlik[i],lbl+' kapasite');
  assert.strictEqual(d.dk,d.gorevler.reduce((s,t)=>s+t.dk,0),lbl+' dk toplami');
  assert.ok(d.dk<=d.kapasite||d.gorevler.every(t=>t.k==='okul'),lbl+' kapasite asimi '+d.iso);
  if(d.durum==='gecmis')assert.strictEqual(d.gorevler.length,0,lbl+' gecmise yazildi');
  if(d.kapasite===0)assert.ok(d.gorevler.every(t=>t.k==='okul'),lbl+' 0 kapasiteli gune is');
  d.gorevler.forEach((t,p)=>{assert.ok(!(t.id in gun),lbl+' iki kez '+t.id);gun[t.id]=i;t._p=p;});
  const gdk=d.gorevler.filter(t=>t.gecikmis).reduce((s,t)=>s+t.dk,0);gecAlt[i]=gdk;
  assert.ok(gdk<=Math.floor(d.kapasite*0.4),lbl+' gecikmis %40 '+d.iso);
  /* gün içi sıra: anlatım < kontrol, vaka < hk, kendi işleri gecikmişten önce */
  const p=k=>d.gorevler.findIndex(t=>t.k===k&&!t.gecikmis);
  d.gorevler.forEach(t=>{if(t.k==='kontrol'){const a=d.gorevler.findIndex(x=>x.k==='anlatim'&&x.uid===t.uid);if(a>=0)assert.ok(a<t._p,lbl+' ayni gun anlatim once');}});
  if(p('vaka')>=0&&p('hk')>=0)assert.ok(p('vaka')<p('hk'),lbl+' vaka hk once');
  const ilkGec=d.gorevler.findIndex(t=>t.gecikmis);if(ilkGec>=0)assert.ok(d.gorevler.slice(ilkGec).every(t=>t.gecikmis),lbl+' gecikmis sonda');});
  /* her açık iş tam bir kez: ya bir günde ya sigmayan'da; bitmişler hiç görünmez */
 const acik=[...g.gorevler,...(g.gecikmis||[])].filter(t=>!t.ok);
 R.sigmayan.forEach(t=>{assert.ok(!(t.id in gun),lbl+' hem yerlesti hem sigmadi '+t.id);gun[t.id]=-1;});
 assert.deepStrictEqual(Object.keys(gun).sort(),acik.map(t=>t.id).sort(),lbl+' is kaybi/fazlasi');
 assert.strictEqual(R.acikDk,R.sigmayan.reduce((s,t)=>s+t.dk,0),lbl+' acikDk');
 const L=ayar.dersGunu,gecerli=R.gunler.filter(d=>d.durum!=='gecmis').map(d=>d.gun);
 for(const t of acik){const i=yer(t);
  if(t.k==='okul'){const o=R.gunler.flatMap(d=>d.gorevler).find(x=>x.id===t.id)||R.sigmayan.find(x=>x.id===t.id);assert.strictEqual(o.dk,0,lbl+' okul 0 dk');
   if(L!==null)assert.strictEqual(i,gecerli.includes(L)?L:-1,lbl+' okul ders gununde');}
  if(t.k==='kontrol'&&i>=0){const a=acik.find(x=>x.k==='anlatim'&&x.uid===t.uid);if(a)assert.ok(yer(a)>=0&&i>=yer(a),lbl+' kontrol anlatimdan once '+t.id);}
  if(t.gecikmis!==undefined)0;}
 /* hk sonrası günlerde kendi işi varsa, o gün hk'yı alamayacak kadar küçük olmalı (hk = kapasitesi yeten son gün) */
 const hk=acik.find(t=>t.k==='hk'&&!(g.gecikmis||[]).includes(t));
 if(hk&&yer(hk)>=0)R.gunler.forEach((d,i)=>{if(i>yer(hk)&&d.gorevler.some(t=>!t.gecikmis&&t.k!=='okul'))assert.ok(d.kapasite<hk.dk,lbl+' hk sonrasi is');});
 /* gecikmiş yalnız artan kapasiteye: sığmayan kendi işi (okul/kontrol hariç) hiçbir geçerli güne gecikmişler çıkarılsa bile sığmazdı */
 const gecIdler=new Set((g.gecikmis||[]).map(t=>t.id));
 R.sigmayan.filter(t=>!gecIdler.has(t.id)&&t.k!=='okul'&&t.k!=='kontrol').forEach(t=>{
  gecerli.forEach(i=>{const d=R.gunler[i];if(d.kapasite>0)assert.ok(d.kapasite-d.dk+gecAlt[i]<t.dk,lbl+' gecikmis kendi isinin yerini aldi');});});
 return {R,yer,gun};}

const varsay=[45,45,45,45,45,60,0];
/* A: normal hafta, ders Çarşamba */
{const g={gorevler:hafta(),haftaIso:PZT,bugun:PZT,musaitlik:varsay,dersGunu:2,gecikmis:[]};
 const {R,yer}=ozellik(HP(g),g,'normal');
 assert.strictEqual(yer({id:'okul'}),2);
 for(const u of['u1','u2']){assert.ok(yer({id:'a-'+u})>=2,'anlatim ders sonrasi');assert.ok(yer({id:'k-'+u})>yer({id:'a-'+u}),'kontrol en az 1 gun sonra');}
 assert.strictEqual(yer({id:'hk'}),5,'hk kapasiteli son gun (Cmt)');
 assert.ok(yer({id:'vaka'})>=Math.max(yer({id:'a-u1'}),yer({id:'a-u2'}))&&yer({id:'vaka'})<=5,'vaka anlatimlardan sonra hk dan once');
 assert.strictEqual(R.sigmayan.length,0);assert.strictEqual(yer({id:'a-u1'})===yer({id:'a-u2'}),false,'anlatimlar yayildi');
 console.log('normal       ',R.gunler.map(d=>d.gorevler.map(t=>t.id).join('+')||'-').join(' | '));}
/* A2: ders günü bilinmiyor → yük yayılır, Pazartesi dolmaz */
{const g={gorevler:hafta(),haftaIso:PZT,bugun:'2026-11-06',musaitlik:varsay,dersGunu:null,gecikmis:[]};
 const {R,yer}=ozellik(HP(g),g,'dersGunu null');
 assert.ok(R.gunler.every(d=>d.durum==='gelecek'));
 assert.ok(new Set(R.gunler.filter(d=>d.dk>0).map(d=>d.gun)).size>=5,'en az 5 gune yayildi');
 assert.ok(R.gunler[0].dk<=45&&R.gunler[0].gorevler.length<=2,'Pazartesi yigilmadi');
 assert.strictEqual(yer({id:'okul'}),0,'ders gunu yoksa ilk gun hatirlatma');}
/* A3: bitmiş görevler yerleşmez; kontrolün anlatımı bitmişse serbest */
{const gs=hafta();gs[1].ok=true;gs[0].ok=true;const g={gorevler:gs,haftaIso:PZT,bugun:PZT,musaitlik:varsay,dersGunu:2,gecikmis:[]};
 const {yer}=ozellik(HP(g),g,'bitmisler');assert.ok(yer({id:'k-u1'})>=0);}
/* B: hafta ortası (Perşembe), ders Salı geçti, kaçırılan okul sığmayan'da 0 dk */
{const g={gorevler:hafta(),haftaIso:'2026-11-11',bugun:'2026-11-12',musaitlik:varsay,dersGunu:1,gecikmis:[]};
 const {R,yer}=ozellik(HP(g),g,'hafta ortasi');
 assert.strictEqual(R.gunler[0].iso,PZT,'hafta Pazartesiye normalize');
 assert.deepStrictEqual(R.gunler.map(d=>d.durum),['gecmis','gecmis','gecmis','bugun','gelecek','gelecek','gelecek']);
 assert.strictEqual(yer({id:'okul'}),-1);assert.ok(['a-u1','a-u2','k-u1','k-u2','hk'].every(id=>yer({id})>=3),'gecmisten ileri kaydi');
 assert.strictEqual(R.acikDk,R.sigmayan.reduce((s,t)=>s+t.dk,0));}
/* C: sıfır kapasiteli günler; ders Pazartesi (kapasite 0) → okul yine orada */
{const g={gorevler:hafta(),haftaIso:PZT,bugun:PZT,musaitlik:[0,60,0,60,0,0,0],dersGunu:0,gecikmis:[]};
 const {R,yer}=ozellik(HP(g),g,'sifir kapasite');
 assert.strictEqual(yer({id:'okul'}),0);assert.strictEqual(yer({id:'hk'}),3);
 assert.ok(yer({id:'k-u1'})>yer({id:'a-u1'}),'dar haftada bile kontrol sonraki gune');
 assert.deepStrictEqual(R.sigmayan.map(t=>t.id),['vaka']);assert.strictEqual(R.acikDk,25);}
/* C2: tek çalışılabilir gün → kontrol aynı gün, anlatımdan sonra */
{const g={gorevler:hafta(['u1']),haftaIso:PZT,bugun:PZT,musaitlik:[0,0,0,0,200,0,0],dersGunu:null,gecikmis:[]};
 const {R,yer}=ozellik(HP(g),g,'tek gun');
 assert.strictEqual(yer({id:'a-u1'}),4);assert.strictEqual(yer({id:'k-u1'}),4);
 assert.deepStrictEqual(R.gunler[4].gorevler.map(t=>t.id),['okul','a-u1','k-u1','vaka','hk'].filter(x=>x!=='okul'||yer({id:'okul'})===4));}
/* D: aşırı yük */
{const g={gorevler:hafta(['u1','u2','u3','u4','u5'],6,{a:40,k:20,v:60,hk:30}),haftaIso:PZT,bugun:PZT,musaitlik:[20,20,20,20,20,20,20],dersGunu:3,gecikmis:[]};
 const {R}=ozellik(HP(g),g,'asiri yuk');
 assert.ok(R.sigmayan.length>0&&R.acikDk>0);
 const top=g.gorevler.reduce((s,t)=>s+(t.k==='okul'?0:t.dk),0);assert.ok(R.acikDk>=top-140,'en fazla kapasite kadar yerlesti');}
/* E: gecikmişler: artan kapasiteye, %40 tavan, en eski önce */
{const gec=['2026-10-26','2026-10-12','2026-10-19','2026-10-12','2026-10-26','2026-10-19','2026-10-05'].map((h,i)=>({id:'g'+i,k:'zorlu',dk:15,hafta:h}));
 gec.push({id:'gA',k:'anlatim',uid:'eski',dk:15,hafta:'2026-10-05'},{id:'gK',k:'kontrol',uid:'eski',dk:15,hafta:'2026-10-05'},{id:'gOk',k:'zorlu',dk:15,ok:true});
 const g={gorevler:hafta(),haftaIso:PZT,bugun:PZT,musaitlik:varsay,dersGunu:2,gecikmis:gec};
 const {R,yer}=ozellik(HP(g),g,'gecikmis');
 const yerlesen=gec.filter(t=>!t.ok&&yer(t)>=0),sigmayan=gec.filter(t=>!t.ok&&yer(t)===-1);
 assert.ok(yerlesen.length>0&&sigmayan.length>0,'kismi yerlesti');
 for(const a of yerlesen)for(const b of sigmayan)assert.ok(a.hafta<=b.hafta,'eski once: '+a.id+' '+b.id);
 assert.ok(yer({id:'gK'})===-1||yer({id:'gK'})>=yer({id:'gA'}),'gecikmis kontrol anlatimdan once degil');
 assert.ok(R.gunler.every(d=>d.gorevler.filter(t=>t.gecikmis).every(t=>t.gecikmis===true)));
 /* kendi işleri gecikmişlerle değişmez */
 const yalin=j(HP({...g,gecikmis:[]})),ayni=yalin.gunler.map(d=>d.gorevler.map(t=>t.id).join());
 assert.deepStrictEqual(R.gunler.map(d=>d.gorevler.filter(t=>!t.gecikmis).map(t=>t.id).join()),ayni,'gecikmis kendi islerini oynatmadi');}
/* F: hafta tamamen geçmiş / G: hafta henüz başlamadı / bozuk girdiler */
{const g={gorevler:hafta(),haftaIso:PZT,bugun:'2026-11-16',musaitlik:varsay,dersGunu:2,gecikmis:[]};
 const {R}=ozellik(HP(g),g,'gecmis hafta');assert.strictEqual(R.sigmayan.length,hafta().length);assert.strictEqual(R.acikDk,135);}
{const r=j(HP({gorevler:hafta(),haftaIso:'bozuk',bugun:PZT}));assert.strictEqual(r.gunler.length,0);assert.strictEqual(r.sigmayan.length,7);}
{const g={gorevler:[...hafta(),{id:'x',k:'toString',dk:10},{id:'y',k:'zorlu',dk:'abc'}],haftaIso:PZT,bugun:'bozuk',musaitlik:[1e9,-5,'x',null],dersGunu:9,gecikmis:'yok'};
 const r=HP(g);ozellik(r,{...g,bugun:PZT,gecikmis:[]},'bozuk girdi');}

/* Rastgele senaryolar (tohumlu): değişmezler her durumda tutmalı */
let tohum=12345;const rnd=n=>{tohum=(tohum*1103515245+12345)%2147483648;return tohum%n;};
for(let s=0;s<400;s++){
 const uids=Array.from({length:1+rnd(4)},(_,i)=>'r'+i),gs=hafta(uids,1+rnd(11),{a:10+rnd(50),k:5+rnd(20),v:10+rnd(40),hk:10+rnd(30)});
 if(rnd(3)===0)gs.push({id:'z',k:'zorlu',dk:rnd(60)},{id:'h',k:'hata',dk:rnd(40)});
 gs.forEach(t=>{if(rnd(6)===0)t.ok=true;});
 const gec=Array.from({length:rnd(6)},(_,i)=>({id:'gg'+i,k:['zorlu','anlatim','vaka'][rnd(3)],uid:'e'+i,dk:5+rnd(30),hafta:'2026-10-'+String(10+rnd(20))}));
 const g={gorevler:gs,haftaIso:PZT,bugun:gunIso(rnd(9)-1)||(rnd(2)?'2026-11-08':'2026-11-16'),
  musaitlik:Array.from({length:7},()=>rnd(4)===0?0:rnd(120)),dersGunu:rnd(8)===7?null:rnd(7),gecikmis:gec};
 ozellik(HP(g),g,'rastgele#'+s);}
console.log('haftaPlani   400 rastgele senaryo + 11 ozel senaryo');

/* ================= 2. gpTelafi ================= */
const W3=(k1='ders')=>[{iso:'2026-11-09',kind:k1},{iso:'2026-11-16',kind:'ders'},{iso:'2026-11-23',kind:'sinav'}];
const m5=[60,60,60,60,60,0,0];
{const r=j(TL({haftalar:W3(),kalanDk:{'2026-11-09':100,'2026-11-16':100},bugun:PZT,musaitlik:m5}));
 assert.strictEqual(r.karar.durum,'rahat');assert.strictEqual(r.karar.bitisIso,'2026-11-17');assert.deepStrictEqual(r.karar.oneri,{tip:'tamam'});
 assert.deepStrictEqual(r.haftalar.map(h=>h.kapasiteDk),[300,300,0],'sinav haftasi 0');
 assert.deepStrictEqual(r.toplam,{kapasiteDk:600,isDk:200,gecikmisDk:0,fark:400});
 assert.deepStrictEqual(r.haftalar[0],{iso:'2026-11-09',kind:'ders',kapasiteDk:300,isDk:100,fark:200});}
{const r=j(TL({haftalar:W3(),kalanDk:{'2026-11-09':280,'2026-11-16':280},bugun:PZT,musaitlik:m5}));
 assert.strictEqual(r.karar.durum,'sinirda');assert.strictEqual(r.karar.bitisIso,'2026-11-20');assert.strictEqual(r.karar.gerekliGunlukDk,40);}
{const g={haftalar:W3(),kalanDk:{'2026-11-09':400,'2026-11-16':400},bugun:PZT,musaitlik:m5},r=j(TL(g));
 assert.strictEqual(r.karar.durum,'yetismez');assert.strictEqual(r.karar.bitisIso,null);
 assert.deepStrictEqual(r.karar.oneri,{tip:'haftaSonu',dk:50,gunler:[5,6]});
 const m2=m5.map((v,i)=>r.karar.oneri.gunler.includes(i)?v+r.karar.oneri.dk:v);
 assert.notStrictEqual(TL({...g,musaitlik:m2}).karar.durum,'yetismez','oneri uygulaninca yetisir');
 const m3=m5.map((v,i)=>r.karar.oneri.gunler.includes(i)?v+r.karar.oneri.dk-1:v);
 assert.strictEqual(TL({...g,musaitlik:m3}).karar.durum,'yetismez','oneri en kucuk deger');}
{/* hafta sonu zaten dolu → günlük artış önerisi, uygulanınca yetişir */
 const g={haftalar:W3(),kalanDk:{'2026-11-09':500,'2026-11-16':500},bugun:PZT,musaitlik:[60,60,60,60,60,30,30]},r=j(TL(g));
 assert.strictEqual(r.karar.oneri.tip,'dkArtir');const e=r.karar.oneri.gunlukEk;
 assert.notStrictEqual(TL({...g,musaitlik:g.musaitlik.map(v=>v+e)}).karar.durum,'yetismez');
 assert.strictEqual(TL({...g,musaitlik:g.musaitlik.map(v=>v+e-1)}).karar.durum,'yetismez');}
{/* tatil yarım kapasite, hafta ortası, gecikmiş iş, geç gelen iş darboğazı */
 const r=j(TL({haftalar:[{iso:'2026-11-02',kind:'ders'},...W3('tatil')],kalanDk:{'2026-11-02':50,'2026-11-16':10},bugun:'2026-11-11',musaitlik:m5}));
 assert.strictEqual(r.haftalar.length,3);assert.strictEqual(r.haftalar[0].kapasiteDk,90,'tatil yarim + gecmis gunler 0');
 assert.strictEqual(r.toplam.gecikmisDk,50);assert.strictEqual(r.toplam.isDk,60);assert.strictEqual(r.karar.bitisIso,'2026-11-16');
 const r2=j(TL({haftalar:W3(),kalanDk:{'2026-11-16':400},bugun:PZT,musaitlik:m5}));
 assert.strictEqual(r2.karar.durum,'yetismez','toplam yetse de son hafta isi sigmaz');
 const r3=j(TL({haftalar:W3(),kalanDk:{'2026-11-23':10},bugun:PZT,musaitlik:m5}));
 assert.strictEqual(r3.karar.durum,'yetismez');assert.strictEqual(r3.karar.gerekliGunlukDk,null);assert.deepStrictEqual(r3.karar.oneri,{tip:'dkArtir',gunlukEk:null});
 const r4=j(TL({haftalar:W3(),kalanDk:{},bugun:PZT,musaitlik:m5}));assert.strictEqual(r4.karar.durum,'rahat');assert.strictEqual(r4.karar.bitisIso,PZT);}
{/* gerçek plan: 28 konu */
 const n=[2,2,2,2,2,5,2,2,2,2,5],B=n.map((k,i)=>({ch:i+1,units:Array.from({length:k},(_,q)=>`c${i+1}${'abcde'[q]}`)}));
 const W=H({start:'2026-11-09',exam:'2027-02-01',skip:['2026-12-28'],tasi:{}},B),kal={};W.forEach(w=>{kal[w.iso]=w.units.length*80+(w.kind==='tekrar'?120:0);});
 for(const [m,bek] of [[[120,120,120,120,120,120,60],'rahat'],[[10,10,10,10,10,0,0],'yetismez']]){
  const r=j(TL({haftalar:W,kalanDk:kal,bugun:'2026-11-18',musaitlik:m}));assert.strictEqual(r.karar.durum,bek,'gercek plan '+bek);
  assert.strictEqual(r.haftalar.find(h=>h.kind==='tatil').kapasiteDk,m.reduce((s,v)=>s+Math.floor(v/2),0));
  if(bek==='yetismez'){const o=r.karar.oneri,m2=o.tip==='haftaSonu'?m.map((v,i)=>o.gunler.includes(i)?v+o.dk:v):m.map(v=>v>0?v+o.gunlukEk:v);
   assert.notStrictEqual(TL({haftalar:W,kalanDk:kal,bugun:'2026-11-18',musaitlik:m2}).karar.durum,'yetismez');}
  console.log('telafi       ',bek.padEnd(9),JSON.stringify(r.karar));}}

/* ================= 3. gpTempo ================= */
const ts=(iso,h=15)=>{const [y,m,d]=iso.split('-').map(Number);return new Date(y,m-1,d,h).getTime();};
{const r=j(TM([{t:ts('2026-11-08'),dk:30},{t:ts('2026-11-10'),dk:30},{t:ts('2026-11-15'),dk:40},{t:ts('2026-11-15',22),dk:20},
  {t:ts('2026-11-18'),dk:60},{t:ts('2026-11-20',8),dk:30},{t:ts('2026-11-06'),dk:999},{t:ts('2026-11-21'),dk:999},{t:'x',dk:5},null,{dk:5}],'2026-11-20'));
 assert.strictEqual(r.toplamDk,210);assert.strictEqual(r.aktifGun,5);assert.strictEqual(r.dkAktifGun,42);
 assert.strictEqual(r.son7Dk,150);assert.strictEqual(r.onceki7Dk,60);assert.strictEqual(r.trend,'artiyor');
 assert.strictEqual(r.gunluk.length,14);assert.strictEqual(r.gunluk[0].iso,'2026-11-07');assert.strictEqual(r.gunluk[13].iso,'2026-11-20');}
assert.strictEqual(TM([{t:ts('2026-11-10'),dk:200},{t:ts('2026-11-18'),dk:60}],'2026-11-20').trend,'azaliyor');
assert.strictEqual(TM([{t:ts('2026-11-10'),dk:100},{t:ts('2026-11-18'),dk:110}],'2026-11-20').trend,'sabit');
assert.deepStrictEqual(j(TM('bozuk','2026-11-20')).toplamDk,0);assert.strictEqual(TM([],'x').trend,'sabit');

/* ================= 4. gpIcs ================= */
{const n=[2,2,2,2,2,5,2,2,2,2,5],B=n.map((k,i)=>({ch:i+1,units:Array.from({length:k},(_,q)=>`c${i+1}${'abcde'[q]}`)}));
 const W=H({start:'2026-11-09',exam:'2027-02-01',skip:['2026-12-21','2026-12-28'],tasi:{}},B);
 const adlar={};B.flatMap(b=>b.units).forEach((u,i)=>{adlar[u]=`Konu ${i+1}: Örgüt kültürü; değerler, normlar ve "ğüşıöçĞÜŞİÖÇ" \\ yol`;});
 adlar.c6a='Çok uzun başlık '+'ışığı göğüs çiğ '.repeat(12)+'🙂 son';adlar.c1a='Satır1\nSatır2';
 const U=Date.UTC(2026,10,9,7,5,3),ics=ICS({haftalar:W,sinavIso:'2027-02-03',dersGunu:2,adlar,uretildi:U});
 assert.ok(ics.endsWith('\r\n'));assert.ok(!/[^\r]\n/.test(ics)&&!/\r[^\n]/.test(ics),'yalniz CRLF');
 assert.strictEqual(Buffer.from(ics,'utf8').toString('utf8'),ics,'cok baytli karakter bolunmedi');
 const fiz=ics.slice(0,-2).split('\r\n');
 fiz.forEach(l=>assert.ok(Buffer.byteLength(l,'utf8')<=75,'75 oktet: '+l));
 assert.ok(fiz.some(l=>l.startsWith(' ')),'katlama oldu');
 const sat=ics.replace(/\r\n[ \t]/g,'').slice(0,-2).split('\r\n');
 assert.strictEqual(sat[0],'BEGIN:VCALENDAR');assert.strictEqual(sat[sat.length-1],'END:VCALENDAR');
 assert.ok(sat.includes('VERSION:2.0')&&sat.some(l=>l.startsWith('PRODID:')));
 const olaylar=[];let cur=null;
 for(const l of sat){if(l==='BEGIN:VEVENT')cur={};else if(l==='END:VEVENT'){olaylar.push(cur);cur=null;}
  else if(cur){const i=l.indexOf(':');cur[l.slice(0,i)]=l.slice(i+1);}}
 const ogret=W.filter(w=>w.kind==='ders'||w.kind==='tekrar');
 assert.strictEqual(olaylar.length,ogret.length+1,'olay sayisi');
 const coz=s=>s.replace(/\\(.)/g,(_,x)=>x==='n'||x==='N'?'\n':x);
 const tarih=s=>new Date(Date.UTC(+s.slice(0,4),+s.slice(4,6)-1,+s.slice(6,8)));
 olaylar.forEach(o=>{
  ['UID','DTSTAMP','DTSTART;VALUE=DATE','DTEND;VALUE=DATE','SUMMARY'].forEach(k=>assert.ok(o[k],'alan '+k));
  assert.strictEqual(o.DTSTAMP,'20261109T070503Z');
  assert.strictEqual((tarih(o['DTEND;VALUE=DATE'])-tarih(o['DTSTART;VALUE=DATE']))/864e5,1,'DTEND = DTSTART+1');
  assert.ok(!/(^|[^\\])[,;]/.test(o.SUMMARY.replace(/\\\\/g,''))&&!/(^|[^\\])[,;]/.test((o.DESCRIPTION||'').replace(/\\\\/g,'')),'kacis');});
 assert.strictEqual(new Set(olaylar.map(o=>o.UID)).size,olaylar.length,'UID tekil');
 const ders=olaylar.filter(o=>o.UID.startsWith('itm-hafta-'));
 ders.forEach(o=>assert.strictEqual(tarih(o['DTSTART;VALUE=DATE']).getUTCDay(),3,'ders gunu Carsamba'));
 const tatil=W.filter(w=>w.kind==='tatil').map(w=>w.iso);assert.ok(tatil.length===2&&ders.every(o=>!tatil.includes(o.UID.slice(10,20))),'tatil olayi yok');
 const ilk=ogret[0],o1=ders[0];
 assert.strictEqual(coz(o1.SUMMARY),`ITM Hafta ${ilk.no}: Ders ${ilk.chs.join(', ')}`);
 const cokluI=ogret.findIndex(w=>w.chs.length>1);assert.ok(cokluI>=0);const cw=ogret[cokluI];
 assert.strictEqual(ders[cokluI].SUMMARY,`ITM Hafta ${cw.no}: Ders ${cw.chs.join('\\, ')}`,'virgul kacisi');
 assert.strictEqual(coz(o1.DESCRIPTION),ilk.units.map(u=>'• '+adlar[u]).join('\n'),'aciklama + Turkce karakterler');
 assert.ok(o1.DESCRIPTION.includes('Satır1\\nSatır2')&&o1.DESCRIPTION.includes('\\; değerler\\, normlar')&&o1.DESCRIPTION.includes(' \\\\ yol'));
 const uzun=ders.find(o=>coz(o.DESCRIPTION).includes('🙂'));assert.ok(uzun&&coz(uzun.DESCRIPTION).includes(adlar.c6a),'uzun Turkce + emoji bozulmadi');
 const s=olaylar.find(o=>o.UID==='itm-sinav@itm-ders-sistemi');assert.strictEqual(s['DTSTART;VALUE=DATE'],'20270203');assert.strictEqual(coz(s.SUMMARY),'ITM Sınavı');
 /* deterministik: aynı girdi aynı çıktı; uretildi yalnız DTSTAMP'i değiştirir */
 assert.strictEqual(ICS({haftalar:W,sinavIso:'2027-02-03',dersGunu:2,adlar,uretildi:U}),ics);
 const ics2=ICS({haftalar:W,sinavIso:'2027-02-03',dersGunu:2,adlar,uretildi:U+86400000});
 assert.strictEqual(ics2.replace(/DTSTAMP:\S+/g,''),ics.replace(/DTSTAMP:\S+/g,''));
 const ics3=ICS({haftalar:W,sinavIso:'2027-02-03',dersGunu:null,adlar,uretildi:U});
 assert.deepStrictEqual(ics3.match(/UID:\S+/g),ics.match(/UID:\S+/g),'UID ders gunune bagli degil');
 assert.ok(ics3.replace(/\r\n /g,'').match(/DTSTART;VALUE=DATE:\d+/g).slice(0,-1).every(x=>tarih(x.slice(-8)).getUTCDay()===1),'ders gunu yoksa Pazartesi');
 assert.ok(ICS({haftalar:W,sinavIso:'bozuk',uretildi:'bozuk'}).includes('DTSTAMP:19700101T000000Z'));
 console.log('ics          ',olaylar.length,'olay,',fiz.length,'fiziksel satir, en uzun',Math.max(...fiz.map(l=>Buffer.byteLength(l))),'bayt');}

/* ================= 5. Ayarlar ================= */
assert.deepStrictEqual(j(gpVarsayilan()),{musaitlik:[45,45,45,45,45,60,0],dersGunu:null});
const gecerliAyar=a=>{assert.ok(Array.isArray(a.musaitlik)&&a.musaitlik.length===7&&a.musaitlik.every(v=>Number.isInteger(v)&&v>=0&&v<=600));
 assert.ok(a.dersGunu===null||(Number.isInteger(a.dersGunu)&&a.dersGunu>=0&&a.dersGunu<=6));};
const kotu=[null,undefined,5,'x',[],{musaitlik:'abc'},{musaitlik:[-5,1000,'30',null,NaN,45.6,Infinity,99]},{dersGunu:7},{dersGunu:'3'},{dersGunu:2.5},
 {get musaitlik(){throw new Error('x');}},new Proxy({},{get(){throw new Error('p');}}),(()=>{const p=Proxy.revocable({},{});p.revoke();return p.proxy;})(),
 JSON.parse('{"__proto__":{"musaitlik":[1,2]},"dersGunu":-1}')];
kotu.forEach(x=>gecerliAyar(gpOnar(x)));
assert.deepStrictEqual(j(gpOnar({musaitlik:[-5,1000,'30',null,NaN,45.6,Infinity,99]})).musaitlik,[0,600,30,45,45,46,0]);
assert.strictEqual(gpOnar({dersGunu:'3'}).dersGunu,3);assert.strictEqual(gpOnar({dersGunu:2.5}).dersGunu,null);
assert.deepStrictEqual(j(gpOnar({musaitlik:[10,20,30,40,50,60,70],dersGunu:4})),{musaitlik:[10,20,30,40,50,60,70],dersGunu:4});
console.log('TAMAM');
