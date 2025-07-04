# Explain 命令

[toc]

## 简介

`EXPLAIN` 命令是 MySQL 中用于分析和优化查询的重要工具。它提供了查询执行计划的详细信息，包括查询将如何被执行、使用哪些索引、扫描哪些表等。

---

## 基本用法

可以通过在 `SELECT` 查询之前加上 `EXPLAIN` 关键字来获取查询的执行计划。

基本语法：

~~~sql
EXPLAIN [EXTENDED|PARTITIONS] SELECT select_options
~~~

参数解释：

- EXTENDED：显示更多的查询优化信息。
- PARTITIONS：显示查询涉及的分区信息。

例如：

```sql
EXPLAIN SELECT * FROM my_table WHERE id = 1;
```

---

## 输出字段

~~~sql
explain select * from test1 t1 where t1.id = (select id from  test1 t2 where  t2.id=2);
~~~

![image-20240730183543659](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240730183543659.png)

`EXPLAIN` 的输出由多列组成，每列提供有关查询执行的信息：

### id

查询中每个子查询的标识符。数字越大，执行优先级越高，表示从属关系。Id 相同时，根据返回结果从上往下执行；Id 不同时，根据 Id 越大，越先执行。在SELECT类型为： UNION RESULT 的时候，id列是可以允许为空的。

### select_type

查询的类型，主要有以下几种：

- `SIMPLE`: 简单的 SELECT 查询，不包含子查询或 UNION。
- `PRIMARY`: 复杂查询中的最外层查询。
- `UNION`: `UNION` 中的第二个或后续的 SELECT 语句。
- `DEPENDENT UNION`: `UNION` 中的第二个或后续的 SELECT 语句，依赖于外层查询。
- `UNION RESULT`: `UNION` 查询的结果。
- `SUBQUERY`: 子查询中的第一个 SELECT。
- `DEPENDENT SUBQUERY`: 子查询，依赖于外层查询。
- `DERIVED`: 派生表（子查询的结果表）。
- `MATERIALIZED`：物化子查询。
- `UNCACHEABLE SUBQUERY`：子查询，其结果无法缓存
- `UNCACHEABLE UNION`：UNION后的第二个或更后面的SELECT，其结果无法缓存。

### table

输出行所引用的表的名称，比如上面的 t1、t2。但也可以是以下值之一：

- `<unionM,N>`：具有和id值的行的M并集N。
- `<derivedN>`：用于与该行的派生表结果id的值N。派生表可能来自（例如）FROM子句中的子查询 。
- `<subqueryN>`：子查询的结果，其id值为N

### partitions

被访问的分区。

### type

连接类型，显示访问表的方式。其性能从好到差大致如下：

- `system`: 表只有一行（等同于 `const`）。
- `const`: 通过索引一次查找到一行。和 `eq_ref` 非常类似， `eq_ref` 通常在联表时出现，`const` 通常是单表。
- `eq_ref`: 对索引的唯一性扫描，最多返回一条匹配行。当在连接操作中使用了唯一索引或者主键索引，并且连接条件是基于这些索引的等值条件时，MySQL 通常会选择该链接类型以提高查询性能。
- `ref`: 非唯一性索引扫描，返回匹配行。
- `ref_or_null`：类似于ref，还会扫描 null 的数据。
- `index_merge`：多种索引合并的方式扫描。
- `unique_subquery`：类似于 `eq_ref`，条件用于 `in` 子查询。
- `index_subquery`：类似于 `unique_subquery`，条件用于 `in` 子查询，但条件非主键或唯一索引。
- `range`: 索引范围扫描。只检索给定范围的行，使用一个索引来选择行。
- `index`: 全索引扫描，速度比全表扫描快。
- `ALL`: 全表扫描。

### possible_keys

查询中可能使用的索引，如果此列是 NULL，则没有相关的索引。在这种情况下，可以通过检查该 WHERE 子句以检查它是否引用了某些适合索引的列，从而提高查询性能。

### key

实际使用的索引。有时使用组合索引时，会导致该列有值（组合索引），但是 possible_keys 列是空。

### key_len

实际使用索引的长度（字节数），该列的值可以反应出索引是否被充分使用。

### ref

该列表示索引命中的列或者常量。

### rows

MySQL 估计为了找到所需的行，必须读取的行数。

### filtered

表中有多少数据会被查询条件过滤的百分比。

### Extra

其他重要信息，如是否使用了临时表或文件排序。常见值包括：

- `Using index`: 表示查询只使用了索引（索引覆盖），查询的字段全部在索引中。
- `Using index condition`: 表示查询在索引上执行了部分条件过滤，通常和索引下推有关。
- `Using where`: 使用 WHERE 子句过滤结果，未使用索引。
- `Using where; Using index`: 表示查询的列被索引覆盖，并且 WHERE 筛选条件时索引列之一，但不是索引列的前导列（不符合最左匹配原则），或者 WHERE 筛选条件的索引列的前导列是范围查询。
- `Using temporary`: MySQL 在查询过程中使用了临时表，通常在排序和分组时发生。
- `Using filesort`: MySQL 必须对数据进行文件排序才能满足查询的 ORDER BY 子句，通常发生在无法使用索引进行排序时。
- `Using join buffer`：表示是否使用连接缓冲。来自较早联接的表被部分读取到联接缓冲区中，然后从缓冲区中使用它们的行来与当前表执行联接。
- `Impossible WHERE`：表示WHERE后面的条件一直都是 false。
- `Using index for group-by`：表示 MySQL 在分组操作中使用了索引。这通常是在分组操作涉及到索引中的所有列时发生的。
- `Using filesort for group-by`：表示 MySQL 在分组操作中使用了文件排序。这通常发生在无法使用索引进行分组操作时。
- `Range checked for each record`：表示 MySQL 在使用索引范围查找时，需要检查每一条记录。
- `Using index for order by`：表示 MySQL 在排序操作中使用了索引，这通常发生在排序涉及到索引中的所有列时。
- `Using filesort for order by`：表示 MySQL 在排序操作中使用了文件排序，这通常发生在无法使用索引进行排序时。
- `Using index for group-by; Using index for order by`：表示 MySQL 在分组和排序操作中都使用了索引。

