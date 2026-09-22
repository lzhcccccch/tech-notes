# ResponseBodyAdvice 详解

[toc]

## 简介

`ResponseBodyAdvice` 是 Spring MVC 提供的一个接口，用于在 Controller 方法返回数据并写入响应之前，对响应体数据进行统一的处理或拦截。它主要配合 `@ResponseBody` 或 `RestController` 使用，能够对返回的对象进行修改、包装或增强，常用于统一响应格式、数据脱敏、日志记录等场景。

---

## 基础架构

### Spring MVC 响应处理流程

~~~tex
Controller返回值 -> ReturnValueHandler处理 -> HttpMessageConverter转换 -> ResponseBodyAdvice处理 -> 响应体输出
~~~

### 接口定义

~~~java
public interface ResponseBodyAdvice<T> {

	/**
	 * Whether this component supports the given controller method return type
	 * and the selected {@code HttpMessageConverter} type.
	 * @param returnType the return type
	 * @param converterType the selected converter type
	 * @return {@code true} if {@link #beforeBodyWrite} should be invoked;
	 * {@code false} otherwise
	 */
	boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType);

	/**
	 * Invoked after an {@code HttpMessageConverter} is selected and just before
	 * its write method is invoked.
	 * @param body the body to be written
	 * @param returnType the return type of the controller method
	 * @param selectedContentType the content type selected through content negotiation
	 * @param selectedConverterType the converter type selected to write to the response
	 * @param request the current request
	 * @param response the current response
	 * @return the body that was passed in or a modified (possibly new) instance
	 */
	@Nullable
	T beforeBodyWrite(@Nullable T body, MethodParameter returnType, MediaType selectedContentType,
			Class<? extends HttpMessageConverter<?>> selectedConverterType,
			ServerHttpRequest request, ServerHttpResponse response);

}
~~~

`ResponseBodyAdvice` 是一个接口，需要实现它并注册为 Spring 的组件（通常配合 `@ControllerAdvice` 使用）。它主要有两个方法：

1. **`boolean supports()`**：
   - 用于判断当前的请求是否需要应用此拦截器。
   - 返回 `true` 时，`beforeBodyWrite` 方法会被调用；返回 `false` 时，当前拦截器不生效。
   - 可以通过 `returnType` 和 `converterType` 来实现条件过滤，比如只拦截某些特定的返回类型。

2. **`Object beforeBodyWrite()`**：
   - 用于在响应体写入之前对数据进行处理。
   - 可以对返回的对象进行修改、包装或直接替换。
   - 参数解析：
     - `body`：Controller 方法的返回值。
     - `returnType`：返回值的类型信息。
     - `selectedContentType`：返回值的媒体类型（如 JSON、XML）。
     - `selectedConverterType`：用于转换响应数据的消息转换器类型。
     - `request`：当前的请求对象。
     - `response`：当前的响应对象。

---

## 作用

### 统一响应格式

- 在实际开发中，很多项目需要对接口返回的数据进行统一包装，比如封装成一个标准的 JSON 格式（包含状态码、消息、数据等），`ResponseBodyAdvice` 可以实现这样的功能。

### 响应数据增强

- 可以在返回数据写入响应之前，动态地添加额外的信息，比如时间戳、请求 ID 等。

### 数据脱敏

- 对返回的数据进行敏感信息处理，比如隐藏手机号中间四位、加密身份证号等。

### 日志记录

- 在数据返回之前，记录响应数据的日志，便于排查问题。

### 动态修改响应

- 根据请求的上下文动态调整返回数据，比如根据用户权限过滤掉某些字段。

---

## 代码示例

### 统一响应格式（常用）

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private Integer code;
    private String message;
    private T data;
    private Long timestamp;
    
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .code(200)
                .message("操作成功")
                .data(data)
                .timestamp(System.currentTimeMillis())
                .build();
    }
    
    public static <T> ApiResponse<T> error(Integer code, String message) {
        return ApiResponse.<T>builder()
                .code(code)
                .message(message)
                .timestamp(System.currentTimeMillis())
                .build();
    }
}

@ControllerAdvice
public class GlobalResponseAdvice implements ResponseBodyAdvice<Object> {
    
    @Override
    public boolean supports(MethodParameter returnType, 
                          Class<? extends HttpMessageConverter<?>> converterType) {
        // 排除特定的返回类型或者特定的转换器
        return !returnType.getParameterType().equals(ApiResponse.class);
    }
    
    @Override
    public Object beforeBodyWrite(Object body,
                                MethodParameter returnType,
                                MediaType selectedContentType,
                                Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                ServerHttpRequest request,
                                ServerHttpResponse response) {
        // 处理特殊情况：String类型需要特殊处理
        if (body instanceof String) {
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                return objectMapper.writeValueAsString(ApiResponse.success(body));
            } catch (JsonProcessingException e) {
                return ApiResponse.error(500, "响应处理异常");
            }
        }
        
        // 其他类型直接包装
        return ApiResponse.success(body);
    }
}
```

### 数据脱敏

```java
@ControllerAdvice
public class SensitiveDataAdvice implements ResponseBodyAdvice<Object> {
    
    @Override
    public boolean supports(MethodParameter returnType, 
                          Class<? extends HttpMessageConverter<?>> converterType) {
        return true;
    }
    
    @Override
    public Object beforeBodyWrite(Object body,
                                MethodParameter returnType,
                                MediaType selectedContentType,
                                Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                ServerHttpRequest request,
                                ServerHttpResponse response) {
        if (body instanceof UserDTO) {
            return handleUserData((UserDTO) body);
        }
        if (body instanceof List) {
            return handleList((List<?>) body);
        }
        return body;
    }
    
