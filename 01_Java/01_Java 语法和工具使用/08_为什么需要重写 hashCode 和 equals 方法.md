# 为什么要重写 hashcode 和 equals 方法

[toc]

## 简介

在 Java 中，重写类的 `hashCode` 和 `equals` 方法是非常重要的，主要是确保对象在集合（如 HashMap**、**HashSet 和 Hashtable）中的正确行为和逻辑一致性。尤其是在需要将类的对象存储在集合中（如 `HashMap`、`HashSet` 或 `Hashtable`）或在需要比较对象时。

---

## `equals` 方法的作用

`equals` 方法用于比较两个对象是否“逻辑上相等”。默认情况下，`Object` 类的 `equals` 方法是基于对象的引用比较的（即 `==`）。如果不重写 `equals` 方法，两个对象即使具有相同的属性值，也会被认为是不同的，除非它们是同一个对象实例。

**为什么需要重写 `equals` 方法？**

- **逻辑相等的定义**：在许多场景中，我们需要比较对象的内容（即逻辑相等性），而不是比较它们的引用。例如，对于一个 `Person` 类来说，我们可能希望两个拥有相同 ID 的对象被认为是相等的。
- **集合操作的正确性**：在集合（如 `HashSet` 或 `HashMap`）中，如果两个对象被认为是逻辑上相等的，它们在集合中应该被视为同一个对象。如果不重写 `equals` 方法，集合可能会错误地认为它们是不同的对象，从而导致不正确的行为。

---

## `hashCode` 方法的作用

`hashCode` 方法返回一个整数值，用于表示对象的哈希值。它通常用于哈希表（如 `HashMap` 和 `HashSet`）中，以确定对象存储的位置（桶的位置）。`hashCode` 方法的默认实现也是基于对象的内存地址。

**为什么需要重写 `hashCode` 方法？**

- **与 `equals` 方法的契约**：Java 中规定，如果两个对象根据 `equals` 方法被认为是相等的，那么它们的 `hashCode` 值必须相等。否则，在使用哈希表时会导致不一致的行为。
- **提高集合性能**：哈希表依赖于 `hashCode` 方法来快速定位对象。如果 `hashCode` 方法没有正确实现，可能会导致哈希表中的所有对象集中在一个桶中，从而降低性能。

---

##  为什么需要重写 hashCode() 和 equals() 方法

### 保证对象在哈希集合中的正常工作

- 哈希集合的核心原理：
  哈希集合（如 HashMap、HashSet）使用哈希表存储数据，通过 hashCode() 计算哈希值以确定对象在集合中的存储位置。
- 数据定位过程：
  1. 通过 hashCode() 计算对象的哈希值，定位到某个“桶”（bucket）。
  2. 在桶中，调用 equals() 方法检查对象是否“相等”，以确保是否需要替换、更新或删除数据。

如果不重写 hashCode() 和 equals()，默认实现继承自 Object，其 hashCode() 基于对象的内存地址，而 equals() 只会比较引用地址。这将导致逻辑上相等的对象（内容相同）无法被识别为相等，从而导致数据重复或检索失败。

### 保证逻辑相等的对象被视为“相等”

在实际开发中，逻辑上“相等”的对象（如两个具有相同 ID、名称的对象）应该被视作“相等”对象，而不依赖于内存地址。

例如：

