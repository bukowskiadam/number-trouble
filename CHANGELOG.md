# Changelog

## Unreleased

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
