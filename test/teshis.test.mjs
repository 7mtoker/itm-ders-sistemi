import fs from 'node:fs'; import vm from 'node:vm'; import assert from 'node:assert';
const c=vm.createContext({console});
vm.runInContext(fs.readFileSync('src/teshis.js','utf8')+';globalThis.T={tsYeni,tsOnar,tsTerimler,tsKavram,tsKaydet,tsProfil,tsOneriler,tsKarsitSorular,tsKarsilastir,tsNorm,tsMAX_CIFT}',c);
const T=c.T, J=x=>JSON.parse(JSON.stringify(x)), GUN=864e5, NOW=Date.UTC(2026,10,9,12);

/* ---------- tsKavram ---------- */
const TR=['Planning','Strategic planning','Leading','PESTEL',"Porter's five forces",'Emotional intelligence (EQ)','Theory X / Theory Y','Culture (Hofstede)','Hygiene factors','SWOT'];
assert.strictEqual(T.tsKavram('Strategic planning by top managers',TR),'Strategic planning','longest wins');
assert.strictEqual(T.tsKavram('PLANNING',TR),'Planning','case-insensitive');
assert.strictEqual(T.tsKavram('Misleading the team',TR),null,'whole word');
assert.strictEqual(T.tsKavram('Porter’s five forces model',TR),"Porter's five forces",'curly apostrophe');
assert.strictEqual(T.tsKavram('High EQ',TR),'Emotional intelligence (EQ)','acronym alias');
assert.strictEqual(T.tsKavram('Emotional intelligence',TR),'Emotional intelligence (EQ)','parenthesis stripped');
assert.strictEqual(T.tsKavram('A culture of trust',TR),null,'non-acronym parenthesis is not an alias');
assert.strictEqual(T.tsKavram('Theory Y managers',TR),'Theory Y','slash splits');
assert.strictEqual(T.tsKavram('Hygiene factor',['Hygiene factor']),'Hygiene factor');
assert.strictEqual(T.tsKavram('SWOTs everywhere',TR),'SWOT','plural tolerated');
assert.strictEqual(T.tsKavram('Planning',[['Planning','def']]),'Planning','pair input');
assert.strictEqual(T.tsKavram('',TR),null); assert.strictEqual(T.tsKavram('x',null),null); assert.strictEqual(T.tsKavram(null,TR),null);
assert.deepStrictEqual(J(T.tsTerimler([{terms:[['A','x'],['a','y'],['B','z']]},{terms:null},null])),['A','B'],'tsTerimler dedup');

