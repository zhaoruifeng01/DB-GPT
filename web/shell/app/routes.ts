import type { RouteConfig } from '@react-router/dev/routes';

/**
 * Route registry for the shell.
 *
 * Migrated domains land here as route modules. Per ADR 0001 §中期: routes are
 * the strangler boundary - each migration adds a route here and removes the
 * corresponding page from the legacy Next app.
 *
 * `file` is relative to the app directory (app/). React Router v7 Framework
 * Mode resolves the module and its exports (default = component, meta, loader,
 * etc.). Each file must be unique - use a redirect loader for alias paths.
 */
export default [
  { path: '/', file: 'routes/index.tsx' },
  { path: '/health', file: 'routes/health.tsx' },
  { path: '/login', file: 'routes/login.tsx' },
  { path: '/governance', file: 'routes/governance.tsx' },
  { path: '/data_index', file: 'routes/data-index.tsx' },
  { path: '/evaluation', file: 'routes/evaluation.tsx' },
  { path: '/mobile/chat', file: 'routes/mobile-chat.tsx' },
  { path: '/share/:token', file: 'routes/share.tsx' },
  { path: '/playground', file: 'routes/playground.tsx' },
  { path: '/knowledge/graph', file: 'routes/knowledge-graph.tsx' },
  { path: '/models_evaluation', file: 'routes/models-evaluation.tsx' },
  { path: '/models_evaluation/datasets', file: 'routes/models-evaluation-datasets.tsx' },
  { path: '/models_evaluation/:code', file: 'routes/models-evaluation-detail.tsx' },
  { path: '/conversations', file: 'routes/conversations.tsx' },
  { path: '/chat', file: 'routes/chat.tsx' },
  { path: '/construct', file: 'routes/construct-index.tsx' },
  { path: '/construct/app', file: 'routes/construct-app.tsx' },
  { path: '/construct/app/extra', file: 'routes/construct-app-extra.tsx' },
  { path: '/construct/flow', file: 'routes/construct-flow.tsx' },
  { path: '/construct/flow/canvas', file: 'routes/construct-flow-canvas.tsx' },
  { path: '/construct/flow/libro', file: 'routes/construct-flow-libro.tsx' },
  { path: '/construct/knowledge', file: 'routes/construct-knowledge.tsx' },
  { path: '/construct/knowledge/chunk', file: 'routes/construct-knowledge-chunk.tsx' },
  { path: '/construct/database', file: 'routes/construct-database.tsx' },
  { path: '/construct/dbgpts', file: 'routes/construct-dbgpts.tsx' },
  { path: '/construct/connectors', file: 'routes/construct-connectors.tsx' },
  { path: '/construct/skills', file: 'routes/construct-skills.tsx' },
  { path: '/construct/permission', file: 'routes/construct-permission.tsx' },
  { path: '/construct/scheduled-tasks', file: 'routes/construct-scheduled-tasks.tsx' },
  { path: '/construct/scheduled-tasks/:taskId', file: 'routes/construct-scheduled-task-detail.tsx' },
  { path: '/construct/models', file: 'routes/construct-models.tsx' },
  { path: '/construct/prompt', file: 'routes/construct-prompt.tsx' },
  { path: '/construct/prompt/:type', file: 'routes/construct-prompt.$type.tsx' },
] satisfies RouteConfig;
