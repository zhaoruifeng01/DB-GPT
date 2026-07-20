import { ModelType } from '@/types/chat';
import { DBType } from '@/types/db';
import { ModelIconInfo } from '@/types/model';

export const DEFAULT_ICON_URL = '/models/huggingface.svg';

export const MODEL_ICON_MAP: Record<ModelType, { label: string; icon: string }> = new Proxy({} as any, {
  get: (_target, prop) => {
    const modelId = prop as string;
    return {
      label: getModelLabel(modelId),
      icon: getModelIcon(modelId),
    };
  },
});

export const MODEL_ICON_INFO: Record<string, ModelIconInfo> = {
  deepseek: {
    label: 'DeepSeek',
    icon: '/models/deepseek.png',
    patterns: ['deepseek', 'r1'],
  },
  qwen: {
    label: 'Qwen',
    icon: '/models/qwen2.png',
    patterns: ['qwen', 'qwen2', 'qwen2.5', 'qwq', 'qvq'],
  },
  gemini: {
    label: 'Gemini',
    icon: '/models/gemini.png',
    patterns: ['gemini'],
  },
  moonshot: {
    label: 'Moonshot',
    icon: '/models/moonshot.png',
    patterns: ['moonshot', 'kimi'],
  },
  minimax: {
    label: 'MiniMax',
    icon: '/models/minimax.png',
    patterns: ['minimax', 'm3', 'm2.7'],
  },
  doubao: {
    label: 'Doubao',
    icon: '/models/doubao.png',
    patterns: ['doubao'],
  },
  ernie: {
    label: 'ERNIE',
    icon: '/models/ernie.png',
    patterns: ['ernie'],
  },
  proxyllm: {
    label: 'Proxy LLM',
    icon: '/models/chatgpt.png',
    patterns: ['proxy'],
  },
  chatgpt: {
    label: 'ChatGPT',
    icon: '/models/chatgpt.png',
    patterns: ['chatgpt', 'gpt', 'o1', 'o3'],
  },
  vicuna: {
    label: 'Vicuna',
    icon: '/models/vicuna.jpeg',
    patterns: ['vicuna'],
  },
  'glm-4': {
    label: 'GLM-4.7',
    icon: '/models/glm4.png',
    patterns: ['glm-4'],
  },
  chatglm: {
    label: 'ChatGLM',
    icon: '/models/chatglm.png',
    patterns: ['chatglm', 'glm'],
  },
  llama: {
    label: 'Llama',
    icon: '/models/llama.jpg',
    patterns: ['llama', 'llama2', 'llama3'],
  },
  baichuan: {
    label: 'Baichuan',
    icon: '/models/baichuan.png',
    patterns: ['baichuan'],
  },
  claude: {
    label: 'Claude',
    icon: '/models/claude.png',
    patterns: ['claude'],
  },
  bard: {
    label: 'Bard',
    icon: '/models/bard.gif',
    patterns: ['bard'],
  },
  tongyi: {
    label: 'Tongyi',
    icon: '/models/tongyi.apng',
    patterns: ['tongyi'],
  },
  yi: {
    label: 'Yi',
    icon: '/models/yi.svg',
    patterns: ['yi'],
  },
  bailing: {
    label: 'Bailing',
    icon: '/models/bailing.svg',
    patterns: ['bailing'],
  },
  wizardlm: {
    label: 'WizardLM',
    icon: '/models/wizardlm.png',
    patterns: ['wizard'],
  },
  internlm: {
    label: 'InternLM',
    icon: '/models/internlm.png',
    patterns: ['internlm'],
  },
  solar: {
    label: 'Solar',
    icon: '/models/solar_logo.png',
    patterns: ['solar'],
  },
  gorilla: {
    label: 'Gorilla',
    icon: '/models/gorilla.png',
    patterns: ['gorilla'],
  },
  zhipu: {
    label: 'Zhipu',
    icon: '/models/zhipu.png',
    patterns: ['zhipu'],
  },
  falcon: {
    label: 'Falcon',
    icon: '/models/falcon.jpeg',
    patterns: ['falcon'],
  },
  huggingface: {
    label: 'Hugging Face',
    icon: '/models/huggingface.svg',
    patterns: ['huggingface', 'hf'],
  },
};

export function getModelLabel(modelId: string): string {
  if (!modelId) return '';

  // 1. Try to match directly
  if (MODEL_ICON_INFO[modelId]?.label) {
    return MODEL_ICON_INFO[modelId].label;
  }

  // 2. Try to match by patterns to get the base name, then add version information
  const formattedModelId = modelId.toLowerCase();
  for (const key in MODEL_ICON_INFO) {
    const modelInfo = MODEL_ICON_INFO[key];

    if (modelInfo.patterns && modelInfo.patterns.some(pattern => formattedModelId.includes(pattern.toLowerCase()))) {
      // Try to extract version information from the model ID
      const versionMatch = modelId.match(/[-_](\d+b|\d+\.\d+b?|v\d+(\.\d+)?)/i);
      const sizePart = modelId.match(/[-_](\d+b)/i);

      // Build the display name
      let displayName = modelInfo.label;

      // Add version information
      if (versionMatch && !sizePart) {
        displayName += ` ${versionMatch[1]}`;
      }

      // Add size information
      if (sizePart) {
        displayName += ` ${sizePart[1]}`;
      }

      return displayName;
    }
  }

  // If no match
  return modelId;
}

