/**
 * Creates a fluent Supabase mock chain.
 * Usage:
 *   const chain = makeChain({ data: { id: '1' }, error: null });
 *   supabase.from.mockReturnValue(chain);
 */
function makeChain(terminal = { data: null, error: null }) {
  const chain = {
    select:     jest.fn().mockReturnThis(),
    insert:     jest.fn().mockReturnThis(),
    update:     jest.fn().mockReturnThis(),
    delete:     jest.fn().mockReturnThis(),
    upsert:     jest.fn().mockReturnThis(),
    eq:         jest.fn().mockReturnThis(),
    neq:        jest.fn().mockReturnThis(),
    or:         jest.fn().mockReturnThis(),
    gt:         jest.fn().mockReturnThis(),
    gte:        jest.fn().mockReturnThis(),
    lte:        jest.fn().mockReturnThis(),
    is:         jest.fn().mockReturnThis(),
    not:        jest.fn().mockReturnThis(),
    in:         jest.fn().mockReturnThis(),
    limit:      jest.fn().mockReturnThis(),
    range:      jest.fn().mockReturnThis(),
    order:      jest.fn().mockReturnThis(),
    // Terminal methods resolve with the configured value
    single:      jest.fn().mockResolvedValue(terminal),
    maybeSingle: jest.fn().mockResolvedValue(terminal),
    // Awaitable chain (for .insert().select() pattern)
    then: (resolve) => Promise.resolve(terminal).then(resolve),
  };
  return chain;
}

/**
 * Builds a mock supabase object where each table name
 * maps to its own chain result.
 *
 * tableMap: { users: { data: {...}, error: null }, jobs: { data: [...] } }
 */
function makeMockSupabase(tableMap = {}) {
  const defaultResult = { data: null, error: null };
  return {
    from: jest.fn((table) => makeChain(tableMap[table] ?? defaultResult)),
    storage: {
      from: jest.fn(() => ({
        upload:      jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/photo.jpg' } }),
      })),
    },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
}

module.exports = { makeChain, makeMockSupabase };
