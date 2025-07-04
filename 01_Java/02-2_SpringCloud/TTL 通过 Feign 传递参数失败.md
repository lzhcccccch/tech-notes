## TTL 通过 Feign 传递参数失败记录

[toc]



本次测试是通过 postman 发起请求，在 header 中添加参数testRpc，并且修改值实现。





TTL（TransmittableThreadLocal）用于线程之间传递参数，但是在通过FeignRequestInterceptor 进行 Feign 调用时传递参数失败。



在生产中最明显的情况为 activiti 调用 system 获取审批人时，获取审批人失败，是因为流程数据源错误导致查不到相关的人。





测试流程：



在 order 服务中设置过滤器，用于拦截请求并设置请求头信息而且设置RpcContextHolder，用于存放 RPC 调用的信息（userId、datasource）。



RpcContextHolder代码：

下面的代码即使使用双重锁进行单例实例化也不行！！！

~~~java
package com.cloud.common.rpc;

import com.alibaba.fastjson.JSONObject;
import com.alibaba.ttl.TransmittableThreadLocal;
import com.cloud.common.constant.Constants;

import java.util.Optional;

/**
 * 服务调用上下文控制器
 * <p>
 * author: lzhch
 * version: v1.0
 * date: 2024/1/31 17:10
 */

public class RpcContextHolder {

    /**
     * 线程安全 ThreadLocal
     */
    private final TransmittableThreadLocal<JSONObject> threadLocal;

    /**
     * 静态内部类单例模式 单例初使化
     */
    private static final RpcContextHolder INSTANCE = new RpcContextHolder();

    /**
     * 构造函数
     */
    private RpcContextHolder() {
        this.threadLocal = new TransmittableThreadLocal<>();
    }

    /**
     * 创建实例
     */
    public static RpcContextHolder getInstance() {
        return RpcContextHolder.INSTANCE;
    }

    /**
     * 用户上下文中放入信息
     *
     * @param currentUserContext 当前用户上下文
     */
    public void setContext(JSONObject currentUserContext) {
        threadLocal.set(currentUserContext);
    }

    /**
     * 获取上下文中的信息
     *
     * @return JSONObject 用户JSON对象
     */
    public JSONObject getContext() {
        return threadLocal.get();
    }

    /**
     * 清空上下文
     */
    public void clear() {
        threadLocal.remove();
    }

    /**
     * 获取数据源
     */
    public String getDataSource() {
        return Optional.ofNullable(getContext()).orElse(new JSONObject()).getString(Constants.DATASOURCE);
    }

    /**
     * 获取 UserId
     */
    public String getUserId() {
        return Optional.ofNullable(getContext()).orElse(new JSONObject()).getString(Constants.CURRENT_ID);
    }

}
~~~

RpcContextHolderFilter代码：

~~~java
package com.cloud.order.config.rpc;

import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson.JSONObject;
import com.cloud.common.constant.Constants;
import com.cloud.common.rpc.RpcContextHolder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.servlet.filter.OrderedFilter;
import org.springframework.stereotype.Component;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;

/**
 * 服务调用上下文过滤器, 用于设置请求头信息
 * <p>
 * author: lzhch
 * version: v1.0
 * date: 2024/1/31 17:19
 */

@Slf4j
@Component
public class RpcContextHolderFilter implements OrderedFilter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;

        String userId = httpServletRequest.getHeader(Constants.CURRENT_ID);
        String datasource = httpServletRequest.getHeader(Constants.DATASOURCE);


        JSONObject userContext = new JSONObject();

        String testRpc = httpServletRequest.getHeader("testRpc");
        userContext.put("testRpc", testRpc);
        log.info("order 线程 :{}, 设置 testRpc:{}", Thread.currentThread().getName(), testRpc);


        if (StrUtil.isNotBlank(userId)) {
            //将 userInfo 放入 ThreadLocal 中
            userContext.put(Constants.CURRENT_ID, userId);
            httpServletRequest.setAttribute(Constants.CURRENT_ID, userId);
            log.info("order 线程 :{}, 拦截器拦截 URL :{}, 设置 userId:{}", Thread.currentThread().getName(), httpServletRequest.getRequestURI(), userId);
        }
        if (StrUtil.isNotBlank(datasource)) {
            //将 datasource 放入 ThreadLocal 中
            userContext.put(Constants.DATASOURCE, datasource);
            httpServletRequest.setAttribute(Constants.DATASOURCE, datasource);
            log.info("order 线程 :{}, 拦截器拦截 URL :{}, 设置 datasource:{}", Thread.currentThread().getName(), httpServletRequest.getRequestURI(), datasource);
        }

        RpcContextHolder.getInstance().setContext(userContext);
        chain.doFilter(httpServletRequest, response);
    }

    @Override
    public int getOrder() {
        return REQUEST_WRAPPER_FILTER_MAX_ORDER;
    }

}
~~~



