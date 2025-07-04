## ORDER BY 实现原理

[toc]

#### 简介

在 MySQL 中，`ORDER BY` 用于指定查询结果集的排序方式。当 MySQL 处理 `ORDER BY` 时，主要有两种方式：通过索引排序（即利用已有索引的有序性）和通过 `filesort` 来实现排序。如果查询的排序列已经被索引覆盖，那么 MySQL 可以直接从索引中得到排序结果，而不需要额外的排序操作；否则，MySQL 会使用 `filesort` 来完成排序工作。

---

#### MySQL 中的 `ORDER BY` 实现原理

##### 通过索引排序

当排序字段有索引时，MySQL 可以直接利用索引的顺序来返回有序结果，这种情况下，排序性能最佳。对于通过索引排序的情况，MySQL 使用的是 B+ 树索引的顺序特性，无需额外的排序步骤。

- **单列排序**：如果 `ORDER BY` 的列有索引，MySQL 可以直接利用索引来排序。
- **多列排序**：如果 `ORDER BY` 包含多个列，并且这些列的组合有复合索引，MySQL 可以根据索引来按多个列进行排序。

**示例：**

```sql
-- 假设表 mytable 的 id 列有索引
SELECT * FROM mytable ORDER BY id;
```

在此查询中，如果 `id` 列有索引，MySQL 可以直接利用索引完成排序操作，而不需要使用 `filesort`。

##### 通过 `filesort` 排序

当排序列上没有索引或索引无法被完全利用时，MySQL 使用 `filesort` 算法来进行排序。`filesort` 并不是按字面意义来理解为“文件排序”，它是 MySQL 的一种内部排序机制。当数据无法在内存中完成排序时，它会将部分数据写入磁盘，这可能会导致性能下降。

---

#### `filesort` 详细解析

`filesort` 是 MySQL 的排序算法，当无法通过索引完成排序时使用。MySQL 中的 `filesort` 主要有两种实现方式：**两次扫描算法**（Two Passes）和 **一次扫描算法**（Single Pass）。

##### 两次扫描算法（Two Passes）

该算法是 MySQL4.1之前采用的算法，顾名思义，它需要两次访问数据，尤其是第二次读取操作会导致大量的随机I/O操作。优点是内存开销较小。

**工作原理**：

- 在第一次扫描时，MySQL 将需要排序的字段（即 `ORDER BY` 字段）以及能够定位到原始行的行指针（ROW ID）从存储引擎中提取出来。
- 这些字段和行指针被放入内存中的排序缓冲区（`sort_buffer`）进行排序。
- 排序完成后，MySQL 根据排序好的行指针再次去磁盘中读取行数据（回表），从而返回最终的结果。

**优缺点**：

- **优点**：内存消耗较小，只需要为 `ORDER BY` 字段和行指针分配内存。
- **缺点**：第二次扫描需要根据行指针进行随机 I/O，从磁盘读取数据，导致性能下降，特别是当数据量较大时。

##### 一次扫描算法（Single Pass）

从 MySQL4.1版本开始使用该算法。它减少了I/O的次数，效率较高，但是内存开销也较大。如果我们将并不需要的 Columns 也取出来，就会极大地浪费排序过程所需要的内存。

**工作原理**：

- 在一次扫描时，MySQL 会将 `ORDER BY` 字段和查询的所有列一次性提取出来，并在内存中对这些数据进行排序。
- 一旦排序完成，结果可以直接返回，不需要再次去读取行数据。

**优缺点**：

- **优点**：减少了 I/O，因为不需要第二次扫描和读取数据。
- **缺点**：由于需要在内存中保存所有列数据，内存使用量会较大。

##### 影响排序算法的参数

MySQL 使用的排序算法取决于 `max_length_for_sort_data` 和 `sort_buffer_size` 这两个参数的设置。

- **`sort_buffer_size`**：该参数决定 MySQL 在内存中用于排序的缓冲区大小。当排序数据量超过此缓冲区大小时，MySQL 将数据写入磁盘进行排序。
- **`max_length_for_sort_data`**：该参数控制 MySQL 选择两次扫描算法还是一次扫描算法。当排序字段和所需列的数据量总和小于 `max_length_for_sort_data` 时，MySQL 会选择一次扫描算法，否则选择两次扫描算法。

**示例：**

```sql
-- 查看当前的 sort_buffer_size 和 max_length_for_sort_data 设置
SHOW VARIABLES LIKE 'sort_buffer_size';
SHOW VARIABLES LIKE 'max_length_for_sort_data';

-- 设置更大的 sort_buffer_size 和 max_length_for_sort_data
SET GLOBAL sort_buffer_size = 8M;
SET GLOBAL max_length_for_sort_data = 1024;
```