export function getModelIcon(modelId: string): string {
  if (!modelId) return DEFAULT_ICON_URL;

  // Format the model ID for matching
  const formattedModelId = modelId.toLowerCase();

  // 1. Try to match directly
  if (MODEL_ICON_INFO[modelId]?.icon) {
    return MODEL_ICON_INFO[modelId].icon;
  }

  // 2. Try to match by patterns
  for (const key in MODEL_ICON_INFO) {
    const modelInfo = MODEL_ICON_INFO[key];

    // Check if the model ID contains one of the patterns
    if (modelInfo.patterns && modelInfo.patterns.some(pattern => formattedModelId.includes(pattern.toLowerCase()))) {
      return modelInfo.icon;
    }
  }

  // Try to match by the model prefix
  const modelParts = formattedModelId.split(/[-_]/);
  if (modelParts.length > 0) {
    const modelPrefix = modelParts[0];
    for (const key in MODEL_ICON_INFO) {
      if (modelPrefix === key.toLowerCase()) {
        return MODEL_ICON_INFO[key].icon;
      }
    }
  }

  // If no match, return the default icon
  return DEFAULT_ICON_URL;
}

export const dbMapper: Record<DBType, { label: string; icon: string; desc: string }> = {
  mysql: {
    label: 'MySQL',
    icon: '/icons/mysql.png',
    desc: '快速、可靠、可扩展的开源关系型数据库管理系统。',
  },
  oceanbase: {
    label: 'OceanBase',
    icon: '/icons/oceanbase.png',
    desc: '超快速且高性价比的分布式SQL数据库。',
  },
  mssql: {
    label: 'MSSQL',
    icon: '/icons/mssql.png',
    desc: '微软推出的强大、可扩展、安全的关系型数据库系统。',
  },
  duckdb: {
    label: 'DuckDB',
    icon: '/icons/duckdb.png',
    desc: '具有高效查询处理能力的内存分析型数据库。',
  },
  sqlite: {
    label: 'Sqlite',
    icon: '/icons/sqlite.png',
    desc: '轻量级嵌入式关系型数据库，简洁且可移植。',
  },
  clickhouse: {
    label: 'ClickHouse',
    icon: '/icons/clickhouse.png',
    desc: '面向高性能分析和实时查询的列式数据库。',
  },
  oracle: {
    label: 'Oracle',
    icon: '/icons/oracle.png',
    desc: '广泛应用于企业的健壮、可扩展、安全的关系型数据库。',
  },
  access: {
    label: 'Access',
    icon: '/icons/access.png',
    desc: '微软推出的易于使用的关系型数据库，适用于小型应用。',
  },
  mongodb: {
    label: 'MongoDB',
    icon: '/icons/mongodb.png',
    desc: '灵活、可扩展的NoSQL文档数据库，适用于Web和移动应用。',
  },
  doris: {
    label: 'ApacheDoris',
    icon: '/icons/doris.png',
    desc: '新一代开源实时数据仓库。',
  },
  starrocks: {
    label: 'StarRocks',
    icon: '/icons/starrocks.png',
    desc: '开源高性能分析型数据库。',
  },
  db2: { label: 'DB2', icon: '/icons/db2.png', desc: 'IBM开发的可扩展、安全的关系型数据库系统。' },
  hbase: {
    label: 'HBase',
    icon: '/icons/hbase.png',
    desc: '分布式、可扩展的NoSQL数据库，适用于大规模结构化/半结构化数据。',
  },
  redis: {
    label: 'Redis',
    icon: '/icons/redis.png',
    desc: '快速、多功能的内存数据结构存储，可用作缓存、数据库或消息代理。',
  },
  cassandra: {
    label: 'Cassandra',
    icon: '/icons/cassandra.png',
    desc: '可扩展、容错的分布式NoSQL数据库，适用于大规模数据。',
  },
  couchbase: {
    label: 'Couchbase',
    icon: '/icons/couchbase.png',
    desc: '高性能NoSQL文档数据库，采用分布式架构。',
  },
  omc: { label: 'Omc', icon: '/icons/odc.png', desc: 'Omc 元数据。' },
  postgresql: {
    label: 'PostgreSQL',
    icon: '/icons/postgresql.png',
    desc: '强大的开源关系型数据库，具有出色的可扩展性和SQL标准支持。',
  },
  gaussdb: {
    label: 'GaussDB',
    icon: '/icons/gaussdb.png',
    desc: '华为推出的兼容PostgreSQL的分布式数据库。',
  },
  openGauss: {
    label: 'openGauss',
    icon: '/icons/opengauss.png',
    desc: '兼容PostgreSQL的开源关系型数据库。',
  },
  vertica: {
    label: 'Vertica',
    icon: '/icons/vertica.png',
    desc: '强一致性、ACID合规的SQL数据仓库，为当今数据驱动世界的规模和复杂性而生。',
  },
  spark: { label: 'Spark', icon: '/icons/spark.png', desc: '大规模数据分析的统一引擎。' },
  hive: { label: 'Hive', icon: '/icons/hive.png', desc: '分布式容错数据仓库系统。' },
  maxcompute: {
    label: 'MaxCompute',
    icon: '/icons/db.png',
    desc: '阿里云提供的大规模数据仓库与计算服务。',
  },
  space: { label: 'Space', icon: '/icons/knowledge.png', desc: '知识库分析。' },
  tugraph: {
    label: 'TuGraph',
    icon: '/icons/tugraph.png',
    desc: '蚂蚁集团与清华大学联合研发的高性能图数据库。',
  },
  neo4j: {
    label: 'Neo4j',
    icon: '/icons/neo4j.png',
    desc: '高可扩展的原生图数据库，专为利用数据关系而构建。',
  },
  dataaworks: {
    label: 'DataWorks',
    icon: '/icons/db.png',
    desc: '阿里云一站式大数据开发与治理平台。',
  },
};
