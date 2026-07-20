import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { constructSkillsApi } from './api';
import { constructSkillsKeys } from './query-keys';

export function useSkillsList() {
  return useQuery({
    queryKey: constructSkillsKeys.list(),
    queryFn: constructSkillsApi.list,
  });
}

export function useSkillDetail(skillName?: string, filePath?: string, enabled = false) {
  return useQuery({
    queryKey: constructSkillsKeys.detail(skillName, filePath),
    queryFn: () => constructSkillsApi.detail({ skill_name: skillName ?? '', file_path: filePath ?? '' }),
    enabled,
  });
}

function useInvalidateSkills() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: constructSkillsKeys.list() });
  };
}

export function useUploadSkill() {
  const invalidate = useInvalidateSkills();
  return useMutation({
    mutationFn: (payload: FormData) => constructSkillsApi.upload(payload),
    onSettled: invalidate,
  });
}

export function useImportGithubSkill() {
  const invalidate = useInvalidateSkills();
  return useMutation({
    mutationFn: (url: string) => constructSkillsApi.importGithub(url),
    onSettled: invalidate,
  });
}
