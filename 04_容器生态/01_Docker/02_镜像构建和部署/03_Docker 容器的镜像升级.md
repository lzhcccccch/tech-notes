## Docker 容器的镜像升级

[toc]

在 Linux 环境下升级 Docker 容器的镜像，可以按照以下步骤操作：

#### 使用 Docker 命令

1. **拉取最新镜像**

   首先，从 Docker 镜像仓库中拉取最新的镜像版本：

   ```bash
   docker pull <image_name>:<tag>
   ```

   如果不指定标签，默认会拉取 `latest` 标签的镜像。

2. **停止并移除旧容器**

   停止正在运行的容器：

   ```bash
   docker stop <container_id_or_name>
   ```

   移除旧容器：

   ```bash
   docker rm <container_id_or_name>
   ```

3. **启动新容器**

   使用更新后的镜像启动新的容器。你可以使用与旧容器相同的配置（端口映射、环境变量、卷等）：

   ```bash
   docker run -d --name <new_container_name> <options> <image_name>:<tag>
   ```

   确保 `<options>` 包含你需要的所有参数。

4. **验证新的容器**

   确保新容器运行正常：

   ```bash
   docker ps
   ```

   检查日志：

   ```bash
   docker logs <new_container_name>
   ```

----

#### 使用 Docker Compose

如果你使用 Docker Compose，可以通过以下方式升级：

1. **更新 `docker-compose.yml`**

   更新 `docker-compose.yml` 文件中的镜像版本。

2. **拉取最新镜像**

   ```bash
   docker-compose pull
   ```

3. **重新创建容器**

   ```bash
   docker-compose up -d
   ```

这将停止旧容器并使用新镜像启动新容器。