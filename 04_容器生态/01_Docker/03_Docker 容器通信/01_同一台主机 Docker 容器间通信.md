# 同一台主机Docker 容器间通信

[toc]

## 简介

在现代软件开发中，Docker 容器已经成为一种不可或缺的技术。使用 Docker，可以将应用及其依赖封装在一个独立的环境中运行，确保在不同环境下具有一致的表现。然而，随着服务的扩展和分布式架构的普及，往往需要在多个容器之间实现高效的通信。本文将详细介绍在同一台主机上如何通过 Docker 实现容器间的通信。

---

## Docker 网络基础

Docker 通过不同的网络模式来支持容器通信，默认提供了以下几种网络类型：

- **bridge**：默认的桥接网络，适用于单主机上的容器通信。
- **host**：直接使用宿主机的网络，绕过 Docker 网络隔离，但不适合多容器通信。
- **none**：没有网络连接，容器只能使用自己的回环接口。
- **overlay**：适用于跨主机的容器通信，一般用于 Swarm 集群或 Kubernetes 环境。

在同一主机上进行容器间通信，最常用的是 **bridge** 网络模式。

---

## docker 命令实现容器间通信

Docker 在启动时会自动创建一个名为 `bridge` 的默认网络，所有未指定网络的容器会连接到这个网络中，使用 IP 地址互相通信。

### 容器名称解析

在同一个 `bridge` 网络中的容器可以通过容器名称进行通信。Docker 内置了 DNS 服务，可以将容器名解析为容器的 IP 地址。

**示例步骤**：

1. 启动两个容器，并指定名称：

   ```sh
   docker run -d --name app1 busybox sleep 3600
   docker run -d --name app2 busybox sleep 3600
   ```

2. 进入 `app1` 容器并 ping `app2` 容器：

   ```sh
   docker exec -it app1 sh
   ping app2
   ```

3. 如果通信成功，说明容器已通过容器名解析成功建立通信。

### 使用自定义 bridge 网络

尽管默认的 `bridge` 网络已能满足通信需求，创建自定义 bridge 网络可以更好地管理容器的通信，并允许用户指定 IP 地址范围等。

**创建自定义 bridge 网络**：

```sh
docker network create --driver bridge mysql_network
```

具体含义如下：

- `docker network create`：创建一个新的 Docker 网络。
- `--driver bridge`：指定网络类型为 `bridge` 网络，适合同一主机上的容器通信。
- `mysql_network`：这是新网络的名称，自定义的名称可以帮助区分不同的网络。

**将容器连接到自定义网络**：

```sh
docker run -d --name one-api --network mysql_network
```

**测试容器通信**：

```sh
docker exec -it one-api sh
ping mysql_docker
```

在这种自定义网络中，容器名解析会更准确，不会与其他 bridge 网络中的容器混淆，适合隔离和管理多个容器组。

---

## Docker Compose 进行容器间通信

对于复杂应用，可以使用 Docker Compose 来定义和管理多个容器及其网络。Docker Compose 可以通过服务名称实现容器间的服务发现，无需依赖容器名。

### 示例 Docker Compose 配置

以下是一个简单的 `docker-compose.yml` 文件，定义了两个容器 `web` 和 `db`：

```yaml
services:
  web:
    image: nginx
    networks:
      - app_network
  db:
    image: mysql
    environment:
      MYSQL_ROOT_PASSWORD: example
    networks:
      - app_network

networks:
  app_network:
    driver: bridge
    # 指定名称，否则会默认拼接镜像名称
    name: app_network
```

**步骤**：

1. 启动服务：

   ```sh
   docker-compose up -d
   ```

2. 使用容器名称进行通信，例如在 `web` 容器中访问 `db` 容器的 MySQL 服务：

   ```sh
   docker exec -it <web_container_id> sh
   ping db
   ```

在 Docker Compose 下，服务名（如 `db`）会自动解析为相应的容器 IP 地址，方便容器间通信。

---

## 网络调试与常见问题排查

### 查看网络配置

可以使用以下命令查看当前 Docker 网络配置：

