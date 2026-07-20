export const constructDatabaseKeys = {
  all: ['construct-database'] as const,
  list: () => [...constructDatabaseKeys.all, 'list'] as const,
  supportTypes: () => [...constructDatabaseKeys.all, 'support-types'] as const,
};
