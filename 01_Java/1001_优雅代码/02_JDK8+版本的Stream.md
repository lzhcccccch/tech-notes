# JDK8版本以上的 Stream 用法

[toc]

## 简介

JDK 8 之后的版本（JDK 9~JDK 24）对 Stream API 进行了多次增强，新增了一些实用的方法和功能。这些改进提升了代码的可读性、灵活性和性能。

---

## JDK 9

### takeWhile(Predicate<? super T> predicate)

- **作用**：从 Stream 中按顺序获取满足条件的元素，直到第一个不满足条件的元素为止（类似于“前缀匹配”）。

- **常见场景**：当需要从一个排序的列表中提取前几项符合条件的元素时，takeWhile 会很有用。

**示例：**

~~~java
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class TakeWhileExample {
    public static void main(String[] args) {
        List<Integer> result = Stream.of(1, 2, 3, 4, 5, 6, 7, 8, 9)
                .takeWhile(n -> n < 5) // 只保留小于 5 的元素，遇到 5 就停止
                .collect(Collectors.toList());
        System.out.println(result); // 输出: [1, 2, 3, 4]
    }
}
~~~

### dropWhile(Predicate<? super T> predicate)

- **作用**：从 Stream 中删除满足条件的前缀元素，直到第一个不满足条件的元素为止。

- **常见场景**：当需要跳过排序列表中的前几项符合条件的元素时，dropWhile 会很有用。

**示例：**

~~~java
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class DropWhileExample {
    public static void main(String[] args) {
        List<Integer> result = Stream.of(1, 2, 3, 4, 5, 6, 7, 8, 9)
                .dropWhile(n -> n < 5) // 跳过小于 5 的元素，直到遇到 5
                .collect(Collectors.toList());
        System.out.println(result); // 输出: [5, 6, 7, 8, 9]
    }
}
~~~

### ofNullable(T t)

- **作用**：将一个可能为 null 的对象转为 Stream，如果为 null，则生成一个空的 Stream。

- **常见场景**：避免 null 值导致的 NullPointerException。

**示例：**

~~~java
import java.util.stream.Stream;

public class OfNullableExample {
    public static void main(String[] args) {
        Stream<String> stream = Stream.ofNullable(null); // 如果为 null，返回空 Stream
        System.out.println(stream.count()); // 输出: 0

        Stream<String> nonNullStream = Stream.ofNullable("Hello");
        nonNullStream.forEach(System.out::println); // 输出: Hello
    }
}
~~~

### Stream.iterate(T seed, Predicate<? super T> hasNext, UnaryOperator<T> next)

- **作用**：生成具有条件终止的无限 Stream，与 JDK 8 的 Stream.iterate(seed, UnaryOperator) 不同，JDK 9 允许在生成的过程中提前终止。

- **常见场景**：生成有限范围的数字流。

**示例：**

~~~java
import java.util.List;
import java.util.stream.Stream;

public class ToListExample {
    public static void main(String[] args) {
        // Java 16 之前
        List<Integer> oldWay = Stream.of(1, 2, 3, 4, 5)
                .collect(Collectors.toList());
        
        // Java 16 及之后
        List<Integer> newWay = Stream.of(1, 2, 3, 4, 5).toList();
        System.out.println(newWay); // 输出: [1, 2, 3, 4, 5]
        
        // 注意：toList() 返回的是不可修改的列表
        // newWay.add(6); // 这将抛出 UnsupportedOperationException
    }
}
~~~

---

## JDK 10

### Collectors.toUnmodifiableList/Set/Map

- **作用**：将 Stream 结果收集为不可变集合。

- **常见场景**：当需要一个不可变的列表、集合或映射时，使用这些方法会更安全。

**示例：**

~~~java
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class ToUnmodifiableCollectionsExample {
    public static void main(String[] args) {
        // 不可变List
        List<Integer> list = Stream.of(1, 2, 3, 4, 5)
                .collect(Collectors.toUnmodifiableList());
        System.out.println(list); // 输出: [1, 2, 3, 4, 5]
        // list.add(6); // 这将抛出 UnsupportedOperationException
        
        // 不可变Set
        Set<String> set = Stream.of("a", "b", "c")
                .collect(Collectors.toUnmodifiableSet());
        System.out.println(set); // 输出: [a, b, c]
        
        // 不可变Map
        Map<String, Integer> map = Stream.of("a", "b", "c")
                .collect(Collectors.toUnmodifiableMap(
                        s -> s, // 键映射函数
                        s -> s.length() // 值映射函数
                ));
        System.out.println(map); // 输出: {a=1, b=1, c=1}
    }
}
~~~

