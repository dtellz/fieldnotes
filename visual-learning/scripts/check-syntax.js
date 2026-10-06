import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
let checked=0;
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=resolve(dir,entry.name);if(entry.isDirectory())await walk(path);else if(entry.name.endsWith('.js')){const r=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});if(r.status!==0){process.stderr.write(r.stderr);process.exit(r.status||1);}checked++;}}}
await walk('dist/assets');console.log(`JavaScript syntax verified for ${checked} modules.`);
