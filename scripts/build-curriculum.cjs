const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),context=vm.createContext({window:{},console});
for(const file of ['vocabulary-data.js','word-curriculum.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const api=context.window.WordCurriculum,data=context.window.CET_VOCABULARY,out={version:data.version,courses:{}};
for(const bank of [4,6]){
 const indices=new Map(data.courses[bank].map((e,i)=>[e.id,i]));
 out.courses[bank]=Array.from({length:api.stats(bank).levels},(_,i)=>api.lesson(bank,i+1).items.map(item=>[indices.get(item.entry.id),item.senseIndex,item.isNew?1:0]));
 console.log('Prebuilt CET-'+bank+': '+out.courses[bank].length+' levels');
}
fs.writeFileSync(path.join(root,'curriculum-plan.js'),'window.CET_PLANS='+JSON.stringify(out)+';\n');