    private UserDTO handleUserData(UserDTO user) {
        // 手机号脱敏
        if (user.getPhone() != null) {
            user.setPhone(maskPhone(user.getPhone()));
        }
        // 邮箱脱敏
        if (user.getEmail() != null) {
            user.setEmail(maskEmail(user.getEmail()));
        }
        // 身份证脱敏
        if (user.getIdCard() != null) {
            user.setIdCard(maskIdCard(user.getIdCard()));
        }
        return user;
    }
    
    private String maskPhone(String phone) {
        return phone.replaceAll("(\\d{3})\\d{4}(\\d{4})", "$1****$2");
    }
    
    private String maskEmail(String email) {
        return email.replaceAll("(\\w{3})\\w+(@\\w+\\.\\w+)", "$1***$2");
    }
    
    private String maskIdCard(String idCard) {
        return idCard.replaceAll("(\\d{6})\\d{8}(\\w{4})", "$1********$2");
    }
    
    private List<?> handleList(List<?> list) {
        if (list.isEmpty()) return list;
        if (list.get(0) instanceof UserDTO) {
            return list.stream()
                    .map(item -> handleUserData((UserDTO) item))
                    .collect(Collectors.toList());
        }
        return list;
    }
}
```

### 添加额外信息

```java
@ControllerAdvice
public class ExtraInfoAdvice implements ResponseBodyAdvice<Object> {
    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        return true;
    }

    @Override
    public Object beforeBodyWrite(Object body,
                                  MethodParameter returnType,
                                  MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  ServerHttpRequest request,
                                  ServerHttpResponse response) {
        if (body instanceof ApiResponse) {
            ApiResponse<?> apiResponse = (ApiResponse<?>) body;
            apiResponse.setMessage(apiResponse.getMessage() + " | 请求时间：" + System.currentTimeMillis());
        }
        return body;
    }
}
```

### 性能监控

~~~java
@ControllerAdvice
@Slf4j
public class PerformanceMonitorAdvice implements ResponseBodyAdvice<Object> {
    
    private ThreadLocal<Long> startTime = new ThreadLocal<>();
    
    @Override
    public boolean supports(MethodParameter returnType, 
                          Class<? extends HttpMessageConverter<?>> converterType) {
        startTime.set(System.currentTimeMillis());
        return true;
    }
    
    @Override
    public Object beforeBodyWrite(Object body,
                                MethodParameter returnType,
                                MediaType selectedContentType,
                                Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                ServerHttpRequest request,
                                ServerHttpResponse response) {
        long duration = System.currentTimeMillis() - startTime.get();
        startTime.remove(); // 防止内存泄漏
        
        String path = request.getURI().getPath();
        log.info("API {} 响应时间: {}ms", path, duration);
        
        // 添加性能指标到响应头
        response.getHeaders().add("X-Response-Time", duration + "ms");
        
        // 如果响应时间超过阈值，记录警告日志
        if (duration > 1000) {
            log.warn("API {} 响应时间超过1秒，实际耗时: {}ms", path, duration);
        }
        
        return body;
    }
}
~~~

### 条件处理

~~~java
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface IgnoreResponseAdvice {}

@ControllerAdvice
public class ConditionalResponseAdvice implements ResponseBodyAdvice<Object> {
    
    @Override
    public boolean supports(MethodParameter returnType, 
                          Class<? extends HttpMessageConverter<?>> converterType) {
        // 检查是否存在忽略注解
        if (returnType.hasMethodAnnotation(IgnoreResponseAdvice.class)) {
            return false;
        }
        
        // 检查是否是特定包下的类
        String packageName = returnType.getContainingClass().getPackage().getName();
        return packageName.startsWith("com.example.api");
    }
    
    @Override
    public Object beforeBodyWrite(Object body,
                                MethodParameter returnType,
                                MediaType selectedContentType,
                                Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                ServerHttpRequest request,
                                ServerHttpResponse response) {
        // 根据不同的内容类型进行处理
        if (MediaType.APPLICATION_JSON.includes(selectedContentType)) {
            return handleJsonResponse(body);
        }
        
        if (MediaType.APPLICATION_XML.includes(selectedContentType)) {
            return handleXmlResponse(body);
        }
        
        return body;
    }
    
    private Object handleJsonResponse(Object body) {
        // JSON 响应处理逻辑
        return body;
    }
    
    private Object handleXmlResponse(Object body) {
        // XML 响应处理逻辑
        return body;
    }
}
~~~

---

## 注意事项

### String 类型的特殊处理

- 如果 Controller 返回的是 `String` 类型，`ResponseBodyAdvice` 需要特殊处理，因为 `StringHttpMessageConverter` 会直接处理字符串类型，导致返回的对象可能无法正常转换为 JSON。
- 解决办法是手动将返回值转换为 JSON 字符串：

```java
if (body instanceof String) {
    return new ObjectMapper().writeValueAsString(ApiResponse.success(body));
}
```

### 避免重复包装

- 如果返回值已经是包装后的格式（比如 `ApiResponse`），需要跳过处理，避免重复包装。

```java
if (body instanceof ApiResponse) {
    return body;
}
```

### 性能优化

- 在 `supports()` 方法中尽量过滤掉不需要处理的请求，减少不必要的拦截逻辑。

### 异常处理的优先级

- 如果配合 `@ExceptionHandler` 使用，`@ExceptionHandler` 的处理逻辑会优先于 `ResponseBodyAdvice`。

---

## 总结

`ResponseBodyAdvice` 是一个非常强大的工具，适用于对所有接口返回值进行统一的处理。通过它，可以实现统一的响应格式、数据增强、日志记录和数据脱敏等功能，同时保持代码的简洁性和可维护性。