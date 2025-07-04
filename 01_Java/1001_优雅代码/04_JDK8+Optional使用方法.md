# JDK8+版本中的 Optional 使用方法

[toc]

## 简介

`Optional` 类是 Java 8 引入的一个重要特性，用于更优雅地处理可能为 null 的值。从 JDK 9 开始，Java 对 Optional 类进行了持续的改进和增强。下面我将详细介绍从 JDK 9 到 JDK 24 中每个版本对 Optional 的改动。

---

## JDK 9 的改进

JDK 9 为 Optional 类添加了三个重要的方法：

### 1. `or()` 方法

提供一种优雅的方式来链接多个 Optional 实例，允许在当前 Optional 为空时提供一个替代的 Optional。

```java
// 假设我们有多个可能的数据源
Optional<User> fromCache = userCache.findUser(userId);
Optional<User> result = fromCache.or(() -> userDatabase.findUser(userId));

// 可以继续链接多个数据源
result = fromCache
    .or(() -> userDatabase.findUser(userId))
    .or(() -> userApi.fetchUser(userId));
```

**作用**：简化了多数据源回退逻辑，使代码更加简洁和声明式，避免了复杂的嵌套条件判断。

### 2. `ifPresentOrElse()` 方法

同时处理值存在和不存在的情况，类似于 if-else 结构，但更加函数式。

```java
userService.findById(userId).ifPresentOrElse(
    user -> {
        // 用户存在时的处理逻辑
        auditLog.recordAccess(user);
        displayUserInfo(user);
    },
    () -> {
        // 用户不存在时的处理逻辑
        logger.warn("User not found: " + userId);
        showNotFoundPage();
    }
);
```

**作用**：避免了重复的 isPresent() 检查，使代码更加清晰，同时处理了两种情况。

### 3. `stream()` 方法

将 Optional 转换为 Stream，便于与流操作结合使用。

```java
// 从多个来源获取用户列表，但有些可能返回空
List<Optional<User>> possibleUsers = Arrays.asList(
    userService.findById(1),
    userService.findById(2),
    userService.findById(3)  // 可能不存在
);

// 过滤出所有存在的用户
List<User> actualUsers = possibleUsers.stream()
    .flatMap(Optional::stream)  // 将每个Optional转为Stream
    .collect(Collectors.toList());
```

**作用**：特别适合处理 Optional 集合，简化了从 Optional 列表中提取实际值的操作。

---

## JDK 11 的改进

JDK 11 为 Optional 添加了一个新方法：

### `isEmpty()` 方法

提供了一种更直观的方式来检查 Optional 是否为空。

```java
Optional<String> optional = Optional.empty();

// JDK 11 之前的写法
if (!optional.isPresent()) {
    System.out.println("没有值");
}

// JDK 11 的新写法
if (optional.isEmpty()) {
    System.out.println("没有值");
}

// 在条件判断中更加直观
userService.findById(id)
    .filter(user -> !user.isBlocked())
    .ifPresentOrElse(
        this::processUser,
        () -> logger.info("用户不存在或已被封禁")
    );
```

**价值**：提高了代码的可读性，使空值检查的意图更加明确。

---

## JDK 21 的改进

JDK 21 引入了模式匹配功能，虽然不是 Optional 类本身的改动，但显著改善了 Optional 的使用体验：

### 模式匹配与 Optional 的结合

```java
Optional<User> userOpt = userService.findById(id);

// JDK 21 之前
if (userOpt.isPresent()) {
    User user = userOpt.get();
    if (user.getRole().equals("ADMIN")) {
        grantAdminAccess(user);
    }
}

// JDK 21 使用模式匹配
if (userOpt.isPresent() && userOpt.get().getRole().equals("ADMIN")) {
    grantAdminAccess(userOpt.get());
}

// 未来可能的模式匹配语法（预览特性）
if (userOpt instanceof Optional<User>(var user) && user.getRole().equals("ADMIN")) {
    grantAdminAccess(user);
}
```

**作用**：虽然这不是 Optional 类的直接改动，但模式匹配特性使得处理 Optional 对象更加简洁和安全。

---

## 总结

从 JDK 9 到 JDK 24，Optional 类的主要改进集中在：

1. **JDK 9**：添加了 `or()`, `ifPresentOrElse()` 和 `stream()` 方法，大大增强了 Optional 的功能性和链式操作能力
2. **JDK 11**：添加了 `isEmpty()` 方法，提高了代码可读性
3. **JDK 21**：虽然不是 Optional 本身的改动，但模式匹配特性改善了 Optional 的使用体验

这些改进使 Optional 的使用更加灵活和便捷，特别是在链式操作和与 Stream API 结合使用时。使用这些增强的 Optional 功能，开发者可以编写更简洁、更具表达力的代码，同时减少 NullPointerException 的风险。