/* ---------- tsKaydet ---------- */
const q1={id:'q1',u:'c6d',d:2,q:'Which tool?',o:['PESTEL','SWOT','Value chain','Something else entirely here'],a:0};
let st=T.tsYeni();
st=T.tsKaydet(st,{q:q1,secilen:1,emin:true,t:NOW-GUN},TR);
assert.deepStrictEqual(J(st.c),{'c6d|PESTEL|SWOT':[1,NOW-GUN]},'pair recorded');
assert.deepStrictEqual(J(st.e.c6d),[0,1,0,0,NOW-GUN,0],'sure+wrong');
const q1r={...q1,o:['SWOT','PESTEL','Value chain','x'],a:0};
st=T.tsKaydet(st,{q:q1r,secilen:1,emin:false,t:NOW},TR);
assert.deepStrictEqual(J(st.c),{'c6d|PESTEL|SWOT':[2,NOW]},'unordered pair, last seen updated');
assert.deepStrictEqual(J(st.e.c6d),[0,1,0,1,NOW-GUN,0],'unsure+wrong');
st=T.tsKaydet(st,{q:q1,secilen:0,emin:null,t:NOW},TR);
assert.deepStrictEqual(J(st.e.c6d),[0,1,0,1,NOW-GUN,0],'emin null leaves calibration');
assert.deepStrictEqual(J(st.c),{'c6d|PESTEL|SWOT':[1,NOW]},'right answer with both on screen weakens the pair');
st=T.tsKaydet(st,{q:q1,secilen:0,emin:false,t:NOW},TR);
assert.deepStrictEqual(J(st.c),{},'pair removed at zero'); assert.deepStrictEqual(J(st.e.c6d),[0,1,1,1,NOW-GUN,NOW],'unsure+right');
st=T.tsKaydet(st,{q:q1,secilen:0,emin:true,t:NOW},TR); assert.strictEqual(st.e.c6d[0],1,'sure+right');
// no "a" field -> o[0] is right (raw bank)
const q2={id:'q2',u:'c1a',d:1,q:'?',o:['Doing nothing at all, ever, in any circumstances whatsoever','Planning']};
st=T.tsKaydet(T.tsYeni(),{q:q2,secilen:1,emin:null,t:5},TR);
const k2=Object.keys(st.c)[0];
assert.ok(k2.startsWith('c1a|')&&k2.includes('|Planning')&&k2.includes('|~doing nothing'),'raw fallback '+k2);
assert.ok(k2.split('|').find(x=>x[0]==='~').length<=41,'truncated');
// same term in both options -> raw texts
st=T.tsKaydet(T.tsYeni(),{q:{id:'q3',u:'c6d',o:['PESTEL, threat or opportunity','PESTEL, weakness']},secilen:1,emin:null,t:1},TR);
assert.deepStrictEqual(Object.keys(st.c),['c6d|~pestel threat or opportunity|~pestel weakness']);
// garbage in -> state out, no throw
for(const bad of [null,{},{q:null},{q:{o:'x'}},{q:q1,secilen:9},{q:q1,secilen:-1},{q:q1,secilen:'1'}]) assert.ok(T.tsKaydet(null,bad,TR).v===1);
{const e=T.tsKaydet(null,{q:{...q1,u:'__proto__'},secilen:1,emin:true,t:1},TR).e;
 assert.deepStrictEqual(Object.keys(e),['?'],'prototype key rejected'); assert.ok(!Array.isArray(Object.getPrototypeOf(e)),'prototype untouched');}
// bound: lowest count first, then oldest
st=T.tsYeni();
for(let i=0;i<T.tsMAX_CIFT+10;i++) st.c[`u|A${String(i).padStart(3,'0')}|B`]=[i<5?1:2,1000+i];
st=T.tsKaydet(st,{q:q1,secilen:1,emin:null,t:9e9},TR);
assert.strictEqual(Object.keys(st.c).length,T.tsMAX_CIFT,'bounded');
assert.ok(!st.c['u|A000|B']&&!st.c['u|A004|B']&&!st.c['u|A005|B']&&!st.c['u|A010|B']&&st.c['u|A011|B']&&st.c['c6d|PESTEL|SWOT'],'eviction order');
// calibration halving
st=T.tsYeni(); for(let i=0;i<81;i++) st=T.tsKaydet(st,{q:q1,secilen:0,emin:true,t:i},TR);
assert.strictEqual(st.e.c6d[0],41,'halved after 80');

/* ---------- tsOnar ---------- */
for(const bad of [undefined,null,5,'x{','[]',[],{v:2},{c:[],e:'x'},{c:{'a|b':[1],'u|x|x':[3,1],'u|y|z':['q',1],'u|q|r':[-2,1]},e:{c1a:'x',c2a:[1,2]}},
 JSON.parse('{"c":{"__proto__":[1,1]},"e":{"__proto__":[1,1,1,1,1,1]}}')]){
 const r=T.tsOnar(bad); assert.strictEqual(r.v,1); assert.deepStrictEqual(Object.keys(r.c),[]);
 assert.ok(Object.getPrototypeOf(r.e)===Object.getPrototypeOf(r.c));}
assert.deepStrictEqual(J(T.tsOnar({c:{'u|b|a':[2.7,'x']},e:{c2a:[1,2]}})),{v:1,c:{'u|a|b':[2,0]},e:{c2a:[1,2,0,0,0,0]}},'normalised');
assert.deepStrictEqual(J(T.tsOnar(JSON.stringify({v:1,c:{'u|a|b':[3,7]},e:{}}))),{v:1,c:{'u|a|b':[3,7]},e:{}},'json string');
const getterBomb={get c(){throw new Error('x');}}; assert.deepStrictEqual(J(T.tsOnar(getterBomb)),J(T.tsYeni()),'never throws');

