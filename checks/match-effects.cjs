const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/');await page.locator('#entry-cet4').click();
 const move=await page.evaluate(()=>possibleMove());await page.locator('[data-index="'+move[0]+'"]').click();await page.locator('[data-index="'+move[1]+'"]').click();
 await page.locator('.match-petal').first().waitFor();assert.ok(await page.locator('.match-lit').count()>=3);assert.ok(await page.locator('.match-link').count()>0);
 assert.ok(await page.locator('.match-flight').count()<=6);await page.screenshot({path:path.join(__dirname,'../preview/match-effects-mobile.png')});
 await page.waitForFunction(()=>!busy);assert.ok(await page.evaluate(()=>collected)>0);await page.waitForTimeout(1100);assert.equal(await page.locator('#particles > *').count(),0);
 await page.evaluate(()=>particles(new Set([0,1,2]),[{indices:[0,1,2]}],3,0));assert.equal(await page.locator('.match-score b').textContent(),'连消 ×3');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>particles(new Set([0,1,2]),[{indices:[0,1,2]}],1,0));assert.equal(await page.locator('#particles > *').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: match location effects, bounded reward flights, cleanup, combo label, mobile width and reduced motion.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
