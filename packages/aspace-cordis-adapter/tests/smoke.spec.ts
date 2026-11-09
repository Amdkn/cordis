import { describe, expect, it } from 'vitest'
import {
  ADAPTER_VERSION,
  PINNED_CORDIS_COMMIT,
  PINNED_HMR_SURFACE,
  PINNED_HMR_VERSION,
  createAspaceApp,
  hasHmr,
  reconcile,
} from '../src/index.ts'

describe('@aspace/cordis-adapter', () => {
  it('pins the frozen upstream (D1)', () => {
    expect(PINNED_CORDIS_COMMIT).toBe('b38ef58')
    expect(PINNED_HMR_VERSION).toBe('1.1.2')
    expect(ADAPTER_VERSION).toBe('0.1.0')
    expect(PINNED_HMR_SURFACE).toContain('ctx.hmr.reconcile(() => roots)')
  })

  it('boots a Cordis app with HMR installed, watch off', async () => {
    const { ctx, hmr } = await createAspaceApp()
    expect(hasHmr(ctx)).toBe(true)
    expect(ctx.hmr.config.watch.enabled).toBe(false)
    await hmr.dispose()
  })

  it('reconciles an empty change set as a noop', async () => {
    const { ctx, hmr } = await createAspaceApp()
    const report = await reconcile(ctx, [])
    expect(report.verdict).toBe('noop')
    expect(report.settled).toBe(0)
    expect(report.aborted).toBe(0)
    expect(report.skipped).toBe(0)
    expect(report.reasons).toEqual([])
    await hmr.dispose()
  })
})