/* ---------- tsProfil ---------- */
const U=[{id:'c1a',ch:1,pts:4},{id:'c3a',ch:3,pts:4},{id:'c6d',ch:6,pts:3},{id:'c6e',ch:6,pts:3}];
const P=T.tsProfil({c1a:[{ok:true,d:1},{ok:true,d:1},{ok:false,d:2}],c6d:[{ok:false,d:3},{ok:true,d:3},{ok:true,d:7}],zz:[{ok:true,d:1}]},U);
assert.deepStrictEqual(J(P[1][1]),{n:2,ok:2,acc:1,est:0.75});
assert.deepStrictEqual(J(P[1][2]),{n:1,ok:0,acc:0,est:1/3});
assert.deepStrictEqual(J(P[3][3]),{n:2,ok:1,acc:0.5,est:0.5});
assert.strictEqual(P[3][0].n,3,'unknown d counts only in level 0');
assert.deepStrictEqual(J(P[2][0]),{n:0,ok:0,acc:null,est:0.5});
assert.strictEqual(P[0][0].n,6); assert.strictEqual(P[3].pts,6); assert.strictEqual(P[3].ptsGor,3); assert.strictEqual(P[0].pts,14);
assert.strictEqual(T.tsProfil(null,null)[0][0].n,0);

/* ---------- tsOneriler ---------- */
const CMP=[['SWOT vs PESTEL','SWOT is internal+external; PESTEL macro only.'],['Line vs Staff manager','Line direct, staff indirect.']];
st={v:1,c:{'c6d|PESTEL|SWOT':[4,NOW],'c1a|Leading|Planning':[1,NOW],'c3a|Line manager|Staff manager':[3,NOW-60*GUN],'c1a|~foo|Planning':[2,NOW]},
 e:{c1a:[2,3,0,0,NOW,0],c3a:[1,1,5,0,0,NOW],c6d:[5,0,1,0,0,NOW]}};
let R=T.tsOneriler(st,{units:U,compare:CMP,now:NOW,limit:10});
assert.ok(!R.some(x=>x.tip==='karisma'&&x.a==='Leading'),'n<2 never surfaces');
const kS=R.find(x=>x.tip==='karisma'&&x.u==='c6d');
assert.deepStrictEqual(J(kS),{tip:'karisma',u:'c6d',a:'PESTEL',b:'SWOT',hamA:false,hamB:false,n:4,son:NOW,kar:CMP[0],puan:1.44});
const kL=R.find(x=>x.u==='c3a'&&x.tip==='karisma');
assert.deepStrictEqual(J(kL.kar),CMP[1],'compare match with shared word'); assert.ok(kL.puan>0&&kL.puan<4*0.36*0.2,'old evidence decays');
const kR=R.find(x=>x.tip==='karisma'&&x.u==='c1a'); assert.ok(kR.hamA&&kR.a==='foo'&&kR.kar===null,'raw concept');
const eY=R.find(x=>x.tip==='eminYanlis'); assert.strictEqual(eY.u,'c1a'); assert.strictEqual(eY.sw,3); assert.ok(!R.some(x=>x.tip==='eminYanlis'&&x.u==='c3a'),'sw<2 skipped');
const kG=R.filter(x=>x.tip==='kirilgan'); assert.deepStrictEqual(J(kG.map(x=>x.u)),['c3a'],'only many unsure+right');
for(let i=1;i<R.length;i++) assert.ok(R[i-1].puan>=R[i].puan,'sorted');
assert.strictEqual(T.tsOneriler(st,{units:U,compare:CMP,now:NOW,limit:2}).length,2,'limit');
assert.deepStrictEqual(J(T.tsOneriler(null,{})),[],'empty');
// level lag
const hh={c1a:Array.from({length:20},(_,i)=>({ok:true,d:1})),c3a:Array.from({length:10},(_,i)=>({ok:i<2,d:2})).concat(Array.from({length:10},()=>({ok:true,d:1})))};
R=T.tsOneriler(T.tsYeni(),{histByUnit:hh,units:U,now:NOW});
assert.strictEqual(R.length,1); assert.strictEqual(R[0].tip,'duzey'); assert.strictEqual(R[0].parca,2); assert.strictEqual(R[0].d,2);
assert.ok(R[0].fark>0.4&&R[0].puan>0&&R[0].n===10&&R[0].ok===2,'duzey numbers');

