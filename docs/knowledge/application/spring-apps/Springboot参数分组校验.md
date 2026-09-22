# Springboot参数分组校验

[toc]

## 简介

`Java API`规范(JSR303)定义了Bean校验的标准`validation-api`，但没有提供实现。`hibernate validation`是对这个规范的实现，并增加了校验注解如`@Email`、`@Length`等。

`Spring Validation`是对`hibernate validation`的二次封装，用于支持spring mvc参数自动校验。本文基于 JDK21 和 springboot3.1.5 进行整理。

---

## 代码准备

### 参数校验对象

以下实例都基于该对象进行。

~~~java
package com.lzhch.practice.dto.req;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.Length;

import java.io.Serial;
import java.io.Serializable;
import java.util.Date;

/**
 * 参数分组校验入参
 * <p>
 * author: lzhch
 * version: v1.0
 * date: 2023/11/20 15:36
 */

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParamGroupValidatedReq implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 用户ID
     * 内部定义接口和统一定义接口任选其一即可
     */
    // @NotNull(message = "用户id不能为空", groups = ParamGroupValidated.Create.class)
    @NotNull(message = "用户id不能为空") // Service 层不进行分组校验
    // @NotNull(message = "用户id不能为空", groups = ParamGroupValidatedReq.Save.class)
    private Long userId;

    /**
     * 用户名
     */
    @NotBlank(message = "用户名不能为空")
    @Length(max = 20, message = "用户名不能超过20个字符")
    private String username;

    /**
     * 手机号
     */
    @NotBlank(message = "手机号不能为空")
    private String mobile;

    /**
     * 性别
     */
    private String sex;

    /**
     * 邮箱
     */
    @NotBlank(message = "联系邮箱不能为空")
    @Email(message = "邮箱格式不对")
    private String email;

    /**
     * 密码
     */
    private String password;

    /**
     * 创建时间
     */
    // @Future(message = "时间必须是将来时间")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date createTime;


    /**
     * 保存的时候校验分组
     */
    public interface Save {
    }

    /**
     * 更新的时候校验分组
     */
    public interface Update {
    }

}
~~~

### 分组接口

~~~java
import jakarta.validation.groups.Default;

/**
 * 新增参数校验接口
 * <p>
 * author: lzhch
 * version: v1.0
 * date: 2023/11/20 17:20
 */

public interface ParamGroupValidated {

    /**
     * 在声明分组的时候加上 extend javax.validation.groups.Default
     * 否则, 在你声明 @Validated(Update.class)的时候, 就会出现你在默认没添加 groups = {} 的时候
     * 校验组 @Email(message = "邮箱格式不对") 会不去校验, 因为默认的校验组是 groups = {Default.class}.
     */

    interface Create extends Default {
    }

    interface Update extends Default {
    }

}
~~~

### 全局异常捕捉

参数校验报错分为 MethodArgumentNotValidException 和 ConstraintViolationException。

~~~java
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Objects;

/**
 * 全局异常处理
 * <p>
 * author: lzhch
 * version: v1.0
 * date: 2023/11/20 17:51
 */

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Controller 层参数校验
     *
     * @param methodArgumentNotValidException: Controller 层参数校验失败异常类型
     * @return 统一封装的结果类, 含有代码code和提示信息msg
     * Author: lzhch 2023/11/21 15:13
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public String handleMethodArgumentNotValidException(MethodArgumentNotValidException methodArgumentNotValidException) {
        log.error(methodArgumentNotValidException.getMessage(), methodArgumentNotValidException);
        FieldError fieldError = methodArgumentNotValidException.getBindingResult().getFieldError();
        if (Objects.isNull(fieldError)) {
            return methodArgumentNotValidException.getMessage();
        }

        return fieldError.getDefaultMessage();
    }

    /**
     * 捕获并处理未授权异常
     *
     * @param e: Service 层参数校验失败异常类型
     * @return 统一封装的结果类, 含有代码code和提示信息msg
     * Author: lzhch 2023/11/21 15:13
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public String handleConstraintViolationException(ConstraintViolationException e) {
        return String.join(";", e.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessageTemplate)
                .toList());
    }

}
~~~

---

## 单个或多个参数的校验

比如根据 Id 查询、删除等，无需封装成对象，且无需使用 JSON 格式。

~~~java
import com.alibaba.fastjson2.JSON;
import com.lzhch.practice.dto.req.ParamGroupValidatedReq;
import com.lzhch.practice.service.IParamGroupValidatedService;
import com.lzhch.practice.validatedtype.ParamGroupValidated;
import jakarta.annotation.Resource;
import jakarta.validation.constraints.NotBlank;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 参数分组校验 controller
 * <p>
 * author: lzhch
 * version: v1.0
 * date: 2023/11/20 17:22
 */

