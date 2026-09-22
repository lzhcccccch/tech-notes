# 							SpringBoot-Actuator

[toc]

##  一、 Spring Boot Admin 简介

> Spring Boot Admin 是 codecentric 公司开发的一款开源社区项目，目标是让用户更方便的管理以及监控 Spring Boot ® 应用。 应用可以通过我们的Spring Boot Admin客户端（通过HTTP的方式）或者使用Spring Cloud ®（比如Eureka，consul的方式）注册。 而前端UI则是使用Vue.js，基于Spring Boot Actuator默认接口开发的。
>
> 参考指南：[Spring Boot Admin 参考指南 (gitee.io)](https://consolelog.gitee.io/docs-spring-boot-admin-docs-chinese/)
>
> 官方文档：[Spring Boot Admin](https://docs.spring-boot-admin.com/current/getting-started.html)
>
> GitHub 源码地址：[Admin UI 用于管理春季启动应用程序](https://github.com/codecentric/spring-boot-admin)

看一下监控效果：

![](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240307155942895.png)

点击实例可以查看详细信息

![image-20240307155730853](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240307155730853.png)

![image-20240307155754374](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240307155754374.png)

---

## 二、Spring Boot Admin Server

### 1. 引入 pom 依赖

```xml
<dependency>
    <groupId>de.codecentric</groupId>
    <artifactId>spring-boot-admin-starter-server</artifactId>
</dependency>
  
<!-- 被监控服务发生变化发送邮件通知 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

### 2. 修改配置文件

在配置文件中添加如下配置

```yaml
spring:
  application:
    name: Spring-Cloud-Admin-Server
  boot:
    admin:
      notify:
        mail:
          # 当已注册的客户端的状态从 UP 变为 OFFLINE 或其他状态, 服务端就会自动将电子邮件发送到xxx@163.com
          to: root@163.com
          # 此处需与mail中配置的一致,即使相同也要配置,否则报错:553 Mail from must equal authorized user
          from: root@163.com
#  security:
#    user:
#      name: admin
#      password: admin
  mail:
    host: smtp.163.com
    username: root@163.com
    password: root!@
```

### 3. 启动类添加 @EnableAdminServer 注解

~~~java
@EnableAdminServer
@SpringBootApplication
public class AdminServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(AdminServerApplication.class, args);
        System.out.println("[----------start----------] Admin 访问地址: http://localhost:8010");
        // 打印 IP 地址和端口号
        try {
            String hostAddress = InetAddress.getLocalHost().getHostAddress();
            System.out.println("http://" + hostAddress + ":8010");
        } catch (UnknownHostException e) {
            System.out.println("获取 IP 地址失败");
        }
    }

}
~~~

### 4. 启动项目

启动项目，访问 http://localhost:8010。

因为还没有客户端进行集成，所以如下图显示暂无应用注册。

![image-20240307170914888](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240307170914888.png)

---

## 三、Spring Boot Admin Client

### 1. 引入 pom 依赖

~~~xml
<dependency>
    <groupId>de.codecentric</groupId>
    <artifactId>spring-boot-admin-starter-client</artifactId>
</dependency>
~~~

### 2. 修改配置文件

在配置文件中添加如下配置

~~~yaml
spring-boot-admin-url: http://localhost:8010

spring:
  boot:
    #设置admin-server的地址
    admin:
      client:
        enabled: true
        url: ${spring-boot-admin-url}
~~~

### 3. 启动客户端

启动项目，访问服务端 http://localhost:8010，客户端可以被监控。

![image-20240307171711669](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240307171711669.png)

点击红框查看详情，如下，发现详情展示的监控信息比文章开头展示的少了很多，想要展示更多监控信息，需要引入 actuator。

![image-20240307171832788](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240307171832788.png)

![image-20240307172057177](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240307172057177.png)

---

## 四、客户端引入 actuator

### 1. 引入 pom 依赖

在 **客户端** 引入 actuator 的依赖。

~~~xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
~~~

### 2. 修改配置文件

在配置文件中添加如下配置

~~~yaml
management:
  server:
    # 为了安全一般都启用独立的端口来访问后端的监控信息，默认与server.port相同
    port: ${server.port}
  endpoints:
    web:
      exposure:
        # 开放所有的端点(访问 http://localhost:${management.server.port}/actuator 查看所有开放且暴露的端点, 支持用户自定义端点)
        include: '*'
  endpoint:
    health:
      show-details: ALWAYS
~~~

### 3. 查看完整监控信息

重新启动客户端，访问服务端，再次点击实例，查看详情，可以查看左侧导航栏的信息。

![image-20240307172848449](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240307172848449.png)

如果查看某一端点的内容展示为*，这是因为出于安全考虑，Spring Boot Actuator 默认会对一些敏感的环境属性进行脱敏处理，可以通过对该端点进行单独配置来查看信息。

![image-20240307181110013](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240307181110013.png)

查看敏感信息配置，版本不同可能导致 key 不同，2023.0.0 版本中 key 的描述为： When to show unsanitized values，关键词 **unsanitized**。

~~~yaml
management:
  # 对外开放某个监控点
  endpoint:
    env:
      show-values: ALWAYS
~~~

![image-20240307185656181](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240307185656181.png)

### 4. 查看实时日志

在配置文件中添加日志文件的路径配置，在 resource 目录下创建 logs 文件夹，配置如下：

~~~yaml
logging:
  pattern:
    # 设置日志格式
    file: %clr(%d{yyyy-MM-dd HH:mm:ss.SSS}){faint} %clr(%5p) %clr(${PID}){magenta} %clr(---){faint} %clr([%15.15t]){faint} %clr(%-40.40logger{39}){cyan} %clr(:){faint} %m%n%wEx
  file:
    path: classpath:/logs/
    # 日志文件名字, 和 path 任选其一即可
#    name: path+name
~~~

![image-20240308093659165](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240308093659165.png)

### 5. 查看端点

查看客户端开放和暴露的所有的端点，访问 http://client_ip:port/actuator。

访问结果如下：

![](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/01.png)

~~~json
{
    "_links": {
        "self": {
            "href": "http://localhost:8761/actuator",
            "templated": false
        },
        "beans": {
            "href": "http://localhost:8761/actuator/beans",
            "templated": false
        },
        "caches-cache": {
            "href": "http://localhost:8761/actuator/caches/{cache}",
            "templated": true
        },
        "caches": {
            "href": "http://localhost:8761/actuator/caches",
            "templated": false
        },
        "health-path": {
            "href": "http://localhost:8761/actuator/health/{*path}",
            "templated": true
        },
        "health": {
            "href": "http://localhost:8761/actuator/health",
            "templated": false
        },
        "info": {
            "href": "http://localhost:8761/actuator/info",
            "templated": false
        },
        "conditions": {
            "href": "http://localhost:8761/actuator/conditions",
            "templated": false
        },
        "shutdown": {
            "href": "http://localhost:8761/actuator/shutdown",
            "templated": false
        },
        "configprops-prefix": {
            "href": "http://localhost:8761/actuator/configprops/{prefix}",
            "templated": true
        },
        "configprops": {
            "href": "http://localhost:8761/actuator/configprops",
            "templated": false
        },
        "env": {
            "href": "http://localhost:8761/actuator/env",
            "templated": false
        },
        "env-toMatch": {
            "href": "http://localhost:8761/actuator/env/{toMatch}",
            "templated": true
        },
        "logfile": {
            "href": "http://localhost:8761/actuator/logfile",
            "templated": false
        },
        "loggers": {
            "href": "http://localhost:8761/actuator/loggers",
            "templated": false
        },
        "loggers-name": {
            "href": "http://localhost:8761/actuator/loggers/{name}",
            "templated": true
        },
        "heapdump": {
            "href": "http://localhost:8761/actuator/heapdump",
            "templated": false
        },
        "threaddump": {
            "href": "http://localhost:8761/actuator/threaddump",
            "templated": false
        },
        "metrics": {
            "href": "http://localhost:8761/actuator/metrics",
            "templated": false
        },
        "metrics-requiredMetricName": {
            "href": "http://localhost:8761/actuator/metrics/{requiredMetricName}",
            "templated": true
        },
        "scheduledtasks": {
            "href": "http://localhost:8761/actuator/scheduledtasks",
            "templated": false
        },
        "mappings": {
            "href": "http://localhost:8761/actuator/mappings",
            "templated": false
        },
        "refresh": {
            "href": "http://localhost:8761/actuator/refresh",
            "templated": false
        },
        "restart": {
            "href": "http://localhost:8761/actuator/restart",
            "templated": false
        },
        "pause": {
            "href": "http://localhost:8761/actuator/pause",
            "templated": false
        },
        "resume": {
            "href": "http://localhost:8761/actuator/resume",
            "templated": false
        },
        "features": {
            "href": "http://localhost:8761/actuator/features",
            "templated": false
        },
        "serviceregistry": {
            "href": "http://localhost:8761/actuator/serviceregistry",
            "templated": false
        }
    }
}
~~~

上面是 actuator 自带的一些端点，actuator 也支持我们自定义端点，进行一些自己想要的监控，可以参考文档进行。

---

## 五、 actuator 部分端点解析

### 1. beans

>可以看到定义的所有的 bean 的信息

### 2. health

> 可以通过实现 `HealthIndicator` 接口来实现健康检查,返回值的状态信息在`org.springframework.boot.actuate.health.Status`内

### 3. info

> 应用信息，springboot 项目可以通过修改 pom 文件来进行展示

访问 info 节点可以返回相应的配置信息

### 4. env

> 侧重于看硬件信息和 JVM 的相关信息

### 5. configprops

> 可以看到 application.yml(propertites) 中的配置信息

### 6. mappings

> 可以看到控制器中的映射信息， RequestMapping 和所对应的方法和 controller

### 7. metrics

> 内存堆、CPU 核数等信息

### 8. dump

> 调用 `java.lang.management.ThreadMXBean`的
>  `public ThreadInfo[] dumpAllThreads(boolean lockedMonitors, boolean lockedSynchronizers);` 方法来返回活动线程的信息

注意：在配置文件中配置 `management.endpoint.shutdown.enabled=true` 然后访问 `http://ip:port/shutdown` 可以关掉该服务，此操作有很大风险，不建议使用或者搭配权限验证等进行操作。

---

## 六、总结

Spring Boot Admin 结合 Actuator 提供了一套完整的应用监控解决方案，具有以下优势：

1. **可视化监控**：通过直观的 Web 界面，可以实时查看应用的运行状态、健康信息和各项指标。

2. **丰富的监控指标**：Actuator 提供了大量内置端点，涵盖应用配置、性能指标、线程状态、日志等多方面信息。

3. **告警通知**：支持邮件等多种方式的告警通知，当应用状态发生变化时及时通知管理员。

4. **易于集成**：只需简单的依赖配置，就能快速将现有 Spring Boot 应用纳入监控体系。

5. **安全可控**：可以通过独立端口、权限控制等方式保障监控系统的安全性。

6. **可扩展性**：支持自定义端点，可以根据业务需求扩展监控指标。

在实际应用中，可以根据项目需求选择性地开放端点，并结合安全策略，构建一个既全面又安全的监控系统。对于生产环境，建议配置适当的安全措施，避免敏感信息泄露和未授权访问。

Spring Boot Admin + Actuator 的组合为微服务架构下的应用监控提供了强大支持，是 Spring Boot 应用运维不可或缺的工具。

---

## 项目地址

> https://github.com/lzhcccccch/SDP-MSP-SpringCloud/tree/master/MSP-Monitor/MSP-Monitor-Admin