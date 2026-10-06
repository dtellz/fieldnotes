# Fieldnotes

A visual learning library for erudites and curious generalists, built around interactive explanations that support deep understanding across disciplines. Read the [project's purpose and lesson principles](../README.md) for the direction of the collection.

The collection includes **AI & Deep Learning** with eleven transformer chapters, and **Distributed Systems** with eight lessons and 32 experiments covering foundations, coordination, data, scaling, messaging, resilience, operations, and architecture. This directory contains the website and its supporting checks.

## Content and sources

Primary sources are linked within the lesson and collected in its final chapter. Research was checked on **6 October 2026**, including Qwen3.5, DeepSeek-V4, and the September DeepSeek-V4.1-Flash announcement. These are selected published examples, not an exhaustive ranking of frontier models; undisclosed proprietary internals are not inferred.

Experiments use small illustrative vectors and parameters. The attention, softmax, rotary rotations, gradient updates, routing, and cache calculations are real; the examples are not extracted from a pretrained language model. Generation uses a labeled toy transition model to demonstrate feedback and sampling. Architecture schematics omit implementation details.

Distributed-systems experiments use explicit, small models: fixed replica membership, selected failure windows, queueing assumptions, and synthetic workloads. They are teaching tools rather than protocol implementations or production benchmarks. Each chapter includes its model scope, a scenario question, deeper reasoning, and primary sources such as the Raft paper, PostgreSQL documentation, Kafka design documentation, and Google's SRE books.

## Layout

```text
dist/
  index.html                       Topic index
  topics/ai/index.html             AI & Deep Learning lessons
  topics/ai/transformers/index.html First lesson
  topics/distributed-systems/       Topic index and eight lesson directories
  assets/catalog.js                Shared topic index
  assets/app.js                    Transformer lesson and AI navigation
  assets/math.js                   Transformer numerical models
  assets/systems.js                Distributed-systems navigation and lesson shell
  assets/systems-curriculum.js     Lesson content, questions, and sources
  assets/systems-labs.js           32 interactive experiments
  assets/systems-models.js         Distributed-systems numerical/state models
  assets/style.css                 Shared dark visual system
  assets/systems.css               Distributed-systems diagrams and layout
```

Each chapter has a linkable URL fragment, e.g. `/topics/ai/transformers/#attention`. Topic and lesson routes are real directories, so direct links work on a basic static server. Source files live directly in `dist/`; it is not generated output.

## Extending the collection

Add a folder under `dist/topics/` for each topic and a nested folder for each lesson. Reuse the stylesheet and page shell. Register the topic in `topicCatalog` in `assets/catalog.js` and provide its index and lesson entry points.

For Distributed Systems, add lesson metadata and chapters to `systemsLessons` in `systems-curriculum.js`, create the matching lesson `index.html`, and register any new experiment in `systems-labs.js`. Each chapter names its experiment, sources, and answer explanation. The topic cards and sequential lesson navigation are derived from this registry. The transformer chapter registry remains `chapters` in `app.js`, with renderers in `renderers`.

## Automatic publishing

The repository's [GitHub Actions workflow](../.github/workflows/pages.yml) publishes this entire `dist/` folder after successful checks on every push to the default branch. Future topics, lessons, and assets inside `dist/` are included automatically. See the [one-time GitHub Pages setup](../README.md#publish-with-github-pages).

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

Runs syntax validation for every asset module, mathematical and distributed-state invariant tests, and local asset/chapter link checks at root and repository subpaths. Also review changed lessons in a browser, including keyboard controls, small-screen diagrams, and reduced-motion behavior.

No API keys, backend, analytics, or runtime package dependencies. Google Fonts is optional; system fallbacks work when unavailable. The workflow handles publishing after the GitHub repository is connected and Pages is enabled.
