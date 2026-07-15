// 角色
export interface RoleResponse {
  id: number;
  role_code: string;
  role_name: string;
  description?: string;
  status: number; // 0=disabled, 1=enabled
}

export interface RoleRequest {
  role_code: string;
  role_name: string;
  description?: string;
}

// 部门
export interface DeptResponse {
  id: number;
  dept_name: string;
  dept_code: string;
  parent_id: number;
  status: number;
  children: DeptResponse[];
}

export interface DeptRequest {
  dept_name: string;
  dept_code: string;
  parent_id: number;
  order_num: number;
}

// 用户
export interface UserResponse {
  id: number;
  username: string;
  email?: string;
  real_name?: string;
  phone?: string;
  status: number;
  roles: RoleResponse[];
  departments: DeptResponse[];
  gmt_created?: string;
}

export interface UserCreateRequest {
  username: string;
  password: string;
  email?: string;
  real_name?: string;
  phone?: string;
  role_ids: number[];
  dept_ids: number[];
}

export interface UserUpdateRequest {
  email?: string;
  real_name?: string;
  phone?: string;
  status?: number;
  role_ids?: number[];
  dept_ids?: number[];
}

// 登录响应
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  username: string;
  role_codes: string[];
  dept_names: string[];
}

// 分页响应
export interface PaginatedUsers {
  items: UserResponse[];
  total: number;
  page: number;
  page_size: number;
}
