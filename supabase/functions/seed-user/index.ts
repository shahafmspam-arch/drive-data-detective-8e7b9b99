import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── All MACs seen in your MQTT stream ──────────────────────────────────────
// Add or remove MACs here as needed. calf_number is just a label.
const KNOWN_MACS = [
  "f0c85a00020d",
  "f0c85a000210",
  "f0c9600200a2",
  "2e58b95a2ce1",
  "2507c2f08334",
  "f0ca2a62014d",
  "acb722bf3837",
  "2f897c9a3d13",
  "2e4427b8eb96",
  "1039170afd70",
  "54b7e58c9007",
  "4ca919682e74",
  "149cef80b1f3",
  "fc45c3d32a1d",
  "d0c24e012bb1",
  "e2e4d6f07947",
  "c033cafad29b",
  "12cc10d264aa",
  "41428a33f3d6",
  "f0c990010671",
  "e2e4d6f07941",
  "e2e4d6f07940",
  "4825078b357d",
  "acb72275f0db",
  "4113711c9f39",
  "f3ca7ffffcf2",
  "f3ca7ffffcf3",
  "8cea48826572",
  "5b0010dc96bb",
  "4fffad7a96c1",
  "7c47073ae76c",
  "633548006d74",
  "5a087e0f028d",
  "35d3ec9d5260",
  "f0c99001066c",
  "0cbc6095d006",
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Accept user_id in request body, or fall back to finding the test user
    let userId: string | null = null;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        userId = body.user_id || null;
      } catch {}
    }

    if (!userId) {
      // Find the test user automatically
      const { data: users } = await supabase.auth.admin.listUsers();
      const testUser = users?.users?.find(u => u.email === 'test@gmail.com');
      if (!testUser) {
        return new Response(JSON.stringify({
          error: 'No user_id provided and test@gmail.com not found. Call seed-user first.'
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      userId = testUser.id;
    }

    // Check which MACs are already registered
    const { data: existing } = await supabase
      .from('calves')
      .select('tag_mac')
      .eq('user_id', userId);

    const existingMacs = new Set(existing?.map(c => c.tag_mac) || []);
    const newMacs = KNOWN_MACS.filter(mac => !existingMacs.has(mac));

    if (newMacs.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'All MACs already registered',
        total: KNOWN_MACS.length,
        user_id: userId,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Insert new calves
    const rows = newMacs.map((mac, i) => ({
      user_id: userId,
      tag_mac: mac,
      calf_number: existingMacs.size + i + 1,
      name: `Calf ${existingMacs.size + i + 1}`,
    }));

    const { error } = await supabase.from('calves').insert(rows);
    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      message: `Registered ${newMacs.length} new calves`,
      new_macs: newMacs,
      user_id: userId,
      // ⬇ Copy this value into Render → GATEWAY_USER_ID env var
      set_render_env: { GATEWAY_USER_ID: userId },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
