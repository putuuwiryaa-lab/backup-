// api/markets.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function handler(req: any, res: any) {
  try {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .order('order', { ascending: true });

    if (error) throw error;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
