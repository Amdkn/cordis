# @aspace/cordis-adapter

The only A'Space code in this fork (D-N047, D6). The 10 upstream packages are
never modified — byte-identical to the frozen commit `b38ef58`.

## What it does

- `createAspaceApp()` — boots a Cordis `Context` with HMR installed the
  A'Space way: file watch **off** by default. A'Space drives `reconcile()`
  explicitly, never by file watch. Returns `{ ctx, hmr }` — dispose the
  `hmr` fiber when done (at most one HMR instance is active per thread).
- `reconcile(ctx, roots)` — one transactional reconcile, reported in
  A'Space terms (`applied` / `partial` / `aborted` / `skipped` / `noop`).
- `hasHmr(ctx)` — whether the HMR service is present and reachable.

## Pinned surface

The upstream warns its API is unstable. The adapter pins the exact surface
it depends on (`PINNED_HMR_SURFACE` in `src/index.ts`) so a drift is a named
design event, not a silent break:

- `ctx.plugin(Hmr, { watch: { enabled } })`
- `ctx.hmr.reconcile(() => roots)` → `Hmr.Result { settled, aborted, skipped }`
- `Hmr.SkipReason { host-module, native-addon, ambiguous-import, ambiguous-export }`
- HMR requires Node internals (`--expose-internals` or
  `node-addon-require-builtin`); without them it fails to start.

## Divergence debt (owner: Buzz core, lane Clara / 12e)

- HMR's API is unstable by the upstream's own warning (core README line 7).
  The adapter depends on `reconcile()` + `SkipReason` + the `Result` shape.
- HMR replaces Node.js methods that read package manifests and `Module._load`
  while it runs; the replacements are not restored on dispose (upstream
  README, « Replacements of Node.js methods »). At most one HMR instance is
  active per thread.
- ESM resolution through a retargeted link observes the new target only on
  Node.js 24.16+ / 26.1+; earlier versions may keep importing the previous
  target after a link retarget.
- The adapter depends on the resolution-cache invalidation introduced by
  #298 — the correction of justness that motivated the freeze after reprise.
