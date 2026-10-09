if('serviceWorker' in navigator&&['http:','https:'].includes(location.protocol)){
 window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
let installPrompt;
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();installPrompt=event;
 let button=document.getElementById('install-app');
 if(!button){button=document.createElement('button');button.id='install-app';button.className='option';button.textContent='安装到本机';document.querySelector('.options')?.append(button);
 button.addEventListener('click',async()=>{if(!installPrompt)return;await installPrompt.prompt();const result=await installPrompt.userChoice;if(result.outcome==='accepted')button.hidden=true;installPrompt=null});}
});
window.addEventListener('appinstalled',()=>{const button=document.getElementById('install-app');if(button)button.hidden=true});
if(/iPad|iPhone|iPod/.test(navigator.userAgent)&&!navigator.standalone&&!matchMedia('(display-mode: standalone)').matches){
 const button=document.createElement('button');button.className='option';button.textContent='安装到 iPhone';
 button.addEventListener('click',()=>{
  let dialog=document.getElementById('ios-install');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='ios-install';dialog.className='dialog';dialog.style.border='1px solid #d3d7b8';dialog.innerHTML='<h2>把花园放到主屏幕</h2><p>在 Safari 中打开当前网页，点击分享按钮，选择「添加到主屏幕」，再点击「添加」。</p><p>以后点击主屏幕的花园图标，就能独立打开游戏。首次联网加载完成后，可离线打开页面。</p><button class="primary">知道了</button>';dialog.querySelector('button').onclick=()=>dialog.close();document.body.append(dialog)}
  dialog.showModal();
 });document.querySelector('.options')?.append(button);
}
