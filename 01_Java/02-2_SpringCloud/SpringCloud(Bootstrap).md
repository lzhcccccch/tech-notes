## Spring Cloud(Bootstrap)

[TOC]

#### 一、bootstrap.yml 简介

* Bootstrap 是 Spring Cloud 新引入的上下文, 与传统的Spring 上下文一致。系 ConfigurableApplicationContext 实例,由 BootstrapApplicationListener 在监听 ApplicationEnvironmentPreparedEvent 时创建。
* bootstrap.yml 比 application.yml 具有更高的优先级, 所以适合做一些引导上下文的配置。
* bootstrap.yml 是系统级的资源配置项, application.yml 是用户级的资源配置项。
* Spring Cloud 会创建 “Bootstrap Context” 作为 “Application Context” 的父上下文。初始化的时候 Bootstrap Context 负责从外部加载资源配置属性并解析。这两个上下文共享一个 “Environment”, Bootstrap具有更高的优先级, 不会被本地配置所覆盖。

---

#### 二、Bootstrap 中的 pom 依赖

##### feign-httpclient

> 默认情况下, feign 通过jdk中的 URLConnection 向下游服务发起 HTTP 请求. URLConnection 会对每个地址保持长连接, 而且没有连接池的支持, 在达到一定流量后便会出现问题. 所以使用 HTTPClient 来替换掉原生的HTTP请求. 

~~~java
	<groupId>io.github.openfeign</groupId>
  	<artifactId>feign-httpclient</artifactId>
~~~

> 上述依赖只是引入了 feign 对于 HTTPClient 的支持, 但是我们还需要引入一个 HTTPClient 的依赖, 以 Apache Http Client 为例: 

> 引入 httpclient 依赖

~~~java
	<groupId>org.apache.httpcomponents</groupId>
    <artifactId>httpclient</artifactId>
~~~

> 修改 application.yml 文件

```java
feign:
  httpclient:
    enabled: true
```

##### spring-cloud-starter-openfeign

> Spring Cloud 提供了 RestTemplate 和 FeignClient 两种服务调用方式. openfeign是通过 FeignClient 来完成服务调用.

> 注意: openfeign 依赖是修改服务调用的方式, 是显式的通过 feign 接口去调用; 而上面的 httpclient 是修改底层的请求方式.

```java
	<groupId>org.springframework.cloud</groupId>
  	<artifactId>spring-cloud-starter-openfeign</artifactId>
```

- 提供Feign客户端，可以实现服务之间通过Feign接口相互调用。
- 在Feign接口上添加 @FeignClient 注解，并且要设置相应的RequestMapping映射。
- 在启动类上需要添加 @EnableFeignClients(basePackages = {"Feign接口路径"})，basePackages可以省略。

##### spring-cloud-starter-config

> 是 Spring Cloud Config 的客户端, 里面集成了 spring-cloud-config-client

~~~java
	<groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-config</artifactId> 
~~~

##### spring-cloud-starter-netflix-eureka-server

~~~java
	<groupId>org.springframework.cloud</groupId>
  	<artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
~~~

* Spring Cloud 使用 Eureka 来实现服务注册与发现，既包含服务端，也包含客户端组件。
* Eureka服务端也称为注册中心，支持高可用，要实现一个注册中心，需要在启动类上添加 @EnableEurekaServer 注解。
* Eureka客户端可以同时充当服务器，将其状态复制到一个连接的对等点上。换句话说，客户机检索服务注册中心所有连接节点的列表，并通过负载均衡算法向其他服务发起请求。要实现一个客户端，需要在启动类上添加 @EnableEurekaClient 注解。
* Eureka心跳机制： 注册中心可以设置定时清理无效的服务；服务端需要定时向注册中心发送心跳信号，以此来表明自己处于存活状态。两者均是通过配置文件进行配置。

##### spring-cloud-starter-sleuth

~~~java
	<groupId>org.springframework.cloud</groupId>
  	<artifactId>spring-cloud-starter-sleuth</artifactId>
