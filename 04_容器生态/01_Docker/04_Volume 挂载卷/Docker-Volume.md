









在使用 `docker-compose` 启动容器时，可以通过 `volumes` 关键字来指定卷（Volume）。卷可以用于持久化数据，并在容器之间共享数据。

下面是一个简单的 `docker-compose.yml` 文件示例，展示了如何正确地指定卷：

```yaml
services:
  db:
    image: mysql:latest
    container_name: mysql_docker
    environment:
      MYSQL_ROOT_PASSWORD: Password
    ports:
      - "3308:3306"
    volumes:
      # 本地目录或文件必须以 `/` 或 `./` 开头，如果直接以名字开头，会被识别为数据卷名而非本地目录名。
    	# 这是在 docker 中创建卷来存储，并不是存储到宿主机
      - db_data:/var/lib/mysql
      # 这是将数据挂载到宿主机的目录下。./db_data 是主机上的目录路径，/var/lib/mysql 是容器内的路径。
      # - ./db_data:/var/lib/mysql
    networks:
     - mysql_network

# 这是在 docker 中创建卷来存储，docker 中存储卷的名字是 db_data，并不是存储到宿主机
 volumes:
   db_data: 

networks:
  mysql_network: 
    name: mysql_network
```

**解释**

1. **服务 (`services`)**：
   定义服务：`mysql` 。
2. **MySQL 服务**：
   - `image`: 使用官方的 `mysql` 镜像。
   - `container_name`: 为容器指定一个名称 `MySQL`。
   - `environment`: 设置环境变量，例如 `MYSQL_ROOT_PASSWORD`。
   - `volumes`: 将主机的卷 `mysql_data` 挂载到容器的 `/var/lib/mysql` 目录。这确保了 MySQL 数据库的数据在容器重启或删除后仍然存在。
   - `networks`: 将容器连接到自定义网络 `my_network`。
3. **volumes**：
   定义了一个名为 `mysql_data` 的卷。
4. **networks**：
   定义了一个名为 `my_network` 的自定义网络。

### 启动服务

使用以下命令启动服务：

```sh
docker-compose up -d
```

这会在后台启动定义的所有服务，并创建必要的卷和网络。

### 验证卷的创建

你可以使用以下命令来验证卷是否已创建：

```sh
docker volume ls
```

你应该会看到一个名为 `your_project_name_mysql_data` 的卷（`your_project_name` 是你的项目名称）。

### 挂载主机目录（可选）

如果你希望将主机上的目录挂载到容器中，而不是使用 Docker 卷，可以这样指定：

```yaml
services:
  mysql:
    image: mysql:latest
    container_name: MySQL
    environment:
      MYSQL_ROOT_PASSWORD: yourpassword
    volumes:
      - ./mysql_data:/var/lib/mysql
    networks:
      - my_network
```

在这个例子中，`./mysql_data` 是主机上的目录路径，`/var/lib/mysql` 是容器内的路径。这样可以更方便地访问和管理数据。



### 挂载卷区分关键

不管采用哪种挂载方式，本地目录或文件必须以 `/` 或 `./` 开头，如果直接以名字开头，会被识别为数据卷名而非本地目录名。