希望通过 RpcContextHolder 在本次调用中可以获取请求中的信息，比如数据源，用来区分租户。



在 FeignRequestInterceptor 中继续向下一次服务调用传递参数，并且在下一个服务中能够获取到，从而实现数据源的传递。

FeignRequestInterceptor 代码：

~~~java
package com.cloud.order.config.rpc;

import cn.hutool.core.util.StrUtil;
import com.cloud.common.constant.Constants;
import com.cloud.common.multidatasource.config.NonWebRequestAttributes;
import com.cloud.common.rpc.RpcContextHolder;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.util.Objects;

/**
 * Feign配置
 * 使用FeignClient进行服务间调用，传递headers信息
 */

@Slf4j
@Configuration
public class FeignRequestInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate requestTemplate) {
        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        if (requestAttributes != null && requestAttributes instanceof ServletRequestAttributes){
            ServletRequestAttributes servletRequestAttributes = (ServletRequestAttributes) requestAttributes;
            HttpServletRequest request = servletRequestAttributes.getRequest();

            // 添加 userId
            String userId = request.getHeader(Constants.CURRENT_ID);
            if (StrUtil.isNotBlank(userId)) {
                requestTemplate.header(Constants.CURRENT_ID, userId);
            } else {
                userId = RpcContextHolder.getInstance().getUserId();
                requestTemplate.header(Constants.CURRENT_ID, userId);
            }

            // 添加数据源信息(定时任务使用)
            String datasource = (String) request.getAttribute(Constants.DATASOURCE);
            if (StrUtil.isNotBlank(datasource)) {
                requestTemplate.header(Constants.DATASOURCE, datasource);
            } else {
                datasource = RpcContextHolder.getInstance().getDataSource();
                requestTemplate.header(Constants.DATASOURCE, datasource);
            }

            String testRpc = RpcContextHolder.getInstance().getContext().getString("testRpc");
            log.info("order 线程 :{}, FeignRequestInterceptor 设置 testRpc:{}", Thread.currentThread().getName(), testRpc);
            requestTemplate.header("testRpc", testRpc);
        } else {
            NonWebRequestAttributes nonWebRequestAttributes = (NonWebRequestAttributes) requestAttributes;
            if (Objects.nonNull(nonWebRequestAttributes)) {
                String attribute = nonWebRequestAttributes.getAttribute(Constants.DATASOURCE, 0);
                requestTemplate.header(Constants.DATASOURCE, attribute);
                log.info("attribute :{}", attribute);
            }
        }
    }
}
~~~



但是在实际情况中，RpcContextHolder 并不能准确赋值，从下面的请求日志中可以看到，在第 1-10 次 Feign 请求时，可以正常的通过 RpcContextHolderFilter 设置 RpcContextHolder 的值，但是在第 11 次Feign 请求时，使用了 [loud-activiti-1] 线程，并没有将新的值 11-11 进行写入，所以导致了 Feign 调用传递参数的异常。

猜测：可能是因为线程池复用的原因，类似与多数据源事务问题，order 已经和 activiti 建立了链接 [loud-activiti-1]，所以再次请求时，不再重新建立连接，也不会重新写入线程的数据。

日志如下：

