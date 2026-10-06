import {renderCourse} from './course.js';
import {securityLessons,securitySources} from './security-curriculum.js';
import {mountLab} from './security-labs.js';
renderCourse({
 slug:'security-engineering',title:'Security Engineering',shortTitle:'Security engineering',
 theme:'security-page',eyebrow:'Topic 05 / Software engineering',
 heading:'Security engineering.<br><span class="accent">Protect the promise.</span>',
 summary:'Trace authority, constrain its reach, and test what happens when trust fails.',
 intro:'<b>Make the boundary visible.</b> Follow a login, cross a tenant boundary, rotate an exposed credential, and work through a recovery.',
 prereq:'Assumes basic web applications, HTTP requests, and database queries. Distributed Systems and Database Internals provide useful context for invariants and failure.',
 sidebar:'From trustworthy identity<br>to trustworthy recovery',
 goals:[['Model','Name the asset, the unacceptable outcome, and every path across its trust boundaries.'],['Enforce','Separate identity, permission, data interpretation, and cryptographic guarantees.'],['Verify','Exercise denied paths, inspect evidence, and restore trust after a compromise.']],
 lessons:securityLessons,sources:securitySources,mountLab
});
