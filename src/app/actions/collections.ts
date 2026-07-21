'use server';

import { getSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function createCollection(title: string, date: string) {
  const supabase = await getSupabaseServer();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('collections')
    .insert([
      { title, date, user_id: userData.user.id }
    ])
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/collections');
  return data;
}

export async function getCollections() {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('collections')
    .select('*, collection_items(count)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getCollectionById(id: string) {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('collections')
    .select('*, collection_items(*, punchline:punchlines(*))')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateCollection(id: string, title: string, date: string) {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('collections')
    .update({ title, date })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/collections');
  revalidatePath(`/collections/${id}`);
  return data;
}

export async function deleteCollection(id: string) {
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/collections');
}

export async function updateCollectionItems(collectionId: string, items: any[]) {
  const supabase = await getSupabaseServer();
  // First delete all existing items
  await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId);

  // Then insert new ones
  if (items.length > 0) {
    const { error } = await supabase
      .from('collection_items')
      .insert(items.map((item, index) => ({
        collection_id: collectionId,
        position: index,
        item_type: item.item_type,
        punchline_id: item.punchline_id,
        text_content: item.text_content,
        color: item.color || null
      })));

    if (error) throw error;
  }

  revalidatePath(`/collections/${collectionId}`);
}
