/* ================= TAKVİM MOTORU: saf fonksiyonlar, DOM yok ================= */
function isoGun(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),g=String(d.getDate()).padStart(2,"0");return`${y}-${m}-${g}`;}
function isoDan(s){const [y,m,g]=String(s).split("-").map(Number);return new Date(y,m-1,g,12);}
function gecerliIso(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s)))return false;const d=isoDan(s);return !isNaN(d.getTime())&&isoGun(d)===s;}
function pazartesi(d){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);x.setDate(x.getDate()-((x.getDay()+6)%7));return x;}
function gunEkle(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}

/* Ardışık dersleri T haftaya en dengeli şekilde böler (en yoğun haftayı en aza indirir). */
function bolustur(bloklar,T){
 const n=bloklar.length,pre=[0];bloklar.forEach((b,i)=>{pre[i+1]=pre[i]+b.units.length;});
 const INF=1e9,dp=Array.from({length:T+1},()=>Array(n+1).fill(INF)),par=Array.from({length:T+1},()=>Array(n+1).fill(0));
 dp[0][0]=0;
 for(let t=1;t<=T;t++)for(let i=t;i<=n;i++)for(let j=t-1;j<i;j++){const c=Math.max(dp[t-1][j],pre[i]-pre[j]);if(c<dp[t][i]){dp[t][i]=c;par[t][i]=j;}}
 const out=[];let i=n;for(let t=T;t>0;t--){const j=par[t][i];out.unshift(bloklar.slice(j,i));i=j;}
 return out;}

/* Hafta sayısı dersten fazlaysa büyük dersleri ikiye böler: okulda da iki haftaya yayılır. */
function genislet(bloklar,T){let b=bloklar.map(x=>({ch:x.ch,units:x.units.slice()}));
 while(b.length<T){let k=-1,en=3;b.forEach((x,i)=>{if(x.units.length>en){en=x.units.length;k=i;}});if(k<0)break;
  const x=b[k],m=Math.ceil(x.units.length/2);b.splice(k,1,{ch:x.ch,units:x.units.slice(0,m)},{ch:x.ch,units:x.units.slice(m)});}
 return b;}

/* plan: {start, exam, skip:[pazartesi ISO], tasi:{ders:pazartesi ISO}} · bloklar: [{ch, units:[id]}] */
function haftalarKur(plan,bloklar){
 if(!gecerliIso(plan.start)||!gecerliIso(plan.exam))return[];
 const ilk=pazartesi(isoDan(plan.start)),son=pazartesi(isoDan(plan.exam));
 if(ilk>son)return[];
 const skip=new Set(plan.skip||[]),W=[];
 for(let d=ilk,g=0;d<=son&&g<140;d=gunEkle(d,7),g++){const iso=isoGun(d),sinav=iso===isoGun(son);
  W.push({iso,kind:sinav?"sinav":skip.has(iso)?"tatil":"musait",units:[],chs:[]});}
 const musait=W.filter(w=>w.kind==="musait"),tekrarN=musait.length>=12?2:musait.length>=2?1:0,ders=musait.slice(0,musait.length-tekrarN);
 musait.slice(musait.length-tekrarN).forEach(w=>{w.kind="tekrar";});
 const T=ders.length,yerles=(w,gr)=>{gr.forEach(b=>{w.units.push(...b.units);});};
 if(T===0){const hedef=W.find(w=>w.kind==="tekrar")||W[W.length-1];hedef.units=bloklar.flatMap(b=>b.units);if(hedef.kind==="tekrar")hedef.kind="ders";}
 else if(T>=bloklar.length){const b=genislet(bloklar,T);ders.forEach((w,i)=>{if(i<b.length){w.kind="ders";w.units.push(...b[i].units);}else w.kind="tekrar";});}
 else{const gr=bolustur(bloklar,T);ders.forEach((w,i)=>{w.kind="ders";yerles(w,gr[i]);});}
 /* Elle taşınan dersler: okuldaki gerçek sıraya uyum için. */
 const sira=new Map(bloklar.flatMap(b=>b.units).map((u,i)=>[u,i])),chOf=new Map(bloklar.flatMap(b=>b.units.map(u=>[u,b.ch])));
 Object.entries(plan.tasi||{}).forEach(([ch,iso])=>{const hedef=W.find(w=>w.iso===iso);if(!hedef||hedef.kind==="tatil")return;
  const blok=bloklar.find(b=>String(b.ch)===String(ch));if(!blok)return;
  W.forEach(w=>{w.units=w.units.filter(u=>!blok.units.includes(u));});hedef.units.push(...blok.units);});
 let no=0;
 W.forEach((w,i)=>{w.i=i;w.units.sort((a,b)=>sira.get(a)-sira.get(b));w.chs=[...new Set(w.units.map(u=>chOf.get(u)))];
  if(w.kind==="tekrar"&&w.units.length)w.kind="ders";
  if(w.kind==="ders"&&!w.units.length)w.kind="bos";
  w.no=w.kind==="tatil"?null:++no;});
 return W;}
