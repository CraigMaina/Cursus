import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/app/data-context';
import { todayIso } from '@/screens/today/dates';
import {
  emptyBuilder,
  toDomain,
  toFormValues,
  type BuilderFormValues,
} from './builderForms';

/**
 * Builder data layer. Loads an existing challenge for edit, and persists create/edit
 * through the DAL ONLY (`useData()`), behind TanStack Query. On a successful save it
 * invalidates the caches the Today and Library views read, then routes to Today.
 *
 * Reset logic is never computed here; the builder only shapes the challenge + rules.
 */
export function useBuilder(challengeId?: string) {
  const data = useData();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isEdit = Boolean(challengeId);

  // Edit mode: load the challenge + its rules to seed the form.
  const challengeQuery = useQuery({
    queryKey: ['challenge-detail', challengeId],
    queryFn: () => data.getChallenge(challengeId!),
    enabled: isEdit,
  });

  const initialValues: BuilderFormValues = challengeQuery.data
    ? toFormValues(challengeQuery.data.challenge, challengeQuery.data.rules)
    : emptyBuilder(todayIso());

  function invalidateAfterSave() {
    void queryClient.invalidateQueries({ queryKey: ['challenges'] });
    void queryClient.invalidateQueries({ queryKey: ['challenge-detail'] });
    void queryClient.invalidateQueries({ queryKey: ['templates'] });
  }

  const saveMutation = useMutation({
    mutationFn: async (values: BuilderFormValues) => {
      const { input, rules } = toDomain(values);
      if (isEdit && challengeId) {
        await data.updateChallenge(challengeId, input);
        await data.replaceRules(challengeId, rules);
        return challengeId;
      }
      const created = await data.createChallenge(input, rules);
      return created.id;
    },
    onSuccess: () => {
      invalidateAfterSave();
      navigate('/', { replace: true });
    },
  });

  const saveAsTemplateMutation = useMutation({
    mutationFn: () => {
      if (!challengeId) {
        throw new Error('Save the challenge before saving it as a template.');
      }
      return data.saveChallengeAsTemplate(challengeId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  return {
    isEdit,
    loading: isEdit && challengeQuery.isLoading,
    loadError: isEdit ? challengeQuery.error : null,
    initialValues,
    save: (values: BuilderFormValues) => saveMutation.mutate(values),
    saving: saveMutation.isPending,
    saveError: saveMutation.error,
    saveAsTemplate: () => saveAsTemplateMutation.mutate(),
    savingTemplate: saveAsTemplateMutation.isPending,
    templateSaved: saveAsTemplateMutation.isSuccess,
    templateError: saveAsTemplateMutation.error,
  };
}
