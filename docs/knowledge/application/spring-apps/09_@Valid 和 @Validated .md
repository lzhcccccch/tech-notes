# @Valid 和 @Validated

[toc]

## 简介

`@Valid` 和 `@Validated` 是 Java 和 Spring 中常用的校验注解，它们在功能和使用场景上有很多相似之处，但也存在一些重要的区别。

---

## 基本信息对比

| 特性       | @Valid                                             | @Validated                                          |
| ---------- | -------------------------------------------------- | --------------------------------------------------- |
| **来源**   | JSR-303/JSR-380 Bean Validation 规范               | Spring Framework                                    |
| **包路径** | javax.validation.Valid 或 jakarta.validation.Valid | org.springframework.validation.annotation.Validated |
| **性质**   | Java 标准规范的一部分                              | Spring 框架的扩展注解                               |
| **依赖**   | 需要 Bean Validation API (如 Hibernate Validator)  | 需要 Spring Framework 和 Bean Validation API        |

---

## 功能特性对比

| 功能               | @Valid     | @Validated                       |
| ------------------ | ---------- | -------------------------------- |
| **基础校验**       | ✅ 支持     | ✅ 支持                           |
| **分组校验**       | ❌ 不支持   | ✅ 支持                           |
| **嵌套校验**       | ✅ 原生支持 | ❌ 本身不支持，需配合 @Valid 使用 |
| **方法参数校验**   | ✅ 支持     | ✅ 支持                           |
| **方法返回值校验** | ✅ 支持     | ✅ 支持                           |
| **类级别校验**     | ❌ 不支持   | ✅ 支持                           |
| **服务层校验**     | ❌ 不适用   | ✅ 支持，通过 AOP 实现            |

---

## 使用位置对比

| 使用位置         | @Valid   | @Validated |
| ---------------- | -------- | ---------- |
| **类**           | ❌ 不支持 | ✅ 支持     |
| **方法**         | ❌ 不支持 | ✅ 支持     |
| **方法参数**     | ✅ 支持   | ✅ 支持     |
| **字段**         | ✅ 支持   | ❌ 不支持   |
| **构造函数参数** | ✅ 支持   | ❌ 不支持   |
| **方法返回值**   | ✅ 支持   | ✅ 支持     |

---

## 异常处理对比

| 异常处理               | @Valid                                | @Validated                            |
| ---------------------- | ------------------------------------- | ------------------------------------- |
| **控制器参数校验失败** | MethodArgumentNotValidException       | ConstraintViolationException          |
| **服务层参数校验失败** | 不适用                                | ConstraintViolationException          |
| **异常处理方式**       | @ExceptionHandler + @ControllerAdvice | @ExceptionHandler + @ControllerAdvice |
| **异常信息详细度**     | 包含详细的字段错误信息                | 包含约束违反的详细信息                |

---

## 分组校验对比

| 分组校验         | @Valid                   | @Validated                               |
| ---------------- | ------------------------ | ---------------------------------------- |
| **支持分组**     | ❌ 不支持                 | ✅ 支持                                   |
| **分组指定方式** | 不适用                   | @Validated(Group.class)                  |
| **多分组校验**   | 不适用                   | @Validated({Group1.class, Group2.class}) |
| **默认分组**     | 默认分组 (Default.class) | 不指定分组时使用默认分组                 |

---

## 使用场景对比

| 使用场景             | @Valid   | @Validated      |
| -------------------- | -------- | --------------- |
| **控制器参数校验**   | ✅ 适用   | ✅ 适用          |
| **嵌套对象校验**     | ✅ 最适合 | ❌ 需配合 @Valid |
| **分组场景校验**     | ❌ 不适用 | ✅ 最适合        |
| **服务层方法校验**   | ❌ 不适用 | ✅ 最适合        |
| **简单参数校验**     | ✅ 适用   | ✅ 适用          |
| **复杂业务规则校验** | ❌ 不适合 | ✅ 适合          |

---

## 代码示例对比

| 示例类型           | @Valid                                                       | @Validated                                                   |
| ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **控制器参数校验** | `@PostMapping("/users")` `public ResponseEntity<User> createUser(@Valid @RequestBody User user) {...}` | `@PostMapping("/users")` `public ResponseEntity<User> createUser(@Validated @RequestBody User user) {...}` |
| **分组校验**       | 不支持                                                       | `@PostMapping("/users")` `public ResponseEntity<User> createUser(@Validated(CreateGroup.class) @RequestBody User user) {...}` |
| **嵌套校验**       | `public class User {` `@Valid` `private Address address;` `}` | 需配合 @Valid 使用                                           |
| **服务层校验**     | 不适用                                                       | `@Service` `@Validated` `public class UserService {` `public User createUser(@NotNull @Valid User user) {...}` `}` |
| **方法参数校验**   | 不支持直接校验简单参数                                       | `@GetMapping("/users/{id}")` `public User getUser(@PathVariable @Min(1) Long id) {...}` |

---

## 综合对比表

| 特性                 | @Valid                          | @Validated                       |
| -------------------- | ------------------------------- | -------------------------------- |
| **来源**             | JSR-303/JSR-380 (Java 标准)     | Spring Framework                 |
| **分组校验**         | ❌ 不支持                        | ✅ 支持                           |
| **嵌套校验**         | ✅ 原生支持                      | ❌ 需配合 @Valid 使用             |
| **使用位置**         | 方法参数、字段、构造函数参数    | 类、方法、方法参数               |
| **异常类型**         | MethodArgumentNotValidException | ConstraintViolationException     |
| **应用层**           | 主要用于控制器层                | 可用于控制器层和服务层           |
| **AOP 支持**         | ❌ 不支持                        | ✅ 支持                           |
| **简单参数校验**     | ❌ 不支持                        | ✅ 支持                           |
| **最佳使用场景**     | 简单的 Bean 校验和嵌套校验      | 分组校验、服务层校验、方法级校验 |
| **与 Spring 集成度** | 较低                            | 高                               |
| **标准兼容性**       | 高 (Java 标准)                  | 中 (Spring 特有)                 |
| **灵活性**           | 较低                            | 较高                             |
| **使用复杂度**       | 简单                            | 相对复杂                         |

---

## 选择建议

| 场景                   | 推荐注解             | 原因                     |
| ---------------------- | -------------------- | ------------------------ |
| **简单控制器参数校验** | @Valid 或 @Validated | 两者在此场景下功能相似   |
| **嵌套对象校验**       | @Valid               | 原生支持嵌套校验         |
| **不同业务场景校验**   | @Validated           | 支持分组校验             |
| **服务层方法校验**     | @Validated           | 支持 AOP 方法校验        |
| **同时需要分组和嵌套** | @Validated + @Valid  | 结合两者优势             |
| **简单参数校验**       | @Validated           | 支持直接校验简单参数     |
| **跨框架兼容性要求高** | @Valid               | 符合 Java 标准规范       |
| **需要高度定制校验**   | @Validated           | 提供更多 Spring 特性支持 |

---

## 总结
- 如果需要简单的参数校验（包括嵌套对象校验），可以使用 `@Valid`。
- 如果需要分组校验或在服务层进行校验，建议使用 `@Validated`。
- 在实际开发中，`@Valid` 和 `@Validated` 往往结合使用，以满足不同场景的需求。