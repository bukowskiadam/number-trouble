# Changelog

All notable changes to Number Trouble. Version numbers follow
[Semantic Versioning 2.0.0](https://semver.org/).
New entries belong in **Unreleased**, with the latest version listed first.
Agent guidelines: [AGENTS.md](AGENTS.md). Release procedure: [docs/RELEASE.md](docs/RELEASE.md).

This changelog is written in English. The user-facing history is maintained in
Polish and English in `src/release-notes.json`.

## Unreleased

### Added

- Show the package version and bilingual, offline release history in the app footer.
- Remember the last launched version across profiles and show new release notes once
  after an upgrade, including skipped releases, without announcing first launches or rollbacks.

### Tests

- Verify SemVer ordering, release metadata consistency, preserved profile data,
  upgrade notices, keyboard access and offline release history in both languages.

### Documentation

- Document Semantic Versioning and the release procedure; record the already published
  MVP as v1.0.0 without changing package versions or creating a release tag.

## v1.0.0 — 2026-10-10

### Added

- Implement the complete React/TypeScript/Vite MVP with four arithmetic levels, three
  accelerating speeds, one eight-block column, moving answer buttons and streak scoring.
- Add timed corrections, exact landing boundaries, pause/resume, visibility pause,
  keyboard and touch input, end-of-game summaries and replay.
- Add independent local child profiles, validated storage, per-profile settings and
  twelve best-score combinations, with confirmed resets and deletion.
- Add Polish and English interfaces, blue visual styling, locally bundled fonts and
  optional synthesized sound effects.
- Add an installable PWA with project-specific icons, complete production precaching,
  offline readiness, subpath support and deferred updates.
- Add unit and production browser coverage for arithmetic, gameplay, storage,
  accessibility, responsive layouts and offline use.

### Documentation

- Record the agreed Number Trouble MVP requirements, acceptance criteria and implementation plan.
- Add repository instructions and a self-contained implementation handoff for a new conversation.

### Deployment

- Add the same tested GitHub Pages workflow as Czytanki, triggered by master pushes,
  with Node.js 24, production browser checks and Pages-derived asset paths.
- Wait for the next falling block before reading equations in browser tests.

### Maintenance

- Add ignore rules for local dependencies, build output, test reports and editor artifacts.
