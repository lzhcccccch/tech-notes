# `ArrayList`的扩容机制

[toc]

## ArrayList 基本原理

### 底层数据结构

ArrayList 底层使用数组实现，核心字段包括：

```java
public class ArrayList<E> {
    // 实际存储元素的数组
    transient Object[] elementData;
    
    // 实际元素个数
    private int size;
    
    // 默认初始容量
    private static final int DEFAULT_CAPACITY = 10;
    
    // 空数组常量
    private static final Object[] EMPTY_ELEMENTDATA = {};
}
```

### 初始化方式

```java
// 方式1：使用默认构造函数
ArrayList<String> list1 = new ArrayList<>();  // 初始容量为 0，首次添加扩容为 10

// 方式2：指定初始容量
ArrayList<String> list2 = new ArrayList<>(20);  // 初始容量为 20

// 方式3：基于已有集合
ArrayList<String> list3 = new ArrayList<>(existingCollection);  // 初始容量等于集合大小
```

---



## 扩容原理

`ArrayList`底层是基于数组实现的，当元素数量超过当前容量时，会触发扩容操作：

- 初始容量为10。
- 每次扩容为当前容量的1.5倍。
- 使用`Arrays.copyOf`将旧数组复制到新数组。

**扩容过程示意图**

```tex
初始容量 -> 检查是否需要扩容 -> 执行扩容 -> 复制数据到新数组
```

**扩容算法**

~~~java
private void grow(int minCapacity) {
    int oldCapacity = elementData.length;
    // 新容量 = 旧容量 + 旧容量 >> 1（相当于旧容量的1.5倍）
    int newCapacity = oldCapacity + (oldCapacity >> 1);
    
    // 如果新容量还是小于所需最小容量
    if (newCapacity - minCapacity < 0)
        newCapacity = minCapacity;
        
    // 如果新容量超过最大数组大小
    if (newCapacity - MAX_ARRAY_SIZE > 0)
        newCapacity = hugeCapacity(minCapacity);
        
    // 创建新数组并复制数据
    elementData = Arrays.copyOf(elementData, newCapacity);
}
~~~

---



## 示例代码

**正常扩容：**

```java
List<Integer> list = new ArrayList<>();
for (int i = 0; i < 15; i++) {
    list.add(i);
}
System.out.println(list.size()); // 输出 15
```

**指定初始容量：**

```java
List<Integer> list = new ArrayList<>(100);
```

---



## 性能分析

### 时间复杂度分析

| 操作     | 最好情况 | 最坏情况 | 平均情况 |
| -------- | -------- | -------- | -------- |
| 添加元素 | O(1)     | O(n)     | O(1)     |
| 删除元素 | O(1)     | O(n)     | O(n)     |
| 查找元素 | O(1)     | O(n)     | O(n)     |
| 扩容操作 | O(n)     | O(n)     | O(n)     |

### 内存开销分析

~~~java
// 示例：添加10000个元素的内存变化
ArrayList<Integer> list = new ArrayList<>();
for (int i = 0; i < 10000; i++) {
    list.add(i);
    // 扩容次数：log(10000/10)/log(1.5) ≈ 14次
}
~~~

---



## 性能优化策略

### 初始容量优化

```java
// 不优化：频繁扩容
ArrayList<String> list1 = new ArrayList<>();
for (int i = 0; i < 10000; i++) {
    list1.add("Item " + i);
}

// 优化：预设容量
ArrayList<String> list2 = new ArrayList<>(10000);
for (int i = 0; i < 10000; i++) {
    list2.add("Item " + i);
}
```

### 批量操作优化

```java
// 不优化：逐个添加
ArrayList<String> list1 = new ArrayList<>();
for (String item : sourceArray) {
    list1.add(item);  // 可能多次扩容
}

// 优化：使用 addAll
ArrayList<String> list2 = new ArrayList<>(sourceArray.length);
list2.addAll(Arrays.asList(sourceArray));  // 一次性扩容

// 优化：使用 ensureCapacity
ArrayList<Integer> list = new ArrayList<>();
list.ensureCapacity(1000);  // 预分配空间
```

### 删除操作优化

```java
// 不优化：正向遍历删除
for (int i = 0; i < list.size(); i++) {
    if (shouldRemove(list.get(i))) {
        list.remove(i);  // 元素移动次数多
        i--;  // 需要调整索引
    }
}

// 优化：反向遍历删除
for (int i = list.size() - 1; i >= 0; i--) {
    if (shouldRemove(list.get(i))) {
        list.remove(i);  // 元素移动次数少
    }
}

// 更优：使用 removeIf（Java 8+）
list.removeIf(item -> shouldRemove(item));
```

### 大量数据处理

```java
// 处理大量数据时的优化策略
public void processBulkData(List<String> source) {
    // 1. 预估容量
    ArrayList<String> result = new ArrayList<>(source.size());
    
    // 2. 批量添加
    result.addAll(source);
    
    // 3. 使用 ensureCapacity 预分配空间
    result.ensureCapacity(source.size() + 1000);  // 如果确定后续还需要添加元素
}
```

### 频繁删除场景

```java
// 优化频繁删除操作
public void optimizedRemoval(ArrayList<Integer> list) {
    // 使用 LinkedList 替代
    LinkedList<Integer> linkedList = new LinkedList<>(list);
    Iterator<Integer> iterator = linkedList.iterator();
    while (iterator.hasNext()) {
        if (shouldRemove(iterator.next())) {
            iterator.remove();  // O(1) 时间复杂度
        }
    }
}
```

### 内存泄漏防范

~~~java
// 清理不用的元素
list.clear();  // 仅清除引用
list.trimToSize();  // 释放多余空间
~~~

---



## 总结

- 尽量在已知数据量的情况下预先设置容量，避免频繁扩容带来的性能开销。
- 对于大规模插入操作，使用批量操作（如 `addAll`）以提高效率。