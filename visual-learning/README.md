# Fieldnotes

A visual learning library for erudites and curious generalists, built around interactive explanations that support deep understanding across disciplines. Read the [project's purpose and lesson principles](../README.md) for the direction of the collection.

The collection includes **AI & Deep Learning** with eleven transformer chapters, and **Distributed Systems** with eight lessons and 32 experiments covering foundations, coordination, data, scaling, messaging, resilience, operations, and architecture. It also includes **Computer Systems & Performance**, with six lessons and 24 experiments covering execution, memory, operating systems, concurrency, I/O, and diagnosis. **Database Internals** adds six lessons and 24 experiments on storage, indexes, physical query execution, transactions, recovery, and maintenance. **Security Engineering** adds seven lessons and 28 experiments on security design, identity, authorization, application boundaries, data protection, delivery, and operations. **Networking & the Web** adds seven lessons and 28 experiments on names and routes, transport, HTTP, intermediaries, browsers, delivery patterns, and diagnosis. This directory contains the website and its supporting checks.

## Content and sources

Primary sources are linked within the lesson and collected in its final chapter. Research was checked on **6 October 2026**, including Qwen3.5, DeepSeek-V4, and the September DeepSeek-V4.1-Flash announcement. These are selected published examples, not an exhaustive ranking of frontier models; undisclosed proprietary internals are not inferred.

Experiments use small illustrative vectors and parameters. The attention, softmax, rotary rotations, gradient updates, routing, and cache calculations are real; the examples are not extracted from a pretrained language model. Generation uses a labeled toy transition model to demonstrate feedback and sampling. Architecture schematics omit implementation details.

Distributed-systems experiments use explicit, small models: fixed replica membership, selected failure windows, queueing assumptions, and synthetic workloads. They are teaching tools rather than protocol implementations or production benchmarks. Each chapter includes its model scope, a scenario question, deeper reasoning, and primary sources such as the Raft paper, PostgreSQL documentation, Kafka design documentation, and Google's SRE books.

Computer-systems experiments use deterministic teaching models, not browser benchmarks or measurements of your hardware. They expose dependencies, LRU cache state, lock ownership, task lifetimes, and explicit performance budgets. Every chapter includes a question, expandable depth, and primary sources from architecture research, OSTEP, platform documentation, and performance-tool authors.

Database experiments use explicit miniature models: actual B+ tree insertion/splits, immutable LSM runs, probabilistic membership hints, snapshot timelines, write-ahead ordering, and idempotent redo. PostgreSQL, RocksDB, and DuckDB sources are linked where their behavior is discussed; the models do not claim to implement those engines or run SQL.

Security experiments use explicit policy and lifecycle models: inspect tenant leakage, compare browser send/read decisions, migrate key envelopes, revoke credentials, and stage incident recovery. They do not execute attack payloads, send network requests, or implement cryptographic primitives. OWASP, IETF, W3C, OpenID, SLSA, and NIST sources support the explanations.

Networking experiments use fixed packet paths, explicit cache state, byte-window arithmetic, dependency timelines, and bounded queue models. They do not probe networks, register service workers, modify browser caches, or benchmark the learner’s connection. Protocol sources come from IETF RFCs; browser and platform behavior links to MDN and NGINX documentation. Networking sources were checked on **8 October 2026**.

## Layout

```text
dist/
  index.html                       Topic index
  topics/ai/index.html             AI & Deep Learning lessons
  topics/ai/transformers/index.html First lesson
  topics/distributed-systems/       Topic index and eight lesson directories
  topics/computer-systems/          Topic index and six lesson directories
  topics/database-internals/        Topic index and six lesson directories
  topics/security-engineering/     Topic index and seven lesson directories
  assets/security.js               Security course configuration
  assets/security-curriculum.js    28 chapters, questions, and primary sources
  assets/security-labs.js          Interactive boundary and lifecycle diagrams
  assets/security-models.js        Policy decisions and state models
  assets/security.css              Security diagrams and responsive layout
  topics/networking-and-the-web/   Topic index and seven lesson directories
  assets/network.js                Networking course configuration
  assets/network-curriculum.js     28 chapters, questions, and sources
  assets/network-labs.js           Packet, stream, cache, and browser diagrams
  assets/network-models.js         Deterministic network and scheduling models
  assets/network.css               Networking diagrams and responsive layout
  assets/catalog.js                Shared topic index
  assets/app.js                    Transformer lesson and AI navigation
  assets/math.js                   Transformer numerical models
  assets/systems.js                Distributed-systems navigation and lesson shell
  assets/systems-curriculum.js     Lesson content, questions, and sources
  assets/systems-labs.js           32 interactive experiments
  assets/systems-models.js         Distributed-systems numerical/state models
  assets/computer.js               Computer-systems course configuration
  assets/computer-curriculum.js    24 chapters, questions, and primary sources
  assets/computer-labs.js          Stateful experiments
  assets/computer-models.js        Execution, memory, concurrency, and timing models
  assets/computer-ui.js            Diagram primitives
  assets/database.js               Database course configuration
  assets/database-curriculum.js    24 chapters, questions, and primary sources
  assets/database-labs.js          Database diagrams and stateful experiments
  assets/database-models.js        Storage, index, query, and recovery models
  assets/database.css              Database diagrams and responsive layout
  assets/course.js                 Reusable topic/lesson navigation shell
  assets/experiment-ui.js          Shared experiment controls and reset lifecycle
  assets/computer.css              Computer-systems diagrams and responsive layout
  assets/style.css                 Shared dark visual system
  assets/systems.css               Distributed-systems diagrams and layout
```

Each chapter has a linkable URL fragment, e.g. `/topics/ai/transformers/#attention`. Topic and lesson routes are real directories, so direct links work on a basic static server. Source files live directly in `dist/`; it is not generated output.

## Extending the collection

Add a folder under `dist/topics/` for each topic and a nested folder for each lesson. Reuse the stylesheet and page shell. Register the topic in `topicCatalog` in `assets/catalog.js` and provide its index and lesson entry points.

For Distributed Systems, add lesson metadata and chapters to `systemsLessons` in `systems-curriculum.js`, create the matching lesson `index.html`, and register any new experiment in `systems-labs.js`. Each chapter names its experiment, sources, and answer explanation. The topic cards and sequential lesson navigation are derived from this registry. The transformer chapter registry remains `chapters` in `app.js`, with renderers in `renderers`.

For Computer Systems & Performance, add metadata to `computerLessons` in `computer-curriculum.js`, register the experiment in `computer-labs.js`, and add a matching lesson `index.html`. `computer.js` configures the reusable `course.js` shell; `experiment-ui.js` supplies controls and resets for both systems topics. Keep calculations in the model modules and test the guarantees the diagrams teach. Topic and experiment counts are derived from the curriculum.

For Database Internals, add chapters to `databaseLessons` in `database-curriculum.js`, register their experiments in `database-labs.js`, and create matching lesson directories. The course reuses `course.js`, `experiment-ui.js`, and the diagram helpers and styles in `computer-ui.js`/`computer.css`. Preserve explicit model assumptions, test invariants in `tests/database.test.js`, and register new course routes in `scripts/check-links.js`.

For Security Engineering, add chapters to `securityLessons` in `security-curriculum.js`, register experiments in `security-labs.js`, and create matching lesson directories. Keep policy semantics explicit, cover acceptance and rejection boundaries in `tests/security.test.js`, and include routes in `scripts/check-links.js`. Displayed code examples must remain escaped inert text; use established cryptographic contracts rather than invented implementations.

For Networking & the Web, add chapters to `networkLessons` in `network-curriculum.js`, register experiments in `network-labs.js`, and create their lesson directories. Preserve explicit protocol assumptions and units, test invariants in `tests/network.test.js`, and include routes in `scripts/check-links.js`. Set `sourcesChecked` in the course configuration when verifying new course sources; existing courses retain their recorded date.

## Automatic publishing

The repository's [GitHub Actions workflow](../.github/workflows/pages.yml) publishes this entire `dist/` folder after successful checks on every push to the default branch. Future topics, lessons, and assets inside `dist/` are included automatically. The repository’s Pages source must be set to **GitHub Actions** in Settings → Pages. Changes can take a little time to propagate after a successful deployment.

Keep asset references relative. The application derives its navigation base from the script URL, so it works at both `/` and `/<repository>/` without a hard-coded repository name. Every new lesson should have its own `index.html` for direct links to work on Pages.

## Run locally and check changes

With Node.js and Python 3 available, no package installation or build step is needed. From this folder:

```sh
npm start
```

Open **http://127.0.0.1:4173**. Alternatively, serve `dist/` with any static HTTP server. Use HTTP rather than double-clicking the HTML: the application uses JavaScript modules.

To validate changes:

```sh
npm run check
```

Runs syntax validation for every asset module, mathematical, execution, memory, concurrency, database, security-policy, networking, and distributed-state invariant tests, and local asset/chapter link checks at root and repository subpaths. Also review changed lessons in a browser, including keyboard controls, small-screen diagrams, and reduced-motion behavior.

No API keys, backend, analytics, or runtime package dependencies. Google Fonts is optional; system fallbacks work when unavailable. The workflow handles publishing after the GitHub repository is connected and Pages is enabled.
