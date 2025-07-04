# `Arrays.asList`的避坑指南

[toc]

## 简介

`Arrays.asList`是将数组转换为`List`的常用方法，但它存在以下问题：

- **固定大小（不可变）**：返回的`List`是固定大小的，无法添加或删除元素。
- **基本类型数组问题**：对于基本类型数组，转换结果并不符合预期。
- **引用关系**：修改原数组会影响转换后的`List`。

---

## 示例代码

### 问题示例 1：固定大小的 List

```java
String[] arr = {"A", "B", "C"};
List<String> list = Arrays.asList(arr);
list.add("D"); // 抛出 UnsupportedOperationException
```

**原因分析：**

`Arrays.asList` 返回的 `List` 实际上是 `Arrays.ArrayList`，它继承自 `AbstractList`，未实现 `add` 和 `remove` 方法。

### 问题示例 2：基本类型数组

```java
int[] arr = {1, 2, 3};
List list = Arrays.asList(arr);
System.out.println(list.size()); // 输出 1，list 中元素为 [1,2,3]
```

**原因分析：**

基本类型数组被视为单一对象，而不是元素集合。

### 问题示例 3：原数组与 List 的联动

```java
String[] arr = {"A", "B", "C"};
List<String> list = Arrays.asList(arr);
arr[0] = "X";
System.out.println(list); // 输出 [X, B, C]
```

**原因分析：**

`Arrays.asList` 返回的 `List` 是原数组的视图，修改数组会影响 `List`。

---

## 解决方案

### 方案 1：创建可变列表

```java
String[] arr = {"A", "B", "C"};
List<String> list = new ArrayList<>(Arrays.asList(arr));
list.add("D");
System.out.println(list); // 输出 [A, B, C, D]
```

### 方案 2：转换基本类型数组

```java
int[] arr = {1, 2, 3};
List<Integer> list = Arrays.stream(arr).boxed().collect(Collectors.toList());
System.out.println(list); // 输出 [1, 2, 3]
```

### 方案 3：处理数组与 List 的联动问题

```java
String[] arr = {"A", "B", "C"};
List<String> list = new ArrayList<>(Arrays.asList(arr));
arr[0] = "X";
System.out.println(list); // 输出 [A, B, C]
```

## 总结

- 不要直接使用 `Arrays.asList` 返回的 `List` 进行修改操作。
- 对于基本类型数组，使用 `Stream` 转换为包装类型的 `List`。
- 如果需要独立的 `List` 副本，使用 `new ArrayList<>(Arrays.asList(...))`。