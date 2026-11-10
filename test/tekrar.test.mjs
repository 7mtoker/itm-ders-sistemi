import fs from 'node:fs'; import vm from 'node:vm'; import assert from 'node:assert';
const c=vm.createContext({console});
vm.runInContext(fs.readFileSync('src/tekrar.js','utf8')+';globalThis.A={tkGun,tkIsoGun,tkHash,tkYeni,tkOnar,tkEkle,tkCevapla,tkSil,tkKuyruk,tkOzet,tkBuda}',c);
const {tkGun,tkIsoGun,tkHash,tkYeni,tkOnar,tkEkle,tkCevapla,tkSil,tkKuyruk,tkOzet,tkBuda}=c.A;
const J=x=>JSON.parse(JSON.stringify(x));
const D0=tkIsoGun('2026-11-09');

// --- tkGun / tkIsoGun, DST kararlılığı ---
assert.strictEqual(tkIsoGun('2026-02-31'),null); assert.strictEqual(tkIsoGun('bozuk'),null);
assert.strictEqual(tkIsoGun('2026-11-10')-D0,1);
const eskiTZ=process.env.TZ;
for(const tz of ['Europe/Berlin','America/New_York','Europe/Istanbul']){
 process.env.TZ=tz;
 if(tz!=='Europe/Istanbul') assert.notStrictEqual(new Date(2026,0,15).getTimezoneOffset(),new Date(2026,6,15).getTimezoneOffset(),tz+' DST etkin olmalı');
 for(const y of [2026,2027]) for(let m=0;m<12;m++) for(let d=1;d<=28;d++){
  const g=tkGun(new Date(y,m,d,0,0,1).getTime());
  assert.strictEqual(g,tkGun(new Date(y,m,d,23,59,59).getTime()),tz+' gün içi');
  assert.strictEqual(tkGun(new Date(y,m,d+1,0,0,1).getTime()),g+1,tz+' ardışık');
  assert.strictEqual(g,tkIsoGun(`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`),tz+' iso');
 }
 // DST geçiş günleri: 2026-03-29 ve 2026-10-25 (Berlin), 03-08 / 11-01 (NY)
 for(const iso of ['2026-03-29','2026-10-25','2026-03-08','2026-11-01']){
  const [y,m,d]=iso.split('-').map(Number), g=tkIsoGun(iso);
  for(const h of [0,1,2,3,4,12,23]) assert.strictEqual(tkGun(new Date(y,m-1,d,h,30).getTime()),g,tz+' DST '+iso+' '+h);
 }
}
if(eskiTZ===undefined) delete process.env.TZ; else process.env.TZ=eskiTZ;
assert.ok(Number.isNaN(tkGun(NaN)));

// --- not yolları, aralık büyümesi, unutma ---
{const st=tkYeni(); let k=tkCevapla(st,'t:Planning',2,D0,null);
 assert.deepStrictEqual(J(k),[D0+1,1,255,1,0,D0]);
 k=tkCevapla(st,'t:Planning',2,D0+1,null); assert.strictEqual(k[1],3);
 k=tkCevapla(st,'t:Planning',2,D0+4,null); assert.ok(k[1]>=7&&k[1]<=9,'3. aralık ~8: '+k[1]);
 let onceki=k[1],gun=D0+4;
 for(let i=0;i<4;i++){gun=k[0];k=tkCevapla(st,'t:Planning',2,gun,null);assert.ok(k[1]>onceki,'büyür');onceki=k[1];}
 assert.ok(k[2]<=300);
 const ease=k[2]; k=tkCevapla(st,'t:Planning',0,k[0],null);
 assert.strictEqual(k[1],1); assert.strictEqual(k[3],0); assert.strictEqual(k[4],1); assert.strictEqual(k[2],ease-20);
 // aynı gün tekrar yanlış: unutma bir kez sayılır; aynı gün doğru: plan değişmez
 const g=k[5]; k=tkCevapla(st,'t:Planning',0,g,null); assert.strictEqual(k[4],1);
 k=tkCevapla(st,'t:Planning',2,g,null); assert.strictEqual(k[0],g+1); assert.strictEqual(k[3],0);
 assert.strictEqual(st.g[g],3);
 // emin değil: ikinci aralık 2, ease düşer, taban 130
 const s2=tkYeni(); let u=tkCevapla(s2,'q:7',1,D0,null); u=tkCevapla(s2,'q:7',1,D0+1,null); assert.strictEqual(u[1],2);
 for(let i=0;i<20;i++) u=tkCevapla(s2,'q:7',1,u[0],null);
 assert.strictEqual(u[2],130); assert.ok(u[1]>2);
 // ekle/sil
 assert.strictEqual(tkEkle(s2,'__proto__',D0),null); assert.strictEqual(tkCevapla(s2,'',2,D0,null),null);
 const e=tkEkle(s2,'a:c1a-adim-0',D0+5); assert.deepStrictEqual(J(e),[D0+5,0,250,0,0,-1]);
 assert.strictEqual(tkEkle(s2,'q:7',D0),s2.k['q:7']); assert.notStrictEqual(s2.k['q:7'][0],D0);
 tkSil(s2,'q:7'); assert.ok(!('q:7' in s2.k)); tkSil(s2,'constructor');
}

