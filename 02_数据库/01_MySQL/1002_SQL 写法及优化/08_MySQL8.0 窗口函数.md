# MySQL 窗口函数

[toc]

## 简介

窗口函数（Window Functions）是 MySQL 8.0 及以上版本中引入的一种功能强大的工具，允许在查询结果集中对数据进行分组、排序和窗口范围内的计算，而无需使用 `GROUP BY` 子句更改结果集。与聚合函数不同，窗口函数不会将行合并为单一结果，而是保留原始行并为每行计算一个值。

---

## 定义

窗口函数的语法如下：

~~~sql
<窗口函数>([参数]) OVER ([PARTITION BY <分组列>] [ORDER BY <排序列>] [<窗口范围>])
~~~

- **窗口函数**；如 `ROW_NUMBER()`、`RANK()`、`SUM()` 等。
- **OVER**：定义窗口函数的作用范围。
- **PARTITION BY**：指定分组依据，将数据划分为多个分区，每个分区独立计算窗口函数。
- **ORDER BY**：指定排序依据，定义窗口函数计算的顺序。**ORDER BY 会影响一些窗口函数的计算结果**。
- **窗口范围**：定义窗口的范围，如 `ROWS_BETWEEN` 或 `RANG_BETWEEN` 。

---

## 常见的窗口函数

### 排名类函数

| 函数           | 特点                                                         | 示例场景                       |
| -------------- | ------------------------------------------------------------ | ------------------------------ |
| `ROW_NUMBER()` | 为每行分配唯一的递增编号，从 1 开始                          | 生成连续序号（如学生成绩排名） |
| `RANK()`       | 为每行分配排名，相同值的行具有相同排名，排名会跳跃（如1,1,3） | 竞赛排名处理                   |
| `DENSE_RANK()` | 与 `RANK` 类似，但是排名不跳跃（如1,1,2）                    | 薪资等级划分                   |
| `NTILE(N)`     | 将结果集划分为 N 个桶，并为每行分配桶编号（N为桶数）         | 数据分位数分析                 |

示例代码：

~~~sql
SELECT 
    name,
    score,
    ROW_NUMBER() OVER (ORDER BY score DESC) AS row_number,
    RANK() OVER (ORDER BY score DESC) AS rank,
    DENSE_RANK() OVER (ORDER BY score DESC) AS dense_rank
FROM students;
~~~

### 聚合类函数

- **SUM()**：计算窗口范围内的总和。
- **AVG()**：计算窗口范围内的平均值。
- **MAX()**：计算窗口范围内的最大值。
- **MIN()**：计算窗口范围内的最小值。
- **COUNT()**：计算窗口范围内的行数。

示例代码：

~~~sql
SELECT 
    department,
    salary,
    SUM(salary) OVER (PARTITION BY department) AS total_salary,
    AVG(salary) OVER (PARTITION BY department) AS avg_salary
FROM employees;
~~~

### 偏移类函数

| 函数              | 功能                                 |
| ----------------- | ------------------------------------ |
| `LAG(列, N)`      | 取当前行前第N行的值（默认N=1）       |
| `LEAD(列, N)`     | 取当前行后第N行的值                  |
| `FIRST_VALUE(列)` | 取窗口内第一个值                     |
| `LAST_VALUE(列)`  | 取窗口内最后一个值（需注意范围定义） |

示例代码：

~~~sql
SELECT 
    name,
    score,
    LAG(score) OVER (ORDER BY score DESC) AS previous_score,
    LEAD(score) OVER (ORDER BY score DESC) AS next_score,
    FIRST_VALUE(score) OVER (ORDER BY score DESC) AS top_score,
    LAST_VALUE(score) OVER (ORDER BY score DESC) AS bottom_score
FROM students;
~~~

### 其他函数

- **`NTH_VALUE(列, n)`**: 返回窗口中第 n 行的列值。
- **`CUME_DIST()`**: 计算小于等于当前行值的行的比例，即按照相应规则分组排序后，当前行在其分组中的累积分布值（即相对位置的百分比）。
- **`PERCENT_RANK()`**: 计算当前行的百分比排名，即按照相应规则分组排序后，当前行之前（不包括当前行）的行数占该分组总行数减1的比例。

