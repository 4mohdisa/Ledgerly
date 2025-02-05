import { createClient } from '@/utils/supabase/server';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date, amount, name, type, account_type, category_id, description } = req.body;

  const supabase = createClient(req, res);
  const { data: profile } = await supabase.auth.getUser();

  if (!profile?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert([
      {
        user_id: profile.user.id,
        date,
        amount,
        name,
        type,
        account_type,
        category_id,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ data });
}