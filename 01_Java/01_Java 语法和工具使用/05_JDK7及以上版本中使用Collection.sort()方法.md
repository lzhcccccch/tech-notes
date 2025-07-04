## JDK7及以上版本中使用Collection.sort()方法

[TOC]

#### 简介
在 Java 开发中，`Collections.sort()` 和 `Arrays.sort()` 方法是对集合和数组进行排序的常用工具。然而，从 JDK7 开始，这些方法对 `Comparator` 的实现提出了更严格的要求，必须满足自反性、传递性和对称性，否则会抛出 `IllegalArgumentException` 异常。

---

#### 问题描述与原因分析
- **问题描述**：
  - 在使用 `Collections.sort()` 方法时，可能会抛出以下异常：
    ```bash
    java.lang.IllegalArgumentException: Comparison method violates its general contract!
    ```
  - 导致该问题的示例代码：
    ```java
    Collections.sort(listRes, new Comparator<ClickNumberInfoRes>() {
        @Override
        public int compare(ClickNumberInfoRes o1, ClickNumberInfoRes o2) {
            if (o1.getClickNumber() > o2.getClickNumber()) {
                return -1;
            } else if (o1.getClickNumber() < o2.getClickNumber()) {
                return 1;
            }
            return 0; // o1.getClickNumber() == o2.getClickNumber()
        }
    });
    ```

- **原因分析**：
  - 从 JDK7 开始，`Comparator` 的实现必须满足以下三个原则：
    1. **自反性**：对于任意的 x 和 y，`compare(x, y)` 与 `compare(y, x)` 的返回值必须相反。
    2. **传递性**：如果 `compare(x, y) > 0` 且 `compare(y, z) > 0`，则 `compare(x, z) > 0`。
    3. **对称性**：如果 `compare(x, y) == 0`，则 `compare(x, z)` 和 `compare(y, z)` 的结果必须相同。
  - 示例代码中，当 `o1` 和 `o2` 为 `null` 时，没有提供明确的处理逻辑，导致违反了上述原则。

---

#### 正确的实现方式
- **解决方案**：
  - 为避免违反 `Comparator` 的通用约定，应在比较逻辑中加入对 `null` 值的处理。
  - 修正后的代码如下：
    ```java
    Collections.sort(listRes, new Comparator<ClickNumberInfoRes>() {
        @Override
        public int compare(ClickNumberInfoRes o1, ClickNumberInfoRes o2) {
            if (o1 == null && o2 == null) {
                return 0;
            }
            if (o1 == null) {
                return 1;
            }
            if (o2 == null) {
                return -1;
            }
            // 该方式为降序，若需升序只需调换 -1 与 1
            if (o1.getClickNumber() > o2.getClickNumber()) {
                return -1;
            } else if (o1.getClickNumber() < o2.getClickNumber()) {
                return 1;
            }
            return 0; // o1.getClickNumber() == o2.getClickNumber()
        }
    });
    ```

- **关键点说明**：
  - 对 `null` 值的处理：
    - 如果两个对象均为 `null`，返回 `0` 表示相等。
    - 如果一个对象为 `null`，另一个不为 `null`，将 `null` 视为较小值。
  - 比较逻辑的顺序：
    - 首先处理 `null` 值情况，确保代码的健壮性。
    - 然后根据实际需求实现升序或降序排序。

---

#### 注意事项

- **遵循 Comparator 的通用约定**：
  - 在实现 `Comparator` 时，确保满足自反性、传递性和对称性。
  - 在处理可能包含 `null` 值的集合时，优先添加 `null` 值的判断逻辑。

- **使用 Java 8 的 Lambda 表达式简化代码**：
  - 如果使用 Java 8 及以上版本，可以通过 `Comparator.comparing` 方法结合 `nullsFirst` 或 `nullsLast` 进一步简化代码。例如：
    ```java
    listRes.sort(Comparator.nullsFirst(
        Comparator.comparing(ClickNumberInfoRes::getClickNumber).reversed()
    ));
    ```

- **避免硬编码**：
  - 在比较逻辑中，尽量避免直接硬编码返回值，如 `-1` 和 `1`，而是使用工具方法或常量来增强代码的可读性和维护性。

---

## 结论

- 在 JDK7 及以上版本中，`Collections.sort()` 和 `Arrays.sort()` 方法对 `Comparator` 的实现提出了更高的要求，开发者需要确保比较逻辑满足自反性、传递性和对称性。
- 通过对 `null` 值的处理和优化比较逻辑，可以避免常见的 `IllegalArgumentException` 异常。
- 推荐在 Java 8 及以上版本中使用 Lambda 表达式和 `Comparator` 的工具方法，以提高代码的简洁性和可维护性。
