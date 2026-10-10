const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),context=vm.createContext({window:{},console});
for(const file of ['vocabulary-data.js','curriculum-plan.js','word-curriculum.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const api=context.window.WordCurriculum,data=context.window.CET_VOCABULARY;
for(const bank of [4,6]){
 const stats=api.stats(bank),introduced=new Set();
 for(let n=1;n<=stats.levels;n++){
  const lesson=api.lesson(bank,n);assert.equal(lesson.items.length,6);
  assert.equal(new Set(lesson.items.map(i=>i.entry.id)).size,6,'Distinct words in each lesson');
  if(n%5===0)assert.ok(lesson.items.every(i=>!i.isNew),'Every fifth level is a review level');
  for(const item of lesson.items){
   if(item.isNew){assert.ok(!introduced.has(item.entry.id));introduced.add(item.entry.id)}else assert.ok(introduced.has(item.entry.id),'No unseen word in review slots');
   assert.ok(item.entry.senses[item.senseIndex].meaning);assert.equal(item.entry.senses[item.senseIndex].meaning,item.entry.senses[item.senseIndex].speechMeaning);
  }
 }
 assert.equal(introduced.size,stats.words,'All imported words eventually introduced');
 assert.deepEqual(api.lesson(bank,100),api.lesson(bank,100),'Lesson stable on restart');
 assert.ok(api.lesson(bank,stats.levels+10).items.every(i=>!i.isNew),'Reviews continue after all words introduced');
 console.log('CET-'+bank+': '+stats.words+' words / '+stats.levels+' planned levels');
}
const june=data.courses[4].find(e=>e.word==='June');assert.equal(june.senses[0].meaning,'六月');
const record=data.courses[4].find(e=>e.word==='record');assert.equal(api.spokenEnglish(record,{pos:'n.'}),'a record');assert.equal(api.spokenEnglish(record,{pos:'vt.'}),'to record');
assert.ok(record.senses.every(s=>!s.meaning.includes('人名')));
console.log('PASS: full corpus coverage, review eligibility, stable lessons, selected senses and pronunciation context.');
