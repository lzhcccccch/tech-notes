## Spring Cloud(Zipkin)

[TOC]

#### 一. Zipkin简介

> Zipkin是一个开源项目, 它提供了在分布式环境下发送/接收/存储和可视化跟踪的机制. 这时的我们能够对服务之间的活动进行关联, 能够更加清楚地了解服务中发生的情况以及调用关系. 假设一个系统有十几个微服务, 其中一个服务出现问题, 在定位问题时要查看每个服务的日志, 工作量十分巨大. 这个时候Zipkin可以把整个链路调用过程给整合起来, 只需要到一个地方去查找, 就可以定位错误, 省时省力. 

##### Zipkin分为服务端和客户端

* 客户端就是每一个服务单元, 用来发送链路信息到服务端
* 服务端用来接收客户端发送来的链路信息, 并进行处理

---

#### 二. Zipkin服务端

> Zipkin服务将存储我们服务的所有操作步骤, 每一步操作都会发送到该服务器用来进行跟踪识别

##### Zipkin服务端由四部分组成

* Collector组件: 用来接收客户端发送的链路信息并整理成Zipkin能够处理的Span格式, 供后续存储或向外部提供查询使用
* Storage组件: 对链路信息进行保存, 默认存储在内存中, 通过配置还可以存储到数据库中, 目前支持的数据库有: Mysql/Cassandra和Elasticsearch
* Restful API组件: 对其他服务单元提供API接口进行查询链路信息
* Web UI组件: 基于API组件实现的上层应用, 调用API组件的接口并将信息显示到Web界面

##### Zipkin服务端的实现

> 添加pom依赖, 版本根据 artifactId 查询

```java 
	<!-- 引入zipkin-server依赖，提供server端功能 -->
	<dependency>
		<groupId>io.zipkin.java</groupId>
		<artifactId>zipkin-server</artifactId>
	</dependency>

	<!-- 引入zipkin-autoconfigure-ui依赖, 用来提供zipkin web ui组件的功能, 方便查看相关信息 -->
	<dependency>
		<groupId>io.zipkin.java</groupId>
		<artifactId>zipkin-autoconfigure-ui</artifactId>
	</dependency>
	
    <!-- 引入eureka依赖 -->
	<dependency>
		<groupId>org.springframework.cloud</groupId>
		<artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
	</dependency>
```

> 启动类上添加 @EnableZipkinServer 注解, 标识开启 Zipkin Server 功能

> 若是基础的服务功能, 配置文件不需要额外配置(已配好端口和应用名字). 若是要注册到注册中心, 则要引入上面的注册中心服务依赖以及配置注册中心地址. 

> Zipkin Server 默认是将数据存储在内存中, 一旦程序重启, 之前的链路数据会全部丢失, 所以我们可以设置将链路数据存储到数据库中. 以MySQL为例, Maven依赖中添加相应依赖, 配置文件中添加数据源配置以及配置 zipkin.storage.type 为mysql, 另外还需要在 MySQL 中初始化数据库脚本,添加相应的表

```java
eureka:
  client:
    serviceUrl:
      defaultZone: http://xxxx
zipkin:
  storage:
    type: mysql
```

---

#### 三. Zipkin客户端

> 客户端其实就是每一个微服务, 只有将 Zipkin Client 注册到 Zipkin Server 中, 才可以在 Zipkin Server 中跟踪服务, 否则 Zipkin Server 空空如也

##### Zipkin客户端的实现

> 添加pom依赖, 版本根据 artifactId 查询

```java
	<!-- 引入zipkin 依赖 ，提供zipkin客户端的功能 -->
	<dependency>
		<groupId>org.springframework.cloud</groupId>
		<artifactId>spring-cloud-starter-zipkin</artifactId>
	</dependency>
```

> 对配置文件添加配置, 需要将 Zipkin Server 的地址配上

~~~java
spring:
  zipkin:
    base-url: http://xxxxx
~~~

