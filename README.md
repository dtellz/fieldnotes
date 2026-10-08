<p align="center">
  <a href="https://dtellz.github.io/fieldnotes/">
    <img src="assets/readme/fieldnotes-header.png" alt="An open field notebook unfolds into a constellation of scientific instruments, classical art, mathematical forms, and connected ideas." width="960">
  </a>
</p>

<p align="center">
  <a href="https://dtellz.github.io/fieldnotes/">
    <img src="https://img.shields.io/website?url=https%3A%2F%2Fdtellz.github.io%2Ffieldnotes%2F&amp;label=site&amp;up_message=up&amp;down_message=down&amp;up_color=c5f277&amp;down_color=e57373&amp;labelColor=202326&amp;style=flat-square" alt="Fieldnotes website availability: up or down">
  </a>
</p>

# Fieldnotes

**A visual learning site for erudites: people who want to understand many things deeply.**

Fieldnotes is a growing collection of interactive lessons for the broadly curious. Its ambition spans science, mathematics, technology, history, philosophy, and the arts. Each lesson offers a focused path into a difficult idea, with enough depth to explain how it works and enough context to connect it to other knowledge.

Erudition here is a practice: follow your curiosity, examine the evidence, revise your understanding, and keep making connections. No one needs to arrive as an expert.

## Understanding through exploration

The goal is to build knowledge you can reason with. A good lesson should leave you able to explain a mechanism, predict what changes when its assumptions change, and recognize where your understanding ends.

Interactive diagrams make relationships visible. Experiments let you change a variable and observe the consequences. Concise explanations give those observations meaning, while optional derivations and primary sources let you go further.

The collection is organized by **topic → lesson → experiment**, so each subject has a clear home and each lesson can be explored at its own pace.

## What every lesson should offer

- **A clear mental model.** Build from essential ideas toward the relationships that make a subject interesting.
- **Purposeful interaction.** Use controls and diagrams to reveal something that would be harder to understand from prose alone.
- **Concise depth.** Make every sentence earn its place; keep the reasoning needed to understand the idea intact.
- **Intellectual honesty.** Cite sources, identify simplifications, and distinguish established knowledge from interpretation and uncertainty.
- **Connections worth keeping.** Show how the lesson relates to broader ideas and give the learner a way to test their understanding.

## Explore the collection