---

## JDK 11

Java 11 没有直接对 Stream API 添加新方法，但改进了相关 API 的使用。

### Collection.toArray(IntFunction)

允许更方便地将集合或流转换为特定类型的数组。

```java
import java.util.List;
import java.util.stream.Stream;

public class ToArrayExample {
    public static void main(String[] args) {
        // Java 11 之前
        String[] oldWay = Stream.of("a", "b", "c")
                .toArray(size -> new String[size]);
                
        // Java 11 之后 (更简洁)
        String[] newWay = Stream.of("a", "b", "c")
                .toArray(String[]::new);
                
        // 结合Stream使用
        List<String> list = List.of("a", "b", "c");
        String[] filtered = list.stream()
                .filter(s -> !s.equals("b"))
                .toArray(String[]::new);
                
        System.out.println(String.join(", ", filtered)); // 输出: a, c
    }
}
```

---

## JDK 12

### Collectors.teeing ()

- **作用**：对 Stream 进行双重操作，合并两个操作的结果。

- **常见场景**：当需要同时对流执行两个操作，并合并结果时（例如，计算平均值和总和）。

**示例：**

~~~java
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class TeeingExample {
    public static void main(String[] args) {
        // 计算平均值：同时获取总和和计数，然后计算平均值
        double average = Stream.of(1, 2, 3, 4, 5)
                .collect(Collectors.teeing(
                    Collectors.summingInt(Integer::intValue), // 计算和
                    Collectors.counting(), // 计算数量
                    (sum, count) -> sum / (double) count // 计算平均值
                ));
        System.out.println("Average: " + average); // 输出: Average: 3.0
        
        // 同时获取最小值和最大值
        record MinMax(int min, int max) {}
        
        MinMax minMax = Stream.of(5, 2, 9, 1, 7, 3)
                .collect(Collectors.teeing(
                    Collectors.minBy(Integer::compareTo),
                    Collectors.maxBy(Integer::compareTo),
                    (min, max) -> new MinMax(min.orElse(0), max.orElse(0))
                ));
        
        System.out.println("Min: " + minMax.min() + ", Max: " + minMax.max()); // 输出: Min: 1, Max: 9
    }
}

~~~

---

## JDK 16

Java 16 为 Stream API 添加了两个重要的增强。

### toList()

- **作用**：Stream 接口直接提供 toList() 方法，比 collect(Collectors.toList()) 更简洁。返回的是不可修改的列表。

- **常见场景**：用于从 Stream 中获取不可变的 List。

**示例：**

~~~java
import java.util.List;
import java.util.stream.Stream;

public class ToListExample {
    public static void main(String[] args) {
        // Java 16 之前
        List<Integer> oldWay = Stream.of(1, 2, 3, 4, 5)
                .collect(Collectors.toList());
        
        // Java 16 及之后
        List<Integer> newWay = Stream.of(1, 2, 3, 4, 5).toList();
        System.out.println(newWay); // 输出: [1, 2, 3, 4, 5]
        
        // 注意：toList() 返回的是不可修改的列表
        // newWay.add(6); // 这将抛出 UnsupportedOperationException
    }
}
~~~

### mapMulti()

允许将一个元素映射为零个、一个或多个元素。与 `flatMap` 相比，`mapMulti` 在某些场景下性能更好，特别是当不需要创建中间 Stream 时。

