import {
  DeptRequest,
  DeptResponse,
  LoginResponse,
  PaginatedUsers,
  RoleRequest,
  RoleResponse,
  UserCreateRequest,
  UserResponse,
  UserUpdateRequest,
} from '@/types/permission';
import { DELETE, GET, POST, PUT } from '.';

const API_PREFIX = '/api/v1/serve/permission';

/** 用户管理 */
export const listUsers = (page = 1, page_size = 20) =>
  GET<{ page: number; page_size: number }, PaginatedUsers>(`${API_PREFIX}/users`, { page, page_size });

export const createUser = (data: UserCreateRequest) =>
  POST<UserCreateRequest, UserResponse>(`${API_PREFIX}/users`, data);

export const updateUser = (userId: number, data: UserUpdateRequest) =>
  PUT<UserUpdateRequest, UserResponse>(`${API_PREFIX}/users/${userId}`, data);

export const deleteUser = (userId: number) =>
  DELETE<null, any>(`${API_PREFIX}/users/${userId}`);

/** 角色管理 */
export const listRoles = () =>
  GET<null, RoleResponse[]>(`${API_PREFIX}/roles`);

export const createRole = (data: RoleRequest) =>
  POST<RoleRequest, RoleResponse>(`${API_PREFIX}/roles`, data);

export const updateRole = (roleId: number, data: RoleRequest) =>
  PUT<RoleRequest, RoleResponse>(`${API_PREFIX}/roles/${roleId}`, data);

export const deleteRole = (roleId: number) =>
  DELETE<null, any>(`${API_PREFIX}/roles/${roleId}`);

/** 部门管理 */
export const listDepts = () =>
  GET<null, DeptResponse[]>(`${API_PREFIX}/depts`);

export const createDept = (data: DeptRequest) =>
  POST<DeptRequest, DeptResponse>(`${API_PREFIX}/depts`, data);

export const updateDept = (deptId: number, data: DeptRequest) =>
  PUT<DeptRequest, DeptResponse>(`${API_PREFIX}/depts/${deptId}`, data);

export const deleteDept = (deptId: number) =>
  DELETE<null, any>(`${API_PREFIX}/depts/${deptId}`);

/** 登录 */
export const loginUser = (data: { username: string; password: string }) =>
  POST<{ username: string; password: string }, LoginResponse>(`${API_PREFIX}/auth/login`, data);
