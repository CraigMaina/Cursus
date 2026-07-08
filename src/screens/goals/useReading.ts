import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useData } from '@/app/data-context';
import type { NewBookInput } from '@/lib/domain/schemas';

/**
 * Reading-goal data layer (D16). Lists the books logged against a reading goal and
 * adds, edits, or removes one, all ONLY through the DAL (`useData()`). The read count
 * versus the target is derived in the view from pure `goalModel` helpers.
 */
export function booksKey(goalId: string) {
  return ['books', goalId] as const;
}

export function useReading(goalId: string | undefined, authed: boolean) {
  const data = useData();
  const queryClient = useQueryClient();

  const booksQuery = useQuery({
    queryKey: booksKey(goalId ?? 'none'),
    queryFn: () => data.listBooks(goalId!),
    enabled: authed && Boolean(goalId),
  });

  function invalidate() {
    if (goalId) void queryClient.invalidateQueries({ queryKey: booksKey(goalId) });
  }

  const addMutation = useMutation({
    mutationFn: (input: NewBookInput) => data.addBook(input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ bookId, patch }: { bookId: string; patch: Partial<NewBookInput> }) =>
      data.updateBook(bookId, patch),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (bookId: string) => data.deleteBook(bookId),
    onSuccess: invalidate,
  });

  return {
    books: booksQuery.data ?? [],
    loading: booksQuery.isLoading,
    error: booksQuery.error ?? null,

    addBook: (input: NewBookInput) => addMutation.mutateAsync(input),
    addingBook: addMutation.isPending,
    addBookError: addMutation.error,
    resetAddBook: () => addMutation.reset(),

    updateBook: (bookId: string, patch: Partial<NewBookInput>) =>
      updateMutation.mutateAsync({ bookId, patch }),
    updatingBook: updateMutation.isPending,
    updateBookError: updateMutation.error,
    resetUpdateBook: () => updateMutation.reset(),

    deleteBook: (bookId: string) => deleteMutation.mutate(bookId),
    deletingBook: deleteMutation.isPending,
  };
}
