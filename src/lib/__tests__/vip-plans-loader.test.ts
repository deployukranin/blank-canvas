import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadVipPlansForStore } from '@/lib/vip-plans-loader';
import { defaultVipConfig } from '@/lib/vip-config';

/**
 * Build a chainable mock that records every filter applied to the query,
 * so tests can assert that /vip never queries by store_id IS NULL
 * (the previous "global fallback" path) and always filters by the
 * provided store_id.
 */
function makeSupabaseMock(configValue: unknown) {
  const calls = {
    from: [] as string[],
    eq: [] as Array<[string, unknown]>,
    is: [] as Array<[string, unknown]>,
    select: [] as string[],
  };

  const builder: any = {
    select: vi.fn((cols: string) => {
      calls.select.push(cols);
      return builder;
    }),
    eq: vi.fn((col: string, val: unknown) => {
      calls.eq.push([col, val]);
      return builder;
    }),
    is: vi.fn((col: string, val: unknown) => {
      calls.is.push([col, val]);
      return builder;
    }),
    maybeSingle: vi.fn(async () => ({
      data: configValue === undefined ? null : { config_value: configValue },
      error: null,
    })),
  };

  const client: any = {
    from: vi.fn((table: string) => {
      calls.from.push(table);
      return builder;
    }),
  };

  return { client, calls };
}

describe('loadVipPlansForStore — store-scoped vip_config contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries app_configurations filtered by config_key AND the given store_id', async () => {
    const storeId = 'store-abc-123';
    const storePlans = [
      { id: 'm', name: 'Mensal Store', type: 'monthly', price: 49.9, description: '', features: [] },
    ];
    const { client, calls } = makeSupabaseMock({ plans: storePlans });

    const result = await loadVipPlansForStore(storeId, client);

    expect(calls.from).toEqual(['app_configurations']);
    expect(calls.eq).toContainEqual(['config_key', 'vip_config']);
    expect(calls.eq).toContainEqual(['store_id', storeId]);
    expect(result.source).toBe('store');
    expect(result.plans).toEqual(storePlans);
  });

  it('NEVER falls back to the global config (store_id IS NULL) when store has no record', async () => {
    const { client, calls } = makeSupabaseMock(undefined); // no row found

    const result = await loadVipPlansForStore('store-xyz', client);

    // The forbidden global fallback must not happen
    expect(calls.is).toEqual([]);
    const queriedNullStore = calls.eq.some(
      ([col, val]) => col === 'store_id' && (val === null || val === undefined),
    );
    expect(queriedNullStore).toBe(false);

    // Must use local defaults as a visual placeholder, not a remote global config
    expect(result.source).toBe('defaults');
    expect(result.plans).toEqual(defaultVipConfig.plans);
  });

  it('NEVER falls back to global when store row exists but has empty plans', async () => {
    const { client, calls } = makeSupabaseMock({ plans: [] });

    const result = await loadVipPlansForStore('store-empty', client);

    expect(calls.is).toEqual([]);
    expect(result.source).toBe('defaults');
    expect(result.plans).toEqual(defaultVipConfig.plans);
  });

  it('does not query Supabase at all when storeId is missing', async () => {
    const { client, calls } = makeSupabaseMock({ plans: [] });

    const result = await loadVipPlansForStore(undefined, client);
    const result2 = await loadVipPlansForStore(null, client);
    const result3 = await loadVipPlansForStore('', client);

    expect(client.from).not.toHaveBeenCalled();
    expect(calls.eq).toEqual([]);
    expect(calls.is).toEqual([]);
    for (const r of [result, result2, result3]) {
      expect(r.source).toBe('none');
      expect(r.plans).toEqual([]);
    }
  });

  it('returns the store plans verbatim, isolating different stores', async () => {
    const planA = [{ id: 'a', name: 'A', type: 'monthly' as const, price: 10, description: '', features: [] }];
    const planB = [{ id: 'b', name: 'B', type: 'monthly' as const, price: 99, description: '', features: [] }];

    const a = makeSupabaseMock({ plans: planA });
    const b = makeSupabaseMock({ plans: planB });

    const rA = await loadVipPlansForStore('store-A', a.client);
    const rB = await loadVipPlansForStore('store-B', b.client);

    expect(rA.plans).toEqual(planA);
    expect(rB.plans).toEqual(planB);
    expect(a.calls.eq).toContainEqual(['store_id', 'store-A']);
    expect(b.calls.eq).toContainEqual(['store_id', 'store-B']);
  });
});
