# 前端状态管理与 API 模块拆分

[toc]

## 前言

在前端开发中，**如何组织代码结构**、**如何管理应用状态**、**如何与后端通信**，是每个开发者都要面对的问题。随着项目复杂度提升，合理分层和拆分代码变得尤为重要。本笔记将围绕 Vue 3 + Pinia 的实际开发，讲解如何区分和实现 API 模块与状态管理模块。

---

## API 模块化

### 什么是 API 模块

API 模块是指一组**纯函数**，用于封装与后端服务器的 HTTP 通信。其主要特点是：

- **无状态（Stateless）**：每次调用只负责请求和返回数据，不保存任何前端状态。
- **高复用性**：可以在任意组件或 Store 中调用。
- **单一职责**：通常每个函数对应一个后端接口。

### 示例代码

```js
// chat.js
export function sendMessage(params, data) {
    return request({
        url: '/api/hospital/ai/chat',
        method: 'post',
        params,
        data
    })
}
```

### API 模块的优点

- 便于维护和测试
- 代码复用性高
- 便于统一处理错误和请求拦截

---

## 状态管理

### 什么是状态管理

状态管理是指在前端应用中**集中管理和维护全局或局部数据状态**，并能在多个组件之间共享和同步这些状态。

### Pinia 简介

[Pinia](https://pinia.vuejs.org/) 是 Vue 3 官方推荐的状态管理库，特点：

- 轻量、易用
- 完美支持 TypeScript
- 支持模块化、插件扩展
- 响应式、与 Vue 3 深度集成

#### Pinia Store 示例

```js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const isLoading = ref(false)
    const isAuthenticated = computed(() => !!user.value)

    function setUser(userData) {
        user.value = userData
    }

    return { user, isLoading, isAuthenticated, setUser }
})
```

### Options API 与 Composition API

- **Options API**：以对象形式组织代码（如 data、methods、computed）。
- **Composition API**：以函数式组织代码，逻辑更灵活，利于组合和复用。

#### 对比

| 特性     | Options API | Composition API |
| -------- | ----------- | --------------- |
| 写法     | 对象式      | 函数式          |
| 逻辑复用 | 不方便      | 灵活            |
| 代码组织 | 按类型分区  | 按功能分区      |
| 学习曲线 | 低          | 略高            |

### Store 的职责

- 管理和共享状态（如用户登录信息）
- 封装业务逻辑（如登录、登出、状态恢复）
- 提供计算属性（如是否已登录）
- 处理副作用（如本地存储同步）

---

## API 模块与 Store 的区别

| 维度       | API 模块（如 chat.js） | Store（如 auth.js）  |
| ---------- | ---------------------- | -------------------- |
| 主要职责   | 负责与后端通信         | 负责管理前端状态     |
| 是否有状态 | 无                     | 有                   |
| 复用性     | 任意地方可调用         | 需要通过 Store 获取  |
| 典型场景   | 聊天、数据获取         | 用户认证、购物车     |
| 适合操作   | 纯请求/响应            | 需要持久化、计算属性 |

### 示例代码对比

**API 模块（chat.js）：**
```js
export function sendMessage(params, data) {
    return request({ url: '/api/chat', method: 'post', params, data })
}
```

**Store 模块（auth.js）：**
```js
export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const setUser = (data) => { user.value = data }
    return { user, setUser }
})
```

---

## 实际开发中的架构建议

### 1. **API 层**（如 chat.js）
- 只负责与后端通信
- 不保存任何状态

### 2. **Store 层**（如 auth.js）
- 负责状态管理和业务逻辑
- 可以调用 API 层的函数
- 提供计算属性和方法

### 3. **组件层**
- 通过 Store 获取和操作状态
- 通过 API 层获取数据（如不需要共享的临时数据）

### 架构图

```
组件 <----> Store <----> API
```

---

## 常见问题与最佳实践

### Q1：为什么不能把用户认证（auth）写成 API 模块？
- 用户认证涉及**状态同步、持久化、本地存储、计算属性**等需求，仅用 API 模块无法满足。

### Q2：什么时候用 Store，什么时候用 API 模块？
- **只需要请求数据，不需要共享状态** → 用 API 模块
- **需要在多个组件间共享、持久化、计算状态** → 用 Store

### Q3：Store 里可以直接写 API 请求吗？
- 可以，但推荐**将 API 请求封装成独立的 API 模块**，Store 只负责调用和管理状态。

### Q4：Store 需要持久化怎么办？
- 可以结合 `localStorage`，或用 Pinia 插件（如 pinia-plugin-persistedstate）。

---

## 总结

- **API 模块**：只负责请求和响应，适合数据获取和操作。
- **Store**：负责状态管理、业务逻辑、计算属性，适合全局/跨组件共享的数据。
- **合理分层**能让代码结构清晰、易维护、易测试，是中大型项目的必备技能。