```java
import java.util.List;
import java.util.stream.Stream;

public class MapMultiExample {
    public static void main(String[] args) {
        // 示例1：将每个字符串映射为原字符串和其大写形式
        List<String> result1 = Stream.of("a", "b", "c")
                .mapMulti((str, consumer) -> {
                    consumer.accept(str);
                    consumer.accept(str.toUpperCase());
                })
                .toList();
        System.out.println(result1); // 输出: [a, A, b, B, c, C]
        
        // 示例2：过滤掉不符合条件的元素（类似于filter）
        List<Integer> result2 = Stream.of(1, 2, 3, 4, 5)
                .mapMulti((num, consumer) -> {
                    if (num % 2 == 0) {
                        consumer.accept(num);
                    }
                })
                .toList();
        System.out.println(result2); // 输出: [2, 4]
        
        // 示例3：展开集合元素（类似于flatMap）
        List<List<Integer>> nestedLists = List.of(
                List.of(1, 2),
                List.of(3, 4, 5),
                List.of(6)
        );
        
        List<Integer> flattened = nestedLists.stream()
                .mapMulti((list, consumer) -> 
                    list.forEach(consumer))
                .toList();
        System.out.println(flattened); // 输出: [1, 2, 3, 4, 5, 6]
    }
}
```

---

## JDK 17

Java 17 没有直接对 Stream API 添加新方法，但随着 Java 17 中密封类（Sealed Classes）的正式发布，Stream API 的使用模式得到了增强。

```java
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// 定义密封类层次结构
sealed interface Shape permits Circle, Rectangle, Triangle {
    double area();
}

record Circle(double radius) implements Shape {
    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

record Rectangle(double width, double height) implements Shape {
    @Override
    public double area() {
        return width * height;
    }
}

record Triangle(double base, double height) implements Shape {
    @Override
    public double area() {
        return 0.5 * base * height;
    }
}

public class SealedClassesWithStreamExample {
    public static void main(String[] args) {
        List<Shape> shapes = List.of(
            new Circle(5),
            new Rectangle(4, 6),
            new Triangle(3, 4),
            new Circle(2)
        );
        
        // 使用Stream和密封类进行类型安全的处理
        Map<String, Double> areaByType = shapes.stream()
                .collect(Collectors.groupingBy(
                        shape -> switch(shape) {
                            case Circle c -> "Circle";
                            case Rectangle r -> "Rectangle";
                            case Triangle t -> "Triangle";
                        },
                        Collectors.summingDouble(Shape::area)
                ));
        
        System.out.println("Area by type: " + areaByType);
    }
}
```

---

## JDK 19

Java 19 引入了虚拟线程（预览特性），虽然不是直接的 Stream API 改进，但对并行流处理有潜在影响。

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.IntStream;

public class VirtualThreadsWithStreamExample {
    public static void main(String[] args) {
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            // 使用虚拟线程执行器处理并行流
            IntStream.range(0, 1000)
                    .parallel()
                    .forEach(i -> {
                        try {
                            // 模拟IO阻塞操作
                            Thread.sleep(1);
                            if (i % 100 == 0) {
                                System.out.println("Processing: " + i);
                            }
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                        }
                    });
        }
    }
}
```

---

## JDK 21

### SequencedCollection 接口

Java 21 引入了 SequencedCollection 接口，虽然不是直接针对 Stream API 的改进，但它增强了集合的顺序性，从而间接影响了 Stream 的使用。

```java
import java.util.ArrayList;
import java.util.List;

public class SequencedCollectionExample {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>(List.of(1, 2, 3, 4, 5));
        
        // 获取反向顺序的视图
        var reversed = list.reversed();
        System.out.println("Reversed: " + reversed); // 输出: [5, 4, 3, 2, 1]
        
        // 然后可以转为流处理
        var sum = reversed.stream().mapToInt(Integer::intValue).sum();
        System.out.println("Sum of reversed: " + sum); // 输出: 15
        
        // 获取第一个和最后一个元素
        System.out.println("First: " + list.getFirst()); // 输出: 1
        System.out.println("Last: " + list.getLast());   // 输出: 5
        
        // 添加元素到开头或结尾
        list.addFirst(0);
        list.addLast(6);
        System.out.println("After adding: " + list); // 输出: [0, 1, 2, 3, 4, 5, 6]
        
        // 结合Stream使用
        var evenNumbers = list.stream()
                .filter(n -> n % 2 == 0)
                .toList();
        System.out.println("Even numbers: " + evenNumbers); // 输出: [0, 2, 4, 6]
    }
}
```

---

## JDK 22

### Stream.mapMulti 方法的改进

Java 22 增强了 `mapMulti` 方法的性能，使其在处理大量数据时更加高效。这个方法在 Java 16 中引入，允许将一个元素映射为零个、一个或多个元素。

```java
import java.util.List;
import java.util.stream.Stream;

