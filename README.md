# Visual learning sites

The collection lives in [visual-learning](visual-learning/README.md).

First topic: **AI & Deep Learning**. First lesson: **Inside the transformer**.

```sh
cd visual-learning
npm start
```

Open http://127.0.0.1:4173 to review the topic index and interactive lesson.

## Publish with GitHub Pages

The [deployment workflow](.github/workflows/pages.yml) publishes the entire `visual-learning/dist/` collection. No dependency installation, build step, deployment branch, or personal access token is required.

One-time setup:

1. Connect this local repository to a GitHub repository and push the files, including `.github/workflows/pages.yml`.
2. On GitHub, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Open **Actions → Check and deploy learning site → Run workflow** on the default branch, or push another commit to that branch.

The successful **Publish GitHub Pages** job shows the live URL, typically `https://<owner>.github.io/<repository>/`. This setup follows [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

After setup, every push to the GitHub repository's **default branch** checks and deploys the full collection automatically. The workflow discovers that branch, so either `master` or `main` works. Pull requests and other branches run checks without replacing the live website. Failed checks prevent deployment and leave the last successful site live.

For future additions, put the publishable files inside `visual-learning/dist/` and add their topic/lesson links to the collection index. Commit and push them to the default branch (or merge a pull request there); they are included in the next deployment without workflow changes. Files elsewhere in the repository are not published.

The site supports both repository subpaths and root/custom-domain hosting. Deployment checks verify local assets under both URL layouts.
