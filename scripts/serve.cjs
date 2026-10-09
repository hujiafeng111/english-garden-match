const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{let file;try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file===root)file=path.join(root,'index.html');if(!file.startsWith(root+path.sep))throw Error('Invalid path');const content=fs.readFileSync(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(content)}catch{res.writeHead(404);res.end('Not found')}});
server.listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log('http://127.0.0.1:'+(server.address().port)));
