import MuiLoading from '@/components/common/loading';
import AddNodesSider from '@/components/flow/add-nodes-sider';
import ButtonEdge from '@/components/flow/button-edge';
import { AddFlowVariableModal } from '@/components/flow/canvas-modal/add-flow-variable-modal';
import { ExportFlowModal } from '@/components/flow/canvas-modal/export-flow-modal';
import { FlowTemplateModal } from '@/components/flow/canvas-modal/flow-template-modal';
import { ImportFlowModal } from '@/components/flow/canvas-modal/import-flow-modal';
import { SaveFlowModal } from '@/components/flow/canvas-modal/save-flow-modal';
import CanvasNode from '@/components/flow/canvas-node';
import type { IFlowData, IFlowUpdateParam } from '@/types/flow';
import { checkFlowDataRequied, getUniqueNodeId, mapUnderlineToHump } from '@/utils/flow';
import { ExportOutlined, FileAddOutlined, FrownOutlined, ImportOutlined, SaveOutlined } from '@ant-design/icons';
import { Divider, Space, Tooltip, message, notification } from 'antd';
import { DragEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactFlow, {
  Background,
  Connection,
  Controls,
  Node,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSearchParams } from 'react-router';

import { useFlowDetail } from '~/features/construct-flow/queries';

const nodeTypes = { customNode: CanvasNode };
const edgeTypes = { buttonedge: ButtonEdge };

function Canvas() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || '';
  const reactFlow = useReactFlow();
  const [messageApi, contextHolder] = message.useMessage();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [flowInfo, setFlowInfo] = useState<IFlowUpdateParam>();
  const [localLoading, setLocalLoading] = useState(false);
  const [isSaveFlowModalOpen, setIsSaveFlowModalOpen] = useState(false);
  const [isExportFlowModalOpen, setIsExportFlowModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportFlowModalOpen] = useState(false);
  const [isFlowTemplateModalOpen, setIsFlowTemplateModalOpen] = useState(false);
  const { data: flowDetail, isFetching } = useFlowDetail(id);

  const applyImportedFlowData = useCallback(
    (importFlowData: unknown) => {
      const data = importFlowData as IFlowUpdateParam | undefined;
      if (!data?.flow_data) return;
      const flowData = mapUnderlineToHump(data.flow_data);
      setFlowInfo(data);
      setNodes(flowData.nodes ?? []);
      setEdges(flowData.edges ?? []);
    },
    [setEdges, setNodes],
  );

  useEffect(() => {
    const raw = localStorage.getItem('importFlowData');
    if (!raw) return;
    try {
      applyImportedFlowData(JSON.parse(raw));
    } finally {
      localStorage.removeItem('importFlowData');
    }
  }, [applyImportedFlowData]);

  useEffect(() => {
    if (!flowDetail) return;
    const flowData = mapUnderlineToHump(flowDetail.flow_data);
    setFlowInfo(flowDetail);
    setNodes(flowData.nodes ?? []);
    setEdges(flowData.edges ?? []);
  }, [flowDetail, setEdges, setNodes]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.returnValue = message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  function onNodesClick(_: unknown, clickedNode: Node) {
    reactFlow.setNodes(nds =>
      nds.map(node => {
        if (node.id === clickedNode.id) {
          node.data = {
            ...node.data,
            selected: true,
          };
        } else {
          node.data = {
            ...node.data,
            selected: false,
          };
        }
        return node;
      }),
    );
  }

  function onConnect(connection: Connection) {
    const newEdge = {
      ...connection,
      type: 'buttonedge',
      id: `${connection.source}|${connection.target}`,
    };
    setEdges(eds => addEdge(newEdge, eds));
  }

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;
      const sidebarWidth = (document.getElementsByClassName('ant-layout-sider')?.[0] as HTMLElement | undefined)?.offsetWidth ?? 0;

      const nodeStr = event.dataTransfer.getData('application/reactflow');
      if (!nodeStr || typeof nodeStr === 'undefined') {
        return;
      }

      const nodeData = JSON.parse(nodeStr);
      const position = reactFlow.screenToFlowPosition({
        x: event.clientX - bounds.left + sidebarWidth,
        y: event.clientY - bounds.top,
      });
      const nodeId = getUniqueNodeId(nodeData, reactFlow.getNodes());
      nodeData.id = nodeId;
      const newNode = {
        id: nodeId,
        position,
        type: 'customNode',
        data: nodeData,
      };
      setNodes(nds =>
        nds.concat(newNode).map(node => {
          if (node.id === newNode.id) {
            node.data = {
              ...node.data,
              selected: true,
            };
          } else {
            node.data = {
              ...node.data,
              selected: false,
            };
          }
          return node;
        }),
      );
    },
    [reactFlow, setNodes],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  function onSave() {
    const flowData = reactFlow.toObject() as IFlowData;
    const [check, node, warningMessage] = checkFlowDataRequied(flowData);

    if (!node) {
      messageApi.open({
        type: 'warning',
        content: t('Please_Add_Nodes_First'),
      });
      return;
    }

    if (!check && warningMessage) {
      setNodes(nds =>
        nds.map(item => ({
          ...item,
          data: {
            ...item.data,
            invalid: item.id === node?.id,
          },
        })),
      );
      return notification.error({
        message: 'Error',
        description: warningMessage,
        icon: <FrownOutlined className='text-red-600' />,
      });
    }
    setIsSaveFlowModalOpen(true);
  }

  const getButtonList = () => {
    const buttonList = [
      {
        title: t('template'),
        icon: <FileAddOutlined className='block text-xl' onClick={() => setIsFlowTemplateModalOpen(true)} />,
      },
      {
        title: t('Import'),
        icon: <ImportOutlined className='block text-xl' onClick={() => setIsImportFlowModalOpen(true)} />,
      },
      {
        title: t('save'),
        icon: <SaveOutlined className='block text-xl' onClick={onSave} />,
      },
    ];

    if (id !== '') {
      buttonList.unshift({
        title: t('Export'),
        icon: <ExportOutlined className='block text-xl' onClick={() => setIsExportFlowModalOpen(true)} />,
      });
    }

    return buttonList;
  };

  return (
    <>
      <div className='flex flex-row'>
        <AddNodesSider />

        <div className='flex flex-col flex-1'>
          <Space className='my-2 mx-4 flex flex-row justify-end'>
            {getButtonList().map(({ title, icon }) => (
              <Tooltip
                key={title}
                title={title}
                className='w-8 h-8 rounded-md bg-stone-300 dark:bg-zinc-700 dark:text-zinc-200 hover:text-blue-500 dark:hover:text-zinc-100'
              >
                {icon}
              </Tooltip>
            ))}
          </Space>

          <Divider className='mt-0 mb-0' />

          <div className='h-[calc(100vh-48px)] w-full' ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodesClick}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              minZoom={0.1}
              fitView
              deleteKeyCode={['Backspace', 'Delete']}
            >
              <Controls className='flex flex-row items-center' position='bottom-center' />
              <Background color='#aaa' gap={16} />
              <AddFlowVariableModal flowInfo={flowInfo} setFlowInfo={setFlowInfo} />
            </ReactFlow>
          </div>
        </div>
      </div>

      <MuiLoading visible={isFetching || localLoading} />

      <SaveFlowModal
        reactFlow={reactFlow}
        flowInfo={flowInfo}
        isSaveFlowModalOpen={isSaveFlowModalOpen}
        setIsSaveFlowModalOpen={setIsSaveFlowModalOpen}
      />

      <ExportFlowModal
        reactFlow={reactFlow}
        flowInfo={flowInfo}
        isExportFlowModalOpen={isExportFlowModalOpen}
        setIsExportFlowModalOpen={setIsExportFlowModalOpen}
      />

      <ImportFlowModal
        setNodes={setNodes}
        setEdges={setEdges}
        isImportModalOpen={isImportModalOpen}
        setIsImportFlowModalOpen={setIsImportFlowModalOpen}
        onFlowDataImported={data => {
          setLocalLoading(true);
          applyImportedFlowData(data);
          setLocalLoading(false);
        }}
      />

      <FlowTemplateModal
        isFlowTemplateModalOpen={isFlowTemplateModalOpen}
        setIsFlowTemplateModalOpen={setIsFlowTemplateModalOpen}
        onTemplateImported={applyImportedFlowData}
      />

      {contextHolder}
    </>
  );
}

export default function FlowCanvasPage() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}
