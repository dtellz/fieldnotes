import {renderCourse} from './course.js';
import {computerLessons,computerSources} from './computer-curriculum.js';
import {mountLab} from './computer-labs.js';

renderCourse({
  slug:'computer-systems', title:'Computer Systems & Performance', shortTitle:'Computer systems',
  theme:'computer-page', eyebrow:'Topic 03 / Software engineering',
  heading:'Computer systems.<br><span class="accent">Under the hood.</span>',
  summary:'Understand what your code asks of the machine. Then learn where the time goes.',
  intro:'<b>Follow one operation.</b> From bits and instructions to memory, the kernel, and I/O—change the mechanism and watch the consequence.',
  prereq:'Assumes basic programming: variables, loops, functions, and arrays. Start at execution, or enter where your mental model feels incomplete.',
  sidebar:'From instructions<br>to useful performance',
  goals:[
    ['Explain','Trace execution, data movement, and waiting. Distinguish the program’s guarantees from the machine’s optimizations.'],
    ['Build','Choose layouts, synchronization, and I/O patterns whose costs and failure modes you understand.'],
    ['Diagnose','Form a hypothesis from evidence. Measure the right resource, test a change, and verify end-to-end improvement.']
  ],
  lessons:computerLessons,sources:computerSources,mountLab
});