~~~java
class Person {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

Person p1 = new Person("Alice", 25);
Person p2 = new Person("Alice", 25);

System.out.println(p1.equals(p2)); // false（因为没有重写 equals 方法）
~~~

虽然 p1 和 p2 的 name 和 age 是相同的，但 equals() 使用的是 Object 中的实现，默认比较对象的内存地址，因此 p1 和 p2 不被视作相等。

### 如果不重写会发生什么

- **逻辑错误**：如果没有重写 `equals` 方法，默认的引用比较会导致逻辑错误。例如，两个对象的内容相同，但它们的引用不同，因此会被认为不相等。
- **集合行为异常**：如果没有重写 `hashCode` 方法，即使两个对象根据 `equals`  方法相等，它们可能会被存储到集合的不同位置，从而导致集合行为异常。例如：
  - 在 `HashSet` 中，可能会存储重复的对象。
  - 在 `HashMap` 中，可能会出现无法正确覆盖键值对的情况。

---

## 如何重写 hashCode() 和 equals() 方法

### 重写 equals()

**原则**

- 自反性：x.equals(x) 必须返回 true。

- 对称性：x.equals(y) 为 true，则 y.equals(x) 也必须为 true。

- 传递性：x.equals(y) 为 true，且 y.equals(z) 为 true，则 x.equals(z) 也必须为 true。

- 一致性：在对象未被修改的前提下，多次调用 equals() 的结果应始终一致。

- 与 null 的关系：x.equals(null) 必须返回 false。

**示例**

~~~java
@Override
public boolean equals(Object obj) {
    if (this == obj) return true; // 1. 自反性
    if (obj == null || getClass() != obj.getClass()) return false; // 2. 检查类型
    Person person = (Person) obj;
    return age == person.age && Objects.equals(name, person.name); // 3. 比较字段
}
~~~

**说明：**

1. 先检查内存地址是否相同（this == obj），如果是，返回 true。

2. 检查 obj 是否为 null，以及类类型是否相同（getClass()）。

3. 将 obj 转换为目标类 Person，比较类的字段，通常使用 Objects.equals() 来避免空指针异常。

### 重写 hashCode()

**原则**

- 如果两个对象根据 equals() 方法相等，则它们的 hashCode() 必须相等。

- 如果两个对象的 hashCode() 不同，则这两个对象不需要是相等的（但它们很可能不相等）。

**示例：**

~~~java
@Override
public int hashCode() {
    return Objects.hash(name, age);
}
~~~

**说明**

- Objects.hash(name, age) 是一种常见的实现方式，JDK 会生成一个基于字段的哈希值，确保逻辑相等的对象的哈希值相等。

也可以手动实现：

~~~java
@Override
public int hashCode() {
    int result = 17; // 初始值，通常为一个质数
    result = 31 * result + (name == null ? 0 : name.hashCode());
    result = 31 * result + age;
    return result;
}
~~~

---

## 何时需要重写 hashCode() 和 equals()

| **场景**         | **是否需要重写 `equals()` 和 `hashCode()`** | **原因**                                   |
| ---------------- | ------------------------------------------- | ------------------------------------------ |
| 使用 `HashSet`   | 是                                          | 保证存储不重复的对象，哈希值和相等逻辑一致 |
| 使用 `HashMap`   | 是                                          | 作为 key 存入 `HashMap`，必须重写          |
| 使用 `ArrayList` | 仅需重写 `equals()`                         | 依赖 `equals()` 进行查找和删除             |
| 使用 `TreeSet`   | 需要实现 `Comparable`，不依赖 `hashCode()`  | 基于 `compareTo` 而不是 `hashCode()`       |
| 使用 `TreeMap`   | 需要实现 `Comparable`，不依赖 `hashCode()`  | 通过排序（`compareTo`）存储 key            |

---

##  可能的面试问题

1. 为什么要重写 hashCode()**？**

- 确保在哈希集合（HashSet、HashMap）中可以正确存储和查找对象。

2. 重写 equals() 和 hashCode() 的基本原则是什么？

- **equals()**: 自反性、对称性、传递性、一致性、与 null 的关系。

- **hashCode()**: 如果 equals() 返回 true，则 hashCode() 必须相等。

3. 只重写 equals() 不重写 hashCode() 会怎样？

- 在 HashMap 和 HashSet 中，两个对象即使 equals() 为 true，但它们的哈希值不同，它们可能会被存储在不同的哈希桶中，导致无法正确检索。

4. 什么是“哈希冲突”，如何解决？

- 当两个对象的 hashCode() 相同但 equals() 不同，就会发生哈希冲突。哈希表会将冲突的对象存储在桶的链表中，通过链表遍历来解决冲突。

---

## 总结

- 如果你重写 equals()，那么你也应该重写 hashCode()，以确保在哈希集合（如 HashMap、HashSet）中的逻辑一致性。

- 使用 Objects.equals() 和 Objects.hash() 可以简化代码，减少出错的风险。

- 遵循“自反性、对称性、传递性”的原则。

重写 `hashCode` 和 `equals` 方法的核心目的是为了确保对象的逻辑相等性和集合操作的正确性。正确实现这两个方法可以避免程序中的潜在错误，尤其是在使用哈希表相关的数据结构时。