~~~shell
2024-02-26 17:25:42.087  INFO 47511 --- [  XNIO-1 task-1] io.undertow.servlet                      : Initializing Spring DispatcherServlet 'dispatcherServlet'
2024-02-26 17:25:42.140  INFO 47511 --- [  XNIO-1 task-1] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-1, 设置 testRpc:111
2024-02-26 17:25:42.142  INFO 47511 --- [  XNIO-1 task-1] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-1, 拦截器拦截 URL :/test/testRpcTimeout, 设置 userId:9
2024-02-26 17:25:42.186  INFO 47511 --- [  XNIO-1 task-1] c.c.c.m.aspect.DefaultDataSourceAspect   : =======Aspect Thread :XNIO-1 task-1
2024-02-26 17:25:42.411  INFO 47511 --- [  XNIO-1 task-1] io.lettuce.core.EpollProvider            : Starting without optional epoll library
2024-02-26 17:25:42.724  INFO 47511 --- [  XNIO-1 task-1] io.lettuce.core.KqueueProvider           : Starting with kqueue library
2024-02-26 17:25:43.219  INFO 47511 --- [  XNIO-1 task-1] c.c.c.m.aspect.DefaultDataSourceAspect   : 用户 ID: 9 操作 testRpcTimeout 方法, 租户:chzh,  数据源: chzh
2024-02-26 17:25:43.224  INFO 47511 --- [  XNIO-1 task-1] c.c.order.controller.OmsTestController   : 测试超时熔断开始
2024-02-26 17:25:43.517  INFO 47511 --- [loud-activiti-1] c.c.o.c.rpc.FeignRequestInterceptor      : order 线程 :hystrix-cloud-activiti-1, FeignRequestInterceptor 设置 testRpc:111
2024-02-26 17:25:43.955  INFO 47511 --- [loud-activiti-1] c.netflix.config.ChainedDynamicProperty  : Flipping property: cloud-activiti.ribbon.ActiveConnectionsLimit to use NEXT property: niws.loadbalancer.availabilityFilteringRule.activeConnectionsLimit = 2147483647
2024-02-26 17:25:43.985  INFO 47511 --- [loud-activiti-1] c.netflix.loadbalancer.BaseLoadBalancer  : Client: cloud-activiti instantiated a LoadBalancer: DynamicServerListLoadBalancer:{NFLoadBalancer:name=cloud-activiti,current list of Servers=[],Load balancer stats=Zone stats: {},Server stats: []}ServerList:null
2024-02-26 17:25:43.994  INFO 47511 --- [loud-activiti-1] c.n.l.DynamicServerListLoadBalancer      : Using serverListUpdater PollingServerListUpdater
2024-02-26 17:25:44.066  INFO 47511 --- [loud-activiti-1] c.netflix.config.ChainedDynamicProperty  : Flipping property: cloud-activiti.ribbon.ActiveConnectionsLimit to use NEXT property: niws.loadbalancer.availabilityFilteringRule.activeConnectionsLimit = 2147483647
2024-02-26 17:25:44.068  INFO 47511 --- [loud-activiti-1] c.n.l.DynamicServerListLoadBalancer      : DynamicServerListLoadBalancer for client cloud-activiti initialized: DynamicServerListLoadBalancer:{NFLoadBalancer:name=cloud-activiti,current list of Servers=[10.182.58.17:8004],Load balancer stats=Zone stats: {unknown=[Zone:unknown;	Instance count:1;	Active connections count: 0;	Circuit breaker tripped count: 0;	Active connections per server: 0.0;]
},Server stats: [[Server:10.182.58.17:8004;	Zone:UNKNOWN;	Total Requests:0;	Successive connection failure:0;	Total blackout seconds:0;	Last connection made:Thu Jan 01 08:00:00 CST 1970;	First connection made: Thu Jan 01 08:00:00 CST 1970;	Active Connections:0;	total failure count in last (1000) msecs:0;	average resp time:0.0;	90 percentile resp time:0.0;	95 percentile resp time:0.0;	min resp time:0.0;	max resp time:0.0;	stddev resp time:0.0]
]}ServerList:com.alibaba.cloud.nacos.ribbon.NacosServerList@39c44bc7
2024-02-26 17:25:45.004  INFO 47511 --- [erListUpdater-0] c.netflix.config.ChainedDynamicProperty  : Flipping property: cloud-activiti.ribbon.ActiveConnectionsLimit to use NEXT property: niws.loadbalancer.availabilityFilteringRule.activeConnectionsLimit = 2147483647
2024-02-26 17:25:47.656  INFO 47511 --- [  XNIO-1 task-1] c.c.order.controller.OmsTestController   : 测试超时熔断结束, resData :null
2024-02-26 17:25:47.656  INFO 47511 --- [  XNIO-1 task-1] c.c.c.m.aspect.DefaultDataSourceAspect   : clean datasource
2024-02-26 17:26:23.724  INFO 47511 --- [  XNIO-1 task-2] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-2, 设置 testRpc:222
2024-02-26 17:26:23.724  INFO 47511 --- [  XNIO-1 task-2] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-2, 拦截器拦截 URL :/test/testRpcTimeout, 设置 userId:9
2024-02-26 17:26:23.725  INFO 47511 --- [  XNIO-1 task-2] c.c.c.m.aspect.DefaultDataSourceAspect   : =======Aspect Thread :XNIO-1 task-2
2024-02-26 17:26:23.801  INFO 47511 --- [  XNIO-1 task-2] c.c.c.m.aspect.DefaultDataSourceAspect   : 用户 ID: 9 操作 testRpcTimeout 方法, 租户:chzh,  数据源: chzh
2024-02-26 17:26:23.802  INFO 47511 --- [  XNIO-1 task-2] c.c.order.controller.OmsTestController   : 测试超时熔断开始
2024-02-26 17:26:23.804  INFO 47511 --- [loud-activiti-2] c.c.o.c.rpc.FeignRequestInterceptor      : order 线程 :hystrix-cloud-activiti-2, FeignRequestInterceptor 设置 testRpc:222
2024-02-26 17:26:25.949  INFO 47511 --- [  XNIO-1 task-2] c.c.order.controller.OmsTestController   : 测试超时熔断结束, resData :null
2024-02-26 17:26:25.949  INFO 47511 --- [  XNIO-1 task-2] c.c.c.m.aspect.DefaultDataSourceAspect   : clean datasource
2024-02-26 17:26:37.498  INFO 47511 --- [  XNIO-1 task-3] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-3, 设置 testRpc:333
2024-02-26 17:26:37.498  INFO 47511 --- [  XNIO-1 task-3] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-3, 拦截器拦截 URL :/test/testRpcTimeout, 设置 userId:9
2024-02-26 17:26:37.498  INFO 47511 --- [  XNIO-1 task-3] c.c.c.m.aspect.DefaultDataSourceAspect   : =======Aspect Thread :XNIO-1 task-3
2024-02-26 17:26:37.568  INFO 47511 --- [  XNIO-1 task-3] c.c.c.m.aspect.DefaultDataSourceAspect   : 用户 ID: 9 操作 testRpcTimeout 方法, 租户:chzh,  数据源: chzh
2024-02-26 17:26:37.569  INFO 47511 --- [  XNIO-1 task-3] c.c.order.controller.OmsTestController   : 测试超时熔断开始
2024-02-26 17:26:37.570  INFO 47511 --- [loud-activiti-3] c.c.o.c.rpc.FeignRequestInterceptor      : order 线程 :hystrix-cloud-activiti-3, FeignRequestInterceptor 设置 testRpc:333
2024-02-26 17:26:39.642  INFO 47511 --- [  XNIO-1 task-3] c.c.order.controller.OmsTestController   : 测试超时熔断结束, resData :null
2024-02-26 17:26:39.642  INFO 47511 --- [  XNIO-1 task-3] c.c.c.m.aspect.DefaultDataSourceAspect   : clean datasource
2024-02-26 17:26:46.860  INFO 47511 --- [  XNIO-1 task-4] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-4, 设置 testRpc:4444
2024-02-26 17:26:46.861  INFO 47511 --- [  XNIO-1 task-4] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-4, 拦截器拦截 URL :/test/testRpcTimeout, 设置 userId:9
2024-02-26 17:26:46.863  INFO 47511 --- [  XNIO-1 task-4] c.c.c.m.aspect.DefaultDataSourceAspect   : =======Aspect Thread :XNIO-1 task-4
2024-02-26 17:26:46.932  INFO 47511 --- [  XNIO-1 task-4] c.c.c.m.aspect.DefaultDataSourceAspect   : 用户 ID: 9 操作 testRpcTimeout 方法, 租户:chzh,  数据源: chzh
2024-02-26 17:26:46.932  INFO 47511 --- [  XNIO-1 task-4] c.c.order.controller.OmsTestController   : 测试超时熔断开始
2024-02-26 17:26:46.933  INFO 47511 --- [loud-activiti-4] c.c.o.c.rpc.FeignRequestInterceptor      : order 线程 :hystrix-cloud-activiti-4, FeignRequestInterceptor 设置 testRpc:4444
2024-02-26 17:26:49.004  INFO 47511 --- [  XNIO-1 task-4] c.c.order.controller.OmsTestController   : 测试超时熔断结束, resData :null
2024-02-26 17:26:49.005  INFO 47511 --- [  XNIO-1 task-4] c.c.c.m.aspect.DefaultDataSourceAspect   : clean datasource
2024-02-26 17:26:54.997  INFO 47511 --- [  XNIO-1 task-5] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-5, 设置 testRpc:555
2024-02-26 17:26:54.997  INFO 47511 --- [  XNIO-1 task-5] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-5, 拦截器拦截 URL :/test/testRpcTimeout, 设置 userId:9
2024-02-26 17:26:54.997  INFO 47511 --- [  XNIO-1 task-5] c.c.c.m.aspect.DefaultDataSourceAspect   : =======Aspect Thread :XNIO-1 task-5
2024-02-26 17:26:55.067  INFO 47511 --- [  XNIO-1 task-5] c.c.c.m.aspect.DefaultDataSourceAspect   : 用户 ID: 9 操作 testRpcTimeout 方法, 租户:chzh,  数据源: chzh
2024-02-26 17:26:55.067  INFO 47511 --- [  XNIO-1 task-5] c.c.order.controller.OmsTestController   : 测试超时熔断开始
2024-02-26 17:26:55.072  INFO 47511 --- [loud-activiti-5] c.c.o.c.rpc.FeignRequestInterceptor      : order 线程 :hystrix-cloud-activiti-5, FeignRequestInterceptor 设置 testRpc:555
2024-02-26 17:26:57.140  INFO 47511 --- [  XNIO-1 task-5] c.c.order.controller.OmsTestController   : 测试超时熔断结束, resData :null
2024-02-26 17:26:57.140  INFO 47511 --- [  XNIO-1 task-5] c.c.c.m.aspect.DefaultDataSourceAspect   : clean datasource
2024-02-26 17:27:03.394  INFO 47511 --- [  XNIO-1 task-6] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-6, 设置 testRpc:666
2024-02-26 17:27:03.394  INFO 47511 --- [  XNIO-1 task-6] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-6, 拦截器拦截 URL :/test/testRpcTimeout, 设置 userId:9
2024-02-26 17:27:03.394  INFO 47511 --- [  XNIO-1 task-6] c.c.c.m.aspect.DefaultDataSourceAspect   : =======Aspect Thread :XNIO-1 task-6
2024-02-26 17:27:03.456  INFO 47511 --- [  XNIO-1 task-6] c.c.c.m.aspect.DefaultDataSourceAspect   : 用户 ID: 9 操作 testRpcTimeout 方法, 租户:chzh,  数据源: chzh
2024-02-26 17:27:03.456  INFO 47511 --- [  XNIO-1 task-6] c.c.order.controller.OmsTestController   : 测试超时熔断开始
2024-02-26 17:27:03.457  INFO 47511 --- [loud-activiti-6] c.c.o.c.rpc.FeignRequestInterceptor      : order 线程 :hystrix-cloud-activiti-6, FeignRequestInterceptor 设置 testRpc:666
2024-02-26 17:27:05.535  INFO 47511 --- [  XNIO-1 task-6] c.c.order.controller.OmsTestController   : 测试超时熔断结束, resData :null
2024-02-26 17:27:05.536  INFO 47511 --- [  XNIO-1 task-6] c.c.c.m.aspect.DefaultDataSourceAspect   : clean datasource
2024-02-26 17:27:17.330  INFO 47511 --- [  XNIO-1 task-7] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-7, 设置 testRpc:777
2024-02-26 17:27:17.330  INFO 47511 --- [  XNIO-1 task-7] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-7, 拦截器拦截 URL :/test/testRpcTimeout, 设置 userId:9
2024-02-26 17:27:17.331  INFO 47511 --- [  XNIO-1 task-7] c.c.c.m.aspect.DefaultDataSourceAspect   : =======Aspect Thread :XNIO-1 task-7
2024-02-26 17:27:17.425  INFO 47511 --- [  XNIO-1 task-7] c.c.c.m.aspect.DefaultDataSourceAspect   : 用户 ID: 9 操作 testRpcTimeout 方法, 租户:chzh,  数据源: chzh
2024-02-26 17:27:17.425  INFO 47511 --- [  XNIO-1 task-7] c.c.order.controller.OmsTestController   : 测试超时熔断开始
2024-02-26 17:27:17.427  INFO 47511 --- [loud-activiti-7] c.c.o.c.rpc.FeignRequestInterceptor      : order 线程 :hystrix-cloud-activiti-7, FeignRequestInterceptor 设置 testRpc:777
2024-02-26 17:27:19.500  INFO 47511 --- [  XNIO-1 task-7] c.c.order.controller.OmsTestController   : 测试超时熔断结束, resData :null
2024-02-26 17:27:19.500  INFO 47511 --- [  XNIO-1 task-7] c.c.c.m.aspect.DefaultDataSourceAspect   : clean datasource
2024-02-26 17:27:27.078  INFO 47511 --- [  XNIO-1 task-8] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-8, 设置 testRpc:888
2024-02-26 17:27:27.079  INFO 47511 --- [  XNIO-1 task-8] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-8, 拦截器拦截 URL :/test/testRpcTimeout, 设置 userId:9
2024-02-26 17:27:27.079  INFO 47511 --- [  XNIO-1 task-8] c.c.c.m.aspect.DefaultDataSourceAspect   : =======Aspect Thread :XNIO-1 task-8
2024-02-26 17:27:27.143  INFO 47511 --- [  XNIO-1 task-8] c.c.c.m.aspect.DefaultDataSourceAspect   : 用户 ID: 9 操作 testRpcTimeout 方法, 租户:chzh,  数据源: chzh
2024-02-26 17:27:27.143  INFO 47511 --- [  XNIO-1 task-8] c.c.order.controller.OmsTestController   : 测试超时熔断开始
2024-02-26 17:27:27.145  INFO 47511 --- [loud-activiti-8] c.c.o.c.rpc.FeignRequestInterceptor      : order 线程 :hystrix-cloud-activiti-8, FeignRequestInterceptor 设置 testRpc:888
2024-02-26 17:27:29.212  INFO 47511 --- [  XNIO-1 task-8] c.c.order.controller.OmsTestController   : 测试超时熔断结束, resData :null
2024-02-26 17:27:29.213  INFO 47511 --- [  XNIO-1 task-8] c.c.c.m.aspect.DefaultDataSourceAspect   : clean datasource
2024-02-26 17:27:36.260  INFO 47511 --- [  XNIO-1 task-9] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-9, 设置 testRpc:999
2024-02-26 17:27:36.260  INFO 47511 --- [  XNIO-1 task-9] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-9, 拦截器拦截 URL :/test/testRpcTimeout, 设置 userId:9
2024-02-26 17:27:36.260  INFO 47511 --- [  XNIO-1 task-9] c.c.c.m.aspect.DefaultDataSourceAspect   : =======Aspect Thread :XNIO-1 task-9
2024-02-26 17:27:36.322  INFO 47511 --- [  XNIO-1 task-9] c.c.c.m.aspect.DefaultDataSourceAspect   : 用户 ID: 9 操作 testRpcTimeout 方法, 租户:chzh,  数据源: chzh
2024-02-26 17:27:36.322  INFO 47511 --- [  XNIO-1 task-9] c.c.order.controller.OmsTestController   : 测试超时熔断开始
2024-02-26 17:27:36.324  INFO 47511 --- [loud-activiti-9] c.c.o.c.rpc.FeignRequestInterceptor      : order 线程 :hystrix-cloud-activiti-9, FeignRequestInterceptor 设置 testRpc:999
2024-02-26 17:27:38.396  INFO 47511 --- [  XNIO-1 task-9] c.c.order.controller.OmsTestController   : 测试超时熔断结束, resData :null
2024-02-26 17:27:38.397  INFO 47511 --- [  XNIO-1 task-9] c.c.c.m.aspect.DefaultDataSourceAspect   : clean datasource
2024-02-26 17:27:49.236  INFO 47511 --- [ XNIO-1 task-10] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-10, 设置 testRpc:10-10
2024-02-26 17:27:49.236  INFO 47511 --- [ XNIO-1 task-10] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-10, 拦截器拦截 URL :/test/testRpcTimeout, 设置 userId:9
2024-02-26 17:27:49.237  INFO 47511 --- [ XNIO-1 task-10] c.c.c.m.aspect.DefaultDataSourceAspect   : =======Aspect Thread :XNIO-1 task-10
2024-02-26 17:27:49.303  INFO 47511 --- [ XNIO-1 task-10] c.c.c.m.aspect.DefaultDataSourceAspect   : 用户 ID: 9 操作 testRpcTimeout 方法, 租户:chzh,  数据源: chzh
2024-02-26 17:27:49.303  INFO 47511 --- [ XNIO-1 task-10] c.c.order.controller.OmsTestController   : 测试超时熔断开始
2024-02-26 17:27:49.305  INFO 47511 --- [oud-activiti-10] c.c.o.c.rpc.FeignRequestInterceptor      : order 线程 :hystrix-cloud-activiti-10, FeignRequestInterceptor 设置 testRpc:10-10
2024-02-26 17:27:51.378  INFO 47511 --- [ XNIO-1 task-10] c.c.order.controller.OmsTestController   : 测试超时熔断结束, resData :null
2024-02-26 17:27:51.378  INFO 47511 --- [ XNIO-1 task-10] c.c.c.m.aspect.DefaultDataSourceAspect   : clean datasource
2024-02-26 17:28:04.073  INFO 47511 --- [ XNIO-1 task-11] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-11, 设置 testRpc:11-11
2024-02-26 17:28:04.073  INFO 47511 --- [ XNIO-1 task-11] c.c.o.config.rpc.RpcContextHolderFilter  : order 线程 :XNIO-1 task-11, 拦截器拦截 URL :/test/testRpcTimeout, 设置 userId:9
2024-02-26 17:28:04.074  INFO 47511 --- [ XNIO-1 task-11] c.c.c.m.aspect.DefaultDataSourceAspect   : =======Aspect Thread :XNIO-1 task-11
2024-02-26 17:28:04.143  INFO 47511 --- [ XNIO-1 task-11] c.c.c.m.aspect.DefaultDataSourceAspect   : 用户 ID: 9 操作 testRpcTimeout 方法, 租户:chzh,  数据源: chzh
2024-02-26 17:28:04.143  INFO 47511 --- [ XNIO-1 task-11] c.c.order.controller.OmsTestController   : 测试超时熔断开始
2024-02-26 17:28:04.144  INFO 47511 --- [loud-activiti-1] c.c.o.c.rpc.FeignRequestInterceptor      : order 线程 :hystrix-cloud-activiti-1, FeignRequestInterceptor 设置 testRpc:111
2024-02-26 17:28:06.214  INFO 47511 --- [ XNIO-1 task-11] c.c.order.controller.OmsTestController   : 测试超时熔断结束, resData :null
2024-02-26 17:28:06.214  INFO 47511 --- [ XNIO-1 task-11] c.c.c.m.aspect.DefaultDataSourceAspect   : clean datasource
~~~