@Slf4j
// 用于在 Controller 层的简单校验, 比如 simple 方法
@Validated
@RestController
@RequestMapping(value = "validated/paramGroup")
public class ParamGroupValidatedController {

    @Resource
    private IParamGroupValidatedService paramGroupValidatedService;

    /**
     * 简单校验
     * 必须在 Controller 上添加 @Validated 注解
     * 指定 groups 可以进行分组校验
     */
    @GetMapping(value = "simple")
    public void simple(@NotBlank(message = "username 不能是空的啊!!!", groups = ParamGroupValidated.Create.class) String username) {
        log.info("result {}", username);
    }

}
~~~

---

## 非 JSON 格式的对象参数校验

Controller 和方法参数上需要添加 @Validated 注解；

对象里面增加相应类型的校验注解。

~~~java
/**
 * 非 JSON 格式的对象校验
 * 使用 @Validated 注解的 value 属性指定分组
 */
@GetMapping(value = "simple1")
public void simple1(@Validated ParamGroupValidatedReq paramGroupValidatedReq) {
    log.info("result {}", JSON.toJSONString(paramGroupValidatedReq));
}
~~~

---

## JSON 格式的对象参数校验

不需要在 Controller 上添加 @Validated 注解

JSON 格式校验只需要增加 @RequestBody 注解。

~~~java
/**
 * 统一接口分组测试新增
 * 使用 @Validated 注解的 value 属性指定分组
 */
@PostMapping(value = "create")
public void create(@RequestBody @Validated(value = ParamGroupValidated.Create.class) ParamGroupValidatedReq paramGroupValidatedReq) {
    log.info("result {}", JSON.toJSONString(paramGroupValidatedReq));
}
~~~

---

## Service 层校验

以上为在 Controller 里面进行的校验，接下来是 Service 层的校验代码。

### 接口

**在接口中必须添加 @Valid 以及 @NotBlank 等注解, 否则报错**

~~~java
package com.lzhch.practice.service;

import com.lzhch.practice.dto.req.ParamGroupValidatedReq;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

/**
 * 分组校验接口
 * <p>
 * author: lzhch
 * version: v1.0
 * date: 2023/11/20 18:16
 */

public interface IParamGroupValidatedService {

    // 在接口中必须添加 @Valid 以及 @NotBlank 等注解, 否则报错

    /**
     * 字段校验
     */
    void filedValidated(@NotBlank(message = "用户名不能为空") String username);

    /**
     * 不分组校验
     */
    void create(@Valid ParamGroupValidatedReq paramGroupValidatedReq);

    /**
     * 分组校验
     */
    // @Validated(value = ParamGroupValidated.Create.class)
    void create1(@Valid ParamGroupValidatedReq paramGroupValidatedReq);

}
~~~

### 实现类

**必须给实现类添加 @Validated 注解！**

~~~java
import com.alibaba.fastjson2.JSON;
import com.lzhch.practice.dto.req.ParamGroupValidatedReq;
import com.lzhch.practice.service.IParamGroupValidatedService;
import com.lzhch.practice.validatedtype.ParamGroupValidated;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

/**
 * 分组校验接口实现类
 * <p>
 * author: lzhch
 * version: v1.0
 * date: 2023/11/20 18:16
 */

@Slf4j
@Service
// 在接口上添加 @Validated 注解, 对该类进行参数校验
@Validated
public class ParamGroupValidatedServiceImpl implements IParamGroupValidatedService {

    /*
     * service 实现参数的校验:
     * 1. 实现类上添加 @Validated 注解, 对该类进行参数校验
     * 2. 在接口方法的参数上可以直接使用 @NotBlank/@Valid 等注解, 实现类上添加与否都可以
     *
     * 解释第 2 点:
     * 如果不在接口的方法中添加注解, 则会报错: jakarta.validation.ConstraintDeclarationException: HV000151: A method overriding another method must not redefine the parameter constraint configuration,
     *  but method ParamGroupValidatedServiceImpl#filedValidated(String) redefines the configuration of IParamGroupValidatedService#filedValidated(String).
     * 原因: 这个错误是由于在重写方法时改变了参数的约束配置导致的。
     *  在你的代码中，ParamGroupValidatedServiceImpl 类中的 filedValidated 方法重写了 IParamGroupValidatedService 中的同名方法，
     *  但是改变了参数的约束配置，这违反了 Hibernate Validator 的规则。
     *  为了解决这个问题，你需要确保在重写方法时保持参数的约束配置不变。如果需要改变约束配置，你需要在接口或父类中修改方法的注解，而不是在重写的方法中修改。
     */

