import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const port=Number(process.env.PORT||5173);
const root=process.cwd();
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.md':'text/markdown'};
createServer((req,res)=>{
  const u=new URL(req.url||'/',`http://localhost:${port}`);
  const requestPath=decodeURIComponent(u.pathname);
  const file=path.resolve(root,`.${requestPath==='/'?'/index.html':requestPath}`);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data)})
}).listen(port,'0.0.0.0',()=>console.log(`Prototype http://localhost:${port}`));
