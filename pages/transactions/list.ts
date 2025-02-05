import { createClient } from '@/utils/supabase/server';

export default async function handler(req, res) {
  const supabase = createClient(req, res);
  const { data: profile } = await supabase.auth.getUser();

  if (!profile?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', profile.user.id)
    .order('date', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ data });
}