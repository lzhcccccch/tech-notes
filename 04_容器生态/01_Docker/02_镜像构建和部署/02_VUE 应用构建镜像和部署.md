## Vue 应用打包成 Docker 镜像并发布启动

[toc]

#### 简介

本文档将指导如何将一个 Vue.js 应用打包成 Docker 镜像，并通过 Docker 发布和启动应用。主要内容包括 Vue 应用的构建、Docker 镜像的创建及运行、以及镜像的推送与发布。

---

#### 前提条件

1. **安装 Node.js 和 npm**：
   - 确保本地已安装 Node.js 和 npm，用于构建 Vue 应用。
   - Node.js 下载地址：[Node.js 官网](https://nodejs.org/)

2. **安装 Docker**：
   - 确保本地已安装 Docker，并已正确配置。
   - Docker 下载地址：[Docker 官网](https://www.docker.com/)

3. **Vue 应用准备**：
   - 已有一个 Vue.js 项目。如果没有，可以通过以下命令创建一个新的 Vue 项目：
     ```bash
     npm install -g @vue/cli
     vue create my-vue-app
     ```

4. **Docker Hub 账户**：
   - 如果需要将镜像推送到 Docker Hub，请确保你已注册 Docker Hub 账户。

---

#### 构建 Vue 应用

在项目的根目录下执行以下命令，将 Vue 应用打包为生产环境的静态文件：

```bash
npm run build
```

执行后，Vue 会在项目根目录下生成一个 `dist` 文件夹，里面包含生产环境的静态资源（HTML、CSS、JS 等文件）。

---

#### 创建 Dockerfile

在项目根目录下创建一个名为 `Dockerfile` 的文件，内容如下：

```dockerfile
# 构建阶段
# 使用官方 Node.js 镜像作为基础镜像
FROM node:22.2.0 AS build-stage

#设置时区
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
  && echo 'Asia/Shanghai' >/etc/timezone

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json（如果有）到工作目录
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 复制项目文件到工作目录
COPY . .

# 构建项目
RUN npm run build


# 生产阶段
# 使用官方 Nginx 镜像作为基础镜像
FROM nginx:stable-alpine AS production-stage
# 从构建阶段（build-stage）中复制 /app/dist 目录的内容到生产阶段的 nginx 容器的 /usr/share/nginx/html 目录。
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 8000
CMD ["nginx", "-g", "daemon off;"]
```

**Dockerfile 解析**

这个 `Dockerfile` 文件分为两个阶段，分别是**构建阶段**和**生产阶段**。以下是对每一行内容的详细解释：

**构建阶段**

```dockerfile
FROM node:22.2.0 as build-stage
```
- **作用**：指定构建阶段使用的基础镜像，这里是 `node:22.2.0`，它包含了 Node.js 和 npm。
- **`as build-stage`**：为这个阶段命名为 `build-stage`，以便后续引用。

```dockerfile
WORKDIR /app
```
- **作用**：设置容器内的工作目录为 `/app`。所有后续命令都将在这个目录中执行。

```dockerfile
COPY package*.json ./
```
- **作用**：将项目根目录下的 `package.json` 和 `package-lock.json`（如果存在）复制到容器的 `/app` 目录。
- **为什么只复制 `package*.json`？**：这样可以利用 Docker 的缓存机制，只在依赖发生变化时重新运行 `npm install`。

```dockerfile
RUN npm install
```
- **作用**：使用 npm 安装项目的依赖。
- **注意**：此时只安装了 `package.json` 中定义的依赖，项目代码还没有被复制到容器中。

```dockerfile
COPY . .
```
- **作用**：将项目的所有文件复制到容器的 `/app` 目录中（除了 `.dockerignore` 文件中排除的内容）。

```dockerfile
RUN npm run build
```
- **作用**：运行 `npm run build` 命令，构建 Vue 项目，将项目的生产环境代码输出到 `dist` 目录。
- **结果**：`dist` 目录包含了构建好的静态资源（HTML、CSS、JS 等）。

**生产阶段**

```dockerfile
FROM nginx:stable-alpine as production-stage
```
- **作用**：指定生产阶段使用的基础镜像，这里是轻量级的 `nginx:stable-alpine`。
- **为什么使用 nginx？**：nginx 是一个高性能的 HTTP 服务器，适合用来托管静态文件（如 Vue 项目构建后的文件）。

```dockerfile
COPY --from=build-stage /app/dist /usr/share/nginx/html
```
- **作用**：从构建阶段（`build-stage`）中复制 `/app/dist` 目录的内容到生产阶段的 nginx 容器的 `/usr/share/nginx/html` 目录。
- **`--from=build-stage`**：表示从 `build-stage` 阶段中复制文件。
- **为什么复制到 `/usr/share/nginx/html`？**：这是 nginx 默认的静态文件目录，nginx 会自动托管该目录中的文件。

```dockerfile
EXPOSE 8000
```
- **作用**：声明容器会监听 `8000` 端口。
- **注意**：`EXPOSE` 不会实际打开端口，它只是一个文档化的声明，方便其他开发者了解容器的端口配置。

```dockerfile
CMD ["nginx", "-g", "daemon off;"]
```
- **作用**：指定容器启动时运行的命令。
- **`nginx`**：启动 nginx 服务器。
- **`-g "daemon off;"`**：告诉 nginx 以前台模式运行，而不是以守护进程模式运行（Docker 容器需要一个前台进程保持运行）。

---

#### 创建 .dockerignore 文件

在项目根目录下创建 `.dockerignore` 文件，内容如下：

```plaintext
node_modules
dist
.git
.gitignore
```

**原因**

创建 `.dockerignore` 文件的目的是为了优化 Docker 构建过程。它的作用类似于 `.gitignore`，用于指定在构建 Docker 镜像时应该忽略的文件和目录。以下是提到的各个条目的具体原因：

1. **`node_modules`**：
   - **原因**：`node_modules` 目录包含了项目的所有依赖包，通常体积很大，而且这些依赖会在 Docker 构建过程中通过 `npm install` 重新安装，因此没有必要将其复制到 Docker 镜像中。
   - **好处**：减少构建上下文的大小，加快构建速度，并确保在镜像中安装的依赖是干净的、与当前环境无关的版本。

2. **`dist`**：
   - **原因**：`dist` 目录是构建输出目录，通常在 `npm run build` 之后生成。因为 Dockerfile 中已经包含了构建步骤 `RUN npm run build`，所以没有必要在构建镜像时复制本地的 `dist` 目录。
   - **好处**：确保构建输出是由 Docker 环境生成的，避免本地构建的结果影响镜像内容。

3. **`.git`**：
   - **原因**：`.git` 目录包含了版本控制信息，对于构建和运行应用程序来说并不必要。
   - **好处**：减少构建上下文的大小，避免不必要的信息泄露到镜像中。

4. **`.gitignore`**：
   - **原因**：`.gitignore` 文件用于 Git 版本控制系统，定义了哪些文件不应该提交到 Git 仓库。它对 Docker 镜像构建没有影响，因此可以忽略。
   - **好处**：减少构建上下文的大小。

**总结**

使用 `.dockerignore` 文件有以下几个主要好处：

- **提高构建效率**：通过减少构建上下文的大小，加快了 Docker 构建过程。
- **降低镜像体积**：避免将不必要的文件和目录复制到镜像中，从而减小镜像的最终体积。
- **增强安全性**：防止将敏感信息（如 `.git` 目录中的版本控制历史）包含在镜像中。
- **保持环境一致性**：确保镜像中的内容是由构建步骤生成的，而不是依赖于本地环境的状态。

通过适当配置 `.dockerignore` 文件，你可以确保 Docker 镜像构建过程更高效、更安全，并且生成的镜像更加轻量和一致。

---

#### 构建 Docker 镜像

执行以下命令，构建 Docker 镜像：

```bash
docker build -t your-username/your-vue-app:latest .
```

**命令解析**

- `-t`：指定镜像的名称和标签。
- `your-username/your-vue-app:latest`：镜像的名称为 `your-vue-app`，标签为 `latest`，`your-username` 是你的 Docker Hub 用户名（如果不需要推送到 Docker Hub，可以省略用户名）。
- `.`：指定 Dockerfile 所在的目录为当前目录。

---

#### 运行 Docker 容器

构建完成后，可以使用以下命令运行容器：

```bash
docker run -d -p 8000:80 --name vue-app your-username/your-vue-app:latest
```

**命令解析**

- `-d`：以守护进程模式运行容器。
- `-p 8080:80`：将本地的 8080 端口映射到容器内的 80 端口。
- `--name vue-app`：为容器指定一个名称 `vue-app`。
- `your-username/your-vue-app:latest`：指定运行的镜像。

运行成功后，可以在浏览器中访问 [http://localhost:8000](http://localhost:8000) 查看应用。

---

#### 推送镜像到 Docker Hub

如果需要将镜像发布到 Docker Hub，可以执行以下步骤：

1. **登录 Docker Hub**：
   
   ```bash
   docker login
   ```
   输入你的 Docker Hub 用户名和密码。
   
2. **推送镜像**：
   ```bash
   docker push your-username/your-vue-app:latest
   ```

3. **验证推送**：
   - 登录到 Docker Hub 网站，检查是否成功推送了镜像。

---

#### 在服务器上拉取镜像并运行

1. **登录服务器**：
   - 使用 SSH 登录到目标服务器。

2. **拉取镜像**：
   ```bash
   docker pull your-username/your-vue-app:latest
   ```

3. **运行容器**：
   ```bash
   docker run -d -p 8000:80 --name vue-app your-username/your-vue-app:latest
   ```

4. **访问应用**：
   - 使用服务器的 IP 地址或域名访问应用。

---

#### 构建多平台镜像

使用 `docker run --platform` 选项指定平台，或在构建时使用 Docker Buildx 构建多架构镜像。

首先，确保 Docker Buildx 已经启用。Buildx 是 Docker 的一个 CLI 插件，通常随 Docker Desktop 一起安装。

~~~bash
# 创建一个新的 Buildx builder
docker buildx create --name mybuilder --use

# 检查并初始化 Buildx builder
docker buildx inspect --bootstrap
~~~

使用 Buildx 构建支持多平台的镜像。在构建命令中，可以通过 `--platform` 选项指定目标平台。

~~~bash
docker buildx build --platform linux/amd64,linux/arm64/v8 -t your-username/your-app:latest --push .
~~~

- `--platform`：指定一个或多个目标平台。例如，`linux/amd64` 表示 x86_64 架构，`linux/arm64/v8` 表示 ARM 架构。
- `-t`：为镜像指定名称和标签。
- `--push`：构建完成后直接推送到指定的镜像仓库（如 Docker Hub）。

---

#### 总结

通过以上步骤，我们成功将 Vue 应用打包成 Docker 镜像，并通过 Docker 容器运行。借助 Docker 的能力，可以轻松实现应用的跨平台发布与部署。

##### 完整命令流程
1. 构建 Vue 应用：
   ```bash
   npm run build
   ```
2. 构建 Docker 镜像：
   ```bash
   docker build -t your-username/your-vue-app:latest .
   ```
3. 运行 Docker 容器：
   ```bash
   docker run -d -p 8080:80 --name vue-app your-username/your-vue-app:latest
   ```
4. 推送镜像到 Docker Hub：
   ```bash
   docker push your-username/your-vue-app:latest
   ```
5. 在服务器上拉取并运行：
   ```bash
   docker pull your-username/your-vue-app:latest
   docker run -d -p 80:80 --name vue-app your-username/your-vue-app:latest
   ```

通过这些步骤，你可以轻松地将 Vue 应用容器化并部署到任意支持 Docker 的环境中。