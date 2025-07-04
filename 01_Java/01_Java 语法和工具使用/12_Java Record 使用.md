# Java Record 详解

[toc]

## 1. 什么是 Record

Record 是 Java 14 中引入（Java 16 正式发布）的一种特殊类型的类，专为表示不可变数据而设计。它本质上是一种"数据类"，主要用于简单地存储和传输数据，而不包含复杂的业务逻辑。

Record 的核心理念是"数据的透明载体"，即它所包含的数据就是它的本质，而不是它的行为。

---

## 2. Record 的特性

### 2.1 不可变性

- Record 的所有字段都自动被声明为 `private final`
- 一旦创建，字段值不能被修改
- 天然线程安全，适合在并发环境中使用

### 2.2 自动生成的组件

当定义一个 Record 时，编译器会自动生成以下内容：

- 私有的、final 的字段，对应于 Record 头中声明的组件
- 一个规范构造函数（canonical constructor），参数与组件一一对应
- 每个组件的访问方法（与组件同名，没有 "get" 前缀）
- equals() 和 hashCode() 方法，基于所有组件的值
- toString() 方法，包含所有组件的名称和值

### 2.3 简洁的语法

```java
// 传统类需要约 30-50 行代码
public record Point(int x, int y) {}  // 仅需一行代码
```

### 2.4 继承限制

- Record 隐式地继承自 java.lang.Record 类
- 不能继承其他类（已经继承了 Record 类）
- 不能被其他类继承（隐式 final）
- 可以实现接口

---

## 3. Record 的创建与使用

### 3.1 基本定义与实例化

```java
// 定义
public record Person(String name, int age) {}

// 实例化
Person person = new Person("张三", 30);

// 访问字段
String name = person.name();  // 注意使用方法调用语法，而不是 person.name
int age = person.age();
```

### 3.2 自定义构造函数

Record 支持多种构造函数：

```java
public record Person(String name, int age) {
    // 紧凑构造函数 - 可以验证或修改参数
    public Person {
        if (age < 0) {
            throw new IllegalArgumentException("年龄不能为负数");
        }
        if (name == null || name.isEmpty()) {
            name = "未知";  // 修改输入参数
        }
    }
    
    // 重载构造函数
    public Person(String name) {
        this(name, 0);  // 调用规范构造函数
    }
    
    // 无参构造函数
    public Person() {
        this("未知", 0);
    }
}
```

### 3.3 添加方法

Record 可以包含额外的方法：

```java
public record Person(String name, int age) {
    // 实例方法
    public boolean isAdult() {
        return age >= 18;
    }
    
    // 静态方法
    public static Person createAdult(String name) {
        return new Person(name, 18);
    }
    
    // 可以覆盖自动生成的方法
    @Override
    public String toString() {
        return "人员[" + name + ", " + age + "岁]";
    }
}
```

### 3.4 不可变性与"修改"模式

由于 Record 是不可变的，"修改"操作实际上是创建新实例：

```java
public record Person(String name, int age) {
    // 返回修改后的新实例
    public Person withName(String newName) {
        return new Person(newName, this.age);
    }
    
    public Person withAge(int newAge) {
        return new Person(this.name, newAge);
    }
}

// 使用
Person person = new Person("张三", 30);
Person updatedPerson = person.withName("李四");  // 创建新实例
```

---

## 4. 嵌套与位置

### 4.1 顶级 Record

```java
// 文件: Person.java
package com.example;

public record Person(String name, int age) {}
```

### 4.2 嵌套 Record

```java
public class Department {
    // 嵌套 record - 自动是静态的
    public record Employee(String name, String id, double salary) {
        // 可以访问 Department 的静态成员
    }
    
    private final String deptName;
    private final List<Employee> employees;
    
    // 使用嵌套 record
    public void addEmployee(String name, String id, double salary) {
        employees.add(new Employee(name, id, salary));
    }
}

// 外部使用
Department.Employee emp = new Department.Employee("王五", "E001", 10000.0);
```

### 4.3 局部 Record

```java
public class ReportGenerator {
    public void generateReport() {
        // 方法内部定义的局部 record
        record SalesData(String product, int quantity, double revenue) {}
        
        // 仅在此方法内可用
        List<SalesData> data = List.of(
            new SalesData("产品A", 100, 5000.0),
            new SalesData("产品B", 50, 7500.0)
        );
        
        // 处理数据...
    }
}
```

---

## 5. Record 与传统类的对比

| 特性            | Record                           | 传统类                                       |
| --------------- | -------------------------------- | -------------------------------------------- |
| 不可变性        | 默认不可变                       | 默认可变，需手动实现不可变性                 |
| 构造函数        | 自动生成规范构造函数             | 需手动实现构造函数                           |
| 访问方法        | 自动生成（与字段同名）           | 需手动实现 getter/setter                     |
| equals/hashCode | 自动基于所有字段实现             | 需手动实现                                   |
| toString        | 自动包含所有字段                 | 需手动实现                                   |
| 继承            | 不能继承或被继承                 | 可以继承和被继承                             |
| 字段访问        | 通过方法调用（如 person.name()） | 直接访问或通过 getter（如 person.getName()） |
| 用途            | 主要用于数据传输和存储           | 通用目的，包括行为和状态                     |

---

## 6. 使用场景

Record 特别适合以下场景：

### 6.1 数据传输对象 (DTO)

```java
public record UserDTO(Long id, String username, String email) {}
```

### 6.2 方法返回多个值

```java
public record QueryResult(List<User> users, int totalCount, int pageCount) {}

// 使用
public QueryResult findUsers(String criteria, int page) {
    // 查询逻辑...
    return new QueryResult(userList, total, pages);
}
```

### 6.3 不可变数据模型

```java
public record Configuration(
    String serverUrl, 
    int port, 
    int timeout, 
    boolean sslEnabled
) {}
```

### 6.4 函数式编程中的元组

```java
public record Pair<T, U>(T first, U second) {}

// 使用
List<Pair<String, Integer>> nameAndAges = List.of(
    new Pair<>("张三", 30),
    new Pair<>("李四", 25)
);
```

---

## 7. 最佳实践

### 7.1 何时使用 Record

- 当需要简单的数据容器时
- 当数据应该是不可变的时
- 当不需要复杂的继承关系时
- 当数据的相等性基于其所有字段时

### 7.2 何时避免使用 Record

- 当需要可变状态时
- 当需要继承层次结构时
- 当需要复杂的封装和业务逻辑时
- 当相等性不应基于所有字段时

### 7.3 设计建议

- 保持 Record 简单，专注于数据而非行为
- 对于复杂验证，使用紧凑构造函数
- 使用工厂方法创建常用实例
- 对于"修改"操作，实现修改方法返回新实例
- 嵌套 Record 时，考虑其可见性和作用域

---

## 8. Record 的局限性

- 不支持字段的单独可见性控制（所有字段都有相同的可见性）
- 不能声明非静态初始化块
- 不能声明原生字段（native fields）
- 不能继承其他类
- 不能被其他类继承
- 组件名称不能与类型名称相同

---

## 总结

Java Record 是一种简洁、高效的数据容器，特别适合表示不可变数据。它通过自动生成常见方法，极大地减少了样板代码，使代码更加清晰和易于维护。虽然有一些限制，但在适当的场景中，Record 可以显著提高开发效率和代码质量。

在选择使用 Record 还是传统类时，关键是考虑数据的性质、不可变性需求以及是否需要复杂的继承关系。当需要简单、透明的数据结构时，Record 通常是更好的选择。
