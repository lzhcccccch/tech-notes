# EasyRules 规则引擎使用指南

[toc]

## 简介
EasyRules 是一个轻量级且功能强大的 Java 规则引擎，支持基于 POJO 的开发、注解编程模型以及多种规则定义方式。其主要特点包括：
- 基于 POJO 的简单开发模型
- 支持声明式的注解编程
- 灵活的规则组合机制
- 可配置的规则执行引擎

---

## Maven 依赖

~~~xml
<!--easy rules核心库-->
<dependency>
    <groupId>org.jeasy</groupId>
    <artifactId>easy-rules-core</artifactId>
    <version>4.1.0</version>
</dependency>

<!--规则定义文件格式，支持json,yaml等-->
<dependency>
    <groupId>org.jeasy</groupId>
    <artifactId>easy-rules-support</artifactId>
    <version>4.1.0</version>
</dependency>

<!--支持mvel规则语法库-->
<dependency>
    <groupId>org.jeasy</groupId>
    <artifactId>easy-rules-mvel</artifactId>
    <version>4.1.0</version>
</dependency>
~~~

---

## 注解概述

EasyRules 提供了一系列注解，帮助开发者以声明式方式定义规则的触发条件和执行逻辑。以下是核心注解及其功能：

- **Rule（规则）**：业务规则的基本单位
- **Facts（事实）**：规则运行时的输入数据
- **RulesEngine（规则引擎）**：负责规则的执行和管理
- **RuleListener（规则监听器）**：用于监控规则执行过程

### 注解系统详解

#### @Rule 注解
标记一个类为规则，并为该规则指定元信息（如名称、描述和优先级）。当有多个规则时，按照 `priority` 属性的顺序执行；`priortiry` 属性值相同时，按照规则注册顺序执行。

```java
@Rule(
    name = "我的规则",              // 规则名称
    description = "规则的描述信息",  // 规则描述
    priority = 1                   // 优先级，数字越小优先级越高，默认值为 Integer.MAX_VALUE
)
public class MyRule {
    // 规则实现
}
```

#### @Condition 注解
定义规则的触发条件。

方法返回值必须为 `boolean` 类型。方法可以有参数，参数需要使用 `@Fact` 注解标记。

```java
public class PriceRule {
    @Condition
    public boolean checkPrice(@Fact("price") double price, 
                            @Fact("quantity") int quantity) {
        return price * quantity >= 1000;
    }
}
```

#### @Action 注解
定义规则触发后要执行的操作。

方法返回值必须为 `void`。一个规则可以包含多个 `@Action` 方法，`order` 属性指定方法执行顺序。

```java
public class DiscountRule {
  	// order：指定操作的执行顺序，默认为 0。
    @Action(order = 1)
    public void applyDiscount(@Fact("order") Order order) {
        order.setDiscount(0.1);
    }

    @Action(order = 2)
    public void notifyCustomer(@Fact("order") Order order) {
        System.out.println("折扣已应用到订单: " + order.getId());
    }
}
```

#### @Fact 注解
标记方法参数，用于注入规则所需的数据。

```java
@Condition
public boolean checkOrder(
  	// value：指定输入数据的名称。
    @Fact("order") Order order,
    @Fact("customer") Customer customer
) {
    return order.getAmount() > 1000 && customer.isVip();
}
```

---

## 代码示例

### 自定义规则 1~3

~~~java
@Slf4j
@Rule(name = "MyRuleOne", description = "自定义规则1", priority = 1)
public class MyRuleOne {

    // @Condition 为规则的条件. 入参可以使用@Fact进行标注, 可一个可多个; 也可使用Facts进行传参(参考MyRuleOne-MyRuleThree)
    @Condition
    public boolean validFactoryCode(@Fact(value = "factoryCode") String factoryCode) {
        return "8310".equals(factoryCode) || "80K0".equals(factoryCode);
    }

    @Action
    public void then(Facts facts) {
        log.info("自定义规则1成功 :{}", facts.toString());
    }

}

@Slf4j
@Rule(name = "MyRuleTwo", description = "自定义规则2", priority = 2)
public class MyRuleTwo {

