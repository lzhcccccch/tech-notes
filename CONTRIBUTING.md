# 内容维护指南

## 目录约定

```text
docs/
├── README.md                 # 博客首页
├── _sidebar.md               # 全站目录
├── about.md                  # 关于页
├── assets/                   # 样式与脚本
└── posts/
    ├── ai/
    ├── backend/
    ├── engineering/
    └── frontend/
```

## 文章模板

```markdown
# 文章标题

> 发布于 2026-09-21 · 分类：后端 · 阅读约 8 分钟

用一段话交代问题、背景和读者能获得什么。

## 第一个主题

正文。

## 小结

列出最重要的结论。
```

建议文件名使用小写英文和连字符，例如 `spring-boot-observability.md`。文章中的链接尽量使用相对路径，图片放在 `docs/assets/images/` 下。

## 提交建议

- 新文章：`docs: 新增 Spring Boot 可观测性笔记`
- 修正文案：`docs: 修正 Vue 状态管理示例`
- 调整站点：`feat: 优化移动端目录`