```sh
docker network ls             # 查看网络列表
docker network inspect <network_name>   # 查看网络详情
```

### 容器连接失败

- **DNS 配置问题**：确保容器在同一网络中，且正确配置了名称解析。
- **防火墙设置**：如果容器在特定端口通信，需要检查宿主机防火墙设置，避免限制通信端口。

### 使用 `curl` 或 `nc` 测试网络

如果希望检查具体服务（如 HTTP、数据库）是否正常开放，可以使用 `curl` 或 `nc` 测试特定端口的连通性。

---

## 示例：one-api 使用外置 mysql

> one-api: https://github.com/songquanpeng/one-api

首先启动 MySQL 容器，不指定 `network` （如果指定更好），适用于将新的容器和已经启动并且不方便重启的容器进行通信。

创建 `network`，并且让 MySQL 容器加入进来。

~~~sh
# 创建network
docker network create mysql_network

# 让 MySQL 加入进来
docker network connect mysql_network mysql_docker
~~~

修改 one-api 的 docker-compose 文件，然后启动 one-api。

~~~yaml
services:
  one-api:
    image: justsong/one-api:latest
    container_name: one-api
    restart: always
    ports:
      - "3000:3000"
    volumes:
      - api_data:/var/lib/oneapi/data
      - api_log:/var/lib/oneapi/logs
    environment:
      # MySQL 镜像的名称和 docker 中的端口
      - SQL_DSN=username:password@tcp(mysql_docker:3306)/one-api
      - SESSION_SECRET=random_string  # 修改为随机字符串
      - TZ=Asia/Shanghai
    healthcheck:
      test: [ "CMD-SHELL", "wget -q -O - http://localhost:3000/api/status | grep -o '\"success\":\\s*true' | awk -F: '{print $2}'" ]
      interval: 30s
      timeout: 10s
      retries: 3
    # 指定使用的network
    networks:
      - mysql_network

volumes:
  api_data: 
  api_log: 

# 配置 network，使用已经存在的 network
networks:
  mysql_network:
    external: true
~~~

当然也可以直接使用命令启动：
~~~ sh
# 省略了一些其它参数，比如数据库连接
docker run -d --name one-api --network mysql_network justsong/one-api:latest
~~~

查看是否使用 mysql_network 成功。

~~~sh
docker network inspect mysql_network
~~~

输出：

~~~json
[
    {
        "Name": "mysql_network",
        "Id": "37df2354c03962b7340d6d70defcb0665d538eb3b19771b9d8d3cc5e1ff64242",
        "Created": "2024-11-08T08:31:12.447781922Z",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": {},
            "Config": [
                {
                    "Subnet": "172.23.0.0/16",
                    "Gateway": "172.23.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "7144b93a470fde03ed152124a8356c96d2c5cb845e1550b4c94fe805a7730bc8": {
                "Name": "mysql_docker",
                "EndpointID": "288c1d7d7481b5bada6c72178e9e4e9330377c0b35be07c9a189c53ef157f41d",
                "MacAddress": "02:42:ac:17:00:02",
                "IPv4Address": "172.23.0.2/16",
                "IPv6Address": ""
            },
            "c2822fd0f822e38d5ddeaf1b78e076ea123528bc97322a072108bd9d8d6a7a59": {
                "Name": "one-api",
                "EndpointID": "85ecd3294434248fa4e0d3ca77fe8c525ead42976312d53ae4010e093d472db1",
                "MacAddress": "02:42:ac:17:00:03",
                "IPv4Address": "172.23.0.3/16",
                "IPv6Address": ""
            }
        },
        "Options": {},
        "Labels": {}
    }
]
~~~

---

## 总结

在同一台主机上实现 Docker 容器间通信主要通过 `bridge` 网络完成。可以使用默认或自定义 bridge 网络，结合容器名称进行互相解析。通过 Docker Compose，可以方便地定义和管理多个容器的通信配置。此外，适当的调试方法和网络管理也有助于解决常见的通信问题。

掌握这些基础方法，将有助于构建健壮的容器化应用，并为未来的跨主机通信做好准备。