    @Condition
    public boolean when(@Fact(value = "factoryCode") String factoryCode, @Fact(value = "lineCode") String lineCode) {
        return "8310".equals(factoryCode) && "36".equals(lineCode);
    }

    @Action
    public void then(Facts facts) {
        log.info("自定义规则2成功 :{}", facts.toString());
    }

}

@Slf4j
@Rule(name = "MyRuleThree", description = "自定义规则3", priority = 3)
public class MyRuleThree {

    @Condition
    public boolean when(Facts facts) {
        return "8310".equals(facts.get("factoryCode")) && "36".equals(facts.get("lineCode"));
    }

    @Action
    public void thenStep1(Facts facts) {
        System.out.println("自定义规则3-第1步成功" + facts.toString());
    }

    @Action(order = 1)
    public void thenStep2(Facts facts) {
        log.info("自定义规则3-第2步成功 :{}", facts.toString());
    }

}
~~~

### 规则引擎配置

~~~java
public class EasyRuleApplication {
    public static void main(String[] args) {
        // create a rules engine
        // skipOnFirstAppliedRule(true) 在满足一个规则之后, 无论成功与失败, 均跳过后面的规则
        // RulesEngineParameters parameters = new RulesEngineParameters().skipOnFirstAppliedRule(true);
        RulesEngineParameters parameters = new RulesEngineParameters();
        RulesEngine rulesEngine = new DefaultRulesEngine(parameters);

        // 自定义规则对象
        Rules rules = new Rules();
        rules.register(new MyRuleOne());
        rules.register(new MyRuleTwo());
        rules.register(new MyRuleThree());

        Facts facts = new Facts();
        facts.put("factoryCode", "8310");
        facts.put("lineCode", "36");

        rulesEngine.fire(rules, facts);

        for (Rule rule : rules) {
            boolean evaluate = rule.evaluate(facts);
            System.out.println(evaluate);
        }

        // 还可以使用脚本/表达式以及配置 yaml 文件, 但是会引入新的语法, 暂不整理
    }

}
~~~

#### 规则引擎属性说明

| 参数名称                        | 描述                                                         | 默认值              | 用途                                                         |
| ------------------------------- | ------------------------------------------------------------ | ------------------- | ------------------------------------------------------------ |
| **priorityThreshold**           | 设置规则引擎执行规则的优先级阈值，只有优先级 ≤ 该值的规则会被触发。 | `Integer.MAX_VALUE` | 限制规则触发范围，避免低优先级规则的执行。                   |
| **skipOnFirstAppliedRule**      | 如果为 `true`，当第一个规则被触发后，规则引擎会跳过后续规则的执行。 | `false`             | 适用于规则互斥或只需执行第一个满足条件的规则的场景。         |
| **skipOnFirstFailedRule**       | 如果为 `true`，当某个规则条件评估失败时，规则引擎会停止评估剩余规则。 | `false`             | 适用于规则之间存在依赖关系，或希望在某个规则失败后终止流程的场景。 |
| **skipOnFirstNonTriggeredRule** | 如果为 `true`，当第一个规则未触发时，规则引擎会跳过后续规则的评估。 | `false`             | 适用于当某些规则未触发时即停止规则评估的场景，优化性能。     |

---

## 其他写法

### 链式写法（RuleBuilder）

~~~java
public class EasyRuleLambdaApplication {

    public static void main(String[] args) {
        // create a rules engine
        // skipOnFirstAppliedRule(true) 在满足一个规则之后, 无论成功与失败, 均跳过后面的规则
        // RulesEngineParameters parameters = new RulesEngineParameters().skipOnFirstAppliedRule(true);
        RulesEngineParameters parameters = new RulesEngineParameters();
        RulesEngine rulesEngine = new DefaultRulesEngine(parameters);

        Facts lambdaFacts = new Facts();
        lambdaFacts.put("age", 40);
        lambdaFacts.put("sex", "man");
        Rule ageRule = new RuleBuilder()
                .name("age rule")
                .description("Check if person's age is > 18 and marks the person as adult")
                .priority(1)
                .when(item -> {
                    Integer value = item.get("age");
                    return value > 18;
                })
                .when(item -> {
                    Integer value = item.get("age");
                    return value < 30;
                })
                .then(item -> System.out.println("then age:" + item.get("age")))
                .build();

        Rule sexRule = new RuleBuilder()
                .name("sex rule")
                .description("Check if person's sex is man")
                .priority(2)
                .when(item -> {
                    String value = item.get("sex");
                    return "man".equals(value);
                })
                .then(item -> System.out.println("then sex:" + item.get("sex")))
                .build();


        Rules rules = new Rules();
        rules.register(ageRule);
        rules.register(sexRule);
        rulesEngine.fire(rules, lambdaFacts);
    }
}
~~~

