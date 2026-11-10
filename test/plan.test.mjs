import fs from 'node:fs'; import vm from 'node:vm'; import assert from 'node:assert';
const c=vm.createContext({console}); vm.runInContext(fs.readFileSync('src/plan.js','utf8')+';globalThis.A={haftalarKur,pazartesi,isoGun,isoDan,gecerliIso,bolustur}',c);
const {haftalarKur:H,gecerliIso}=c.A;
const n=[2,2,2,2,2,5,2,2,2,2,5],B=n.map((k,i)=>({ch:i+1,units:Array.from({length:k},(_,j)=>`c${i+1}${'abcde'[j]}`)}));
const all=B.flatMap(b=>b.units);
const chk=(W,lbl)=>{const u=W.flatMap(w=>w.units);assert.strictEqual(u.length,28,lbl+' units '+u.length);assert.deepStrictEqual([...u],[...all],lbl+' order');};
for(const [lbl,start,exam,skip] of [
 ['3 hafta','2026-11-09','2026-11-30',[]],
 ['8 hafta','2026-11-09','2027-01-04',[]],
 ['11 hafta','2026-11-09','2027-02-01',['2026-12-21','2026-12-28']],
 ['14 hafta','2026-11-09','2027-02-15',[]],
 ['20 hafta','2026-11-09','2027-03-29',[]],
 ['ayni hafta','2026-11-09','2026-11-13',[]],
 ['bir sonraki','2026-11-09','2026-11-16',[]],
 ['yil degisimi DST','2026-10-19','2026-11-30',[]],
]){const W=H({start,exam,skip,tasi:{}},B);chk(W,lbl);
 W.forEach((w,i)=>{if(i)assert.strictEqual((new Date(w.iso)-new Date(W[i-1].iso))/864e5,7,lbl+' 7 gun');assert.strictEqual(c.A.isoDan(w.iso).getDay(),1,lbl+' pazartesi');});
 console.log(lbl.padEnd(18),W.map(w=>w.kind[0]+(w.units.length||'')).join(' '));}
const W2=H({start:'2026-11-09',exam:'2027-01-11',skip:['2026-12-21','2026-12-28'],tasi:{3:'2026-11-09'}},B);
assert.ok(W2[0].units.includes('c3a'));assert.strictEqual(W2.flatMap(w=>w.units).length,28);
assert.strictEqual(H({start:'2026-12-01',exam:'2026-11-01',skip:[],tasi:{}},B).length,0);
assert.strictEqual(H({start:'bozuk',exam:'2026-11-01',skip:[],tasi:{}},B).length,0);
assert.ok(!gecerliIso('2026-02-31'));
const W3=H({start:'2026-11-09',exam:'2027-01-11',skip:[],tasi:{1:'2026-12-14',2:'2026-12-14'}},B);
console.log('tasi', W3.map(w=>w.kind[0]+(w.chs.join('/')||'')).join(' '));
console.log('TAMAM');
