# Lombok 的使用

[TOC]

## 简介

Lombok 是一个用于简化 Java 开发的工具库，通过注解的方式减少样板代码的编写。在日常开发中，Lombok 不仅可以简化 JavaBean 的创建，还能通过更高级的注解来处理复杂对象、继承关系、日志管理等场景。然而，尽管 Lombok 提高了开发效率，但其在实际使用中也存在一些问题和隐患。

---

## 引入依赖

maven项目里，直接添加pom依赖。

```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.2</version>
</dependency>
```

---

## 常用注解

### 基本注解

#### @Getter 和 @Setter

自动生成字段的 getter 和 setter 方法。

```java
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class User {
    private String name;
    private int age;
}
```

~~~java
import lombok.Getter;
import lombok.Setter;

public class User {
    @Getter @Setter private String username; // 单个字段
    @Getter(AccessLevel.PROTECTED) private String password; // 自定义访问级别
    @Setter(AccessLevel.PRIVATE) private String email; // 私有 setter
}
~~~

#### @ToString

生成 `toString` 方法，支持排除某些字段。

```java
import lombok.ToString;

@ToString(
    includeFieldNames = true, // 包含字段名
    exclude = {"password"}, // 排除敏感字段
    callSuper = true // 调用父类 toString
)
public class User {
    private String name;
    private String password;
}
```

#### @EqualsAndHashCode

生成 `equals` 和 `hashCode` 方法，支持基于特定字段。

```java
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(
    onlyExplicitlyIncluded = true, // 只包含显式标记的字段
    callSuper = false // 不调用父类 equals/hashCode
)
public class User {
    @EqualsAndHashCode.Include
    private String id; // 只基于 id 比较相等性
    
    private String username;
    private String email;
}
```

### 组合注解

#### @Data

组合了 @Getter、@Setter、@ToString、@EqualsAndHashCode 和 @RequiredArgsConstructor。

```java
import lombok.Data;
import lombok.NonNull;

@Data
public class User {
    @NonNull private String id; // 非空检查
    private String username;
    private String email;
    
    // @Data 自动生成：
    // - 所有字段的 getter/setter
    // - toString()
    // - equals()/hashCode()
    // - 带有 @NonNull 字段的构造器
}
```

#### @Value

创建不可变对象（Immutable Object），相当于 `@Data` + `final`。

```java
import lombok.Value;
import lombok.Builder;

@Value
@Builder
public class ImmutableUser {
    String id;
    String username;
    String email;
    
    // 所有字段自动被标记为 private final
    // 类自动被标记为 final
}
```

### 构造器注解

#### @NoArgsConstructor

生成无参构造方法。

#### @AllArgsConstructor

生成全参构造方法。

#### @RequiredArgsConstructor

生成基于 `final` 字段和 `@NonNull` 字段的构造方法。

`@RequiredArgsConstructor` 会为所有声明为 `final` 或标注了 `@NonNull` 的非 `final` 字段生成一个构造方法参数。如果 `final`标记的字段没有添加 `@NonNull` 注解，那么生成的构造函数中不会对该字段添加非空校验。

~~~java
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class MyService {

    @NonNull
    private final MyRepository myRepository;

    private final MyHelper myHelper;

    private String optionalField; // 非 final 且无 @NonNull，不会加入构造器
}

~~~

生成的构造方法如下：

```java
public MyService(@NonNull MyRepository myRepository, @NonNull MyHelper myHelper) {
    if (myRepository == null) {
        throw new NullPointerException("myRepository is marked non-null but is null");
    }
  
    this.myRepository = myRepository;
    this.myHelper = myHelper;
}
```

**构造器组合使用**

```java
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

@NoArgsConstructor
@RequiredArgsConstructor
@AllArgsConstructor
public class User {
    private final String id; // required
    private String username; // optional
    private String email; // optional
    
    // 生成三个构造器：
    // 1. User()
    // 2. User(String id)
    // 3. User(String id, String username, String email)
}
```

### 构建器模式

