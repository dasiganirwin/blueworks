const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // service role — full DB access, backend only
  { auth: { persistSession: false } }
);

module.exports = supabase;
