export const constructSkillsKeys = {
  all: ['construct-skills'] as const,
  list: () => [...constructSkillsKeys.all, 'list'] as const,
  detail: (skillName?: string, filePath?: string) =>
    [...constructSkillsKeys.all, 'detail', skillName ?? '', filePath ?? ''] as const,
};
