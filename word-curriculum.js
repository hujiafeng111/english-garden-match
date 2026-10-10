(function(){
 'use strict';
 const data=window.CET_VOCABULARY,plans={};
 function hash(text){let n=2166136261;for(const c of text)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0}
 function similar(a,b){a=a.toLowerCase();b=b.toLowerCase();if(Math.abs(a.length-b.length)>1)return false;let d=0,i=0,j=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue}if(++d>1)return false;if(a.length>=b.length)i++;if(a.length<=b.length)j++}return d+(i<a.length||j<b.length?1:0)<=1}
 function build(bank){
  const warm=bank===4?'learn study work time need help create effort change develop support improve health travel culture future family nature':'achieve sustain resource impact assess approach benefit research evidence maintain contrast contribute';
  const ranks=new Map(warm.split(' ').map((w,i)=>[w,i]));
  const queue=[...data.courses[bank]].sort((a,b)=>{
   const ra=ranks.get(a.word.toLowerCase()),rb=ranks.get(b.word.toLowerCase());
   if(ra!==undefined||rb!==undefined)return (ra??999)-(rb??999);
   const ease=w=>/^[a-z]+$/.test(w)?Math.min(4,Math.floor(w.length/3)):5;
   return ease(a.word)-ease(b.word)||hash(a.id)-hash(b.id);
  });
  const seen=[],usage=new Map(),last=new Map(),result=[];
  for(let level=1;queue.length;level++){
   const chosen=[],review=level%5===0&&seen.length>=6,wanted=review?0:level<=3?6:4;
   for(let k=0;k<wanted&&queue.length;k++){
    let index=queue.findIndex(e=>!chosen.some(p=>similar(p.word,e.word)));if(index<0)index=0;
    const entry=queue.splice(index,1)[0];chosen.push(entry);
   }
   const fresh=new Set(chosen.map(e=>e.id));
   const candidates=[...seen].sort((a,b)=>(usage.get(a.id)||0)-(usage.get(b.id)||0)||(last.get(a.id)||0)-(last.get(b.id)||0)||hash(a.id)-hash(b.id));
   while(chosen.length<6&&candidates.length){let index=candidates.findIndex(e=>!chosen.some(p=>similar(p.word,e.word)));if(index<0)index=0;chosen.push(candidates.splice(index,1)[0])}
   if(chosen.length!==6)throw Error('A lesson must contain six different words');
   result.push({kind:review?'review':'mixed',items:chosen.map(e=>{const uses=usage.get(e.id)||0;const senseIndex=Math.floor(uses/2)%e.senses.length;usage.set(e.id,uses+1);last.set(e.id,level);return {entry:e,senseIndex,isNew:fresh.has(e.id)}})});
   for(const entry of chosen)if(fresh.has(entry.id))seen.push(entry);
  }
  return result;
 }
 function lesson(bank,level){
  if(window.CET_PLANS?.version===data.version){const p=window.CET_PLANS.courses[bank];if(level<=p.length){const items=p[Math.max(0,level-1)].map(([index,senseIndex,isNew])=>({entry:data.courses[bank][index],senseIndex,isNew:Boolean(isNew)}));return {kind:items.every(i=>!i.isNew)?'review':'mixed',items}}return extraReview(bank,level-p.length)}
  if(!plans[bank])plans[bank]=build(bank);const plan=plans[bank];
  if(level<=plan.length)return plan[Math.max(0,level-1)];
  return extraReview(bank,level-plan.length);
 }
 function extraReview(bank,reviewLevel){
  const entries=data.courses[bank],offset=(reviewLevel-1)*6;
  return {kind:'review',items:Array.from({length:6},(_,i)=>{const entry=entries[(offset+i)%entries.length],cycle=Math.floor((offset+i)/entries.length);return {entry,isNew:false,senseIndex:cycle%entry.senses.length}})};
 }
 function stats(bank){if(window.CET_PLANS?.version===data.version)return {words:data.courses[bank].length,levels:window.CET_PLANS.courses[bank].length};if(!plans[bank])plans[bank]=build(bank);return {words:data.courses[bank].length,levels:plans[bank].length}}
 function spokenEnglish(entry,sense){
  const contexts={record:['a record','to record'],present:['a present','to present'],object:['an object','to object'],produce:['fresh produce','to produce'],refuse:['household refuse','to refuse'],conduct:['good conduct','to conduct'],permit:['a permit','to permit'],contract:['a contract','to contract'],export:['an export','to export'],import:['an import','to import'],increase:['an increase','to increase'],decrease:['a decrease','to decrease'],protest:['a protest','to protest'],progress:['steady progress','to progress']};
  const pair=contexts[entry.word.toLowerCase()];return pair?(sense.pos==='n.'?pair[0]:/^v/.test(sense.pos)?pair[1]:entry.word):entry.word;
 }
 window.WordCurriculum={lesson,stats,spokenEnglish,version:data.version};
})();