---

## 窗口范围

窗口范围定义了窗口函数的计算范围。可以通过 `ROWS` 和 `RANGE` 来指定。

- **ROWS**：基于物理行的范围（如前两行）。适用于精确控制行数（比如移动平均）。
- **RANGE**：基于逻辑值的范围（例如数值或时间范围）。适用于时间序列分析（比如累计销售额）。

窗口范围的语法：

~~~sql
ROWS | RANGE BETWEEN <起始范围> AND <结束范围>
~~~

- **UNBOUNDED PRECEDING**：从窗口的开头。
- **CURRENT ROW**：当前行。
- **UNBOUNDED FOLLOWING**：到窗口的结尾。
- **N PRECEDING**：当前行之前的 N 行。
- **N FOLLOWING**：当前行之后的 N 行。

示例代码：

~~~sql
SELECT 
    name,
    score,
    -- 定义窗口范围为当前行及前2行（共3行）
    SUM(score) OVER (ORDER BY score ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS rolling_sum
FROM students;
~~~

---

## 应用场景

### 排名和分组排名

~~~sql
SELECT 
    department,
    name,
    salary,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rank_in_department
FROM employees;
~~~

### 滑动平均值

~~~sql
SELECT 
    date,
    sales,
    -- 定义窗口范围为当前行及前6行（共7行）
    AVG(sales) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_avg
FROM sales_data;
~~~

### 环比和同比分析

~~~sql
SELECT 
    date,
    sales,
    -- 计算当前销售额与前一天销售额的差值
    sales - LAG(sales) OVER (ORDER BY date) AS sales_change
FROM sales_data;
~~~

---

## 窗口函数与 GROUP BY 的对比

| 特性           | 窗口函数 (Window Function)                         | GROUP BY                         |
| -------------- | -------------------------------------------------- | -------------------------------- |
| **保留原始行** | 保留所有原始行，每行都有输出                       | 将多行合并为一行，减少结果集行数 |
| **计算粒度**   | 可以为每一行计算聚合值                             | 只能为每个分组计算一个聚合值     |
| **结果集大小** | 与原表行数相同                                     | 等于分组数量                     |
| **灵活性**     | 可以同时查看明细数据和聚合数据                     | 只能查看聚合后的数据             |
| **排序功能**   | 支持 RANK(), DENSE_RANK(), ROW_NUMBER() 等排序函数 | 不直接支持排序功能               |
| **语法位置**   | 通常在 SELECT 子句中使用                           | 在 FROM 子句之后使用             |
| **分区范围**   | 可以定义不同的窗口范围（如 ROWS BETWEEN）          | 只能按完整分组聚合               |
| **常见函数**   | SUM() OVER(), AVG() OVER(), RANK() OVER() 等       | SUM(), AVG(), COUNT() 等         |

### 何时使用窗口函数

- 需要同时查看明细数据和聚合数据时。
- 需要计算排名、累计和、移动平均等时。
- 需要对比单个值与组内其他值时。

### 何时使用 GROUP BY

- 只需要聚合结果而不关心原始数据时。
- 需要对数据进行分组统计时。
- 需要与 HAVING 子句结合筛选分组时。

---

## ORDER BY 对于窗口函数结果的影响

窗口函数是SQL中强大的分析工具，而ORDER BY子句在窗口函数中扮演着重要角色。下面以表格形式展示ORDER BY子句对窗口函数查询结果的影响：

| 窗口函数类型                 | 不添加ORDER BY             | 添加ORDER BY           | 影响说明                       |
| ---------------------------- | -------------------------- | ---------------------- | ------------------------------ |
| ROW_NUMBER()                 | 结果不确定，依赖数据库实现 | 按指定列顺序分配行号   | ORDER BY决定了行号的分配顺序   |
| RANK() / DENSE_RANK()        | 所有行的排名相同           | 按指定列排序分配排名   | 没有ORDER BY时无法正确排名     |
| LEAD() / LAG()               | 结果不可预测               | 按指定列确定前后行     | ORDER BY决定了"前"和"后"的定义 |
| FIRST_VALUE() / LAST_VALUE() | 结果不确定                 | 按指定列确定首值和尾值 | ORDER BY决定了分区内的数据顺序 |
| SUM()/AVG()/等聚合函数       | 计算整个分区的聚合值       | 可实现累计/滚动计算    | ORDER BY使聚合变为累计计算     |
| NTILE()                      | 分组不确定                 | 按指定列顺序分配到桶中 | ORDER BY决定了数据分桶的顺序   |

### 示例说明

#### ROW_NUMBER() 函数

```sql
-- 不使用ORDER BY（结果不确定）
SELECT name, department, salary, 
       ROW_NUMBER() OVER (PARTITION BY department) as row_num
FROM employees;

-- 使用ORDER BY（结果确定）
SELECT name, department, salary, 
       ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as row_num
FROM employees;
```

#### 累计求和示例

```sql
-- 不使用ORDER BY（计算整个分区的和）
SELECT name, department, sales,
       SUM(sales) OVER (PARTITION BY department) as total_sales
FROM sales_data;

-- 使用ORDER BY（累计求和）
SELECT name, department, sales,
       SUM(sales) OVER (PARTITION BY department ORDER BY date) as running_total
FROM sales_data;
```

#### FIRST_VALUE/LAST_VALUE示例

```sql
-- 不使用ORDER BY（结果不确定）
SELECT product, category, price,
       FIRST_VALUE(price) OVER (PARTITION BY category) as first_price
FROM products;

-- 使用ORDER BY（结果确定）
SELECT product, category, price,
       FIRST_VALUE(price) OVER (PARTITION BY category ORDER BY price) as lowest_price,
       LAST_VALUE(price) OVER (PARTITION BY category ORDER BY price 
                              ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as highest_price
FROM products;
```

### 重要提示

1. 窗口函数中的ORDER BY与查询级别的ORDER BY不同，前者决定窗口内数据的处理顺序，后者决定最终结果的显示顺序。
2. 对于FIRST_VALUE/LAST_VALUE，通常需要同时指定窗口框架（如ROWS BETWEEN...），否则默认框架可能导致意外结果。
3. 聚合窗口函数（SUM、AVG等）搭配ORDER BY使用时，会从分区开始到当前行累计计算，而不是整个分区的聚合。
4. 在实际应用中，几乎所有窗口函数都应该指定ORDER BY子句，以确保结果的可预测性和正确性。

---

## 窗口函数在 `SELECT` 和`ORDER BY` 子句中的区别

| **方面**         | **在 SELECT 子句中**                           | **在 ORDER BY 子句中**                 |
| ---------------- | ---------------------------------------------- | -------------------------------------- |
| **作用**         | 计算窗口函数的结果并将其作为查询输出的一部分。 | 根据窗口函数的结果对查询结果进行排序。 |
| **结果是否显示** | 结果会作为查询的输出列显示。                   | 结果不会显示，仅用于排序。             |
| **是否影响排序** | 不影响查询结果的行顺序。                       | 会影响查询结果的行顺序。               |
| **使用场景**     | 用于分析数据，例如排名、累计值、聚合值等。     | 用于基于窗口函数的计算结果对数据排序。 |

---

## 窗口函数的限制

- **性能问题**：窗口函数的计算复杂度较高，尤其是涉及大量数据和复杂排序时。

- **不能嵌套**：窗口函数不能嵌套使用。

- **不能直接用在 `WHERE` 子句中**：因为 `WHERE` 子句在 `SELECT` 之前执行，窗口函数需要在结果集生成后计算。

---

## 总结

MySQL 窗口函数是非常强大的工具，能够帮助我们解决许多复杂的查询需求。通过窗口函数，我们可以轻松实现排名、滑动统计、累计计算等功能，同时保留原始数据行，极大地增强了 SQL 的表达能力。在实际使用中，合理设计 `PARTITION BY` 和 `ORDER BY` 是窗口函数性能优化的关键。