### Yaml 配置文件

在 `resources` 目录下创建 `rule1.yml` 文件，内容如下：

~~~yaml
---
name: "Temperature Rule"
description: "If temperature is greater than 30, then alert."
priority: 1
condition: "temperature > 30"
actions:
  - "System.out.println('Temperature is too high!')"

---
name: "Rain Rule"
description: "If it is raining, carry an umbrella."
priority: 2
condition: "isRaining == true"
actions:
#  - "System.out.println('It is raining, take an umbrella!')"
  # 通过调用方法实现, 方法必须是静态方法且能被 easyRule 调用到
  - "com.lzhch.practice.easyrule.action.YamlRainAction.rain()"
~~~

Java 代码

~~~java
public class EasyRuleYamlApplication {

    public static void main(String[] args) throws Exception {
        // 1. 创建规则引擎参数
        RulesEngineParameters parameters = new RulesEngineParameters()
                .skipOnFirstAppliedRule(false) // 配置规则引擎参数
                .priorityThreshold(10);       // 只执行优先级 <= 10 的规则

        // 2. 创建规则引擎
        DefaultRulesEngine rulesEngine = new DefaultRulesEngine(parameters);

        // 3. 从 YAML 文件加载规则
        MVELRuleFactory ruleFactory = new MVELRuleFactory(new YamlRuleDefinitionReader());
        // 加载 rules.yml 文件
        InputStreamReader inputStreamReader = new InputStreamReader(Objects.requireNonNull(EasyRuleYamlApplication.class.getClassLoader().getResourceAsStream("rule1.yml")));
        Rules rules = ruleFactory.createRules(inputStreamReader);

        // 4. 定义事实（Facts）
        Facts facts = new Facts();
        facts.put("temperature", 35);  // 温度为 35
        facts.put("isRaining", true); // 下雨

        // 5. 执行规则引擎
        rulesEngine.fire(rules, facts);


        Facts factList = new Facts();
        for (int i = 28; i <= 40; i = i + 2) {
            System.out.println("====== " + i + " ======");
            factList.put("temperature", i);
            factList.put("isRaining", i / 2 == 0);
            rulesEngine.fire(rules, facts);
        }
    }

}
~~~

action 类：

~~~java
public class YamlRainAction {

    /**
     * 需要确保类和方法是静态的，并且可以被规则引擎访问。
     */
    public static void rain() {
        System.out.println("It rains, take an umbrella.");
    }

}
~~~

### MVEL 写法

~~~java
public class EasyRuleMVELApplication {

    public static void main(String[] args) {
        RulesEngine rulesEngine = new DefaultRulesEngine(new RulesEngineParameters());

        Rule weatherRule = new MVELRule()
                .name("weather rule")
                .description("if it rains then take an umbrella")
                .when("rain == true")
                .then("System.out.println(\"It rains, take an umbrella!\");");

        Rules rules = new Rules();
        rules.register(weatherRule);

        Facts facts = new Facts();
        facts.put("rain", true);

        rulesEngine.fire(rules, facts);
    }

}
~~~

---

## 监听器的使用

EasyRules 提供了两种类型的监听器：

1. `RuleListener`: 监听单个规则的执行过程
2. `RulesEngineListener`: 监听整个规则引擎的执行过程

### 规则监听器

