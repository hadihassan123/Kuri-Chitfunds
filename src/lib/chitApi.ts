import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function deleteChit(chitId: string): Promise<void> {
  const { data: { session } } = await supabase!.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('You must be signed in to delete a chit');

  const response = await fetch(`${API_BASE_URL}/api/chits/${chitId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'Failed to delete chit fund');
  }
}