// --- jitter determinizmi ---
{const run=()=>{const st=tkYeni();const out=[];for(let i=0;i<60;i++){const key='t:T'+i;tkCevapla(st,key,2,D0,null);tkCevapla(st,key,2,D0+1,null);out.push(tkCevapla(st,key,2,D0+4,null)[1]);}return out;};
 const a=run(),b=run(); assert.deepStrictEqual(a,b);
 assert.ok(a.every(x=>x>=7&&x<=9),'±%10'); assert.ok(new Set(a).size>1,'jitter yayıyor');
}

// --- sınav tavanı birim kontrolleri ---
{const E=D0+40,st=tkYeni();
 st.k['t:Olgun']=[E-20,40,280,6,0,E-60]; st.k['t:Unutkan']=[E-20,40,280,6,2,E-60];
 const a=tkCevapla(st,'t:Olgun',2,E-20,E), b=tkCevapla(st,'t:Unutkan',2,E-20,E);
 assert.ok(a[0]>=E-7&&a[0]<=E-1,'pencerede'); assert.ok(b[0]>=E-7&&b[0]<=E-4,'unutulmuş erken pencerede');
 const b2=tkCevapla(st,'t:Unutkan',2,b[0],E); assert.ok(b2[0]<=E,'toparlanmış kart sınavı aşmaz');
 // son 3 gün: unutulmuş kart her gün gelir, bugün çalışıldıysa gelmez
 st.k['q:9']=[E+30,60,250,3,1,E-10];
 assert.ok(tkKuyruk(st,E-2,{sinavGun:E,limit:99}).keys.includes('q:9'));
 tkCevapla(st,'q:9',2,E-2,E); assert.ok(!tkKuyruk(st,E-2,{sinavGun:E,limit:99}).keys.includes('q:9'));
 assert.ok(!tkKuyruk(st,E-1,{sinavGun:E,limit:99}).keys.includes('q:9'),'toparlanmış kart ertesi gün zorlanmaz');
 // son 3 gün kuralı: unutulmuş ve henüz toparlanmamış (reps<2) kart her gün gelir;
 // unutulmuş ama art arda 2+ doğruyla toparlanmış kart ve temiz kart zorlanmaz
 st.k['q:dun']=[E+30,60,250,3,1,E-3]; st.k['q:iki']=[E+30,60,250,1,1,E-4]; st.k['q:cok']=[E+30,60,250,3,2,E-3]; st.k['q:temiz']=[E+30,60,250,3,0,E-5];
 const k2=tkKuyruk(st,E-2,{sinavGun:E,limit:99}).keys;
 assert.ok(!k2.includes('q:dun'),'unutulmuş ama toparlanmış: zorlanmaz'); assert.ok(k2.includes('q:iki'),'unutulmuş, toparlanmamış: gelir');
 assert.ok(!k2.includes('q:cok'),'2 unutma ama toparlanmış: zorlanmaz'); assert.ok(!k2.includes('q:temiz'),'temiz kart zorlanmaz');
 ['q:dun','q:iki','q:cok','q:temiz'].forEach(k=>tkSil(st,k));
 // sınav sonrası: null gibi
 assert.deepStrictEqual(J(tkKuyruk(st,E+3,{sinavGun:E})),J(tkKuyruk(st,E+3,{sinavGun:null})));
 assert.deepStrictEqual(J(tkOzet(st,E+3,E)),J(tkOzet(st,E+3,null)));
}

