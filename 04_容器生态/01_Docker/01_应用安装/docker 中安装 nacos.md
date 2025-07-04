## docker 中部署 nacos

[toc]

#### 简介

Nacos（官方网站： [nacos.io](https://nacos.io/) ）是一个易于使用的平台，专为动态服务发现、配置和服务管理而设计。它可以帮助您轻松构建云原生应用程序和微服务平台。

开源地址：[alibaba/nacos](https://github.com/alibaba/nacos)。

本文主要讲述如何在 docker 中部署单机版 nacos。

---

#### 安装

执行命令安装 nacos

~~~sh
git clone https: //github.com/nacos-group/nacos-docker.git
~~~

![image-20240912133659758](pic/image-20240912133659758.png)

如果没有安装 git，可以先执行以下命令安装 git

~~~sh
sudo yum install git
~~~

查看 git 版本进行验证git 是否安装成功

~~~sh
git --version
~~~

执行完 `git clone` 命令后，会在当前文件夹下生成一个 `nacos-docker` 的文件夹，可以将该文件夹移动到想要的目录下。

~~~sh
mv /nacos-docker /usr/mydocker/nacos-docker
~~~

---

#### 配置数据库

数据库分为 nacos 的数据库连接配置和数据库的初始化。

##### nacos

我们配置的是单机版，所以要修改 `nacos-standlone-mysql.env` 文件。该文件位于 `env` 目录下。我的版本为 2.4.2，如果版本不一致的话，可以分布执行命令，找到配置文件进行修改。

执行命令

~~~sh
-- 进入目录
cd nacos-docker/env
-- 修改文件内容
vim nacos-standlone-mysql.env
-- 查看内容是否修改成功
cat nacos-standlone-mysql.env
~~~

配置文件内容：

~~~yaml
// 域名优先，支持 IP
PREFER_HOST_MODE=hostname
// 单机
MODE=standalone
SPRING_DATASOURCE_PLATFORM=mysql
// 数据库连接地址
MYSQL_SERVICE_HOST=
// 数据库库名
MYSQL_SERVICE_DB_NAME=nacos_config
// 数据库端口
MYSQL_SERVICE_PORT=3308
// 数据库用户名
MYSQL_SERVICE_USER=root
// 数据库用户密码
MYSQL_SERVICE_PASSWORD=
MYSQL_SERVICE_DB_PARAM=characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useUnicode=true&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
NACOS_AUTH_IDENTITY_KEY=2222
NACOS_AUTH_IDENTITY_VALUE=2xxx
NACOS_AUTH_TOKEN=SecretKey012345678901234567890123456789012345678901234567890123456789
~~~

修改 `MYSQL_SERVICE_HOST`、`MYSQL_SERVICE_DB_NAME`、`MYSQL_SERVICE_PORT`、`MYSQL_SERVICE_USER`、`MYSQL_SERVICE_PASSWORD` 这五个配置，修改为自己的数据库。

##### 初始化

在自己数据库中，创建名为 `nacos_config` 的数据库（和上面配置文件中一致），并且执行脚本进行初始化。

脚本地址：[nacos 初始化脚本](https://github.com/alibaba/nacos/blob/develop/distribution/conf/mysql-schema.sql)

---

#### 启动

在 `nacos-docker` 目录下，执行以下命令：

~~~sh
docker-compose -f example/standalone-mysql-8.yaml up -d
~~~

启动后，可以执行以下命令查看运行中容器运行状态：

~~~sh
docker ps
~~~

启动后，访问以下地址查看控制台

> http://公网ip地址:8848/nacos/index.html

2.2.1 版本之后 nacos 的访问默认不需要密码，但是这样风险比较大，我们还是需要一个简单的验证。

---

#### 配置用户名密码登录

还是修改 `nacos-standlone-mysql.env` 文件，在里面添加开启验证的参数即可。

~~~yaml
// 域名优先，支持 IP
PREFER_HOST_MODE=hostname
// 单机
MODE=standalone
SPRING_DATASOURCE_PLATFORM=mysql
// 数据库连接地址
MYSQL_SERVICE_HOST=
// 数据库库名
MYSQL_SERVICE_DB_NAME=nacos_config
// 数据库端口
MYSQL_SERVICE_PORT=3308
// 数据库用户名
MYSQL_SERVICE_USER=root
// 数据库用户密码
MYSQL_SERVICE_PASSWORD=
MYSQL_SERVICE_DB_PARAM=characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useUnicode=true&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
// 添加该参数，新版本该参数默认 false
NACOS_AUTH_ENABLE=true
NACOS_AUTH_IDENTITY_KEY=2222
NACOS_AUTH_IDENTITY_VALUE=2xxx
NACOS_AUTH_TOKEN=SecretKey012345678901234567890123456789012345678901234567890123456789
~~~

再次执行命令启动，访问页面，发现需要用户名密码。

~~~sh
docker-compose -f example/standalone-mysql-8.yaml up -d
~~~











