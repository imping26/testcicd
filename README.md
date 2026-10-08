# testcicd

A small React + Vite app used to build and understand a complete CI/CD pipeline from scratch — PR checks, branch protection, and automated deployment to GitHub Pages.

**Live:** https://imping26.github.io/testcicd/

The app itself is deliberately trivial (a counter with a reset button). The point of this repo is everything around it: how code gets verified, gated, and shipped without anyone running a command by hand.

## Stack

| | |
|---|---|
| Framework | React 19 |
| Build | Vite 8 |
| Lint | Oxlint |
| Test | Vitest + Testing Library (jsdom) |
| CI/CD | GitHub Actions |
| Hosting | GitHub Pages |

## Running locally

```bash
npm ci            # install exactly what package-lock.json specifies
npm run dev       # dev server
npm run test      # run the test suite once
npm run test:watch
npm run lint
npm run build
```

## CI/CD

Two workflows, split by **when** they run and **what** they are responsible for.

### `ci.yml` — verification, before merge

Triggered by `on: pull_request` targeting `main`. Runs `lint → test → build` and deploys nothing.

**Why it's separate from deployment:** the original setup was a single workflow triggered on push to `main`, which meant code was only verified *after* it had already landed on the main branch. By that point a bad commit is everyone's problem. Moving verification to the pull request stage means a broken change is caught while it's still isolated on a branch.

`concurrency.cancel-in-progress` is `true` here — if you push three times in a row, only the newest check matters, so the older runs are cancelled.

### `deploy.yml` — build and publish, after merge

Triggered by `on: push` to `main`. Two jobs:

- **`build`** — installs, runs `lint → test → build`, then uploads `dist/` as a Pages artifact
- **`deploy`** — declares `needs: build` and publishes the artifact

**Why the checks run a second time here:** `ci.yml` only protects the pull request path. Anyone with write access can push directly to `main` and bypass it entirely. Re-running the checks before deployment is the last line of defence between a bad commit and production.

This is not theoretical. During development I merged a pull request whose CI was red (branch protection wasn't configured yet, so the merge button was still clickable). The deployment workflow then failed at the `Test` step, which meant `Build` was skipped, the artifact was never produced, and the `deploy` job never started. The live site kept serving the previous good build. Without that second check, the broken code would have shipped.

`concurrency.cancel-in-progress` is `false` here, unlike in CI — a verification run is safe to cancel, a deployment mid-flight is not.

### Deployment method

Uses `actions/upload-pages-artifact` + `actions/deploy-pages` rather than committing the build output to a `gh-pages` branch. Two reasons: build artifacts don't belong in version control, and declaring a `github-pages` environment gives a deployment history that can be inspected and rolled back.

Requires the repository's Pages source to be set to **GitHub Actions** (not "Deploy from a branch").

### Branch protection

A ruleset on `main` requires the `Lint / Test / Build` status check to pass and a pull request before merging. Without it, a red check is only a warning — GitHub will still let you merge.

The ruleset targets **the default branch only**. An earlier attempt targeted all branches, which deadlocks immediately: pushing a new feature branch is rejected because its required status check hasn't run yet, and it can't run until a pull request exists, which needs the branch to be pushed first. Protection belongs at the destination, not along the way.

### Vite `base` path

`vite.config.js` sets `base: '/testcicd/'`. GitHub Pages serves project sites from a subpath, so without it Vite emits asset URLs like `/assets/index.js`, which resolve to the domain root and 404. This is the most common cause of a "works locally, blank page in production" deployment.

## What this pipeline deliberately does *not* have

Decisions about what to leave out matter as much as what to include. The reasoning behind these
and other choices — including the ones that turned out to be wrong — is recorded in
[`DECISIONS.md`](./DECISIONS.md).

**No staging environment.** Staging exists so that someone — QA, a product owner, a client — can verify a release candidate against something close to production before it goes live. This project has one user and no acceptance step, so a staging environment would add hosting, configuration, and a promotion step while solving nothing. For a team project with real users I would add one, most likely as a separate branch deploying to its own URL, since Vite bakes environment variables into the bundle at build time and the same artifact generally can't be reused across environments.

**No containerisation.** The build output is static files. Docker would add a layer with nothing underneath it.

**No end-to-end tests.** The component tests cover the behaviour that exists. E2E is worth its maintenance cost once there are flows that span multiple pages or depend on a backend; here there are neither.

**No matrix builds across Node versions.** This deploys to one target, built by one runner, on one Node version. Testing against Node 18 and 22 would prove something nobody needs to know.

## Testing

Eight tests in `src/App.test.jsx`, written against roles and accessible names (`getByRole`) rather than class names, so they test what a user can actually perceive.

The reset tests were checked by deliberately breaking the component — changing `setCount(0)` to `setCount(1)` — and confirming three of them turned red. A test that passes but never fails when the code is broken is not protecting anything.

One of them asserts an intermediate state on purpose:

```js
await user.click(counter)   // ×3
expect(counter).toHaveTextContent('Count is 3')   // prove the state actually changed
await user.click(reset)
expect(counter).toHaveTextContent('Count is 0')
```

Without the middle assertion, a counter stuck at zero would make the reset test pass for the wrong reason.