// --- 70 günlük tam simülasyon ---
{const st=tkYeni(),E=D0+70,birim={},log={},kartlar=[];
 for(let i=0;i<600;i++){const key=i%5===0?'q:'+i:i%7===0?'a:c'+(i%28)+'-adim-'+i:'t:Terim '+i;kartlar.push(key);birim[key]='u'+(i%28);}
 const birimOf=k=>birim[k];let pencereUnutkan=null,maxYuk=0;const yuk=[];
 for(let d=D0;d<E;d++){
  const i0=(d-D0)*15; for(const key of kartlar.slice(i0,i0+15)) tkEkle(st,key,d); // 40 günde 600 kart
  if(d===E-7) pencereUnutkan=Object.keys(st.k).filter(k=>st.k[k][4]>0&&st.k[k][3]<1);
  const q=tkKuyruk(st,d,{limit:1e6,sinavGun:E,birimOf});
  assert.strictEqual(q.keys.length,q.vadesi); maxYuk=Math.max(maxYuk,q.keys.length); yuk.push(q.keys.length);
  for(const key of q.keys){
   const r=tkHash(key+'@'+d)%100, not=r<15?0:r<35?1:2;
   const k=tkCevapla(st,key,not,d,E);
   assert.ok(k[0]>d&&k[0]<=E,'vade sınavı aşmaz: '+key);
   (log[key]=log[key]||[]).push(d);
  }
  for(const key in st.k) assert.ok(st.k[key][0]<=E||st.k[key][5]<0);
 }
 const pencerede=k=>(log[k]||[]).filter(d=>d>=E-7&&d<=E-1).length;
 for(const key of kartlar) assert.ok(pencerede(key)>=1,'son haftada en az bir kez: '+key);
 assert.ok(pencereUnutkan.length>=5,"toparlanmamış kart sayısı: "+pencereUnutkan.length);
 for(const key of pencereUnutkan) assert.ok(pencerede(key)>=2,'unutulmuş kart iki kez: '+key);
 const oz=tkOzet(st,E-1,E); assert.strictEqual(oz.toplam,600); assert.strictEqual(oz.seri,70);
 // makul yük: son 3 günde her unutulmuş kart her gün gelmez (eski kural 3×unutulmuş tekrar üretiyordu)
 const unutkan=Object.keys(st.k).filter(k=>st.k[k][4]>0).length,son3=yuk.slice(-3);
 assert.ok(son3.slice(0,2).every(n=>n<unutkan),'son günlerde unutulmuşların hepsi her gün gelmez: '+son3+' / '+unutkan);
 assert.ok(son3.reduce((a,b)=>a+b,0)<unutkan*2.85,'son 3 gün toplamı sınırlı: '+son3);
 assert.ok(maxYuk<=oz.toplam*0.75,'hiçbir gün destenin dörtte üçünü aşmaz: '+maxYuk);
 console.log('simülasyon: 600 kart, en yoğun gün',maxYuk,'tekrar, olgun',oz.olgun,'\n günlük yük:',yuk.join(' '));
 // sınırlı kuyruk: limit ve gecikmiş sayısı
 const q=tkKuyruk(st,E+20,{sinavGun:E,birimOf}); assert.strictEqual(q.keys.length,20); assert.ok(q.gecikmis>0&&q.vadesi>=q.gecikmis);
}

// --- karıştırma ---
{const st=tkYeni(),b={};
 for(let i=0;i<10;i++){st.k['t:A'+i]=[D0-i,1,250,1,0,D0-i-1];b['t:A'+i]='A';}
 for(let i=0;i<5;i++){st.k['q:B'+i]=[D0,1,250,1,0,D0-1];b['q:B'+i]='B';st.k['a:C'+i]=[D0,1,250,1,0,D0-1];b['a:C'+i]='C';}
 const q=tkKuyruk(st,D0,{limit:100,birimOf:k=>b[k]});assert.strictEqual(q.keys.length,20);
 for(let i=1;i<q.keys.length;i++) assert.notStrictEqual(b[q.keys[i]],b[q.keys[i-1]],'ünite yan yana: '+q.keys);
 assert.strictEqual(q.keys[0],'t:A9','en gecikmiş önce');
 // birimOf yok: türler dönüşümlü
 const s2=tkYeni(); for(let i=0;i<10;i++){s2.k['t:x'+i]=[D0-5,1,250,1,0,D0-6];s2.k['q:'+i]=[D0,9,250,1,0,D0-9];}
 const q2=tkKuyruk(s2,D0,{limit:20}).keys; for(let i=1;i<20;i++) assert.notStrictEqual(q2[i][0],q2[i-1][0],'tür yan yana');
 // kaçınılamaz durum: 6 A + 1 B -> en az yan yana (4)
 const s3=tkYeni(); for(let i=0;i<6;i++) s3.k['t:a'+i]=[D0,1,250,1,0,D0-1]; s3.k['t:b']=[D0,1,250,1,0,D0-1];
 const q3=tkKuyruk(s3,D0,{birimOf:k=>k==='t:b'?'B':'A'}).keys; let yan=0;for(let i=1;i<q3.length;i++) if((q3[i]==='t:b')===(q3[i-1]==='t:b')) yan++;
 assert.strictEqual(q3.length,7); assert.strictEqual(yan,4);
 // birimOf hata atsa da çalışır
 assert.strictEqual(tkKuyruk(s3,D0,{birimOf:()=>{throw 1}}).keys.length,7);
}