```java
public class MyRuleListener implements RuleListener {

    private static final Logger logger = LoggerFactory.getLogger(MyRuleListener.class);

    /**
     * 该方法在规则条件被评估前被调用, 默认返回true
     * 如果返回false，则中断规则的执行; 如果返回true，则继续执行规则
     * <p>
     * 可以在该方法中打印当前Facts中的所有数据
     * 可以在该方法中对当前Facts中的数据进行修改
     * 可以在该方法中对当前Rule进行修改
     */
    @Override
    public boolean beforeEvaluate(Rule rule, Facts facts) {
        logger.info("规则[{}]开始评估条件", rule.getName());
        // 打印当前Facts中的所有数据
        facts.asMap().forEach((k, v) -> logger.info("Fact - key: {}, value: {}", k, v));
        return true; // 返回true继续执行，返回false则中断执行
    }

    /**
     * 该方法在规则条件被评估后被调用
     */
    @Override
    public void afterEvaluate(Rule rule, Facts facts, boolean evaluationResult) {
        logger.info("规则[{}]条件评估完成，评估结果: {}", rule.getName(), evaluationResult);
    }

    /**
     * 该方法在规则条件评估出现异常时被调用
     * 可以在该方法中打印异常信息
     */
    @Override
    public void onEvaluationError(Rule rule, Facts facts, Exception exception) {
        logger.error("规则[{}]条件评估异常，异常信息: {}", rule.getName(), exception.getMessage());
    }

    /**
     * 该方法在规则执行动作前被调用
     */
    @Override
    public void beforeExecute(Rule rule, Facts facts) {
        logger.info("规则[{}]开始执行动作", rule.getName());
    }

    /**
     * 该方法在规则执行动作后被调用
     */
    @Override
    public void onSuccess(Rule rule, Facts facts) {
        logger.info("规则[{}]执行成功", rule.getName());
    }

    /**
     * 该方法在规则执行动作出现异常时被调用
     * 可以在该方法中打印异常信息
     */
    @Override
    public void onFailure(Rule rule, Facts facts, Exception exception) {
        logger.error("规则[{}]执行失败，异常信息: {}", rule.getName(), exception.getMessage());
    }

}
```

### 规则引擎监听器

~~~java
public class MyRulesEngineListener implements RulesEngineListener {

    private static final Logger logger = LoggerFactory.getLogger(MyRulesEngineListener.class);
    private long startTime;

    /**
     * 该方法在规则引擎执行前被调用
     * 可以在该方法中打印规则数量
     * 可以在该方法中打印当前Facts中的所有数据
     */
    @Override
    public void beforeEvaluate(Rules rules, Facts facts) {
        startTime = System.currentTimeMillis();

        logger.info("规则引擎开始执行，规则数量: {}", rules.size());
        logger.info("当前Facts数量: {}", facts.asMap().size());
    }

    /**
     * 该方法在规则引擎执行后被调用
     * 可以在该方法中打印规则执行耗时
     */
    @Override
    public void afterExecute(Rules rules, Facts facts) {
        long executionTime = System.currentTimeMillis() - startTime;

        logger.info("规则引擎执行完成，耗时: {}ms", executionTime);
        // 输出执行后的Facts状态
        logger.info("执行后的Facts状态:");

        facts.asMap().forEach((k, v) ->
                logger.info("Fact - key: {}, value: {}", k, v));
    }

}
~~~

### 注册监听器

```java
public class EasyRuleListenerApplication {

    public static void main(String[] args) {
        DefaultRulesEngine rulesEngine = new DefaultRulesEngine();

        // 添加规则监听器, 可注册多个
        rulesEngine.registerRuleListener(new MyRuleListener());
        // 添加规则引擎监听器, 可注册多个
        rulesEngine.registerRulesEngineListener(new MyRulesEngineListener());

        // 自定义规则对象
        Rules rules = new Rules();
        rules.register(new MyRuleOne());
        rules.register(new MyRuleThree());
        rules.register(new MyRuleTwo());

        Facts facts = new Facts();
        facts.put("factoryCode", "8310");
        facts.put("lineCode", "36");

        rulesEngine.fire(rules, facts);
    }

}
```

---

## 总结

EasyRules 通过其简单而强大的注解系统，为我们提供了一种优雅的方式来实现业务规则。通过合理使用这些注解和遵循最佳实践，可以构建出易于维护和扩展的规则系统。