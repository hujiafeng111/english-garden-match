const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', process.argv[2] || 'word-garden.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const nodes = new Map();
function node() {
  return {innerHTML:'', textContent:'', style:{}, hidden:true, disabled:false,handlers:{},
    classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(name,handler){this.handlers[name]=handler},
    querySelector(){return node()},querySelectorAll(){return []},focus(){},replaceChildren(){}};
}
const document = {getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},
  querySelectorAll(){return []},addEventListener(){},activeElement:null};
const spoken=[];
const context = vm.createContext({document, window:{addEventListener(){},speechSynthesis:{cancel(){},speak(utterance){spoken.push({text:utterance.text,lang:utterance.lang})}}},
  SpeechSynthesisUtterance:function(text){this.text=text},
  localStorage:{getItem(){return null},setItem(){}},matchMedia(){return {matches:true}},
  setTimeout(fn,ms){if(ms<1000)return setTimeout(fn,0);return 0},clearTimeout,
  console, Math});
vm.runInContext(script + `\nwindow.checks={freshGrid,runs,possibleMove,swap,expandSpecials,collapse,start,readEliminatedGroups,
  get grid(){return grid},set grid(value){grid=value},get moves(){return moves},
  get collected(){return collected},get busy(){return busy},get finished(){return finished},
  get saved(){return saved},setGoal(value){goal=value}};`, context);
const game=context.window.checks;
(async()=>{
  for(let i=0;i<150;i++){
    game.freshGrid();assert.equal(game.runs().length,0,'Opening board must have no existing matches');
    assert.ok(game.possibleMove(),'Opening board must have a legal move');
    assert.equal(game.grid.length,36);
  }
  game.start();game.setGoal(10000);
  let invalid;
  for(let i=0;i<35&&!invalid;i++){
    if(i%6===5)continue;
    [game.grid[i],game.grid[i+1]]=[game.grid[i+1],game.grid[i]];
    const hasMatch=game.runs().length;
    [game.grid[i],game.grid[i+1]]=[game.grid[i+1],game.grid[i]];
    if(!hasMatch)invalid=[i,i+1];
  }
  assert.ok(invalid);
  const before=JSON.stringify(game.grid),movesBefore=game.moves;
  await game.swap(...invalid);
  assert.equal(game.moves,movesBefore,'Invalid swaps must not cost moves');
  assert.equal(JSON.stringify(game.grid),before,'Invalid swaps must restore the board');
  for(let i=0;i<15;i++){
    game.start();game.setGoal(10000);
    const move=game.possibleMove();await game.swap(...move);
    assert.equal(game.moves,17,'Legal swaps cost exactly one move');
    assert.ok(game.collected>=3,'Legal swaps collect petals');
    assert.equal(game.busy,false,'Resolution must unlock interaction');
    assert.equal(game.runs().length,0,'Cascades must settle');
    assert.ok(game.grid.every(Boolean),'Refill must fill every cell');
    assert.ok(game.possibleMove(),'Settled board must remain playable');
  }
  game.start();game.grid[0].special='row';
  assert.ok(spoken.length>0,'Legal elimination automatically pronounces');
  assert.equal(spoken.length%2,0,'Each word queues an English and Chinese pair');
  for(let i=0;i<spoken.length;i+=2){assert.equal(spoken[i].lang,'en-US');assert.equal(spoken[i+1].lang,'zh-CN');}
  game.setGoal(10000);await game.swap(...game.possibleMove());
  assert.equal(nodes.get('word-rewards').hidden,false,'Successful elimination reveals word rewards');
  assert.match(nodes.get('word-rewards').innerHTML,/<small>[^<]+<\/small>/,'Rewards include meanings');
  assert.match(nodes.get('word-rewards').innerHTML,/data-read-type=/,'Each word includes a pronunciation button');
  const beforeReplay=spoken.length;
  nodes.get('sound').handlers.click();
  assert.equal(spoken.length,beforeReplay+2,'Manual replay queues English and Chinese');
  assert.ok(nodes.get('word-rewards').innerHTML.includes(spoken[beforeReplay].text),'Pronunciation refers to a displayed eliminated word');
  await game.swap(...game.possibleMove());
  assert.ok(spoken.length>beforeReplay+2,'Following eliminations also automatically pronounce');
  game.start();assert.equal(nodes.get('word-rewards').hidden,true,'Restart clears previous word rewards');
  assert.equal(nodes.get('sound').disabled,true,'No stale pronunciation remains after restart');
  game.grid[0].special='row';
  assert.equal(game.expandSpecials([0]).size,6,'Rocket clears a complete row');
  game.grid[3].special='column';
  assert.equal(game.expandSpecials([0]).size,11,'Hit rockets trigger each other');
  game.start();game.grid[0].special='rainbow';
  const target=game.grid[1].type;
  const expected=new Set([0]);game.grid.forEach((tile,i)=>{if(tile.type===target)expected.add(i)});
  assert.equal(game.expandSpecials([0],target).size,expected.size,'Rainbow clears the target type');
  game.start();game.setGoal(1);await game.swap(...game.possibleMove());
  assert.equal(game.finished,true,'Goal completion must finish the round');
  assert.equal(game.saved.completed,1,'Victory advances progress');
  assert.equal(game.saved.seeds,5,'Victory awards five seeds');
  const saved=JSON.stringify(game.saved);await game.swap(0,1);
  assert.equal(JSON.stringify(game.saved),saved,'Finished board cannot award rewards again');
  game.start();game.grid.forEach(tile=>tile.type=0);
  let baseline=spoken.length;
  game.readEliminatedGroups([{type:0,indices:[0,1,2]},{type:0,indices:[2,8,14]}],new Set([0,1,2,8,14]));
  assert.equal(spoken.length,baseline+2,'Overlapping cross is narrated as a single group');
  baseline=spoken.length;
  game.readEliminatedGroups([{type:0,indices:[0,1,2]},{type:0,indices:[12,13,14]}],new Set([0,1,2,12,13,14]));
  assert.equal(spoken.length,baseline+4,'Independent groups are each narrated even with the same word');
  console.log('PASS: gameplay, rewards, per-group English then Chinese, cascades, overlapping groups and manual replay.');
})().catch(error=>{console.error(error);process.exitCode=1});
