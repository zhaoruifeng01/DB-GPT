import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ConnectorToolsQueryResult } from '@/new-components/connector/ConnectorToolsModal';
import type { CreateConnectorRequest } from '@/new-components/connector/types';
import { constructConnectorsApi } from './api';
import { constructConnectorsKeys } from './query-keys';

export function useConnectorCatalog() {
  return useQuery({
    queryKey: constructConnectorsKeys.catalog(),
    queryFn: constructConnectorsApi.types,
  });
}

export function useConnectorList() {
  return useQuery({
    queryKey: constructConnectorsKeys.list(),
    queryFn: constructConnectorsApi.list,
  });
}

function useInvalidateConnectors() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: constructConnectorsKeys.list() });
  };
}

export function useCreateConnector() {
  const invalidate = useInvalidateConnectors();
  return useMutation({
    mutationFn: (data: CreateConnectorRequest) => constructConnectorsApi.create(data),
    onSettled: invalidate,
  });
}

export function useUpdateConnector() {
  const invalidate = useInvalidateConnectors();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateConnectorRequest> }) =>
      constructConnectorsApi.update(id, data),
    onSettled: invalidate,
  });
}

export function useDeleteConnector() {
  const invalidate = useInvalidateConnectors();
  return useMutation({
    mutationFn: (id: string) => constructConnectorsApi.remove(id),
    onSettled: invalidate,
  });
}

export function useTestConnection() {
  const invalidate = useInvalidateConnectors();
  return useMutation({
    mutationFn: (id: string) => constructConnectorsApi.test(id),
    onSettled: invalidate,
  });
}

export function useConnectorToolsQuery(connectorId?: string): ConnectorToolsQueryResult {
  const query = useQuery({
    queryKey: constructConnectorsKeys.tools(connectorId),
    queryFn: () => constructConnectorsApi.tools(connectorId ?? ''),
    enabled: false,
  });

  return {
    data: query.data ?? null,
    loading: query.isFetching,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    refetch: () => query.refetch(),
  };
}