| Topic | Lessons | What you will understand |
| --- | --- | --- |
| AI & Deep Learning | [Inside the transformer](visual-learning/dist/topics/ai/transformers/index.html) | How tokens become representations, how attention moves information, how models learn, and how modern architectures manage memory and computation. |
| Distributed Systems | [Eight-lesson learning path](https://dtellz.github.io/fieldnotes/topics/distributed-systems/) | How to design around partial failure, preserve data invariants, distribute work, and operate reliable systems. |
| Computer Systems & Performance | [Six-lesson learning path](https://dtellz.github.io/fieldnotes/topics/computer-systems/) | How code executes, data moves, concurrent work stays correct, and measurements reveal what limits performance. |
| Database Internals | [Six-lesson learning path](https://dtellz.github.io/fieldnotes/topics/database-internals/) | How storage, indexes, query execution, transactions, and recovery turn bytes into trustworthy results. |
| Security Engineering | [Seven-lesson learning path](https://dtellz.github.io/fieldnotes/topics/security-engineering/) | How trust boundaries, identity, permission, data protection, and secure operations preserve a system’s guarantees. |
| Networking & the Web | [Seven-lesson learning path](https://dtellz.github.io/fieldnotes/topics/networking-and-the-web/) | How names resolve, packets travel, protocols deliver data, and browsers turn responses into responsive pages. |

The transformer lesson contains eleven interactive chapters. Distributed Systems adds **32 experiments and 32 scenario questions** across eight lessons:

1. **The rules of the network** — request paths, queues, clocks, and partitions.
2. **Copies that agree** — consistency, quorums, consensus, and conflicts.
3. **Data that survives change** — durability, isolation, transactions, and schema evolution.
4. **Where the work goes** — partitioning, skew, caching, and regions.
5. **Work that crosses boundaries** — delivery, outboxes, streams, and workflows.
6. **Services that fail gracefully** — deadlines, retries, overload, and API contracts.
7. **Operate the promise** — SLOs, observability, releases, and recovery.
8. **Make the trade-offs explicit** — capacity estimates, architecture examples, security, and decisions.

Computer Systems & Performance adds **24 experiments and 24 scenario questions** across six lessons:

1. **From code to execution** — bits, instruction dependencies, branch prediction, and parallel speedup.
2. **Make data cheap to reach** — cache traversal, false sharing, bandwidth limits, and allocation versus retention.
3. **The operating system mediates** — processes, scheduling, virtual memory, and container budgets.
4. **Make concurrent work correct** — lost updates, deadlocks, memory ordering, and task lifetimes.
5. **Move bytes without losing control** — batching, durability, event loops, and network windows.
6. **Measure before you optimize** — profiles, tail latency, benchmark bias, and evidence-led diagnosis.

Database Internals adds **24 experiments and 24 scenario questions** across six lessons:

1. **Rows become pages** — slotted pages, buffer pools, row/column layouts, and compression.
2. **Find data without scanning it all** — B+ trees, composite indexes, LSM trees, and Bloom filters.
3. **Turn SQL into physical work** — estimates, joins, sort spills, and pagination.
4. **Give concurrent work a meaning** — snapshots, write skew, locks, and constraints.
5. **Survive the interrupted write** — WAL, checkpoints, redo, and point-in-time recovery.
6. **Keep the engine healthy** — vacuum, compaction, partition pruning, and query investigation.

Security Engineering adds **28 experiments and 28 scenario questions** across seven lessons:

1. **Start with what must remain true** — assets, trust boundaries, least privilege, and independent attack paths.
2. **Establish and preserve identity** — password storage, passkeys, sessions, and federated sign-in.
3. **Decide who may do what** — object authorization, tenant isolation, policies, and token validation.
4. **Keep untrusted data in its lane** — injection, XSS, CSRF/CORS, and server-side fetching.
5. **Protect data through its lifecycle** — TLS, authenticated encryption, envelope rotation, and retention.
6. **Ship software with bounded authority** — provenance, exposed secrets, runtime hardening, and negative tests.
7. **Detect, contain, and learn** — abuse budgets, audit evidence, incident response, and diagnosis.

Networking & the Web adds **28 experiments and 28 scenario questions** across seven lessons:

1. **Find the destination, cross the network** — packet envelopes, routing prefixes, DNS caches, and path MTU.
2. **Deliver bytes without overrunning the path** — loss, ordering, flow control, congestion, and connection reuse.
3. **Give the exchange a protocol** — HTTPS handshakes, HTTP/2 and HTTP/3 streams, methods, and validators.
4. **Put intermediaries to work** — proxy trust, load distribution, cache freshness, and representation keys.
5. **Turn responses into a responsive page** — origins, rendering dependencies, task scheduling, and offline caches.
6. **Choose how information moves** — redirects, compression, live updates, and stream backpressure.
7. **Explain where the time went** — waterfalls, bandwidth-delay limits, deadlines, and evidence-led diagnosis.

Each experiment makes its assumptions visible, links to primary sources, and offers optional deeper explanations. Further disciplines will grow from the same ambition: breadth supported by depth.

## Growing the library

New lessons should begin with a question worth understanding and an interaction that helps answer it. Choose a scope small enough to explain carefully, name the prerequisites, and give readers a path toward deeper study.

The website lives in [`visual-learning/`](visual-learning/README.md). Its project guide describes the structure and how to add topics and lessons. Publishable content belongs in `visual-learning/dist/`; add each new lesson to the collection index so readers can find it.

## Run locally

With Node.js and Python 3 available, no package installation or build step is needed:

```sh
cd visual-learning
npm start
```

Open http://127.0.0.1:4173. Run `npm run check` from the same folder to validate JavaScript, numerical examples, and site links.
