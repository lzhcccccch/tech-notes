# Spring 中 LocalDateTime 自动转换

[toc]

## 问题背景

在 Spring Boot Web 开发中，常常需要将请求参数自动绑定到 Controller 的方法参数上。当方法参数类型为 `java.time.LocalDateTime` 时，如果请求参数为字符串且格式与 Spring 默认格式不符，就会抛出类型转换异常。

### 典型异常信息

```shell
org.springframework.web.method.annotation.MethodArgumentTypeMismatchException: 
Failed to convert value of type 'java.lang.String' to required type 'java.time.LocalDateTime'; 
nested exception is org.springframework.core.convert.ConversionFailedException: 
Failed to convert from type [java.lang.String] to type [@org.springframework.web.bind.annotation.RequestParam java.time.LocalDateTime] 
for value '2025-07-01 11:11:11'; 
nested exception is java.lang.IllegalArgumentException: Parse attempt failed for value [2025-07-01 11:11:11]
```

---

## 原因分析

- Spring 默认支持的 `LocalDateTime` 字符串格式为：`yyyy-MM-dd'T'HH:mm:ss`（中间有 `T`，如 `2025-07-01T11:11:11`）。
- 如果前端传递的时间字符串为 `2025-07-01 11:11:11`（无 `T`），Spring 无法自动完成类型转换，导致抛出异常。

---

## 解决方案

### 修改前端传参格式（最简单直接）

将前端传递的字符串由 `2025-07-01 11:11:11` 改为 `2025-07-01T11:11:11`，这样 Spring Boot 可以自动完成类型转换，无需后端额外配置。

---

### 后端自定义参数格式化

#### 使用 `@DateTimeFormat` 注解（单独处理）

在 Controller 方法参数上添加注解：

```java
@GetMapping("/test")
public String test(
    @RequestParam("time") 
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime time) {
    // ...
}
```

这样，Spring 会按照指定格式解析字符串为 `LocalDateTime`。

---

#### 全局注册 Converter（全局生效）

如果希望全局支持自定义的日期时间格式，可以注册一个全局 Converter：

```java
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class StringToLocalDateTimeConverter implements Converter<String, LocalDateTime> {
    @Override
    public LocalDateTime convert(String source) {
        return LocalDateTime.parse(source, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}
```

**作用**：
只要参数类型为 `LocalDateTime`，Spring 会自动调用该 Converter 进行类型转换，无需手动调用。

---

## 全局 Converter 的调用机制

- 只需将 Converter 注册为 Spring Bean（如加上 `@Component` 注解），Spring 容器会自动识别并应用。
- 在 Controller 中声明 `LocalDateTime` 类型参数时，无论是 `@RequestParam`、`@PathVariable` 还是 `@ModelAttribute`，只要接收到字符串，Spring 都会自动使用注册的 Converter 进行转换。
- 无需手动调用，完全自动化。

---

## 常见问题与注意事项

1. **多个时间格式**  
   如果需要支持多种时间格式，可以在 Converter 中增加格式判断和兼容逻辑。
   
2. **与 Jackson 配合**  
   如果用到 JSON 反序列化（如 `@RequestBody`），需要额外配置 Jackson 的时间格式化规则，Converter 仅对参数绑定有效。

3. **全局 Converter 的优先级**  
   自定义 Converter 会覆盖 Spring 默认的字符串到 `LocalDateTime` 的转换逻辑。

---

## 总结

- Spring Boot 默认只支持 `yyyy-MM-dd'T'HH:mm:ss` 格式的字符串自动转换为 `LocalDateTime`。
- 若需支持自定义格式（如 `yyyy-MM-dd HH:mm:ss`），有三种常用方式：
    1. 修改前端传参格式；
    2. 使用 `@DateTimeFormat` 注解；
    3. 注册全局 `Converter`。
- 注册全局 Converter 后，Spring 会自动调用，无需手动处理。
