import {renderCourse} from './course.js';
import {networkLessons,networkSources} from './network-curriculum.js';
import {mountLab} from './network-labs.js';
renderCourse({
 slug:'networking-and-the-web',title:'Networking & the Web',shortTitle:'Networking & the web',
 theme:'network-page',eyebrow:'Topic 06 / Software engineering',sourcesChecked:'8 October 2026',
 heading:'Networking & the web.<br><span class="accent">Follow the request.</span>',
 summary:'From a name to a packet, from a response to a responsive page.',
 intro:'<b>Make the journey visible.</b> Expire a DNS answer, repair a missing packet, follow an HTTP stream, and find the wait that actually matters.',
 prereq:'Assumes basic client/server applications and familiarity with a URL. No networking background required. Computer Systems, Distributed Systems, and Security Engineering connect the mechanisms to broader design choices.',
 sidebar:'From names and packets<br>to pixels and evidence',
 goals:[['Trace','Follow a request through resolution, routing, transport, intermediaries, and browser execution.'],['Choose','Reason about delivery guarantees, cache policies, live updates, and bounded streaming.'],['Diagnose','Separate setup, transfer, server work, and browser scheduling using explicit evidence.']],
 lessons:networkLessons,sources:networkSources,mountLab
});
