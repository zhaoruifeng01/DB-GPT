-- DB-GPT v0.8.1 数据库Schema（中文注释版）
-- 使用前请先创建数据库并切换：
-- CREATE DATABASE IF NOT EXISTS your_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE your_db;

-- Alembic数据库迁移版本记录表
CREATE TABLE IF NOT EXISTS `alembic_version`
(
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
) DEFAULT CHARSET=utf8mb4 ;

-- 知识空间表
CREATE TABLE IF NOT EXISTS `knowledge_space`
(
    `id`           int          NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    `name`         varchar(100) NOT NULL COMMENT '知识空间名称',
    `vector_type`  varchar(50)  NOT NULL COMMENT '向量类型',
    `domain_type`  varchar(50)  NOT NULL COMMENT '领域类型',
    `desc`         varchar(500) NOT NULL COMMENT '描述',
    `owner`        varchar(100) DEFAULT NULL COMMENT '所有者',
    `context`      TEXT         DEFAULT NULL COMMENT '上下文参数',
    `gmt_created`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `gmt_modified` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY            `idx_name` (`name`) COMMENT '索引：知识空间名称'
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='知识空间表';

-- 知识文档表
CREATE TABLE IF NOT EXISTS `knowledge_document`
(
    `id`           int          NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    `doc_name`     varchar(100) NOT NULL COMMENT '文档路径名称',
    `doc_type`     varchar(50)  NOT NULL COMMENT '文档类型',
    `doc_token`    varchar(100) NULL COMMENT '文档令牌',
    `space`        varchar(50)  NOT NULL COMMENT '所属知识空间',
    `chunk_size`   int          NOT NULL COMMENT '分块大小',
    `last_sync`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后同步时间',
    `status`       varchar(50)  NOT NULL COMMENT '状态：TODO/RUNNING/FAILED/FINISHED',
    `content`      LONGTEXT     NOT NULL COMMENT '知识嵌入同步结果',
    `result`       TEXT NULL COMMENT '知识内容',
    `questions`    TEXT NULL COMMENT '文档相关问题',
    `vector_ids`   LONGTEXT NULL COMMENT '向量ID列表',
    `summary`      LONGTEXT NULL COMMENT '知识摘要',
    `gmt_created`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `gmt_modified` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY            `idx_doc_name` (`doc_name`) COMMENT '索引：文档名称'
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='知识文档表';

-- 文档分块详情表
CREATE TABLE IF NOT EXISTS `document_chunk`
(
    `id`           int          NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    `doc_name`     varchar(100) NOT NULL COMMENT '文档路径名称',
    `doc_type`     varchar(50)  NOT NULL COMMENT '文档类型',
    `document_id`  int          NOT NULL COMMENT '所属文档ID',
    `content`      longtext     NOT NULL COMMENT '分块内容',
    `questions`    text         NULL COMMENT '分块相关问题',
    `meta_info`    text NOT NULL COMMENT '元数据信息',
    `gmt_created`  timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `gmt_modified` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY            `idx_document_id` (`document_id`) COMMENT '索引：文档ID'
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='文档分块详情表';

-- 数据源连接配置表
CREATE TABLE IF NOT EXISTS `connect_config`
(
    `id`       int          NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    `db_type`  varchar(255) NOT NULL COMMENT '数据库类型',
    `db_name`  varchar(255) NOT NULL COMMENT '数据库名称',
    `db_path`  varchar(255) DEFAULT NULL COMMENT '文件型数据库路径',
    `db_host`  varchar(255) DEFAULT NULL COMMENT '数据库连接主机地址',
    `db_port`  varchar(255) DEFAULT NULL COMMENT '数据库连接端口',
    `db_user`  varchar(255) DEFAULT NULL COMMENT '数据库用户名',
    `db_pwd`   varchar(255) DEFAULT NULL COMMENT '数据库密码',
    `comment`  text COMMENT '数据库备注',
    `sys_code` varchar(128) DEFAULT NULL COMMENT '系统编码',
    `user_name`  varchar(255) DEFAULT NULL COMMENT '用户名',
    `user_id`  varchar(255) DEFAULT NULL COMMENT '用户ID',
    `gmt_created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `ext_config` text COMMENT '扩展配置，JSON格式',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_db` (`db_name`),
    KEY        `idx_q_db_type` (`db_type`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='数据源连接配置表';

-- 对话历史表
CREATE TABLE IF NOT EXISTS `chat_history`
(
    `id`        int                                     NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    `conv_uid`  varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '对话记录唯一ID',
    `chat_mode` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '对话场景模式',
    `summary`   longtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '对话记录摘要',
    `user_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '对话用户',
    `messages`  text COLLATE utf8mb4_unicode_ci COMMENT '对话详情',
    `message_ids` text COLLATE utf8mb4_unicode_ci COMMENT '消息ID列表，逗号分隔',
    `app_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '应用唯一编码',
    `sys_code`  varchar(128)                            DEFAULT NULL COMMENT '系统编码',
    `gmt_created`  timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `gmt_modified` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY `conv_uid` (`conv_uid`),
    PRIMARY KEY (`id`),
    KEY `idx_chat_his_app_code` (`app_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对话历史表';

-- 对话历史消息表
CREATE TABLE IF NOT EXISTS `chat_history_message`
(
    `id`             int                                     NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    `conv_uid`       varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '对话记录唯一ID',
    `index`          int                                     NOT NULL COMMENT '消息序号',
    `round_index`    int                                     NOT NULL COMMENT '对话轮次',
    `message_detail` longtext COLLATE utf8mb4_unicode_ci COMMENT '消息详情，JSON格式',
    `gmt_created`  timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `gmt_modified` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY `message_uid_index` (`conv_uid`, `index`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对话历史消息表';

-- 用户反馈表
CREATE TABLE IF NOT EXISTS `chat_feed_back`
(
    `id`              bigint(20) NOT NULL AUTO_INCREMENT,
    `conv_uid`        varchar(128) DEFAULT NULL COMMENT '对话ID',
    `conv_index`      int(4) DEFAULT NULL COMMENT '对话轮次',
    `score`           int(1) DEFAULT NULL COMMENT '用户评分',
    `ques_type`       varchar(32)  DEFAULT NULL COMMENT '用户问题分类',
    `question`        longtext     DEFAULT NULL COMMENT '用户问题',
    `knowledge_space` varchar(128) DEFAULT NULL COMMENT '知识空间名称',
    `messages`        longtext     DEFAULT NULL COMMENT '用户反馈详情',
    `message_id`      varchar(255)  NULL COMMENT '消息ID',
    `feedback_type`   varchar(50)  NULL COMMENT '反馈类型：点赞/点踩',
    `reason_types`    varchar(255)  NULL COMMENT '反馈原因分类',
    `remark`          text          NULL COMMENT '反馈备注',
    `user_code`       varchar(128)  NULL COMMENT '用户编码',
    `user_name`       varchar(128) DEFAULT NULL COMMENT '用户名',
    `gmt_created`     timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `gmt_modified`    timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_conv` (`conv_uid`,`conv_index`),
    KEY               `idx_conv` (`conv_uid`,`conv_index`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='用户反馈表';

-- 用户插件表
CREATE TABLE IF NOT EXISTS `my_plugin`
(
    `id`          int                                     NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    `tenant`      varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户租户',
    `user_code`   varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户编码',
    `user_name`   varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户名',
    `name`        varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '插件名称',
    `file_name`   varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '插件包文件名',
    `type`        varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '插件类型',
    `version`     varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '插件版本',
    `use_count`   int                                     DEFAULT NULL COMMENT '插件总使用次数',
    `succ_count`  int                                     DEFAULT NULL COMMENT '插件总成功次数',
    `sys_code`    varchar(128)                            DEFAULT NULL COMMENT '系统编码',
    `gmt_created` TIMESTAMP                               DEFAULT CURRENT_TIMESTAMP COMMENT '插件安装时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户插件表';

-- 插件市场表
CREATE TABLE IF NOT EXISTS `plugin_hub`
(
    `id`              int                                     NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    `name`            varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '插件名称',
    `description`     varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '插件描述',
    `author`          varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '插件作者',
    `email`           varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '插件作者邮箱',
    `type`            varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '插件类型',
    `version`         varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '插件版本',
    `storage_channel` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '插件存储渠道',
    `storage_url`     varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '插件下载地址',
    `download_param`  varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '插件下载参数',
    `gmt_created`     TIMESTAMP                               DEFAULT CURRENT_TIMESTAMP COMMENT '插件上传时间',
    `installed`       int                                     DEFAULT NULL COMMENT '插件已安装次数',
    PRIMARY KEY (`id`),
    UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='插件市场表';

-- 提示词管理表
CREATE TABLE IF NOT EXISTS `prompt_manage`
(
    `id`             int(11) NOT NULL AUTO_INCREMENT,
    `chat_scene`     varchar(100) DEFAULT NULL COMMENT '对话场景',
    `sub_chat_scene` varchar(100) DEFAULT NULL COMMENT '子对话场景',
    `prompt_type`    varchar(100) DEFAULT NULL COMMENT '提示词类型：公共或私有',
    `prompt_name`    varchar(256) DEFAULT NULL COMMENT '提示词名称',
    `prompt_code`    varchar(256) DEFAULT NULL COMMENT '提示词编码',
    `content`        longtext COMMENT '提示词内容',
    `input_variables` varchar(1024) DEFAULT NULL COMMENT '提示词输入变量（逗号分隔）',
    `response_schema` text  DEFAULT NULL COMMENT '提示词响应Schema',
    `model` varchar(128) DEFAULT NULL COMMENT '提示词关联模型名称（不同提示词可使用不同模型）',
    `prompt_language` varchar(32) DEFAULT NULL COMMENT '提示词语言（如：en、zh-cn）',
    `prompt_format` varchar(32) DEFAULT 'f-string' COMMENT '提示词格式（如：f-string、jinja2）',
    `prompt_desc`    varchar(512) DEFAULT NULL COMMENT '提示词描述',
    `user_code`     varchar(128) DEFAULT NULL COMMENT '用户编码',
    `user_name`      varchar(128) DEFAULT NULL COMMENT '用户名',
    `sys_code`       varchar(128)                            DEFAULT NULL COMMENT '系统编码',
    `gmt_created`    timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `gmt_modified`   timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `prompt_name_uiq` (`prompt_name`, `sys_code`, `prompt_language`, `model`),
    KEY              `gmt_created_idx` (`gmt_created`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='提示词管理表';

-- GPT对话记录表
CREATE TABLE IF NOT EXISTS `gpts_conversations` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `conv_id` varchar(255) NOT NULL COMMENT '对话记录唯一ID',
  `user_goal` text NOT NULL COMMENT '用户目标内容',
  `gpts_name` varchar(255) NOT NULL COMMENT 'GPT应用名称',
  `state` varchar(255) DEFAULT NULL COMMENT 'GPT应用状态',
  `max_auto_reply_round` int(11) NOT NULL COMMENT '最大自动回复轮次',
  `auto_reply_count` int(11) NOT NULL COMMENT '自动回复计数',
  `user_code` varchar(255) DEFAULT NULL COMMENT '用户编码',
  `sys_code` varchar(255) DEFAULT NULL COMMENT '系统应用编码',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '最后更新时间',
  `team_mode` varchar(255) NULL COMMENT 'Agent团队工作模式',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_gpts_conversations` (`conv_id`),
  KEY `idx_gpts_name` (`gpts_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='GPT对话记录表';

-- GPT实例表
CREATE TABLE IF NOT EXISTS `gpts_instance` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `gpts_name` varchar(255) NOT NULL COMMENT '当前AI助手名称',
  `gpts_describe` varchar(2255) NOT NULL COMMENT '当前AI助手描述',
  `resource_db` text COMMENT '当前GPT包含的结构化数据库名称列表',
  `resource_internet` text COMMENT '是否可以从互联网检索信息',
  `resource_knowledge` text COMMENT '当前GPT包含的非结构化知识库名称列表',
  `gpts_agents` varchar(1000) DEFAULT NULL COMMENT '当前GPT包含的Agent名称列表',
  `gpts_models` varchar(1000) DEFAULT NULL COMMENT '当前GPT包含的LLM模型名称列表',
  `language` varchar(100) DEFAULT NULL COMMENT 'GPT应用语言',
  `user_code` varchar(255) NOT NULL COMMENT '用户编码',
  `sys_code` varchar(255) DEFAULT NULL COMMENT '系统应用编码',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '最后更新时间',
  `team_mode` varchar(255) NOT NULL COMMENT '团队工作模式',
  `is_sustainable` tinyint(1) NOT NULL COMMENT '是否支持持续对话',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_gpts` (`gpts_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='GPT实例表';

-- GPT消息表
CREATE TABLE IF NOT EXISTS `gpts_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `conv_id` varchar(255) NOT NULL COMMENT '对话记录唯一ID',
  `sender` varchar(255) NOT NULL COMMENT '当前对话轮次的发言者',
  `receiver` varchar(255) NOT NULL COMMENT '当前对话轮次的接收者',
  `model_name` varchar(255) DEFAULT NULL COMMENT '消息生成模型',
  `rounds` int(11) NOT NULL COMMENT '对话轮次',
  `is_success` int(4)  NULL DEFAULT 0 COMMENT 'Agent消息是否成功',
  `app_code` varchar(255) NOT NULL COMMENT '当前AI助手编码',
  `app_name` varchar(255) NOT NULL COMMENT '当前AI助手名称',
  `content` text COMMENT '发言内容',
  `current_goal` text COMMENT '当前消息对应的目标',
  `context` text COMMENT '当前对话上下文',
  `review_info` text COMMENT '当前对话审核信息',
  `action_report` longtext COMMENT '当前对话动作报告',
  `resource_info` text DEFAULT NULL COMMENT '当前对话资源信息',
  `role` varchar(255) DEFAULT NULL COMMENT '当前消息内容的角色',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '最后更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_q_messages` (`conv_id`,`rounds`,`sender`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='GPT消息表';

-- GPT计划表
CREATE TABLE IF NOT EXISTS `gpts_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `conv_id` varchar(255) NOT NULL COMMENT '对话记录唯一ID',
  `sub_task_num` int(11) NOT NULL COMMENT '子任务编号',
  `sub_task_title` varchar(255) NOT NULL COMMENT '子任务标题',
  `sub_task_content` text NOT NULL COMMENT '子任务内容',
  `sub_task_agent` varchar(255) DEFAULT NULL COMMENT '子任务对应的可用Agent',
  `resource_name` varchar(255) DEFAULT NULL COMMENT '资源名称',
  `rely` varchar(255) DEFAULT NULL COMMENT '子任务依赖，如：1,2,3',
  `agent_model` varchar(255) DEFAULT NULL COMMENT '子任务处理Agent使用的LLM模型',
  `retry_times` int(11) DEFAULT NULL COMMENT '重试次数',
  `max_retry_times` int(11) DEFAULT NULL COMMENT '最大重试次数',
  `state` varchar(255) DEFAULT NULL COMMENT '子任务状态',
  `result` longtext COMMENT '子任务结果',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '最后更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sub_task` (`conv_id`,`sub_task_num`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='GPT计划表';

-- 工作流定义表
CREATE TABLE IF NOT EXISTS `dbgpt_serve_flow` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `uid` varchar(128) NOT NULL COMMENT '唯一标识',
  `dag_id` varchar(128) DEFAULT NULL COMMENT 'DAG标识',
  `name` varchar(128) DEFAULT NULL COMMENT '工作流名称',
  `flow_data` longtext COMMENT '工作流数据，JSON格式',
  `user_name` varchar(128) DEFAULT NULL COMMENT '用户名',
  `sys_code` varchar(128) DEFAULT NULL COMMENT '系统编码',
  `gmt_created` datetime DEFAULT NULL COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT NULL COMMENT '更新时间',
  `flow_category` varchar(64) DEFAULT NULL COMMENT '工作流分类',
  `description` varchar(512) DEFAULT NULL COMMENT '工作流描述',
  `state` varchar(32) DEFAULT NULL COMMENT '工作流状态',
  `error_message` varchar(512) NULL COMMENT '错误信息',
  `source` varchar(64) DEFAULT NULL COMMENT '工作流来源',
  `source_url` varchar(512) DEFAULT NULL COMMENT '工作流来源地址',
  `version` varchar(32) DEFAULT NULL COMMENT '工作流版本',
  `define_type` varchar(32) NULL COMMENT '工作流定义类型（json或python）',
  `label` varchar(128) DEFAULT NULL COMMENT '工作流标签',
  `editable` int DEFAULT NULL COMMENT '是否可编辑，0：可编辑，1：不可编辑',
  `variables` text DEFAULT NULL COMMENT '工作流变量，JSON格式',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_uid` (`uid`),
  KEY `ix_dbgpt_serve_flow_sys_code` (`sys_code`),
  KEY `ix_dbgpt_serve_flow_uid` (`uid`),
  KEY `ix_dbgpt_serve_flow_dag_id` (`dag_id`),
  KEY `ix_dbgpt_serve_flow_user_name` (`user_name`),
  KEY `ix_dbgpt_serve_flow_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流定义表';

-- 文件服务表
CREATE TABLE IF NOT EXISTS `dbgpt_serve_file` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `bucket` varchar(255) NOT NULL COMMENT '存储桶名称',
  `file_id` varchar(255) NOT NULL COMMENT '文件ID',
  `file_name` varchar(256) NOT NULL COMMENT '文件名称',
  `file_size` int DEFAULT NULL COMMENT '文件大小',
  `storage_type` varchar(32) NOT NULL COMMENT '存储类型',
  `storage_path` varchar(512) NOT NULL COMMENT '存储路径',
  `uri` varchar(512) NOT NULL COMMENT '文件URI',
  `custom_metadata` text DEFAULT NULL COMMENT '自定义元数据，JSON格式',
  `file_hash` varchar(128) DEFAULT NULL COMMENT '文件哈希值',
  `user_name` varchar(128) DEFAULT NULL COMMENT '用户名',
  `sys_code` varchar(128) DEFAULT NULL COMMENT '系统编码',
  `gmt_created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_bucket_file_id` (`bucket`, `file_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件服务表';

-- 变量管理表
CREATE TABLE IF NOT EXISTS `dbgpt_serve_variables` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `key` varchar(128) NOT NULL COMMENT '变量键名',
  `name` varchar(128) DEFAULT NULL COMMENT '变量名称',
  `label` varchar(128) DEFAULT NULL COMMENT '变量标签',
  `value` text DEFAULT NULL COMMENT '变量值，JSON格式',
  `value_type` varchar(32) DEFAULT NULL COMMENT '变量值类型（string/int/float/bool）',
  `category` varchar(32) DEFAULT 'common' COMMENT '变量分类（common：普通，secret：密钥）',
  `encryption_method` varchar(32) DEFAULT NULL COMMENT '变量加密方式（fernet/simple/rsa/aes）',
  `salt` varchar(128) DEFAULT NULL COMMENT '变量加密盐值',
  `scope` varchar(32) DEFAULT 'global' COMMENT '变量作用域（global/flow/app/agent/datasource/flow_priv/agent_priv等）',
  `scope_key` varchar(256) DEFAULT NULL COMMENT '变量作用域键，默认为空，当作用域为flow_priv时为工作流的DAG ID',
  `enabled` int DEFAULT 1 COMMENT '是否启用，0：禁用，1：启用',
  `description` text DEFAULT NULL COMMENT '变量描述',
  `user_name` varchar(128) DEFAULT NULL COMMENT '用户名',
  `sys_code` varchar(128) DEFAULT NULL COMMENT '系统编码',
  `gmt_created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `ix_your_table_name_key` (`key`),
  KEY `ix_your_table_name_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='变量管理表';

-- 模型持久化表
CREATE TABLE IF NOT EXISTS `dbgpt_serve_model` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `host` varchar(255) NOT NULL COMMENT '模型Worker主机地址',
  `port` int NOT NULL COMMENT '模型Worker端口',
  `model` varchar(255) NOT NULL COMMENT '模型名称',
  `provider` varchar(255) NOT NULL COMMENT '模型提供者',
  `worker_type` varchar(255) NOT NULL COMMENT 'Worker类型',
  `params` text NOT NULL COMMENT '模型参数，JSON格式',
  `enabled` int DEFAULT 1 COMMENT '是否启用，启用后系统启动时自动加载，1：启用，0：禁用',
  `worker_name` varchar(255) DEFAULT NULL COMMENT 'Worker名称',
  `description` text DEFAULT NULL COMMENT '模型描述',
  `user_name` varchar(128) DEFAULT NULL COMMENT '用户名',
  `sys_code` varchar(128) DEFAULT NULL COMMENT '系统编码',
  `gmt_created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_name` (`user_name`),
  KEY `idx_sys_code` (`sys_code`),
  UNIQUE KEY `uk_model_provider_type` (`model`, `provider`, `worker_type`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模型持久化表';

-- GPT应用表
CREATE TABLE IF NOT EXISTS `gpts_app` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `app_code` varchar(255) NOT NULL COMMENT '当前AI助手编码',
  `app_name` varchar(255) NOT NULL COMMENT '当前AI助手名称',
  `app_describe` varchar(2255) NOT NULL COMMENT '当前AI助手描述',
  `language` varchar(100) NOT NULL COMMENT 'GPT应用语言',
  `team_mode` varchar(255) NOT NULL COMMENT '团队工作模式',
  `team_context` text COMMENT '不同工作模式团队依赖的执行逻辑和团队成员内容',
  `user_code` varchar(255) DEFAULT NULL COMMENT '用户编码',
  `sys_code` varchar(255) DEFAULT NULL COMMENT '系统应用编码',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '最后更新时间',
  `icon` varchar(1024) DEFAULT NULL COMMENT '应用图标URL',
  `published` varchar(64) DEFAULT 'false' COMMENT '是否已发布',
  `param_need` text DEFAULT NULL COMMENT '应用支持的参数信息',
  `admins` text DEFAULT NULL COMMENT '管理员',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_gpts_app` (`app_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='GPT应用表';

-- GPT应用收藏表
CREATE TABLE IF NOT EXISTS `gpts_app_collection` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `app_code` varchar(255) NOT NULL COMMENT '当前AI助手编码',
  `user_code` int(11) NOT NULL COMMENT '用户编码',
  `sys_code` varchar(255) NULL COMMENT '系统应用编码',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '最后更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_app_code` (`app_code`),
  KEY `idx_user_code` (`user_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='GPT应用收藏表';

-- GPT应用详情表
CREATE TABLE IF NOT EXISTS `gpts_app_detail` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `app_code` varchar(255) NOT NULL COMMENT '当前AI助手编码',
  `app_name` varchar(255) NOT NULL COMMENT '当前AI助手名称',
  `agent_name` varchar(255) NOT NULL COMMENT 'Agent名称',
  `node_id` varchar(255) NOT NULL COMMENT '当前AI助手Agent节点ID',
  `resources` text COMMENT 'Agent绑定的资源',
  `prompt_template` text COMMENT 'Agent绑定的提示词模板',
  `llm_strategy` varchar(25) DEFAULT NULL COMMENT 'Agent使用的LLM策略',
  `llm_strategy_value` text COMMENT 'Agent使用的LLM策略值',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '最后更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_gpts_app_agent_node` (`app_name`,`agent_name`,`node_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='GPT应用详情表';

-- 集群模型注册实例表
CREATE TABLE IF NOT EXISTS `dbgpt_cluster_registry_instance` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `model_name` varchar(128) NOT NULL COMMENT '模型名称',
  `host` varchar(128) NOT NULL COMMENT '模型主机地址',
  `port` int(11) NOT NULL COMMENT '模型端口',
  `weight` float DEFAULT 1.0 COMMENT '模型权重',
  `check_healthy` tinyint(1) DEFAULT 1 COMMENT '是否检查模型健康状态',
  `healthy` tinyint(1) DEFAULT 0 COMMENT '模型是否健康',
  `enabled` tinyint(1) DEFAULT 1 COMMENT '模型是否启用',
  `prompt_template` varchar(128) DEFAULT NULL COMMENT '模型实例的提示词模板',
  `last_heartbeat` datetime DEFAULT NULL COMMENT '模型实例最后心跳时间',
  `user_name` varchar(128) DEFAULT NULL COMMENT '用户名',
  `sys_code` varchar(128) DEFAULT NULL COMMENT '系统编码',
  `gmt_created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model_instance` (`model_name`, `host`, `port`, `sys_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='集群模型注册实例表，用于注册和管理模型实例';

-- 推荐问题表
CREATE TABLE IF NOT EXISTS `recommend_question` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `gmt_create` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `app_code` varchar(255) NOT NULL COMMENT '当前AI助手编码',
  `question` text DEFAULT NULL COMMENT '推荐问题',
  `user_code` varchar(255) NOT NULL COMMENT '用户编码',
  `sys_code` varchar(255) NULL COMMENT '系统应用编码',
  `valid` varchar(10) DEFAULT 'true' COMMENT '是否有效，true/false',
  `chat_mode` varchar(255) DEFAULT NULL COMMENT '对话场景模式，如chat_knowledge等',
  `params` text DEFAULT NULL COMMENT '问题参数',
  `is_hot_question` varchar(10) DEFAULT 'false' COMMENT '是否为热门推荐问题',
  PRIMARY KEY (`id`),
  KEY `idx_rec_q_app_code` (`app_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI应用推荐问题表';

-- 用户最近使用应用表
CREATE TABLE IF NOT EXISTS `user_recent_apps` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `gmt_create` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `app_code` varchar(255) NOT NULL COMMENT 'AI助手编码',
  `last_accessed` timestamp NULL DEFAULT NULL COMMENT '用户最近使用时间',
  `user_code` varchar(255) DEFAULT NULL COMMENT '用户编码',
  `sys_code` varchar(255) DEFAULT NULL COMMENT '系统应用编码',
  PRIMARY KEY (`id`),
  KEY `idx_user_r_app_code` (`app_code`),
  KEY `idx_last_accessed` (`last_accessed`),
  KEY `idx_user_code` (`user_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户最近使用应用表';

-- 我的DBGPTs插件表
CREATE TABLE IF NOT EXISTS `dbgpt_serve_dbgpts_my` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `name` varchar(255)  NOT NULL COMMENT '插件名称',
  `user_code` varchar(255)  DEFAULT NULL COMMENT '用户编码',
  `user_name` varchar(255)  DEFAULT NULL COMMENT '用户名',
  `file_name` varchar(255)  NOT NULL COMMENT '插件包文件名',
  `type` varchar(255)  DEFAULT NULL COMMENT '插件类型',
  `version` varchar(255)  DEFAULT NULL COMMENT '插件版本',
  `use_count` int DEFAULT NULL COMMENT '插件总使用次数',
  `succ_count` int DEFAULT NULL COMMENT '插件总成功次数',
  `sys_code` varchar(128) DEFAULT NULL COMMENT '系统编码',
  `gmt_created` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '插件安装时间',
  `gmt_modified` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`, `user_name`),
  KEY `ix_my_plugin_sys_code` (`sys_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='我的DBGPTs插件表';

-- DBGPTs插件市场表
CREATE TABLE IF NOT EXISTS `dbgpt_serve_dbgpts_hub` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `name` varchar(255) NOT NULL COMMENT '插件名称',
  `description` varchar(255)  NULL COMMENT '插件描述',
  `author` varchar(255) DEFAULT NULL COMMENT '插件作者',
  `email` varchar(255) DEFAULT NULL COMMENT '插件作者邮箱',
  `type` varchar(255) DEFAULT NULL COMMENT '插件类型',
  `version` varchar(255) DEFAULT NULL COMMENT '插件版本',
  `storage_channel` varchar(255) DEFAULT NULL COMMENT '插件存储渠道',
  `storage_url` varchar(255) DEFAULT NULL COMMENT '插件下载地址',
  `download_param` varchar(255) DEFAULT NULL COMMENT '插件下载参数',
  `gmt_created` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '插件上传时间',
  `gmt_modified` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `installed` int DEFAULT NULL COMMENT '插件已安装次数',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='DBGPTs插件市场表';

-- 评测管理表
CREATE TABLE IF NOT EXISTS `evaluate_manage` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `evaluate_code` varchar(256) NOT NULL COMMENT '评测唯一编码',
  `scene_key` varchar(100)  DEFAULT NULL COMMENT '场景键',
  `scene_value` varchar(256) DEFAULT NULL COMMENT '场景值',
  `context` text DEFAULT NULL COMMENT '上下文',
  `evaluate_metrics` varchar(599) DEFAULT NULL COMMENT '评测指标',
  `datasets_name` varchar(256) DEFAULT NULL COMMENT '数据集名称',
  `datasets` text DEFAULT NULL COMMENT '数据集内容',
  `storage_type` varchar(256) DEFAULT NULL COMMENT '结果存储类型',
  `parallel_num` int DEFAULT NULL COMMENT '执行并行线程数',
  `state` VARCHAR(100) DEFAULT NULL COMMENT '执行状态',
  `result` text DEFAULT NULL COMMENT '评测结果',
  `log_info` text DEFAULT NULL COMMENT '评测错误日志',
  `average_score` text DEFAULT NULL COMMENT '指标平均分',
  `user_id` varchar(100) DEFAULT NULL COMMENT '用户ID',
  `user_name` varchar(128) DEFAULT NULL COMMENT '用户名',
  `sys_code` varchar(128) DEFAULT NULL COMMENT '系统编码',
  `gmt_create` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '评测创建时间',
  `gmt_modified` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '评测完成时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_evaluate` (`evaluate_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评测管理表';

-- 基准测试摘要表
CREATE TABLE IF NOT EXISTS `benchmark_summary` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `round_id` int NOT NULL COMMENT '任务轮次ID',
  `output_path` varchar(512)  NULL COMMENT '输出文件路径',
  `right` int DEFAULT NULL COMMENT '正确数量',
  `wrong` int DEFAULT NULL COMMENT '错误数量',
  `failed` int DEFAULT NULL COMMENT '失败数量',
  `exception` int DEFAULT NULL COMMENT '异常数量',
  `llm_code` varchar(256) DEFAULT NULL COMMENT '基准测试LLM编码',
  `evaluate_code` varchar(256) DEFAULT NULL COMMENT '基准测试评测编码',
  `gmt_created` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '基准测试创建时间',
  `gmt_modified` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '基准测试完成时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='基准测试摘要表';

-- 对话分享链接表
CREATE TABLE IF NOT EXISTS `share_links` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `token` varchar(64) NOT NULL COMMENT '唯一随机分享令牌',
  `conv_uid` varchar(255) NOT NULL COMMENT '被分享的对话UID',
  `created_by` varchar(255) DEFAULT NULL COMMENT '创建分享链接的用户',
  `gmt_created` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_share_token` (`token`),
  KEY `ix_share_links_token` (`token`),
  KEY `ix_share_links_conv_uid` (`conv_uid`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对话分享链接表';

-- MCP连接器实例表
CREATE TABLE IF NOT EXISTS `connector_instance` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `connector_id` varchar(64) NOT NULL COMMENT '连接器UUID',
  `connector_type` varchar(64) NOT NULL COMMENT '连接器类型，如yuque/feishu/custom_mcp',
  `display_name` varchar(256) DEFAULT NULL COMMENT '显示名称',
  `encrypted_credentials` text COMMENT '加密凭证JSON',
  `encryption_salt` varchar(256) DEFAULT NULL COMMENT '加密盐值',
  `status` varchar(32) DEFAULT NULL COMMENT '状态：active/error/disconnected/needs_reactivation',
  `config_json` text COMMENT '扩展配置JSON（server_uri/transport/description/auth_type/header_name等）',
  `user_name` varchar(128) DEFAULT NULL COMMENT '用户名',
  `sys_code` varchar(128) DEFAULT NULL COMMENT '系统编码',
  `gmt_created` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_connector_instance_connector_id` (`connector_id`),
  KEY `ix_connector_instance_user_name` (`user_name`),
  KEY `ix_connector_instance_sys_code` (`sys_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='MCP连接器实例表';

-- 定时任务定义表
CREATE TABLE IF NOT EXISTS `dbgpt_serve_scheduled_task` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `task_id` varchar(64) NOT NULL COMMENT '任务UUID',
  `task_name` varchar(256) NOT NULL COMMENT '任务名称',
  `description` text DEFAULT NULL COMMENT '任务描述',
  `task_type` varchar(32) NOT NULL DEFAULT 'chat_replay' COMMENT '任务类型，如chat_replay',
  `cron_expression` varchar(128) NOT NULL COMMENT 'Cron调度表达式',
  `payload_json` text NOT NULL COMMENT '冻结的对话快照JSON',
  `enabled` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否启用，1：启用，0：禁用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `user_name` varchar(128) DEFAULT NULL COMMENT '用户名',
  `sys_code` varchar(128) DEFAULT NULL COMMENT '系统编码',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_scheduled_task_task_id` (`task_id`),
  KEY `ix_scheduled_task_task_type` (`task_type`),
  KEY `ix_scheduled_task_user_name` (`user_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='定时任务定义表';

-- 定时任务执行历史表
CREATE TABLE IF NOT EXISTS `dbgpt_serve_scheduled_run` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `run_id` varchar(64) NOT NULL COMMENT '运行UUID',
  `task_id` varchar(64) NOT NULL COMMENT '关联的任务UUID',
  `started_at` datetime NOT NULL COMMENT '运行开始时间',
  `finished_at` datetime DEFAULT NULL COMMENT '运行完成时间',
  `status` varchar(32) NOT NULL COMMENT '运行状态：running/success/failed/timeout',
  `result_summary` text DEFAULT NULL COMMENT '结果摘要',
  `error_message` text DEFAULT NULL COMMENT '失败时的错误信息',
  `output_conv_uid` varchar(64) DEFAULT NULL COMMENT '本次运行生成的输出对话UID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_scheduled_run_run_id` (`run_id`),
  KEY `ix_scheduled_run_task_id` (`task_id`),
  KEY `ix_scheduled_run_started_at` (`started_at`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='定时任务执行历史表';