    /**
     * 在方法的参数上可以直接使用 @NotBlank 等注解
     */
    @Override
    public void filedValidated(String username) {
        log.info("service username :{}", username);
    }

    /**
     * 不分组校验
     * 在方法上使用 @Valid 注解, 采用默认分组(实体也不指定分组)
     *
     * @param paramGroupValidatedReq param
     * @return: void
     * Author: lzhch 2023/11/21 14:56
     * Since: 1.0.0
     */
    @Override
    public void create(@Valid ParamGroupValidatedReq paramGroupValidatedReq) {
        log.info("service result :{}", JSON.toJSONString(paramGroupValidatedReq));
    }

    /**
     * 分组校验
     * 在不分组校验的基础上对方法添加使用 @Validated 注解, 并指定分组
     *
     * @param paramGroupValidatedReq param
     * @return: void
     * Author: lzhch 2023/11/21 14:55
     * Since: 1.0.0
     */
    @Override
    @Validated(value = ParamGroupValidated.Create.class)
    public void create1(ParamGroupValidatedReq paramGroupValidatedReq) {
        log.info("service result :{}", JSON.toJSONString(paramGroupValidatedReq));
    }

}
~~~

---

## 常用注解

| 注解             | 校验描述                                                     |
| ---------------- | ------------------------------------------------------------ |
| **@NotNul**      | 被注解的元素必须不为null                                     |
| **@NotBlank**    | 验证注解的元素值不为空（不为null、去除首位空格后长度为0） ，并且类型为String。 |
| **@NotEmpty**    | 验证注解的元素值不为null且不为空（字符串长度不为0、集合大小不为0） ，并且类型为String。 |
| **@AssertTrue**  | 被注解的元素必须为true，并且类型为boolean。                  |
| **@AssertFalse** | 被注解的元素必须为false，并且类型为boolean。                 |
| **@Min**         | 被注解的元素其值必须大于等于最小值，并且类型为int，long，float，double。 |
| **@Max**         | 被注解的元素其值必须小于等于最小值，并且类型为int，long，float，double。 |
| **@DecimalMin**  | 验证注解的元素值大于等于@DecimalMin指定的value值，并且类型为BigDecimal。 |
| **@DecimalMax**  | 验证注解的元素值小于等于@DecimalMax指定的value值 ，并且类型为BigDecimal。 |
| **@Range**       | 验证注解的元素值在最小值和最大值之间，并且类型为BigDecimal，BigInteger，CharSequence，byte，short，int，long |
| **@Past**        | 被注解的元素必须为过去的一个时间，并且类型为java.util.Date。 |
| **@Future**      | 被注解的元素必须为未来的一个时间，并且类型为java.util.Date。 |
| **@Size**        | 被注解的元素的长度必须在指定范围内，并且类型为String，Array，List，Map。 |
| **@Length**      | 验证注解的元素值长度在min和max区间内 ，并且类型为String。    |
| **@Digits**      | 验证注解的元素值的整数位数和小数位数上限 ，并且类型为float，double，BigDecimal。 |
| **@Pattern**     | 被注解的元素必须符合指定的正则表达式，并且类型为String。     |
| **@Email**       | 验证注解的元素值是Email，也可以通过regexp和flag指定自定义的email格式，类型为String。 |

---

## 总结

Spring Validation 提供了强大的参数校验功能，通过分组校验可以在不同场景下复用同一个实体类而应用不同的校验规则。本文介绍了在 Controller 层和 Service 层实现参数校验的多种方式，包括单个参数校验、对象参数校验以及 JSON 格式参数校验。在 Controller 层，需要使用 `@Validated` 注解标注类或方法参数；在 Service 层，接口方法参数需要添加 `@Valid` 或具体约束注解，同时实现类必须添加 `@Validated` 注解。通过全局异常处理器可以统一捕获并处理校验异常，提供友好的错误提示。合理使用参数校验不仅可以减少冗余的判断代码，还能提高代码的可读性和健壮性，是开发高质量应用的重要实践。

---

## 项目地址

> [SpringBoot3-Practice/ParamGroupValidated at main · lzhcccccch/SpringBoot3-Practice (github.com)](https://github.com/lzhcccccch/SpringBoot3-Practice/tree/main/ParamGroupValidated)