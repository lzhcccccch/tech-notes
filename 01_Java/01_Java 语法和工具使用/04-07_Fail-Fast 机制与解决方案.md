# Fail-Fast 机制与解决方案

[toc]

## 什么是 Fail-Fast

在 Java 中，`List` 集合的 Fail-Fast 机制是指在集合被结构性修改（如添加、删除元素）时，如果有迭代器正在遍历这个集合，则迭代器会快速失败（抛出 `ConcurrentModificationException`）。这种机制主要用于检测并发修改错误，从而避免在多线程环境中出现不可预知的行为。

---

## Fail-Fast 机制的工作原理

1. **结构性修改**：指的是改变集合的大小或扰乱集合的结构，例如 `add()`、`remove()` 操作。
2. **modCount**：大多数的集合类（如 `ArrayList`、`HashSet`）都有一个 `modCount` 变量，用于记录集合结构性修改的次数。当集合被修改时，`modCount` 就会增加。
3. **迭代器(Iterator)的检查**：当你通过迭代器遍历集合时，迭代器会保存一个 `expectedModCount`，这个值在迭代器创建时被初始化为集合的 `modCount`。在每次调用 `Iterator.next()`、`remove()` 等方法时，迭代器会检查 `expectedModCount` 是否等于集合的 `modCount`。如果不相等，就会抛出 `ConcurrentModificationException`。

---

## 如何触发 Fail-Fast 机制

- **结构性修改：** 添加、删除或清空集合的操作会改变集合的结构。
- **迭代期间：** 在使用 `Iterator` 或增强型 `for` 循环遍历集合时发生。

| **场景**                                              | **是否触发 Fail-Fast**                       |
| ----------------------------------------------------- | -------------------------------------------- |
| 通过 `Iterator` 遍历，并通过 `List` 修改              | ✅ 是，抛出 `ConcurrentModificationException` |
| 通过 `Iterator` 遍历，并通过 `Iterator.remove()` 修改 | ❌ 否，推荐的操作方式                         |
| 单线程直接修改 `List`                                 | ❌ 否，正常操作                               |
| 多线程修改 `List`                                     | ✅ 是，抛出 `ConcurrentModificationException` |

---

## 代码示例

### 错误代码

~~~java
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

public class FailFastExample {
    public static void main(String[] args) {
        new ArrayList<>(Arrays.asList("A", "B", "C"));

        Iterator<String> iterator = list.iterator();
        while (iterator.hasNext()) {
            String element = iterator.next();
            if ("A".equals(element)) {
                list.remove(element);  // 直接对集合修改，触发 Fail-Fast 机制
            }
        }
    }
}
~~~

**输出**

~~~bash
Exception in thread "main" java.util.ConcurrentModificationException
~~~

**分析**

在 `list.remove(element)` 时，`modCount` 增加了 1。但是 `Iterator` 仍然持有原始的 `expectedModCount`，所以 `modCount != expectedModCount`，触发 `ConcurrentModificationException`。

### 正确用法：使用 Iterator

```java
List<String> list = new ArrayList<>(Arrays.asList("A", "B", "C"));
Iterator<String> iterator = list.iterator();
while (iterator.hasNext()) {
    if ("B".equals(iterator.next())) {
        iterator.remove(); // 使用 Iterator 的 remove 方法
    }
}
System.out.println(list); // 输出 [A, C]
```

---

## 解决方案

### 方法 1：使用 `Iterator` 的 `remove()` 方法

- 如果需要在迭代过程中删除元素，应该使用迭代器提供的 `remove()` 方法，而不是直接调用集合的 `remove()` 方法。
- 直接调用集合的 `remove()` 方法会导致 `ConcurrentModificationException`，而 `Iterator` 的 `remove()` 方法会更新 `expectedModCount`，从而避免异常。
- 这是因为 `Iterator.remove()` 会同步更新 `modCount` 和 `xpectedModCount`。

**示例**：

```java
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

public class FailFastSolution1 {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>(Arrays.asList("A", "B", "C"));

        Iterator<String> iterator = list.iterator();
        while (iterator.hasNext()) {
            String element = iterator.next();
            if ("B".equals(element)) {
                iterator.remove(); // 使用迭代器的 remove 方法
            }
        }

        System.out.println(list); // 输出：[A, C]
    }
}
```

**注意**：

- `iterator.remove()` 只能在调用 `iterator.next()` 之后调用一次，否则会抛出 `IllegalStateException`。

### 方法 2：使用 `CopyOnWriteArrayList`