public class MapMultiOptimizationExample {
    public static void main(String[] args) {
        // 使用mapMulti处理大量数据
        long start = System.currentTimeMillis();
        
        // 生成大量数据并使用mapMulti处理
        long count = Stream.iterate(0, i -> i < 1_000_000, i -> i + 1)
                .mapMulti((i, consumer) -> {
                    if (i % 2 == 0) {
                        consumer.accept(i);
                        consumer.accept(i * 2);
                    }
                })
                .count();
                
        long end = System.currentTimeMillis();
        
        System.out.println("Processed " + count + " elements in " + (end - start) + "ms");
    }
}
```

---

## JDK 23-24

### Stream 的并行处理优化

这些版本主要对 Stream 的并行处理进行了底层优化，提高了性能，但没有引入新的 API。

```java
import java.util.List;
import java.util.stream.IntStream;

public class ParallelStreamExample {
    public static void main(String[] args) {
        // 并行流处理大数据集的性能在新版本中有所提升
        long start = System.currentTimeMillis();
        int sum = IntStream.range(0, 10_000_000)
                .parallel()
                .map(i -> i * 2)
                .sum();
        long end = System.currentTimeMillis();
        System.out.println("Sum: " + sum);
        System.out.println("Time taken: " + (end - start) + "ms");
    }
}
```

---

## 总结对比表

| **版本**       | **新增/改进方法**                                         | **描述**                             | **示例**                                                     |
| -------------- | --------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------ |
| **Java 9**     | `takeWhile(Predicate<? super T>)`                         | 获取前缀元素，直到不满足条件         | `stream.takeWhile(n -> n < 5)`                               |
|                | `dropWhile(Predicate<? super T>)`                         | 丢弃前缀元素，直到不满足条件         | `stream.dropWhile(n -> n < 5)`                               |
|                | `ofNullable(T t)`                                         | 将可能为 `null` 的元素转为 `Stream`  | `Stream.ofNullable(value)`                                   |
|                | `iterate(T seed, Predicate<? super T>, UnaryOperator<T>)` | 生成有限范围的迭代流                 | `Stream.iterate(1, n -> n <= 10, n -> n + 1)`                |
| **Java 10**    | `Collectors.toUnmodifiableList/Set/Map`                   | 收集为不可变集合                     | `stream.collect(Collectors.toUnmodifiableList())`            |
| **Java 11**    | `ofNullable` 增强                                         | 优化处理多个 null 值的场景           | `Stream.ofNullable(null)`                                    |
| **Java 12**    | `Collectors.teeing(Collector, Collector, BiFunction)`     | 对流进行双操作并合并结果             | `stream.collect(Collectors.teeing(sum, count, (s, c) -> s/c))` |
| **Java 16**    | `Stream.toList()`                                         | 直接收集为不可变列表                 | `stream.toList()`                                            |
|                | `mapMulti(BiConsumer)`                                    | 一对多映射，将一个元素映射为多个元素 | `stream.mapMulti((s, c) -> { c.accept(s); c.accept(s.toUpperCase()); })` |
| **Java 21**    | 间接增强：`SequencedCollection`                           | 增强了集合的顺序性，影响 Stream 使用 | `list.reversed().stream()`                                   |
| **Java 22**    | `mapMulti` 性能优化                                       | 提高了 mapMulti 方法的性能           | 同上，但性能更好                                             |
| **Java 23-24** | 并行流处理优化                                            | 提高并行流的处理性能                 | `stream.parallel().map(...)`                                 |

---

## 总结

从 Java 9 到 Java 24，Stream API 经历了多次增强，主要集中在以下几个方面：

1. **流的生成**：通过 `ofNullable`、增强版 `iterate` 等方法，使流的创建更加灵活
2. **流的处理**：通过 `takeWhile`、`dropWhile`、`mapMulti` 等方法，提供更精细的流控制
3. **流的收集**：通过 `toList`、`toUnmodifiableList` 等方法，简化收集操作
4. **双操作聚合**：通过 `teeing` 方法，支持同时进行两种操作并合并结果
5. **性能优化**：特别是在并行流处理方面的持续改进

这些改进使得 Stream API 更加强大、灵活和高效，能够更好地支持函数式编程风格的数据处理。