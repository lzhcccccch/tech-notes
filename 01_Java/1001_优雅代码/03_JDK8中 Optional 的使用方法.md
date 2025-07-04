# JDK8中 Optional 的使用方法

[toc]

## 简介

Java 8 引入了 Optional 类，以减少代码中显式的空值检查，从而避免 NullPointerException。Optional 是一个容器类，它可以包含一个非空的值，也可以为空。使用 Optional，你可以更清晰地表达一个方法可能返回一个空值，并且可以更安全地处理这种情况。

---

## 优点

1. **避免 `null` 检查**：使用 `Optional` 可以减少代码中的 `null` 检查，因为你可以通过流式调用来处理值的存在或缺失。
2. **改善代码可读性**：使代码的意图更明确，即某个变量可以没有值。
3. **集成到 Java 8 流**：`Optional` 类型可以很方便地转换成 Stream，与 Java 8 的其他功能（如 `Stream` API）一起使用。

---

## 注意事项

虽然 `Optional` 是一个强大的工具来替代 `null` 检查，但它并不是用来替换所有 `null` 的情况。例如，在类的字段或在可能大量创建 `Optional` 对象的数据密集型应用中使用 `Optional` 可能不是一个好选择，因为它增加了额外的内存负担。正确的使用场景通常是作为方法的返回类型，特别是你不确定方法是否总是能返回一个非 `null` 值的时候。

---

## 常用方法

以下是 Optional 类的一些主要方法及其用法示例：

### 创建 Optional 对象

- **Optional.of(T value):** 创建一个包含指定非空值的 Optional 对象。如果传入的值为 null，则抛出 NullPointerException。
- **Optional.ofNullable(T value):** 创建一个包含指定值的 Optional 对象。如果传入的值为 null，则返回一个空的 Optional 对象。
- **Optional.empty():** 返回一个空的 Optional 对象。

示例：

~~~java
Optional<String> nonEmptyOptional = Optional.of("Hello, World!");
Optional<String> nullableOptional = Optional.ofNullable(null);
Optional<String> emptyOptional = Optional.empty();
~~~

### 检查 Optional 对象的值

- **boolean isPresent():** 如果值存在，则返回 true，否则返回 false。
- **void ifPresent(Consumer<? super T> action):** 如果值存在，执行给定的动作，否则不执行任何操作。

示例：

~~~Java
Optional<String> optional = Optional.of("Hello, World!");

if (optional.isPresent()) {
    System.out.println(optional.get());
}

optional.ifPresent(value -> System.out.println(value));
~~~

### 获取 Optional 对象的值

- **T get():** 如果值存在，返回该值，否则抛出 NoSuchElementException。
- **T orElse(T other):** 如果值存在，返回该值，否则返回指定的默认值。
- **T orElseGet(Supplier<? extends T> other):** 如果值存在，返回该值，否则执行并返回由 Supplier 提供的值。
- **T orElseThrow(Supplier<? extends X> exceptionSupplier):** 如果值存在，返回该值，否则抛出由 Supplier 提供的异常。

示例：

~~~java
Optional<String> optional = Optional.ofNullable(null);

String value1 = optional.orElse("Default Value");
System.out.println(value1);  // 输出 "Default Value"

String value2 = optional.orElseGet(() -> "Default Value from Supplier");
System.out.println(value2);  // 输出 "Default Value from Supplier"

try {
    String value3 = optional.orElseThrow(() -> new IllegalStateException("Value is absent"));
} catch (IllegalStateException e) {
    System.out.println(e.getMessage());  // 输出 "Value is absent"
}
~~~

### 转换 Optional 对象的值

- **Optional\<U> map(Function<? super T, ? extends U> mapper):** 如果值存在，应用提供的映射函数并返回一个包含映射结果的 Optional 对象。如果值不存在，则返回一个空的 Optional 对象。
- **Optional\<U> flatMap(Function<? super T, Optional\<U>> mapper):** 与 map 类似，但映射函数返回的仍然是一个 Optional 对象。

示例：

~~~java
Optional<String> optional = Optional.of("Hello, World!");

Optional<Integer> lengthOptional = optional.map(String::length);
System.out.println(lengthOptional.get());  // 输出 12

Optional<String> upperOptional = optional.flatMap(value -> Optional.of(value.toUpperCase()));
System.out.println(upperOptional.get());  // 输出 "HELLO, WORLD!"
~~~

### 过滤 Optional 对象的值

- **Optional\<T> filter(Predicate<? super T> predicate):** 如果值存在，并且值匹配给定的断言条件，则返回包含该值的 Optional 对象，否则返回一个空的 Optional 对象。

示例：

~~~java
Optional<String> optional = Optional.of("Hello, World!");

Optional<String> filteredOptional = optional.filter(value -> value.startsWith("Hello"));
System.out.println(filteredOptional.isPresent());  // 输出 true

Optional<String> emptyFilteredOptional = optional.filter(value -> value.startsWith("Bye"));
System.out.println(emptyFilteredOptional.isPresent());  // 输出 false
~~~

---

## 组合使用

### List 转 Map

在处理数据量较大的 List 时，由于查询效率慢，所以要转为 Map 进行查询，可以直接对 List 进行判空并转为 Map。

~~~java
Map<String, BigDecimal> factoryMonthlyFinanceDifMap = Optional.ofNullable(factoryMonthlyFinanceDifList)
                .orElse(Collections.emptyList())
                .stream()
                .filter(item -> Objects.nonNull(item.getFinanceDif()))
                .collect(Collectors.toMap(
                                FactoryMonthlyFinanceDifDto::getFactoryCode,
                                FactoryMonthlyFinanceDifDto::getFinanceDif,
                                BigDecimal::add
                        )
                );

// 搭配 getOrDefault() 方法，巧妙避免空指针
factoryMonthlyFinanceDifMap.getOrDefault(item, BigDecimal.ZERO)
~~~

### 取出对象中的某字段（为空设置默认值或抛异常等）

~~~java
BigDecimal uphUnitPrice = Optional.ofNullable(priceBillZzUphInfoMap.get(entry.getKey()))
                    .map(item -> Optional.ofNullable(item.getQtAttr2Price()).orElse(BigDecimal.ZERO))
                    .orElse(BigDecimal.ZERO);
~~~

---

## 总结

Optional 提供了一种优雅的方式来处理可能为空的值。通过使用 Optional，可以显著减少代码中对空值的显式检查，提升代码的可读性和安全性。