~~~

>  Spring-Cloud-Sleuth是Spring Cloud的组成部分之一，为SpringCloud应用实现了一种分布式追踪解决方案，其兼容了Zipkin, HTrace和log-based追踪。

#####  spring-cloud-starter-netflix-hystrix

~~~java
	<groupId>org.springframework.cloud</groupId>
  	<artifactId>spring-cloud-starter-netflix-hystrix</artifactId>
~~~

* 提供容错机制--断路器（也叫熔断器等）。具有请求熔断，服务降级，依赖隔离，请求缓存和请求合并等功能特性。
* 实现断路器功能需在启动类上添加 @EnableCircuitBreaker 注解。
* 请求熔断：当 Hystrix Command 请求后端服务失败（比如连接数据库失败等）数量超过一定比例(默认50%)，断路器会切换到开路状态(Open)。这时所有请求会直接失败而不会发送到后端服务。断路器保持在开路状态一段时间后(默认5秒)，自动切换到半开路状态(HALF-OPEN)。这时会判断下一次请求的返回情况，如果请求成功，断路器切回闭路状态(CLOSED),，否则重新切换到开路状态(OPEN)。Hystrix的断路器就像我们家庭电路中的保险丝，一旦后端服务不可用，断路器会直接切断请求链，避免发送大量无效请求影响系统吞吐量，并且断路器有自我检测并恢复的能力。
* 服务降级：Fallback相当于是降级操作。对于查询操作，可以实现一个fallback方法，当后端服务发生异常无法正常返回结果时，可以自动调用fallback方法来返回结果（比如一个友好的错误页面等）。定义fallback接口需在方法上添加 @HystrixCommand(fallbackMethod = "异常服务的方法名") 注解。
* 依赖隔离(采用舱壁模式，Docker就是舱壁模式的一种)：在Hystrix中，主要通过线程池来实现资源隔离。通常在使用的时候我们会根据调用的远程服务划分出多个线程池。

##### spring-boot-starter-actuator

~~~java
	<groupId>org.springframework.boot</groupId>
  	<artifactId>spring-boot-starter-actuator</artifactId>
~~~

* 可以对服务进行实时监控，监控服务的可用性。

> `actuator` 的核心部分是Endpoints，它用来监视应用程序及交互，`spring-boot-actuator`中已经内置了非常多的 **`Endpoints（health、info、beans、httptrace、shutdown等等）`**，同时也允许我们自己扩展自己的端点
>
> 在 `application.properties` 文件中配置`actuator`的相关配置，其中`info`开头的属性，就是访问`info`端点中显示的相关内容，值得注意的是`Spring Boot2.x`中，默认只开放了`info、health`两个端点，剩余的需要自己通过配置`management.endpoints.web.exposure.include`属性来加载（有`include`自然就有`exclude`，不做详细概述了）。如果想单独操作某个端点可以使用`management.endpoint.端点.enabled`属性进行启用或禁用

> ```java
> # 暴露监控端点
> management:
>   endpoints:
>     web:
>       exposure:
>         include: '*'
>   info:
>     git:
>       mode: full
> ```

##### spring-cloud-starter-openfeign

~~~java
	<groupId>org.springframework.cloud</groupId>
  	<artifactId>spring-cloud-starter-openfeign</artifactId>
~~~

* 提供Feign客户端，可以实现服务之间通过Feign接口相互调用。
* 在Feign接口上添加 @FeignClient 注解，并且要设置相应的RequestMapping映射。
* 在启动上需要添加 @EnableFeignClients(basePackages = {"Feign接口路径"})，basePackages可以省略。

##### spring-boot-admin-starter-client

~~~java
	<groupId>de.codecentric</groupId>
  	<artifactId>spring-boot-admin-starter-client</artifactId>
~~~

> Spring Boot Admin用于监控基于Spring Boot的应用, 它是在Spring Boot Actuator的基础上提供简洁的可视化WEB UI。