## Java 应用构建部署 Docker 镜像的完整指南

[toc]

本文档将指导您如何为 Java 应用构建 Docker 镜像，将其推送到 Docker 镜像仓库，并利用该镜像启动容器。我们将涵盖从准备 Java 应用到运行容器的每一个步骤。

#### 准备工作

在开始之前，请确保具备以下条件：

- 安装了 Docker。可以通过访问 [Docker 官方网站](https://www.docker.com/get-started) 下载并安装。
- 一个 Java 应用程序（例如，一个包含 `pom.xml` 的 Maven 项目）。
- Docker Hub 账户或其他 Docker 镜像仓库的访问权限。

##### 环境准备

1. **安装 Java 和 Maven**：确保本地环境安装了 Java（JDK 8 或更高版本）和 Maven。
2. **验证安装**：
   ```bash
   java -version
   mvn -version
   docker --version
   ```

---

#### 创建 Dockerfile

Dockerfile 是一个文本文件，其中包含构建 Docker 镜像的指令。以下是一个示例 Dockerfile，用于构建 Java 应用的镜像。

```dockerfile
# 使用官方的 OpenJDK 21 作为基础镜像
FROM openjdk:21-jdk-slim

# 设置工作目录
WORKDIR /app

# 将项目的 jar 文件复制到容器中
COPY target/your-app.jar app.jar

# 暴露应用程序的端口
EXPOSE 8080

# 运行应用程序
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**注意事项**

- 替换 `your-app.jar` 为实际生成的 jar 文件名。
- 确保端口号 `8080` 与应用程序配置的端口一致。

##### springboot 中指定 jar 名称

```xml
<build>
    <finalName>LifeRecordsServer</finalName>
</build>
```

---

#### 构建 Docker 镜像

使用 Dockerfile 构建镜像。

##### 构建命令

在项目根目录下运行以下命令：

```bash
docker build -t your-image-name:latest .
```

##### 验证镜像

使用以下命令查看构建的镜像：

```bash
docker images ls
```

---

#### 推送镜像到 Docker 仓库

将构建的镜像推送到 Docker Hub 或其他镜像仓库。

##### 登录 Docker Hub

```bash
// 登录默认配置的镜像仓库（daemon.json），默认是 Docker Hub
docker login 

// 登录到自定义的仓库
docker login your-private-registry.com
```

输入您的 Docker Hub 用户名和密码。如果启用了双因素认证，请使用个人访问令牌。

##### 推送镜像

与登录同理，如果是推送到默认的镜像仓库，则不需要指定仓库地址

```bash
// 默认仓库
docker push your-repo/your-image-name:latest

// 自定义仓库
docker push your-private-registry.com/your-repo/your-image-name:latest
```

##### 验证推送

在 Docker Hub 网站上检查镜像是否已成功推送。

---

#### 运行 Docker 容器

从镜像启动容器以运行 Java 应用。

##### 启动容器

```bash
docker run -d -p 8080:8080 your-dockerhub-username/your-app-name:latest
```

##### 验证容器运行

使用以下命令查看运行的容器：

```bash
docker ps
```

访问 `http://localhost:8080` 验证应用是否正常运行。

---

#### 附录：常见问题

##### 1. 如何处理端口冲突？

如果端口 `8080` 已被占用，可以在 `docker run` 命令中更改主机端口，例如 `-p 9090:8080`。

##### 2. 如何调试构建问题？

使用 `docker build` 时添加 `--progress=plain --no-cache` 选项以获取详细日志。

##### 3. 如何处理平台不匹配问题？

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

通过以上步骤，您可以成功地为 Java 应用构建 Docker 镜像，并将其部署到容器中运行。希望本指南对您有所帮助！