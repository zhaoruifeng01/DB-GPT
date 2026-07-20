import { DELETE, GET, POST, PUT } from '@dbgpt/shared';

import type {
  ConnectorCatalogEntry,
  ConnectorInstance,
  ConnectorToolsResponse,
  CreateConnectorRequest,
} from '@/new-components/connector/types';

const API_BASE = '/api/v2/serve/connectors';
const API_BASE_LIST = `${API_BASE}/`;

type BackendConnector = Omit<ConnectorInstance, 'id'> & { connector_id: string };

function normalizeConnector(raw: BackendConnector): ConnectorInstance {
  const { connector_id, ...rest } = raw;
  return {
    id: connector_id,
    ...rest,
    is_custom: raw.is_custom ?? false,
  } as ConnectorInstance;
}

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

export const constructConnectorsApi = {
  types: () => unwrap<ConnectorCatalogEntry[]>(GET(`${API_BASE}/types`)),
  list: async () => {
    const data = await unwrap<BackendConnector[]>(GET(API_BASE_LIST));
    return (data ?? []).map(normalizeConnector);
  },
  create: async (data: CreateConnectorRequest) => {
    const res = await unwrap<BackendConnector>(POST(API_BASE_LIST, data));
    return normalizeConnector(res);
  },
  update: async (id: string, data: Partial<CreateConnectorRequest>) => {
    const res = await unwrap<BackendConnector>(PUT(`${API_BASE}/${id}`, data));
    return normalizeConnector(res);
  },
  remove: (id: string) => unwrap<unknown>(DELETE(`${API_BASE}/${id}`)),
  test: (id: string) => unwrap<{ success: boolean; message: string }>(POST(`${API_BASE}/${id}/test`)),
  tools: (id: string) => unwrap<ConnectorToolsResponse>(GET(`${API_BASE}/${id}/tools`)),
};