10 个线程是在配置文件中设置的，如果想快速测试，可以修改为一个线程。

~~~yaml
hystrix:
  threadpool:
    default:
    	#并发执行的最大线程数，默认10
      coreSize: 10
~~~











使用 TTL 时：

1.线程池必须使用TtlExecutors修饰，或者Runnable\Callable必须使用TtlRunnable\TtlCallable修饰

---->原因：子线程复用，子线程拥有的上下文内容会对下次使用造成“污染”，而修饰后的子线程在执行run方法后会进行“回放”，防止污染



在 Feign 调用中传递参数时，如果只使用 FeignRequestInterceptor 的话，也是无法正常进行参数传递的，因为在 FeignRequestInterceptor 中使用 RequestContextHolder.getRequestAttributes(); 获取不到数据，所以无法进行参数传递。可以使用 ThreadLocal或者 TTL 等方案同步数据，但是在搭配 hystrix 使用时会有坑，需要注意；也可以使用过滤器的方式，重新在请求头中设置 header 信息，参考 RpcContextHolderFilter。



RequestContextHolder.getRequestAttributes()：

使用时要注意，RequestAttributes 是使用 ThreadLocal 存储的，所以在跨线程的情况下会获取不到，比如在 FeignRequestInterceptor 中直接获取就会失败，但是 header 信息是可以直接获取的，所以在使用时要注意使用 header 还是 attribute。在进行 Feign 调用传递参数时，最好使用 header，但是在请求进入容器后，已经无法修改 header 信息，所以使用 attribute（注意 FeignRequestInterceptor 和 RpcContextHolderFilter 对参数的处理要保持一致）。

在开启了 hystrix 后，FeignRequestInterceptor 会有单独的线程池，所以 FeignRequestInterceptor 和主线程不是同一个线程，所以导致使用 RequestContextHolder.getRequestAttributes()： 获取不到值。







测试使用 TTL 时，不开启 hystrix 是否可正常传参（EDSP）。
