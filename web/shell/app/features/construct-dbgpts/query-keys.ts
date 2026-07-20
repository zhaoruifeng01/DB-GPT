export interface DbgptsListParams {
  activeKey: 'market' | 'my';
  searchValue: string;
  typeStr: string;
  pageNo: number;
  pageSize: number;
}

export const constructDbgptsKeys = {
  all: ['construct-dbgpts'] as const,
  lists: () => [...constructDbgptsKeys.all, 'list'] as const,
  list: (params: DbgptsListParams) => [...constructDbgptsKeys.lists(), params] as const,
};
