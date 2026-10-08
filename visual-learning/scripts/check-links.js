import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {networkLessons} from '../dist/assets/network-curriculum.js';
import {systemsLessons} from '../dist/assets/systems-curriculum.js';
import {computerLessons} from '../dist/assets/computer-curriculum.js';
import {securityLessons} from '../dist/assets/security-curriculum.js';
import {databaseLessons} from '../dist/assets/database-curriculum.js';
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
for(const topic of topicCatalog){
  await stat(resolve(root,'topics',topic.slug,'index.html'));
  await stat(resolve(root,'topics',topic.slug,topic.first,'index.html'));
}
const courses=[['distributed-systems',systemsLessons],['computer-systems',computerLessons],['database-internals',databaseLessons],['security-engineering',securityLessons],['networking-and-the-web',networkLessons]];
for(const [slug,lessons] of courses){
  const topic=topicCatalog.find(t=>t.slug===slug);
  if(topic?.count!==lessons.length)throw Error(`Catalog lesson count differs for ${slug}`);
  if(topic.experiments!==lessons.reduce((n,l)=>n+l.chapters.length,0))throw Error(`Catalog experiment count differs for ${slug}`);
  for(const lesson of lessons){
    const file=resolve(root,'topics',slug,lesson.slug,'index.html');
    await stat(file);
    // Exercise the same topic → lesson → chapter URLs rendered by the course shells.
    for(const chapter of lesson.chapters)await checkReference(resolve(root,'index.html'),`topics/${slug}/${lesson.slug}/#${chapter.id}`);
  }
}
const courseChapters=courses.flatMap(([,lessons])=>lessons.flatMap(l=>l.chapters)).length;
console.log(`Verified ${checked} asset/import/lesson resolutions, ${topicCatalog.length} topic routes, and ${slugs.length+courseChapters} chapters at root and repository subpaths.`);
