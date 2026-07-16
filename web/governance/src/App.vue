<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from '@/utils/axios'

type Tab = 'overview' | 'datasources' | 'policies' | 'catalog' | 'audit'

type Datasource = {
  id: number
  db_name: string
  db_type: string
  comment?: string
  policy?: { status: string; business_domain?: string; health_status: string } | null
}

const activeTab = ref<Tab>('overview')
const loading = ref(false)
const error = ref('')
const overview = ref<Record<string, number>>({})
const datasources = ref<Datasource[]>([])
const grants = ref<any[]>([])
const maskRules = ref<any[]>([])
const products = ref<any[]>([])
const audits = ref<any[]>([])
const notice = ref('')
const grantForm = ref({ role_code: '', datasource_id: 0, table_pattern: '*', permission: 'query' })
const maskForm = ref({ datasource_id: 0, table_name: '*', column_name: '', role_code: '', mask_type: 'partial' })
const productForm = ref({ product_key: '', datasource_id: 0, title: '', description: '', resource_type: 'table', resource_definition: '', status: 'draft', rate_limit_per_minute: 60 })

const tabs: Array<{ key: Tab; name: string; hint: string }> = [
  { key: 'overview', name: '资产概览', hint: '数据资产、审批与调用审计' },
  { key: 'datasources', name: '数据源', hint: '连接健康度与治理归属' },
  { key: 'policies', name: '权限与脱敏', hint: '角色表授权与字段保护' },
  { key: 'catalog', name: '数据产品', hint: '发布、发现与访问申请' },
  { key: 'audit', name: '审计', hint: '受治理查询与管理操作' },
]

const title = computed(() => tabs.find(tab => tab.key === activeTab.value)?.name ?? '')
const unwrap = <T,>(response: { data: { data: T } }) => response.data.data

async function loadDatasources() {
  datasources.value = await unwrap(await axios.get('/datasources'))
}

async function loadPolicies() {
  const [grantData, maskData] = await Promise.all([
    unwrap(await axios.get('/grants')),
    unwrap(await axios.get('/mask-rules')),
  ])
  grants.value = grantData
  maskRules.value = maskData
}

async function load() {
  loading.value = true
  error.value = ''
  notice.value = ''
  try {
    if (activeTab.value === 'overview') overview.value = await unwrap(await axios.get('/overview'))
    if (activeTab.value === 'datasources') await loadDatasources()
    if (activeTab.value === 'policies') await Promise.all([loadDatasources(), loadPolicies()])
    if (activeTab.value === 'catalog') {
      await loadDatasources()
      products.value = await unwrap(await axios.get('/catalog/products'))
    }
    if (activeTab.value === 'audit') audits.value = await unwrap(await axios.get('/audit-logs'))
  } catch (cause: any) {
    error.value = cause?.response?.data?.detail || '无法加载治理数据，请确认已登录且拥有对应权限。'
  } finally {
    loading.value = false
  }
}

async function changeTab(tab: Tab) {
  activeTab.value = tab
  await load()
}

async function testDatasource(id: number) {
  try {
    const result = await unwrap(await axios.post(`/datasources/${id}/health`))
    notice.value = result.message
    await loadDatasources()
  } catch (cause: any) {
    notice.value = cause?.response?.data?.detail || '健康检查失败'
  }
}

async function createGrant() {
  await axios.post('/grants', { ...grantForm.value, datasource_id: Number(grantForm.value.datasource_id) })
  grantForm.value = { role_code: '', datasource_id: 0, table_pattern: '*', permission: 'query' }
  await loadPolicies()
}

async function removeGrant(id: number) {
  await axios.delete(`/grants/${id}`)
  await loadPolicies()
}

async function createMaskRule() {
  await axios.post('/mask-rules', { ...maskForm.value, datasource_id: Number(maskForm.value.datasource_id), role_code: maskForm.value.role_code || null })
  maskForm.value = { datasource_id: 0, table_name: '*', column_name: '', role_code: '', mask_type: 'partial' }
  await loadPolicies()
}

async function removeMaskRule(id: number) {
  await axios.delete(`/mask-rules/${id}`)
  await loadPolicies()
}

async function createProduct() {
  await axios.post('/catalog/products', { ...productForm.value, datasource_id: Number(productForm.value.datasource_id) })
  productForm.value = { product_key: '', datasource_id: 0, title: '', description: '', resource_type: 'table', resource_definition: '', status: 'draft', rate_limit_per_minute: 60 }
  products.value = await unwrap(await axios.get('/catalog/products'))
}