// --- tkOnar ---
{const ok=st=>{assert.deepStrictEqual(Object.keys(st).sort(),['g','k','v']);assert.strictEqual(st.v,1);
  for(const k in st.k){const a=st.k[k];assert.strictEqual(a.length,6);assert.ok(a.every(Number.isInteger));assert.ok(a[2]>=130&&a[2]<=300);}
  for(const d in st.g) assert.ok(Number.isInteger(st.g[d])&&st.g[d]>0); tkKuyruk(st,D0,{}); tkOzet(st,D0,D0+5); return st;};
 for(const x of [null,undefined,5,'x',[],{},{k:[]},{k:'x',g:[]},{v:9,k:null,g:5}]) assert.deepStrictEqual(J(ok(tkOnar(x))),{v:1,k:{},g:{}});
 const kotu=JSON.parse('{"k":{"__proto__":[1,1,250,1,0,0],"t:a":[1,2,3],"t:b":["x",1,250,1,0,0],"t:c":[10.4,3,999,2,-4,8],"t:d":[5,null,"e",-1e400,1,"y"],"t:e":{"0":1},"":[1,1,1,1,1,1]},"g":{"5":3,"x":2,"7":null,"8":-1,"9":2.7}}');
 kotu.k['t:f']=[Infinity,1,250,1,0,0]; kotu.k['t:g']=[NaN,1,250,1,0,0];
 const r=ok(tkOnar(kotu));
 assert.deepStrictEqual(Object.keys(r.k).sort(),['t:c','t:d']);
 assert.deepStrictEqual(J(r.k['t:c']),[10,3,300,2,0,8]); assert.deepStrictEqual(J(r.k['t:d']),[5,0,250,0,1,-1]);
 assert.deepStrictEqual(J(r.g),{5:3,9:2}); assert.strictEqual(Object.getPrototypeOf(r.k),vm.runInContext('Object.prototype',c));
 const p=new Proxy({},{ownKeys(){throw new Error('x')},get(){throw new Error('y')}}); ok(tkOnar(p)); ok(tkOnar({k:p,g:p}));
 const dongu={};dongu.k=dongu;ok(tkOnar(dongu));
}

// --- tkBuda ---
{const st=tkYeni();
 for(let i=0;i<1000;i++) st.k['t:'+i]=[D0+i%30,i%60,250,i%9,i%4===0?1:0,D0-1];
 for(let d=D0-200;d<=D0;d++) st.g[d]=1;
 const lapsed=Object.keys(st.k).filter(k=>st.k[k][4]>0).length;
 tkBuda(st,D0); assert.strictEqual(Object.keys(st.k).length,900);
 assert.strictEqual(Object.keys(st.k).filter(k=>st.k[k][4]>0).length,lapsed,'unutulmuşlar korunur');
 const kalanMaxIvl=Math.max(...Object.values(st.k).filter(a=>a[4]===0).map(a=>a[1])); assert.ok(kalanMaxIvl<59,'en olgunlar atıldı');
 assert.strictEqual(Object.keys(st.g).length,90); assert.ok(Object.keys(st.g).every(d=>+d>D0-90));
 tkBuda(st,D0,10); assert.strictEqual(Object.keys(st.k).length,10); assert.ok(Object.values(st.k).every(a=>a[4]>0));
 assert.ok(JSON.stringify(st).length<240e3);
}

// --- seri ve özet ---
{const st=tkYeni(); st.g[D0-1]=4; st.g[D0-2]=1; st.g[D0-3]=2; st.g[D0-5]=9;
 assert.strictEqual(tkOzet(st,D0,null).seri,3); assert.strictEqual(tkOzet(st,D0,null).bugunYapilan,0);
 tkCevapla(st,'t:x',2,D0,null); let o=tkOzet(st,D0,null); assert.strictEqual(o.seri,4); assert.strictEqual(o.bugunYapilan,1);
 assert.strictEqual(tkOzet(st,D0+2,null).seri,0);
 st.k['t:y']=[D0,1,250,1,0,D0-1]; st.k['t:z']=[D0+6,10,250,3,0,D0-4]; st.k['t:w']=[D0+20,30,250,4,0,D0-10];
 o=tkOzet(st,D0,null); assert.deepStrictEqual(J(o.hafta),[1,1,0,0,0,0,1]); assert.strictEqual(o.vadesi,1); assert.strictEqual(o.yarin,1);
 assert.strictEqual(o.toplam,4); assert.strictEqual(o.olgun,2);
}
console.log('TAMAM');