/* ---------- tsKarsitSorular ---------- */
const QS=[
 {id:'x1',u:'c6d',d:1,q:'?',o:['SWOT','Value chain','VRIO','BCG']},
 {id:'x2',u:'c6c',d:3,q:'?',o:['Value chain','PESTEL','SWOT','x']},
 {id:'x3',u:'c6d',d:2,q:'?',o:['PESTEL','SWOT analysis','x','y']},
 {id:'x4',u:'c6d',d:1,q:'What does PESTEL cover?',o:['a','b','c','d']},
 {id:'x5',u:'c7b',d:1,q:'?',o:['SWOT','x','y','z']},
 {id:'x6',u:'c6d',d:3,q:'?',o:['PESTEL and SWOT together','x','y','z']}];
assert.deepStrictEqual(J(T.tsKarsitSorular({a:'PESTEL',b:'SWOT',u:'c6d'},QS,10)),['x3','x2','x6','x1','x4'],'contrast first, then unit fallback');
assert.deepStrictEqual(J(T.tsKarsitSorular({a:'PESTEL',b:'SWOT',u:'c6d'},QS,2)),['x3','x2']);
assert.deepStrictEqual(J(T.tsKarsitSorular(null,QS)),[]); assert.deepStrictEqual(J(T.tsKarsitSorular({a:'',b:''},QS)),[]);
console.log('birim testleri tamam');

/* ---------- realistic: real units + real bank ---------- */
const UNITS=JSON.parse(fs.readFileSync('kaynak/birimler.json','utf8'));
const BANKF=JSON.parse(fs.readFileSync('kaynak/sorular-banka.json','utf8'));
const BANK=Array.isArray(BANKF)?BANKF:BANKF.bank;
assert.ok(Array.isArray(BANK)&&BANK.length>100&&BANK.every(q=>Array.isArray(q.o)&&q.u),'bank shape');
const html=fs.readFileSync('kaynak/orijinal.html','utf8'), i0=html.indexOf('const COMPARE');
const COMPARE=vm.runInNewContext(html.slice(html.indexOf('[',i0),html.indexOf('];',i0)+1));
assert.ok(COMPARE.length>5);
const TER=T.tsTerimler(UNITS);
const right=q=>Number.isInteger(q.a)?q.a:0;
// find, per unit, the (correct concept, distractor concept) contrast that the bank tests most often; prefer COMPARE pairs
const cnt={};
for(const q of BANK){const a=T.tsKavram(q.o[right(q)],TER);if(!a)continue;
 q.o.forEach((o,j)=>{if(j===right(q))return;const b=T.tsKavram(o,TER);if(!b||b===a)return;
  const k=q.u+'|'+[a,b].sort().join('|');(cnt[k]||(cnt[k]=[])).push([q,j]);});}
const cands=Object.entries(cnt).map(([k,v])=>{const [u,a,b]=k.split('|');return {u,a,b,v,cmp:!!T.tsKarsilastir(a,b,COMPARE)};}).filter(x=>x.v.length>=2);
console.log('adaylar:',cands.map(x=>`${x.u}:${x.a}/${x.b}:${x.v.length}${x.cmp?'*':''}`).join(' '));
const best=cands.sort((x,y)=>(y.cmp-x.cmp)||(y.v.length-x.v.length)||(x.u<y.u?-1:1))[0];
assert.ok(best&&best.v.length>=2,'bank has a testable contrast');
const OVER=UNITS.find(u=>u.ch!==UNITS.find(x=>x.id===best.u).ch&&u.pts===4).id;   // overconfident unit, other chapter
console.log('karisma:',best.u,best.a,'<->',best.b,'('+best.v.length+' soru)','| asiri emin:',OVER);
let S=T.tsYeni(); const hist={}; let t=NOW-10*GUN, i=0;
const ans=(q,sec,emin)=>{t+=20*60e3;S=T.tsKaydet(S,{q,secilen:sec,emin,t},TER);
 const h=hist[q.u]||(hist[q.u]=[]);h.push({ok:sec===right(q),d:q.d,k:'test',t});if(h.length>40)h.shift();};
