import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/app/data-context';
import type { Template } from '@/lib/domain/schemas';

/** Device-local calendar date as 'YYYY-MM-DD' (default start date for a new challenge). */
export function todayIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Challenge-library data layer. Lists templates and starts a personal Challenge from
 * one, both ONLY through the DAL (`useData()`) behind TanStack Query. On a successful
 * start it invalidates the challenge/session caches the Today view reads and routes
 * the user there.
 */
export function useLibrary() {
  const data = useData();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: () => data.listTemplates(),
  });

  const startMutation = useMutation({
    mutationFn: (vars: { template: Template; startDate: string }) =>
      data.startFromTemplate(vars.template.id, vars.startDate),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['challenges'] });
      navigate('/', { replace: true });
    },
  });

  return { templatesQuery, startMutation };
}
