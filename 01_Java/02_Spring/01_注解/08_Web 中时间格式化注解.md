# Web 系统中时间格式化注解

[toc]

## 简介

在 Java 语言开发的 Web 系统中，处理时间格式化是一个常见的需求。许多情况下，我们会使用注解来简化时间的格式化操作，尤其是在与 JSON 数据交互或表单数据绑定时。以下是一些常见的与时间格式化相关的注解及其使用场景：

---

## @JsonFormat
**来源**

`com.fasterxml.jackson.annotation.JsonFormat`

**作用**

用于在序列化（对象转 JSON）和反序列化（JSON 转对象）时，指定时间字段的格式。

**使用场景**

- 在使用 Jackson 作为 JSON 解析库时，格式化日期时间字段。
- 主要用于后端返回 JSON 数据时，格式化时间字段，或者从前端接收 JSON 数据时解析时间字段。

**常用属性**

- `pattern`: 指定时间格式，例如 `yyyy-MM-dd HH:mm:ss`。
- `timezone`: 指定时区，例如 `GMT+8`。
- `shape`: 指定数据类型的形状（如 `JsonFormat.Shape.STRING` 表示时间以字符串形式序列化）。

**示例代码**

```java
import com.fasterxml.jackson.annotation.JsonFormat;
import java.util.Date;

public class Event {
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date eventTime;

    // Getter and Setter
}
```

**作用**

- 序列化时，`Date` 类型的 `eventTime` 会被转换为指定的时间格式。
- 反序列化时，JSON 中的时间字符串会按指定格式解析为 `Date` 对象。

---

## @DateTimeFormat
**来源**

`org.springframework.format.annotation.DateTimeFormat`

**作用**

用于格式化日期时间字段，通常在表单提交或 URL 参数绑定时使用。

**使用场景**

在 Spring MVC 中，将请求参数（如表单或 URL 参数）绑定到 Java 对象时格式化日期。

**常用属性**

- `pattern`: 指定时间格式，例如 `yyyy-MM-dd`。
- `iso`: 指定标准时间格式（如 `DateTimeFormat.ISO.DATE`）。
- `style`: 使用预定义的样式格式化时间。

**示例代码**

```java
import org.springframework.format.annotation.DateTimeFormat;
import java.util.Date;

public class User {
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private Date birthDate;

    // Getter and Setter
}
```

**作用**

- 当表单提交的 `birthDate` 参数为字符串（如 `2025-01-13`）时，Spring 会将其自动转换为 `Date` 类型。

---

## @Temporal
**来源**

`javax.persistence.Temporal`

**作用**

用于指定 `java.util.Date` 或 `java.util.Calendar` 类型字段在 JPA 中的存储格式。

**使用场景**

在使用 JPA 或 Hibernate 进行数据库映射时，指定时间字段的存储粒度（日期、时间或时间戳）。

**常用属性**

- `TemporalType.DATE`: 仅存储日期部分（如 `2025-01-13`）。
- `TemporalType.TIME`: 仅存储时间部分（如 `10:30:00`）。
- `TemporalType.TIMESTAMP`: 存储完整的日期和时间（如 `2025-01-13 10:30:00`）。

**示例代码**

```java
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import java.util.Date;

@Entity
public class Task {
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdTime;

    // Getter and Setter
}
```

**作用**

- 在数据库中，`createdTime` 字段会被存储为 `TIMESTAMP` 类型。

---

## @JsonDeserialize 和 @JsonSerialize
**来源**

`com.fasterxml.jackson.databind.annotation.JsonDeserialize` 和 `com.fasterxml.jackson.databind.annotation.JsonSerialize`

**作用**

用于自定义序列化和反序列化逻辑。

**使用场景**

需要更复杂的时间格式化需求时，使用自定义的序列化器和反序列化器。

**配合使用**

需要编写自定义的序列化器和反序列化器类。

**示例代码**

```java
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import java.time.LocalDateTime;

public class Appointment {
    @JsonSerialize(using = CustomDateSerializer.class)
    @JsonDeserialize(using = CustomDateDeserializer.class)
    private LocalDateTime appointmentTime;

    // Getter and Setter
}
```

**自定义序列化器**

```java
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class CustomDateSerializer extends JsonSerializer<LocalDateTime> {
    @Override
    public void serialize(LocalDateTime value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        gen.writeString(value.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
    }
}
```

**自定义反序列化器**

```java
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class CustomDateDeserializer extends JsonDeserializer<LocalDateTime> {
    @Override
    public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        return LocalDateTime.parse(p.getText(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}
```

---

## @Pattern
**来源**

`javax.validation.constraints.Pattern`

**作用**

用于校验字符串的格式是否符合正则表达式。

**使用场景**

对时间字符串进行格式校验，确保输入符合预期格式。

**常用属性**

- `regexp`: 正则表达式，用于校验格式。
- `message`: 校验失败时的提示信息。

**示例代码**

```java
import javax.validation.constraints.Pattern;

public class Event {
    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "日期格式必须为 yyyy-MM-dd")
    private String eventDate;

    // Getter and Setter
}
```

**作用**

- 如果用户输入的 `eventDate` 不符合 `yyyy-MM-dd` 格式，则会抛出校验异常。

---

## @Future` 和 `@Past

**来源**

`javax.validation.constraints.Future` 和 `javax.validation.constraints.Past`

**作用**

用于校验时间是否在未来或过去。

**框架支持**

Javax Validation（JSR 303/JSR 380）。

**常用属性**

- `message`：校验失败时的提示信息。

**使用场景**

对时间字段进行逻辑校验，例如生日必须是过去的日期，预约时间必须是未来的日期。

**示例代码**

```java
import javax.validation.constraints.Future;
import javax.validation.constraints.Past;
import java.util.Date;

public class Booking {
    @Past(message = "生日必须是过去的日期")
    private Date birthDate;

    @Future(message = "预约时间必须是未来的日期")
    private Date appointmentDate;

    // Getter and Setter
}
```

---

## 总结

| 注解名称                            | 来源库           | 主要作用                             | 常用场景                             |
| ----------------------------------- | ---------------- | ------------------------------------ | ------------------------------------ |
| `@JsonFormat`                       | Jackson          | JSON 序列化与反序列化时间格式化      | 与前端交互的 JSON 数据时间格式化     |
| `@DateTimeFormat`                   | Spring Framework | 表单数据绑定时的时间格式化           | Spring MVC 表单或 URL 参数时间格式化 |
| `@Temporal`                         | JPA              | 数据库时间字段的存储粒度             | JPA 实体类中时间字段的映射           |
| `@JsonDeserialize`/`@JsonSerialize` | Jackson          | 自定义时间序列化与反序列化逻辑       | 复杂的时间格式需求或自定义逻辑       |
| `@Pattern`                          | Javax Validation | 校验时间字符串格式是否符合正则表达式 | 输入校验，确保时间字符串格式符合要求 |
| `@Future` / `@Past`                 | Javax Validation | 校验时间是否在未来或过去             | 校验逻辑，例如生日或预约时间校验     |

通过合理使用这些注解，可以有效地处理 Java Web 开发中的各种日期时间格式化需求。选择合适的注解组合，可以简化开发，提高代码质量。