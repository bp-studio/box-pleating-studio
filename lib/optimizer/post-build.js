import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const filePath = join(__dirname, 'dist_mp', 'optimizer.js');
let content = readFileSync(filePath, 'utf8');

// Remove the self-reference line
const stringToRemove = 'else worker=new Worker(new URL("optimizer.js",import.meta.url),{type:"module",name:"em-pthread-"+PThread.nextWorkerID});';

if(!content.includes(stringToRemove)) {
	throw new Error('String to remove not found in dist_mp/optimizer.js');
}

content = content.replace(stringToRemove, '');

writeFileSync(filePath, content, 'utf8');

