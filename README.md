# Tech Notes

一个以 Markdown 为内容源、使用 Docsify 渲染并通过 GitHub Pages 发布的技术博客。

## 当前包含的功能

- 按专题组织的左侧目录与文章内目录
- 全文搜索、代码复制、上一篇/下一篇
- 亮色/深色主题，适配桌面端与移动端
- 每篇文章的 GitHub 在线编辑入口
- 可选的 GitHub Discussions（Giscus）评论区
- 推送到 `main` 后由 GitHub Actions 自动发布

所有博客页面都在 `docs/` 中，整理后的知识内容统一放在 `docs/knowledge/`。已根据原始清单生成 187 个同名占位文件，可以逐篇替换正文。

## 本地预览

在仓库根目录运行：

```bash
python3 -m http.server 3000 --directory docs
```

然后访问 <http://localhost:3000>。

## GitHub 首次设置

### 1. 推送仓库内容

```bash
git add .
git commit -m "feat: 初始化技术博客"
git push origin main
```

### 2. 启用 GitHub Pages

1. 打开仓库：<https://github.com/lzhcccccch/tech-notes>。
2. 点击 **Settings**。
3. 左侧找到 **Pages**。
4. 在 **Build and deployment** → **Source** 中选择 **GitHub Actions**。
5. 打开仓库的 **Actions** 页，等待 `Deploy blog to GitHub Pages` 工作流变绿。
6. 回到 **Settings** → **Pages**，页面顶部会显示博客地址。项目站点通常是：
   <https://lzhcccccch.github.io/tech-notes/>。

工作流文件已放在 `.github/workflows/pages.yml`，不需要在 GitHub 网页上再创建工作流。

### 3. 启用文章评论（可选）

1. 在仓库 **Settings** → **General** → **Features** 中勾选 **Discussions**。
2. 打开 <https://github.com/apps/giscus>，安装 Giscus，并只授权当前仓库。
3. 打开 <https://giscus.app/zh-CN>，输入 `lzhcccccch/tech-notes`。
4. 页面映射选择 **特定字符串**，Discussion 分类选择 **Announcements**。
5. 页面下方生成配置后，复制 `data-repo-id` 和 `data-category-id` 的值。
6. 打开 `docs/index.html` 中的 `BLOG_CONFIG`，填写 `comments.repoId` 与 `comments.categoryId`；如果你选择了其他分类，也要同步修改 `comments.category`。
7. 提交并推送；每篇文章底部会自动出现独立评论区。

未填写这两个 ID 时，评论功能会安全地保持关闭。

### 4. 建议的 Actions 权限

进入 **Settings** → **Actions** → **General**：

- **Actions permissions**：允许使用 GitHub 官方和公开 Actions。
- **Workflow permissions**：保留默认的只读权限即可；发布工作流已单独声明 `pages: write` 和 `id-token: write`。

### 5. 可选：自定义域名

1. 进入 **Settings** → **Pages**。
2. 在 **Custom domain** 填入域名，例如 `notes.example.com`。
3. 在域名服务商处添加 CNAME：`notes` 指向 `lzhcccccch.github.io`。
4. DNS 生效后，在 GitHub Pages 中启用 **Enforce HTTPS**。

使用 GitHub Actions 发布时不需要手工创建 `CNAME` 文件，以 GitHub Pages 设置页中的域名为准。

## 写一篇新文章

1. 在 `docs/knowledge/<知识域>/<专题>/` 下复制一篇 Markdown 文件并改名。
2. 修改标题、日期、标签与正文。
3. 在 `docs/_sidebar.md` 中加入文章链接。
4. 如需在首页展示，再编辑 `docs/README.md` 的文章卡片。
5. 提交并推送到 `main`，GitHub Actions 会自动发布。

更详细的格式约定见 [CONTRIBUTING.md](CONTRIBUTING.md)。
