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

The transformer lesson contains eleven interactive chapters. Distributed Systems adds **32 experiments and 32 scenario questions** across eight lessons:

1. **The rules of the network** — request paths, queues, clocks, and partitions.
2. **Copies that agree** — consistency, quorums, consensus, and conflicts.
3. **Data that survives change** — durability, isolation, transactions, and schema evolution.
4. **Where the work goes** — partitioning, skew, caching, and regions.
5. **Work that crosses boundaries** — delivery, outboxes, streams, and workflows.
6. **Services that fail gracefully** — deadlines, retries, overload, and API contracts.
7. **Operate the promise** — SLOs, observability, releases, and recovery.
8. **Make the trade-offs explicit** — capacity estimates, architecture examples, security, and decisions.

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
