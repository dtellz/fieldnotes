import {renderCourse} from './course.js';
import {databaseLessons,databaseSources} from './database-curriculum.js';
import {mountLab} from './database-labs.js';
renderCourse({
 slug:'database-internals',title:'Database Internals',shortTitle:'Database internals',
 theme:'database-page',eyebrow:'Topic 04 / Software engineering',
 heading:'Database internals.<br><span class="accent">Below the query.</span>',
 summary:'Follow a row from storage to a result—and through the failures in between.',
 intro:'<b>Make the hidden work visible.</b> Split an index, inspect a plan, interleave transactions, and recover the data after a crash.',
 prereq:'Assumes basic SQL: SELECT, WHERE, JOIN, INSERT, and UPDATE. Computer Systems & Performance provides useful background on memory and I/O.',
 sidebar:'From stored bytes<br>to trustworthy results',
 goals:[
  ['Explain','Trace a query through pages, indexes, physical operators, and visible row versions.'],
  ['Design','Choose access paths and transaction boundaries that protect the workload’s invariants.'],
  ['Operate','Read execution evidence, budget maintenance, and prove the recovery path before relying on it.']
 ],
 lessons:databaseLessons,sources:databaseSources,mountLab
});
