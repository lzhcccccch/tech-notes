# Vue 3 状态应该放在哪里

<p class="article-meta">发布于 2026-09-12 · 分类：前端开发 · 阅读约 6 分钟</p>

> 本文是占位示例，用于展示技术博客的阅读体验。

状态管理的问题往往不是“要不要用 Pinia”，而是状态的生命周期和共享范围没有被说清楚。

## 三层状态边界

### 组件内部状态

只服务于单个组件、随组件销毁而消失的状态，应优先留在组件内。

```ts
const isExpanded = ref(false)
const draft = ref('')
```

### 组合式函数状态

当一段状态逻辑需要复用，但不同调用方不应共享同一个实例时，放进组合式函数：

```ts
export function usePagination() {
  const page = ref(1)
  const pageSize = ref(20)

  const reset = () => {
    page.value = 1
  }

  return { page, pageSize, reset }
}
```

### 全局 Store

只有跨页面共享、需要持久化或需要集中调试的状态，才进入 Store。典型例子包括当前用户、权限集合和跨页面购物车。

## 判断问题

在创建状态前先问三个问题：

1. 谁需要读取它？
2. 它应该活多久？
3. 刷新页面后是否还需要存在？

答案通常会直接指向组件、组合式函数、Store 或 URL 查询参数。

