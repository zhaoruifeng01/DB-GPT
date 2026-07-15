-- Permission module initialization script
-- Version: v0.8.2
-- Description: Create permission management tables (user, role, department)
-- Date: 2026-07-14

USE ekb400;

-- ----------------------------
-- sys_user 用户表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `sys_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(64) NOT NULL COMMENT '登录用户名',
  `password_hash` varchar(256) NOT NULL COMMENT '加密密码',
  `email` varchar(128) DEFAULT NULL COMMENT '邮箱',
  `real_name` varchar(64) DEFAULT NULL COMMENT '真实姓名',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `status` int(11) NOT NULL DEFAULT 1 COMMENT '状态(0=禁用,1=启用)',
  `deleted` int(11) NOT NULL DEFAULT 0 COMMENT '删除标记(0=正常,1=已删除)',
  `gmt_created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  INDEX `idx_username` (`username`),
  INDEX `idx_status_deleted` (`status`, `deleted`),
  INDEX `idx_sys_user_deleted_id` (`deleted`, `id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ----------------------------
-- sys_role 角色表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `sys_role` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `role_code` varchar(64) NOT NULL COMMENT '角色代码',
  `role_name` varchar(64) NOT NULL COMMENT '角色名称',
  `description` varchar(256) DEFAULT NULL COMMENT '描述',
  `status` int(11) NOT NULL DEFAULT 1 COMMENT '状态(0=禁用,1=启用)',
  `gmt_created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_code` (`role_code`),
  INDEX `idx_role_code` (`role_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- ----------------------------
-- sys_dept 部门表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `sys_dept` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '部门ID',
  `dept_name` varchar(128) NOT NULL COMMENT '部门名称',
  `dept_code` varchar(64) NOT NULL COMMENT '部门代码',
  `parent_id` int(11) NOT NULL DEFAULT 0 COMMENT '上级部门ID(0=顶级)',
  `order_num` int(11) NOT NULL DEFAULT 0 COMMENT '排序号',
  `status` int(11) NOT NULL DEFAULT 1 COMMENT '状态(0=禁用,1=启用)',
  `gmt_created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dept_code` (`dept_code`),
  INDEX `idx_parent_id` (`parent_id`),
  INDEX `idx_dept_code` (`dept_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门表';

-- ----------------------------
-- sys_user_role 用户-角色关联表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `sys_user_role` (
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `role_id` int(11) NOT NULL COMMENT '角色ID',
  PRIMARY KEY (`user_id`, `role_id`),
  INDEX `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户-角色关联表';

-- ----------------------------
-- sys_user_dept 用户-部门关联表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `sys_user_dept` (
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `dept_id` int(11) NOT NULL COMMENT '部门ID',
  PRIMARY KEY (`user_id`, `dept_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户-部门关联表';

-- ----------------------------
-- 初始数据
-- ----------------------------

-- 默认角色
INSERT IGNORE INTO sys_role (id, role_code, role_name, description) VALUES
(1, 'admin', '管理员', '系统管理员，拥有所有权限'),
(2, 'normal', '普通用户', '普通用户，基本操作权限');

-- 默认部门
INSERT IGNORE INTO sys_dept (id, dept_name, dept_code, parent_id, order_num) VALUES
(1, '默认部门', 'default', 0, 1);

-- admin用户由应用程序init_default_data()自动创建，不使用SQL预插入

-- 用户-角色关联
INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES (1, 1);

-- 用户-部门关联
INSERT IGNORE INTO sys_user_dept (user_id, dept_id) VALUES (1, 1);
