export const constructConnectorsKeys = {
  all: ['construct-connectors'] as const,
  catalog: () => [...constructConnectorsKeys.all, 'catalog'] as const,
  list: () => [...constructConnectorsKeys.all, 'list'] as const,
  tools: (id?: string) => [...constructConnectorsKeys.all, 'tools', id ?? ''] as const,
};
