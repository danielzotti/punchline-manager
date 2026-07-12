import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Status {
  id: string;
  name: string;
  position: number;
  color: string;
}

export function useStatuses() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["statuses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("statuses")
        .select("*")
        .order("position", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Status[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, color, position }: { name: string; color: string; position: number }) => {
      const { data, error } = await supabase
        .from("statuses")
        .insert([{ name, color, position }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      color,
      position,
    }: {
      id: string;
      name?: string;
      color?: string;
      position?: number;
    }) => {
      const { data, error } = await supabase
        .from("statuses")
        .update({
          ...(name !== undefined && { name }),
          ...(color !== undefined && { color }),
          ...(position !== undefined && { position }),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
      queryClient.invalidateQueries({ queryKey: ["punchlines"] });
    },
  });

  const updateStatusesMutation = useMutation({
    mutationFn: async (
      updates: { id: string; name?: string; color?: string; position?: number }[]
    ) => {
      const promises = updates.map((update) =>
        supabase
          .from("statuses")
          .update({
            ...(update.name !== undefined && { name: update.name }),
            ...(update.color !== undefined && { color: update.color }),
            ...(update.position !== undefined && { position: update.position }),
          })
          .eq("id", update.id)
      );
      const results = await Promise.all(promises);
      for (const res of results) {
        if (res.error) throw res.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
      queryClient.invalidateQueries({ queryKey: ["punchlines"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("statuses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
      // Invalidate punchlines too because a status change might affect punchline renderings/filters
      queryClient.invalidateQueries({ queryKey: ["punchlines"] });
    },
  });

  return {
    statuses: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createStatus: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateStatus: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateStatuses: updateStatusesMutation.mutateAsync,
    isUpdatingStatuses: updateStatusesMutation.isPending,
    deleteStatus: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