- 使用 `CopyOnWriteArrayList` 替代 `ArrayList`。`CopyOnWriteArrayList` 是线程安全的集合类，它在每次修改时都会创建一个新的底层数组（拷贝原始数据），所以它的迭代器不会抛出 `ConcurrentModificationException`。
- 在迭代过程中，`CopyOnWriteArrayList` 会为每次结构性修改创建一个新的副本，因此不会影响当前的迭代。
- 适用于读多写少的场景，因为每次写入都会创建一个新的底层数据，开销较大。

**示例**：

```java
import java.util.Iterator;
import java.util.concurrent.CopyOnWriteArrayList;

public class FailFastSolution2 {
    public static void main(String[] args) {
        CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();
        list.add("A");
        list.add("B");
        list.add("C");

        Iterator<String> iterator = list.iterator();
        while (iterator.hasNext()) {
            System.out.println(iterator.next());
            list.add("D"); // 不会抛出异常
        }

        System.out.println(list); // 输出：[A, B, C, D, D, D]
    }
}
```

**注意**：

- `CopyOnWriteArrayList` 的性能较低，尤其是在元素较多时，因为每次修改都会创建一个新的副本，内存开销大。
- 遍历时不会看到并发修改，因为遍历的副本与原始数据是分离的。

### 方法 3：使用 `Collections.synchronizedList`

- 使用 `Collections.synchronizedList` 将普通的 `List` 转换为线程安全的集合，素有方法都被同步控制。
- 在迭代时需要手动同步，确保线程安全。

**示例**：

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;

public class FailFastSolution3 {
    public static void main(String[] args) {
        List<String> list = Collections.synchronizedList(new ArrayList<>());
        list.add("A");
        list.add("B");
        list.add("C");

        synchronized (list) { // 手动同步
            Iterator<String> iterator = list.iterator();
            while (iterator.hasNext()) {
                System.out.println(iterator.next());
                list.add("D"); // 会抛出异常
            }
        }
    }
}
```

**注意**：

- 虽然 `Collections.synchronizedList` 提供了线程安全的集合，但迭代时仍然会触发 Fail-Fast。
- 手动同步可以保证线程安全，但不能避免 `ConcurrentModificationException`。
- 这是比 `synchronized` 更好的做法，适用于多线程环境。

### 方法 4：使用 synchronized 关键字

- 使用同步块或同步方法，在遍历和修改集合时进行同步控制。

**示例**

~~~java
import java.util.ArrayList;
import java.util.List;

public class SynchronizedBlockExample {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        list.add("A");
        list.add("B");
        list.add("C");

        synchronized (list) {
            for (String element : list) {
                if ("B".equals(element)) {
                    list.remove(element); // 不会抛出异常，但不推荐
                }
            }
        }

        System.out.println(list); // 输出：[A, C]
    }
}
~~~

**注意：**

- 这种方式不推荐，因为同步块会阻塞所有访问，降低了性能。

- 如果是多线程环境，推荐使用线程安全的集合，如 CopyOnWriteArrayList 或 Collections.synchronizedList()。

### 方法 5：使用 `Stream` 的操作

- Java 8 引入了 `Stream`，可以使用 `filter` 等操作来避免直接修改集合。

**示例**：

```java
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class FailFastSolution4 {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>(Arrays.asList("A", "B", "C"));

        // 使用 Stream 过滤元素
        List<String> filteredList = list.stream()
                                        .filter(e -> !"B".equals(e))
                                        .collect(Collectors.toList());

        System.out.println(filteredList); // 输出：[A, C]
    }
}
```

**优点**：

- 避免直接修改集合。
- 代码简洁且易读。

---

## 方案对比

| **方案**                           | **线程安全** | **内存开销** | **性能**   | **适用场景**       |
| ---------------------------------- | ------------ | ------------ | ---------- | ------------------ |
| **Iterator.remove()**              | ❌ 否         | 低           | 快速       | 单线程，安全删除   |
| **CopyOnWriteArrayList**           | ✅ 是         | 高           | 低         | 读多写少，线程安全 |
| **synchronized**                   | ✅ 是         | 低           | 低（阻塞） | 共享资源，低性能   |
| **Collections.synchronizedList()** | ✅ 是         | 低           | 中等       | 线程安全，推荐方式 |

---

## 总结

- **Fail-Fast 是一种保护机制，用于防止在迭代过程中集合被意外修改。**
- **推荐使用 `Iterator` 的 `remove` 方法或 `Stream` 操作来避免异常。**
- **对于并发场景，可以使用 `CopyOnWriteArrayList` 或其他线程安全的集合。**

通过选择合适的方案，可以有效避免 Fail-Fast 机制带来的问题，确保在多线程环境中安全地操作集合。