import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {systemsLessons} from '../dist/assets/systems-curriculum.js';
import {topicCatalog} from '../dist/assets/catalog.js';
const root=resolve('dist');let checked=0;
const bases=['/','/fieldnotes/'];
async function checkReference(file,reference){
  if(/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference))return;
  for(const base of bases){
    const page=new URL(base+relative(root,file).split('\\').join('/'),'https://example.github.io');
    const target=new URL(reference,page);
    if(!target.pathname.startsWith(base))throw Error(`${file}: ${reference} escapes the Pages base ${base}`);
    const path=resolve(root,decodeURIComponent(target.pathname.slice(base.length)));
    if(path!==root&&!path.startsWith(root+'/'))throw Error(`Reference escapes the published directory: ${reference}`);
    const info=await stat(path);
    if(info.isDirectory())await stat(resolve(path,'index.html'));
    checked++;
  }
}
async function walk(dir){
  for(const name of await readdir(dir)){
    const p=resolve(dir,name);
    if((await stat(p)).isDirectory()){await walk(p);continue;}
    if(name.endsWith('.html')){
      const html=await readFile(p,'utf8');
      for(const [,url]of html.matchAll(/(?:src|href)="([^"]+)"/g))await checkReference(p,url);
    }else if(name.endsWith('.js')){
      const js=await readFile(p,'utf8');
      for(const [,url]of js.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g))await checkReference(p,url);
    }
  }
}
await walk(root);
const app=await readFile(resolve(root,'assets/app.js'),'utf8');
const slugs=[...app.matchAll(/^  \['([a-z]+)'/gm)].map(x=>x[1]);
for(const [,slug]of app.matchAll(/href="#([a-z]+)"/g)){if(slug!=='main'&&!slugs.includes(slug))throw Error(`Unknown chapter: ${slug}`);}
if(slugs.length!==11)throw Error('Expected eleven lesson chapters');
for(const topic of topicCatalog)await stat(resolve(root,'topics',topic.slug,'index.html'));
for(const lesson of systemsLessons)await stat(resolve(root,'topics/distributed-systems',lesson.slug,'index.html'));
const systemsCount=systemsLessons.reduce((n,l)=>n+l.chapters.length,0);
console.log(`Verified ${checked} asset/import resolutions, ${topicCatalog.length} topic routes, and ${slugs.length+systemsCount} chapters at root and repository subpaths.`);
