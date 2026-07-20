import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface PunchlineCategory {
  id: string;
  category_id: string;
  category: {
    id: string;
    name: string;
  };
}

export interface Punchline {
  id: string;
  text: string;
  notes: string | null;
  status_id: string | null;
  created_at: string;
  updated_at: string;
  status: {
    id: string;
    name: string;
    color: string;
    position: number;
  } | null;
  punchline_categories: PunchlineCategory[];
}

interface FetchFilters {
  searchText?: string;
  categoryIds?: string[];
  statusId?: string;
}

export function usePunchlines(filters: FetchFilters = {}) {
  const queryClient = useQueryClient();
  const { searchText, categoryIds, statusId } = filters;

  const query = useQuery({
    queryKey: ["punchlines", { searchText, categoryIds, statusId }],
    queryFn: async () => {
      const hasCategories = categoryIds && categoryIds.length > 0;
      
      let req = supabase
        .from("punchlines")
        .select(`
          id,
          text,
          notes,
          status_id,
          created_at,
          updated_at,
          status:statuses(id, name, color, position),
          punchline_categories(
            id,
            category_id,
            category:categories(id, name)
          )
        `);

      if (searchText) {
        req = req.or(`text.ilike.%${searchText}%,notes.ilike.%${searchText}%`);
      }

      if (statusId) {
        req = req.eq("status_id", statusId);
      }

      // Sort by newest
      req = req.order("created_at", { ascending: false });

      const { data, error } = await req;
      if (error) throw error;

      const rawData = (data as any[]) || [];
      let punchlines: Punchline[] = rawData.map((p) => ({
        id: p.id,
        text: p.text,
        notes: p.notes,
        status_id: p.status_id,
        created_at: p.created_at,
        updated_at: p.updated_at,
        status: Array.isArray(p.status) ? p.status[0] || null : p.status || null,
        punchline_categories: (p.punchline_categories || []).map((pc: any) => ({
          id: pc.id,
          category_id: pc.category_id,
          category: Array.isArray(pc.category) ? pc.category[0] || null : pc.category || null,
        })),
      }));
      
      // Strict AND matching for categories
      if (hasCategories) {
        punchlines = punchlines.filter((p) => {
          const pCatIds = p.punchline_categories.map((pc) => pc.category_id);
          return categoryIds.every((catId) => pCatIds.includes(catId));
        });
      }

      return punchlines;
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({
      text,
      notes,
      status_id,
      categoryIds,
    }: {
      text: string;
      notes: string;
      status_id: string | null;
      categoryIds: string[];
    }) => {
      const { data: punchline, error: pError } = await supabase
        .from("punchlines")
        .insert([{ text, notes, status_id: status_id || null }])
        .select()
        .single();

      if (pError) throw pError;

      if (categoryIds && categoryIds.length > 0) {
        const mappings = categoryIds.map((catId) => ({
          punchline_id: punchline.id,
          category_id: catId,
        }));
        const { error: cError } = await supabase.from("punchline_categories").insert(mappings);
        if (cError) throw cError;
      }

      return punchline;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["punchlines"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      text,
      notes,
      status_id,
      categoryIds,
    }: {
      id: string;
      text: string;
      notes: string;
      status_id: string | null;
      categoryIds: string[];
    }) => {
      const { error: pError } = await supabase
        .from("punchlines")
        .update({ text, notes, status_id: status_id || null })
        .eq("id", id);

      if (pError) throw pError;

      // Delete old mappings
      const { error: dError } = await supabase
        .from("punchline_categories")
        .delete()
        .eq("punchline_id", id);

      if (dError) throw dError;

      // Insert new mappings
      if (categoryIds && categoryIds.length > 0) {
        const mappings = categoryIds.map((catId) => ({
          punchline_id: id,
          category_id: catId,
        }));
        const { error: cError } = await supabase.from("punchline_categories").insert(mappings);
        if (cError) throw cError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["punchlines"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("punchlines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["punchlines"] });
    },
  });

  return {
    punchlines: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createPunchline: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updatePunchline: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deletePunchline: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
