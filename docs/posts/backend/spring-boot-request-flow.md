# 一次 Spring Boot 请求经历了什么

<p class="article-meta">发布于 2026-09-18 · 分类：后端开发 · 阅读约 8 分钟</p>

> 本文是占位示例，用于展示文章结构、代码块和目录效果。

当一个 HTTP 请求进入 Spring Boot 应用时，它不会直接抵达 Controller。理解完整链路，能让鉴权、日志、异常处理等问题更容易定位。

## 请求处理链

一个常见的 Servlet 应用可以简化为：

```text
Client
  → Servlet Filter
  → DispatcherServlet
  → HandlerInterceptor.preHandle
  → Controller
  → HandlerInterceptor.afterCompletion
  → Servlet Filter
```

### Filter：容器级入口

Filter 属于 Servlet 规范，适合处理跨框架的请求预处理，例如请求 ID、字符编码和基础安全头。

```java
@Component
public class RequestIdFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain chain
    ) throws ServletException, IOException {
        String requestId = UUID.randomUUID().toString();
        response.setHeader("X-Request-Id", requestId);
        chain.doFilter(request, response);
    }
}
```

### Interceptor：Spring MVC 边界

Interceptor 已经知道目标 Handler，更适合做需要 Controller 元数据的逻辑，例如读取自定义注解、权限检查或接口耗时统计。

## 如何选择扩展点

| 需求 | 建议位置 | 原因 |
| --- | --- | --- |
| 请求 ID | Filter | 尽早创建，错误响应也能携带 |
| 登录态解析 | Filter 或安全框架 | 在业务处理前统一完成 |
| Controller 注解鉴权 | Interceptor | 可以访问 HandlerMethod |
| 统一响应异常 | ControllerAdvice | 与 MVC 异常解析机制一致 |

## 小结

排查请求问题时，先确认故障发生在容器层、MVC 调度层还是业务层。扩展点越靠前，覆盖越广；越靠后，能获得的业务上下文越完整。