#### @Builder

生成 Builder 模式的代码。

```java
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class User {
    @Builder.Default
    private String role = "USER";
    
    private String username;
    private String email;
    
    // 使用示例：
    public static void main(String[] args) {
        User user = User.builder()
            .username("john")
            .email("john@example.com")
            .build();
    }
}
```

#### @SuperBuilder

支持继承关系的 Builder 模式。

```java
import lombok.experimental.SuperBuilder;

@SuperBuilder
public class Person {
    private String name;
    private int age;
}

@SuperBuilder
public class Employee extends Person {
    private String company;
    private double salary;
    
    // 使用示例：
    public static void main(String[] args) {
        Employee employee = Employee.builder()
            .name("John")
            .age(30)
            .company("Tech Corp")
            .salary(50000)
            .build();
    }
}
```

#### @Builder.Default

为 Builder 模式设置默认值。

```java
import lombok.Builder;

@Builder
public class User {
    @Builder.Default
    private String name = "DefaultName";
}
```

### 日志注解

#### @Slf4j

生成 `org.slf4j.Logger` 实例。

```java
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class UserService {
    public void createUser(String username) {
        log.info("Creating user: {}", username);
        log.debug("Debug information");
        log.error("Error occurred", new Exception("Sample error"));
    }
}
```

### 其他注解

#### @Accessors

支持链式调用。

```java
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

@Getter
@Setter
@Accessors(chain = true)
public class User {
    private String name;
    private int age;
}
```

#### @Tolerate

忽略特定方法的生成冲突。

```java
import lombok.Builder;
import lombok.experimental.Tolerate;

@Builder
public class User {
    @Tolerate
    public User() {
        // Custom no-arg constructor
    }
}
```

---

## 注意事项

### @Builder 和默认值冲突

使用 @Builder 注解时，字段的默认值会被清除。

需要使用 @Builder.Default 明确指定默认值。

```java
@Builder
public class Config {
    private String host = "localhost"; // 这个默认值会被忽略！
    
    @Builder.Default // 正确方式
    private String port = "8080";
}
```

### @Builder 与继承的兼容性

在继承关系中使用 @Builder 时，子类无法继承父类的属性。

需要使用 @SuperBuilder 替代 @Builder。

```java
// 错误示例
@Builder
public class Child extends Parent {
    // 无法访问父类属性
}

// 正确示例
@SuperBuilder
public class Child extends Parent {
    // 可以正常访问父类属性
}
```

### @Data 的问题

#### 安全性风险

- @Data 会生成 setter 方法，可能导致不可变对象的属性被修改。
  - 在需要不可变对象时，使用 @Value 替代 @Data。

- 性能问题：@Data 会生成 `toString` 方法，可能在大对象中带来性能开销。
  - 在性能敏感场景中，手动实现 `toString` 方法。
- 循环依赖： @Data 中包含 @RequiredArgsConstructor，很容易造成循环依赖。
  - 对代码进行合理分层，功能进行提取。

### @Builder 和 @Data 同时使用导致无参构造器丢失

单独使用 @Data 注解时，会自动生成无参构造方法；而单独使用 @Builder 注解时，则会生成全参构造方法。然而，当这两个注解同时使用时，编译后的 class 文件中仅保留全参构造方法，而无参构造方法则会缺失。由于许多框架依赖无参构造方法来构建对象，因此缺少无参构造方法可能会导致对象初始化失败。

解决方案：

- 对无参构造方法添加 @Tolerate 注解

  ~~~java
  @Tolerate
  public Test() {
  }
  ~~~

- 同时使用以下 4 个注解

  ~~~java
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  ~~~

---

## 总结

Lombok 是一个强大的工具，能够显著提高 Java 开发效率，但其隐含的问题也不容忽视。在实际使用中，我们应根据项目需求权衡利弊，合理选择注解，并遵循最佳实践以降低潜在风险。通过对 Lombok 的深入理解和规范使用，可以最大化其优势，同时避免常见的坑。
