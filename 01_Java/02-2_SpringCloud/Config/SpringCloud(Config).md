## Spring Cloud(Config)

[TOC]

#### 一. Spring Cloud Config 简介

> 用来为分布式系统中的基础设施和微服务应用提供集中化的外部配置支持, 提供集中化的外部配置支持, 即支持将配置文件放在本地或者远程Git中进行读取. Spring Cloud Config 实现的配置中心默认采用 Git 来存储配置信息, 也支持 SVN 以及本地系统等方式.

> Spring Cloud Config 是一个基于 http 协议的远程配置实现方式. 通过统一的配置管理服务器进行配置管理, 客户端通过 https 协议主动地拉取服务的配置信息, 完成配置获取.

##### Spring Cloud Config 分为服务端和客户端

* 服务端称为分布式配置中心, 用来连接配置仓库(Git)并为客户端提供获取配置信息/加密解密信息等功能
* 客户端则是每个微服务应用, 他们通过指定的配置中心来管理配置文件, 并在启动的时候从配置中心获取和加载配置信息

---

#### 二. Spring Cloud Config 服务端

> 分布式配置中心(统一配置中心). Server 提供配置文件的存储, 以接口的形式将配置文件的内容提供出去. 它会从远端的 Git 上拉取配置, 并且同步到本地 Git 中, 所以即使远端的 Git 挂掉了, 本地的 Git 依旧可以为服务提供支持.

##### Spring Cloud Config Server 的实现

> 添加 pom 依赖

```java
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-config-server</artifactId>
</dependency>

<!-- 2020.X.X版本官方重构了bootstrap引导配置的加载方式，需要添加以下依赖 -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-bootstrap</artifactId>
</dependency>
```

> 在启动类上添加 @EnableConfigServer 注解

> 修改配置文件, 添加相应配置

```java
spring:
  cloud:
    config:	# 配置中心
      server:
        naive:	# 读取本地配置
          search-locations: classpath:/config/	# 配置路径
        git:	# 读取远端Git
          uri: http:xxx/xxx/xxx.git   # 配置git仓库的地址
          search-paths:        # git仓库地址下的相对地址, 可以配置多个, 用 "," 分割
          username:	# git仓库的账号
          password:	# git仓库的密码
          timeout: 100
          basedir: /home/sdp/gitconfig	# 
```

---

#### 三、Spring Cloud Config 客户端

##### Spring Cloud Config Client 的实现

> 添加 pom 依赖

~~~Java
<dependency>
    <groupId>de.codecentric</groupId>
    <artifactId>spring-boot-admin-starter-client</artifactId>
</dependency>

<!-- 2020.X.X版本官方重构了bootstrap引导配置的加载方式，需要添加以下依赖 -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-bootstrap</artifactId>
</dependency>
~~~

> 配置文件中添加相关配置

~~~yaml
spring:
  cloud:
    config:
      name: ${spring.application.name}
      uri: ${spring-cloud-config-server-url}
      profile: ${spring.profiles.active}
      fail-fast: true
~~~

配置文件在 config server 端存储的形式为 applicationName-环境，比如：Spring-Cloud-Admin-Server-dev.yml。

---

#### 项目地址

> https://github.com/lzhcccccch/SDP-MSP-SpringCloud/tree/master/MSP-Config