##### `filesort` 的工作流程

**内存排序**

当 MySQL 确定需要使用 `filesort` 进行排序时，首先会尝试在内存中完成排序操作。排序数据会被加载到内存的 `sort_buffer` 中。在内存中进行排序时，MySQL 使用的是快速排序（QuickSort）算法。

**磁盘排序**

如果排序的数据量超出 `sort_buffer_size` 限制，MySQL 将部分数据写入磁盘，使用外部排序（external sort）来完成排序。外部排序是将磁盘上的数据进行分块，再将各个分块的排序结果合并，以最终生成排序的结果（实际就是外排序，使用了临时表）。

---

#### `filesort` 相关的参数调优

为了优化 filesort 的性能，我们可以调整以下几个参数：

##### sort_buffer_size

- 控制 MySQL 用于排序操作的内存大小。
- 设置较大的 `sort_buffer_size` 值可以减少磁盘 I/O，但会增加内存使用量。
- 建议根据服务器内存资源进行调整，通常设置为几 MB 到几十 MB。

##### max_length_for_sort_data

- 控制 MySQL 在 filesort 中选择两种排序算法的阈值。
- 较小的值更倾向于选择两次扫描算法，较大的值更倾向于一次扫描算法。

##### read_rnd_buffer_size

- 控制 MySQL 读取排序结果的缓冲区大小。
- 较大的 `read_rnd_buffer_size` 可以减少磁盘随机读取的次数，提高性能。

##### tmp_table_size 和 max_heap_table_size

- 控制内存中临时表的最大大小。

- 如果排序结果需要存储到临时表中，增大这些参数的值可以减少磁盘 I/O。

---

#### 如何优化 `ORDER BY` 和 `filesort`

##### 使用索引排序

尽量使用索引覆盖来避免 `filesort`，特别是在 `ORDER BY` 列上创建合适的索引。对于复杂查询，可以考虑使用复合索引，以减少 `filesort` 的使用。

**示例：**

```sql
-- 创建复合索引以避免使用 filesort
CREATE INDEX idx_name_age ON mytable (name, age);

-- 使用该复合索引进行排序
SELECT * FROM mytable WHERE name = 'Alice' ORDER BY age;
```

##### 减少排序数据量

- 尽量避免在查询中返回不必要的列，因为一次扫描算法会将所有查询列的数据加载到内存中进行排序。如果只选择必要的列，可以减少内存的使用并加快排序速度。
- 使用 LIMIT 限制返回结果的数量，减少排序的数据量。
- 对于非常大的数据集，可以考虑将查询分成多个小批次进行处理，以减少排序的内存开销。

##### 适当调整内存参数

适当增加 `sort_buffer_size` 和 `max_length_for_sort_data` 的大小，可以减少磁盘 I/O，从而提高排序性能。但是，过大的内存分配可能会导致系统内存不足，尤其是在并发查询较多的情况下。

##### 分页查询中的排序

对于需要分页的查询，如果数据量大且涉及排序，`ORDER BY` 和 `LIMIT` 结合使用时，可能会导致效率低下。可以通过使用主键或索引列进行优化，避免全表扫描排序。

**示例：**

```sql
-- 大数据量的分页排序查询
SELECT * FROM mytable WHERE id > 100 ORDER BY id LIMIT 10;
```

---

#### `EXPLAIN` 中的 `Using filesort`

当 MySQL 使用 `filesort` 时，在 `EXPLAIN` 的输出中会显示“`Using filesort`”。此外，如果排序涉及多表连接，并且排序发生在连接后的结果集上，EXPLAIN 会显示“`Using temporary; Using filesort`”，表示 MySQL 在连接后先将结果写入临时表，再进行排序。

**示例：**

```sql
EXPLAIN SELECT * FROM mytable ORDER BY age;
```

**输出**：

```sql
+----+-------------+---------+-------+---------------+------+---------+------+----------+-----------------------------+
| id | select_type | table   | type  | possible_keys | key  | key_len | ref  | rows     | Extra                       |
+----+-------------+---------+-------+---------------+------+---------+------+----------+-----------------------------+
|  1 | SIMPLE      | mytable | index | NULL          | NULL | NULL    | NULL | 100000   | Using filesort              |
+----+-------------+---------+-------+---------------+------+---------+------+----------+-----------------------------+
```

---

#### 总结

MySQL 中 `ORDER BY` 的实现可以通过索引排序或 `filesort` 完成。索引排序是性能最佳的方式，而 `filesort` 则是在没有索引或索引无法利用时的替代方案。`filesort` 分为两种主要的算法：两次扫描算法和一次扫描算法。通过合理设计索引、优化查询列、调整内存参数，可以有效减少 `filesort` 的使用，进而提升查询性能。