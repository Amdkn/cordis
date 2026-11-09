/**
 * @aspace/cordis-adapter — the only A'Space code in this fork (D-N047, D6).
 *
 * The 10 upstream packages are never modified (byte-identical to the frozen
 * commit). Every A'Space adaptation lives here, behind this stable surface.
 *
 * Pinned surface (upstream API the adapter depends on — unstable by the
 * upstream's own warning, pinned here so a drift is a named event, not a
 * silent break):
 * - `ctx.plugin(Hmr, { watch: { enabled } })` — HMR installed as a service.
 * - `ctx.hmr.reconcile(() => roots)` — transactional reconcile, returns
 *   `Hmr.Result` (`settled` / `aborted` / `skipped`).
 * - `Hmr.SkipReason` — `host-module`, `native-addon`, `ambiguous-import`,
 *   `ambiguous-export`.
 * - HMR requires Node internals (`--expose-internals` or
 *   `node-addon-require-builtin`); without them it fails to start.
 */
import { Context, Fiber } from 'cordis'
import Hmr from '@cordisjs/plugin-hmr'

/** Adapter version (semver of the adapted module, D4). */
export const ADAPTER_VERSION = '0.1.0'

/** Frozen upstream commit this adapter is built against (D1). */
export const PINNED_CORDIS_COMMIT = 'b38ef58'

/** Upstream HMR package version at the frozen commit. */
export const PINNED_HMR_VERSION = '1.1.2'

/** The pinned upstream surface, as names — a drift here is a design event. */
export const PINNED_HMR_SURFACE = [
  'ctx.plugin(Hmr, { watch: { enabled } })',
  'ctx.hmr.reconcile(() => roots)',
  'Hmr.Result { settled, aborted, skipped }',
  'Hmr.SkipReason { host-module, native-addon, ambiguous-import, ambiguous-export }',
] as const

export type ReconcileVerdict = 'applied' | 'partial' | 'aborted' | 'skipped' | 'noop'

export interface ReconcileReport {
  verdict: ReconcileVerdict
  settled: number
  aborted: number
  skipped: number
  reasons: string[]
}

/**
 * Boot a Cordis app with HMR installed the A'Space way: watch OFF by
 * default — A'Space drives `reconcile()` explicitly, never by file watch.
 * The plugin installation is awaited, so `ctx.hmr` is live on return.
 * Returns the context and the HMR fiber — dispose the fiber when done:
 * at most one HMR instance is active per thread (upstream rule).
 */
export async function createAspaceApp(options: { base?: string } = {}): Promise<{ ctx: Context, hmr: Fiber }> {
  const ctx = new Context()
  const hmr = await ctx.plugin(Hmr, {
    base: options.base,
    watch: { enabled: false },
  })
  return { ctx, hmr }
}

/**
 * Drive one reconcile transaction and report it in A'Space terms.
 * `roots` are the absolute paths of files or directories that changed.
 * The callback form of the upstream is preserved: the caller hands the
 * roots, the adapter only normalizes the report.
 */
export async function reconcile(ctx: Context, roots: Iterable<string>): Promise<ReconcileReport> {
  const result = await ctx.hmr.reconcile(() => roots)
  const reasons = result.skipped.map((skip) => skip.reason)
  const verdict: ReconcileVerdict =
    result.aborted.length > 0 ? 'aborted'
    : result.skipped.length > 0 ? 'skipped'
    : result.settled.length > 0 ? 'applied'
    : 'noop'
  return {
    verdict,
    settled: result.settled.length,
    aborted: result.aborted.length,
    skipped: result.skipped.length,
    reasons,
  }
}

/** Whether the HMR service is present and reachable on this context. */
export function hasHmr(ctx: Context): boolean {
  return !!ctx.hmr
}

export { Hmr }
export default { createAspaceApp, reconcile, hasHmr }