const trap=new Map(best.v.map(([q,j])=>[q.id,j]));
for(const round of [1,2]) for(const q of BANK){
 if(round===2&&!trap.has(q.id))continue;
 const r=right(q),other=(r+1+(i++%3))%q.o.length;
 if(trap.has(q.id)) ans(q,trap.get(q.id),round===1?null:false);            // keeps falling for the same contrast
 else if(q.u===OVER) ans(q,i%5<3?other:r,true);                              // sure, and mostly wrong
 else ans(q,i%7===0?other:r,i%3===0?null:true);                              // a normal ~85% student
}
// a second, COMPARE-backed confusion from real data: picks reward power when coercive power is right
const qCR=BANK.find(q=>q.u==='c3a'&&T.tsKavram(q.o[right(q)],TER)==='Coercive power'&&q.o.some(o=>T.tsKavram(o,TER)==='Reward power'));
assert.ok(qCR,'real coercive/reward question');
for(let k=0;k<3;k++) ans(qCR,qCR.o.findIndex(o=>T.tsKavram(o,TER)==='Reward power'),false);
const top=T.tsOneriler(S,{histByUnit:hist,units:UNITS,compare:COMPARE,now:NOW,limit:5});
console.log(top.map(x=>`${x.tip} ${x.u||('P'+x.parca+'d'+x.d)} ${x.a?x.a+'/'+x.b+' n'+x.n:''}${x.sw!=null?' sr'+x.sr+' sw'+x.sw+' ur'+x.ur:''} puan=${x.puan}`).join('\n'));
const tk=top.findIndex(x=>x.tip==='karisma'&&x.u===best.u&&[x.a,x.b].sort().join()===[best.a,best.b].sort().join());
const te=top.findIndex(x=>x.tip==='eminYanlis'&&x.u===OVER);
assert.ok(tk>=0&&tk<2,'confused pair is a top-2 insight, rank '+tk);
assert.ok(te>=0&&te<2,'overconfident unit is a top-2 insight, rank '+te);
assert.ok(top[tk].n>=best.v.length,'confusion count');
assert.deepStrictEqual(J(top[tk].kar),J(T.tsKarsilastir(best.a,best.b,COMPARE)),'COMPARE lookup consistent');
const kc=top.find(x=>x.tip==='karisma'&&x.u==='c3a'&&x.a==='Coercive power'&&x.b==='Reward power');
assert.ok(kc&&kc.n===3,'second confusion surfaces'); assert.strictEqual(kc.kar[0],'Coercive vs Reward power','COMPARE explanation attached');
assert.ok(top.filter(x=>x.tip==='eminYanlis'&&x.u!==OVER).every(x=>x.puan*1.5<top[te].puan),'occasional slips rank far below real overconfidence');
const drill=T.tsKarsitSorular(top[tk],BANK,6);
assert.ok(drill.length>=Math.min(2,best.v.length),'drill returns questions');
const nA=T.tsNorm(best.a),nB=T.tsNorm(best.b);
for(const id of drill.slice(0,Math.min(best.v.length,drill.length))){const q=BANK.find(x=>x.id===id);const s=q.o.map(T.tsNorm).join(' | ');
 assert.ok(s.includes(nA)&&s.includes(nB),'drill question offers both concepts: '+id);}
assert.ok(best.v.every(([q])=>drill.includes(q.id))||drill.length===6,'trap questions are drilled');
assert.ok(JSON.stringify(S).length<20000,'state stays compact: '+JSON.stringify(S).length);
assert.deepStrictEqual(J(T.tsOnar(JSON.parse(JSON.stringify(S)))),J(S),'state survives JSON round trip');
console.log('drill:',drill.join(' '));
console.log('TAMAM');
