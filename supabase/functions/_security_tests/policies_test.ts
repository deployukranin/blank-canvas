// Integration tests for store_users RLS and custom_orders tamper trigger.
// Uses direct Postgres connection with impersonated JWT claims via
// `SET LOCAL request.jwt.claims` so RLS + SECURITY DEFINER triggers behave
// exactly as they would for a real signed-in user.
//
// Run with: supabase--test_edge_functions { functions: ["_security_tests"] }
//
// Skips gracefully when SUPABASE_DB_URL is not available.

import { assert, assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const DB_URL = Deno.env.get("SUPABASE_DB_URL");

async function makeSql() {
  if (!DB_URL) return null;
  const sql = postgres(DB_URL, { max: 1, prepare: false, onnotice: () => {} });
  // Elevate default session to service_role so seed/cleanup bypasses RLS.
  // (Each per-test block switches to `authenticated` via SET LOCAL ROLE.)
  try { await sql.unsafe("SET ROLE service_role"); } catch { /* ignore */ }
  return sql;
}

async function asUser<T>(
  sql: ReturnType<typeof postgres>,
  userId: string,
  fn: (tx: ReturnType<typeof postgres>) => Promise<T>,
): Promise<T> {
  return await sql.begin(async (tx) => {
    await tx.unsafe(
      `SELECT set_config('request.jwt.claims', $1, true),
              set_config('request.jwt.claim.sub', $2, true),
              set_config('role', 'authenticated', true)`,
      [JSON.stringify({ sub: userId, role: "authenticated" }), userId],
    );
    await tx.unsafe(`SET LOCAL ROLE authenticated`);
    return await fn(tx as unknown as ReturnType<typeof postgres>);
  }) as T;
}

Deno.test("store_users insert is blocked on suspended stores", async () => {
  const sql = makeSql();
  if (!sql) return; // env not available; skip

  const ownerId = crypto.randomUUID();
  const outsiderId = crypto.randomUUID();
  let storeId: string | null = null;

  try {
    // Seed a suspended store as service role.
    const [row] = await sql<{ id: string }[]>`
      INSERT INTO public.stores (name, url, status, created_by, plan_type, suspended_at, onboarding_completed)
      VALUES ('sec-test', 'sec-test-' || gen_random_uuid()::text, 'active', ${ownerId}, 'trial', now(), true)
      RETURNING id
    `;
    storeId = row.id;

    await assertRejects(
      () =>
        asUser(sql, outsiderId, async (tx) => {
          await tx.unsafe(
            `INSERT INTO public.store_users (store_id, user_id) VALUES ($1, $2)`,
            [storeId, outsiderId],
          );
        }),
      Error,
    );
  } finally {
    if (storeId) await sql`DELETE FROM public.stores WHERE id = ${storeId}`;
    await sql.end({ timeout: 1 });
  }
});

Deno.test("custom_orders tamper trigger blocks client edits and audits", async () => {
  const sql = makeSql();
  if (!sql) return;

  const ownerId = crypto.randomUUID();
  const clientId = crypto.randomUUID();
  let storeId: string | null = null;
  let orderId: string | null = null;

  try {
    const [store] = await sql<{ id: string }[]>`
      INSERT INTO public.stores (name, url, status, created_by, plan_type, onboarding_completed)
      VALUES ('sec-test', 'sec-test-' || gen_random_uuid()::text, 'active', ${ownerId}, 'trial', true)
      RETURNING id
    `;
    storeId = store.id;

    const [order] = await sql<{ id: string }[]>`
      INSERT INTO public.custom_orders
        (user_id, product_type, category, customer_name, amount_cents,
         correlation_id, status, store_id)
      VALUES
        (${clientId}, 'custom_video', 'asmr', 'Test', 5000,
         'sec-' || gen_random_uuid()::text, 'pending', ${storeId})
      RETURNING id
    `;
    orderId = order.id;

    // Client tries to change status → must fail
    await assertRejects(
      () =>
        asUser(sql, clientId, async (tx) => {
          await tx.unsafe(
            `UPDATE public.custom_orders SET status = 'paid' WHERE id = $1`,
            [orderId],
          );
        }),
      Error,
      "protected",
    );

    // Audit row must exist for this order/user
    const attempts = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count
      FROM public.custom_orders_tamper_attempts
      WHERE order_id = ${orderId} AND user_id = ${clientId}
    `;
    assert(attempts[0].count >= 1, "tamper attempt should be audited");

    // Client editing an allowed field (observations) must succeed
    await asUser(sql, clientId, async (tx) => {
      await tx.unsafe(
        `UPDATE public.custom_orders SET observations = 'ok' WHERE id = $1`,
        [orderId],
      );
    });

    const [ok] = await sql<{ observations: string }[]>`
      SELECT observations FROM public.custom_orders WHERE id = ${orderId}
    `;
    assertEquals(ok.observations, "ok");
  } finally {
    if (orderId) {
      await sql`DELETE FROM public.custom_orders_tamper_attempts WHERE order_id = ${orderId}`;
      await sql`DELETE FROM public.custom_orders WHERE id = ${orderId}`;
    }
    if (storeId) await sql`DELETE FROM public.stores WHERE id = ${storeId}`;
    await sql.end({ timeout: 1 });
  }
});
