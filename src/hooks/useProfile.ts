import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  farm_name: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
    } else {
      // Auto-create profile
      const { data: created } = await supabase
        .from('profiles')
        .insert({ user_id: user.id, farm_name: 'My Farm' })
        .select()
        .single();
      if (created) setProfile(created);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, [user?.id]);

  const updateProfile = async (updates: { display_name?: string; farm_name?: string }) => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', profile.user_id)
      .select()
      .single();
    if (!error && data) setProfile(data);
    return { data, error };
  };

  return { profile, loading, updateProfile, refetch: fetchProfile };
}