onMounted(load)
</script>

<template>
  <main class="min-h-screen bg-slate-100 text-slate-900">
    <header class="border-b border-slate-200 bg-white px-6 py-4">
      <div class="mx-auto flex max-w-7xl items-center justify-between">
        <div><p class="text-sm font-medium text-sky-700">DB-GPT</p><h1 class="text-xl font-semibold">数据治理</h1></div>
        <a class="text-sm text-slate-600 hover:text-sky-700" href="/construct/database">返回 DB-GPT</a>
      </div>
    </header>

    <div class="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[220px_1fr]">
      <aside class="h-fit border border-slate-200 bg-white p-2">
        <button v-for="tab in tabs" :key="tab.key" class="mb-1 block w-full px-3 py-3 text-left text-sm" :class="activeTab === tab.key ? 'bg-sky-700 text-white' : 'text-slate-700 hover:bg-slate-100'" @click="changeTab(tab.key)">
          <span class="block font-medium">{{ tab.name }}</span><span class="mt-1 block text-xs opacity-75">{{ tab.hint }}</span>
        </button>
      </aside>

      <section class="min-w-0">
        <div class="mb-5 flex items-center justify-between"><div><h2 class="text-lg font-semibold">{{ title }}</h2><p class="mt-1 text-sm text-slate-500">统一身份、统一 API Server、统一数据源连接管理</p></div><button class="border border-slate-300 bg-white px-3 py-2 text-sm hover:border-sky-700" @click="load">刷新</button></div>
        <p v-if="error" class="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</p>
        <p v-if="notice" class="mb-4 border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">{{ notice }}</p>
        <p v-if="loading" class="border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">正在加载…</p>

        <div v-if="!loading && activeTab === 'overview'" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><article v-for="(value, key) in overview" :key="key" class="border border-slate-200 bg-white p-4"><p class="text-xs text-slate-500">{{ String(key).replaceAll('_', ' ') }}</p><p class="mt-2 text-2xl font-semibold">{{ value }}</p></article></div>

        <div v-if="!loading && activeTab === 'datasources'" class="overflow-x-auto border border-slate-200 bg-white"><table class="w-full min-w-[680px] text-left text-sm"><thead class="border-b bg-slate-50 text-slate-500"><tr><th class="p-3">名称</th><th class="p-3">类型</th><th class="p-3">治理状态</th><th class="p-3">健康度</th><th class="p-3"></th></tr></thead><tbody><tr v-for="item in datasources" :key="item.id" class="border-b last:border-0"><td class="p-3 font-medium">{{ item.db_name }}</td><td class="p-3">{{ item.db_type }}</td><td class="p-3">{{ item.policy?.status || '待纳管' }}</td><td class="p-3">{{ item.policy?.health_status || 'unknown' }}</td><td class="p-3 text-right"><button class="text-sky-700 hover:underline" @click="testDatasource(item.id)">检查连接</button></td></tr></tbody></table></div>

        <div v-if="!loading && activeTab === 'policies'" class="grid gap-5 xl:grid-cols-2">
          <article class="border border-slate-200 bg-white p-4"><h3 class="font-semibold">角色数据授权</h3><form class="mt-4 grid gap-3" @submit.prevent="createGrant"><input v-model="grantForm.role_code" required placeholder="DB-GPT role_code" class="border border-slate-300 px-3 py-2 text-sm"><select v-model="grantForm.datasource_id" required class="border border-slate-300 px-3 py-2 text-sm"><option :value="0" disabled>选择数据源</option><option v-for="item in datasources" :key="item.id" :value="item.id">{{ item.db_name }}</option></select><input v-model="grantForm.table_pattern" placeholder="表名或通配符" class="border border-slate-300 px-3 py-2 text-sm"><select v-model="grantForm.permission" class="border border-slate-300 px-3 py-2 text-sm"><option value="query">查询</option><option value="manage">管理</option></select><button class="bg-sky-700 px-3 py-2 text-sm text-white">添加授权</button></form><ul class="mt-4 divide-y"><li v-for="grant in grants" :key="grant.id" class="flex items-center justify-between py-2 text-sm"><span>{{ grant.role_code }} · 数据源 {{ grant.datasource_id }} · {{ grant.table_pattern }} · {{ grant.permission }}</span><button class="text-red-700" @click="removeGrant(grant.id)">删除</button></li></ul></article>
          <article class="border border-slate-200 bg-white p-4"><h3 class="font-semibold">字段脱敏</h3><form class="mt-4 grid gap-3" @submit.prevent="createMaskRule"><select v-model="maskForm.datasource_id" required class="border border-slate-300 px-3 py-2 text-sm"><option :value="0" disabled>选择数据源</option><option v-for="item in datasources" :key="item.id" :value="item.id">{{ item.db_name }}</option></select><input v-model="maskForm.table_name" placeholder="表名或通配符" class="border border-slate-300 px-3 py-2 text-sm"><input v-model="maskForm.column_name" required placeholder="字段名" class="border border-slate-300 px-3 py-2 text-sm"><input v-model="maskForm.role_code" placeholder="仅对角色生效（可选）" class="border border-slate-300 px-3 py-2 text-sm"><select v-model="maskForm.mask_type" class="border border-slate-300 px-3 py-2 text-sm"><option value="partial">部分掩码</option><option value="full">全掩码</option><option value="hash">哈希</option><option value="email">邮箱</option></select><button class="bg-sky-700 px-3 py-2 text-sm text-white">添加规则</button></form><ul class="mt-4 divide-y"><li v-for="rule in maskRules" :key="rule.id" class="flex items-center justify-between py-2 text-sm"><span>数据源 {{ rule.datasource_id }} · {{ rule.table_name }}.{{ rule.column_name }} · {{ rule.mask_type }}</span><button class="text-red-700" @click="removeMaskRule(rule.id)">删除</button></li></ul></article>
        </div>

        <div v-if="!loading && activeTab === 'catalog'" class="grid gap-5 xl:grid-cols-[360px_1fr]"><article class="border border-slate-200 bg-white p-4"><h3 class="font-semibold">发布数据产品</h3><form class="mt-4 grid gap-3" @submit.prevent="createProduct"><input v-model="productForm.product_key" required placeholder="产品 Key" class="border border-slate-300 px-3 py-2 text-sm"><input v-model="productForm.title" required placeholder="展示名称" class="border border-slate-300 px-3 py-2 text-sm"><select v-model="productForm.datasource_id" required class="border border-slate-300 px-3 py-2 text-sm"><option :value="0" disabled>选择数据源</option><option v-for="item in datasources" :key="item.id" :value="item.id">{{ item.db_name }}</option></select><textarea v-model="productForm.description" placeholder="说明" class="border border-slate-300 px-3 py-2 text-sm"></textarea><textarea v-model="productForm.resource_definition" placeholder="TABLE 或手写只读 SQL 定义" class="border border-slate-300 px-3 py-2 text-sm"></textarea><button class="bg-sky-700 px-3 py-2 text-sm text-white">保存草稿</button></form></article><article class="border border-slate-200 bg-white"><div class="border-b p-4"><h3 class="font-semibold">数据产品目录</h3></div><ul class="divide-y"><li v-for="product in products" :key="product.id" class="p-4"><p class="font-medium">{{ product.title }}</p><p class="mt-1 text-sm text-slate-500">{{ product.product_key }} · {{ product.resource_type }} · {{ product.status }}</p><p v-if="product.description" class="mt-2 text-sm text-slate-600">{{ product.description }}</p></li></ul></article></div>

        <div v-if="!loading && activeTab === 'audit'" class="overflow-x-auto border border-slate-200 bg-white"><table class="w-full min-w-[720px] text-left text-sm"><thead class="border-b bg-slate-50 text-slate-500"><tr><th class="p-3">时间</th><th class="p-3">用户</th><th class="p-3">操作</th><th class="p-3">数据源</th><th class="p-3">结果</th><th class="p-3">详情</th></tr></thead><tbody><tr v-for="audit in audits" :key="audit.id" class="border-b last:border-0"><td class="p-3">{{ audit.gmt_created }}</td><td class="p-3">{{ audit.username }}</td><td class="p-3">{{ audit.action }}</td><td class="p-3">{{ audit.datasource_id || '-' }}</td><td class="p-3">{{ audit.status }}</td><td class="p-3 text-slate-500">{{ audit.detail || '-' }}</td></tr></tbody></table></div>
      </section>
    </div>
  </main>
</template>