---

## select_type 列

上面列举了 8 种 **select_type**，其中常用的一般为这 6 种：SIMPLE、PRIMARY、SUBQUERY、DERIVED、UNION、UNION RESULT。

下面看看这些 **select_type** 出现的示例：

### SIMPLE

执行如下 SQL：

~~~sql
explain select * from test1;
~~~

结果：

![image-20240730182341164](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240730182341164.png)

只在简单SELECT查询中出现，不包含子查询和UNION。

### PRIMARY 和 SUBQUERY

执行 SQL 如下：

```sql
explain select * from test1 t1 where t1.id = (select id from  test1 t2 where  t2.id=2);
```

结果：

![image-20240730182450922](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240730182450922.png)

这条嵌套查询的 sql 中，最外层的 t1 表是 PRIMARY 类型，而最里面的子查询 t2 表是 SUBQUERY 类型。

### DERIVED

执行 sql 如下：

```sql
explain
select t1.* from test1 t1
inner join (select max(id) mid from test1 group by id) t2
on t1.id=t2.mid
```

结果：

![image-20240730182634881](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240730182634881.png)

最后一条记录就是衍生表，它一般是FROM列表中包含的子查询，这里是 sql 中的分组子查询。

### UNION 和 UNION RESULT

执行 sql 如下：

```sql
explain
select * from test1
union
select* from test2
```

结果：

![image-20240730182933393](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240730182933393.png)

 test2 表是 UNION 关键字之后的查询，所以被标记为 UNION，test1 是最主要的表，被标记为 PRIMARY。而 <union1,2> 表示 id=1 和 id=2 的表 union，其结果被标记为 UNION RESULT。

UNION 和 UNION RESULT 一般会成对出现。

PS：上图中在SELECT类型为： UNION RESULT 的时候，id 列是空的。

---

## type 列

上面列举了一些 type 的类型，执行结果从最好到最坏的的顺序是从上到下。

我们需要重点掌握的是下面几种类型，在演示之前，先说明一下test2表中只有一条数据，并且code字段上面建了一个普通索引，如下图：

![image-20240731095856542](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240731095856542.png)

![image-20240731095921208](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240731095921208.png)

### system

这种类型要求数据库表中只有一条数据，是 const 类型的一个特例，一般情况下是不会出现的。

### const

通过一次索引就能找到数据，一般用于主键或唯一索引作为条件的查询 sql 中，执行 sql 和结果如下：

~~~sql
explain select * from test2 where id=1;
~~~

![image-20240731100127080](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240731100127080.png)

### eq_ref

常用于主键或唯一索引扫描。执行 sql 和结果如下：

~~~sql
explain select * from test2 t1 inner join test2 t2 on t1.id=t2.id;
~~~

![image-20240731100326128](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240731100326128.png)

const 和 eq_ref 都是对主键或唯一索引的扫描，有什么区别？

 答：const 只索引一次，而 eq_ref 主键和主键匹配，由于表中有多条数据，一般情况下要索引多次，才能全部匹配上。

### ref

常用于非主键和唯一索引扫描。执行 sql 和结果如下：

```sql
explain select * from test2 where code = '001';
```

![image-20240731100451292](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240731100451292.png)

### range

常用于范围查询，比如：between ... and 或 In 等操作，执行 sql 如下：

```sql
explain select * from test2 where id between 1 and 2;
```

![image-20240731100525862](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240731100525862.png)

### index

全索引扫描，执行 sql 如下：

```sql
explain select code from test2;
```

![image-20240731100626430](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240731100626430.png)

### ALL

全表扫描，执行 sql 如下：

```sql
explain select *  from test2;
```

![image-20240731100713838](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20240731100713838-2391634.png)

---

## key_len 列

`key_len` 列表示查询过程中使用的索引键的长度（以字节为单位）。`key_len` 是一个重要的指标，它告诉你 MySQL 实际使用了多少字节的索引。这对于分析和优化查询非常有用，因为它有助于你了解查询使用的索引的效率。

### 计算规则

决定 key_len 值的三个因素：字符集、列类型长度、是否为空（允许为空要多 1 字节） 。

公式：字符集长度 * 列类型长度 + 是否允许为空（允许为 1，反之为 0）。

---

## 总结

使用 `Explain` 命令通常是用来查看 SQL 的执行效率，即查看 SQL 语句是否正确使用索引等。其中我们需要重点关注 `key`、`key_len`、`type` 和 `Extra` 这四列，查看是否使用了索引、是否充分使用索引、索引类型以及附加信息来进行 SQL 的优化。
