# MySQL 8.0 中的 CTE

[toc]

## 简介

CTE (Common Table Expression，公用表表达式) 是 MySQL 8.0 版本中引入的一项重要功能。它允许您在单个 SQL 语句中定义一个临时结果集，可以在同一查询中多次引用。CTE 使复杂查询更易于理解和维护，特别是对于需要多次引用相同子查询结果的情况。

---

## CTE 主要特点

CTE 的主要特性包括：
1. **临时性**：CTE 在查询执行期间是临时的，查询结束后会被销毁。
2. **递归支持**：MySQL 8.0 中的 CTE 支持递归查询，适用于层次结构数据（如组织结构或目录树）。
3. **可读性**：通过命名子查询，CTE 提高了 SQL 代码的可读性和逻辑清晰度。
4. **可重用性**：可以在同一查询中多次引用

---

## CTE 的语法

CTE 的定义使用 `WITH` 子句，其基本语法如下：

```sql
WITH cte_name [(column_list)] AS (
    -- 查询定义
    SELECT ...
)
-- 主查询，引用 CTE
SELECT * FROM cte_name;
```

### 参数说明：
- `cte_name`：CTE 的名称，用于标识该临时结果集。
- `column_list`：可选，定义 CTE 结果集的列名。如果未指定，系统会自动使用查询中列的名称。
- `SELECT ...`：定义 CTE 的查询。
- 主查询：可以引用 CTE 的名称来使用其结果。

---

## CTE 的类型

MySQL 8.0 支持两种类型的 CTE：
1. **非递归 CTE**：不涉及递归逻辑的普通 CTE。
2. **递归 CTE**：允许 CTE 引用自身，从而实现递归查询。

### 1. 非递归 CTE

非递归 CTE 是最常见的形式，用于定义一个简单的临时结果集，可以在主查询中多次引用。

#### 示例：计算每个部门的平均工资
```sql
WITH department_avg_salary AS (
    SELECT department_id, AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department_id
)
SELECT d.department_name, das.avg_salary
FROM departments d
JOIN department_avg_salary das ON d.department_id = das.department_id
ORDER BY das.avg_salary DESC;
```

**解释**：
1. 使用 CTE `department_avg_salary` 计算每个部门的平均工资。
2. 在主查询中引用该 CTE，并将其与部门表连接，获取部门名称及平均工资。

### 2. 递归 CTE

递归 CTE 是 MySQL 8.0 的一个重要功能，允许 CTE 自引用，从而实现递归查询。这在处理层次结构（如组织树、文件系统目录树）时非常有用。

#### 递归 CTE 的语法：
递归 CTE 由两部分组成：
1. **锚成员**：初始的非递归查询，提供递归的起点。
2. **递归成员**：引用自身的查询，定义递归逻辑。

递归 CTE 的语法如下：
```sql
WITH RECURSIVE cte_name AS (
    -- 锚成员
    SELECT ...
    UNION ALL
    -- 递归成员
    SELECT ... FROM cte_name ...
)
SELECT * FROM cte_name;
```

#### 示例：生成数字序列
```sql
WITH RECURSIVE numbers AS (
    SELECT 1 AS n  -- 锚成员
    UNION ALL
    SELECT n + 1   -- 递归成员
    FROM numbers
    WHERE n < 10
)
SELECT * FROM numbers;
```

**结果**：
```
+---+
| n |
+---+
| 1 |
| 2 |
| 3 |
| 4 |
| 5 |
| 6 |
| 7 |
| 8 |
| 9 |
| 10|
+---+
```

**解释**：
1. 锚成员 `SELECT 1 AS n` 定义了递归的起点。
2. 递归成员 `SELECT n + 1 FROM numbers WHERE n < 10` 逐步生成从 2 到 10 的数字。
3. `UNION ALL` 将锚成员和递归成员的结果合并。

#### 示例：查询组织结构的层次关系
假设有一个员工表 `employees`，其中包含 `id`、`name` 和 `manager_id` 字段，用于表示员工与其上级经理的关系。

```sql
WITH RECURSIVE employee_hierarchy AS (
    -- 锚成员：查找顶级经理
    SELECT id, name, manager_id, 1 AS level
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- 递归成员：查找下属员工
    SELECT e.id, e.name, e.manager_id, eh.level + 1
    FROM employees e
    JOIN employee_hierarchy eh ON e.manager_id = eh.id
)
SELECT * FROM employee_hierarchy
ORDER BY level, id;
```

**解释**：
1. 锚成员查找顶级经理（`manager_id IS NULL`）。
2. 递归成员查找每个经理的直接下属。
3. `level` 字段用于表示员工在组织结构中的层级。

---

## 多个 CTE 的组合使用

MySQL 允许在一个查询中定义多个 CTE，这些 CTE 可以相互引用。

### 示例：多个 CTE 的使用
```sql
WITH 
cte1 AS (
    SELECT department_id, COUNT(*) AS employee_count
    FROM employees
    GROUP BY department_id
),
cte2 AS (
    SELECT department_id, AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department_id
)
SELECT c1.department_id, c1.employee_count, c2.avg_salary
FROM cte1 c1
JOIN cte2 c2 ON c1.department_id = c2.department_id;
```

---

## CTE 与子查询、临时表的比较

| 特性     | CTE                          | 子查询           | 临时表               | 视图           |
| -------- | ---------------------------- | ---------------- | -------------------- | -------------- |
| 定义范围 | 当前查询                     | 当前查询         | 会话范围内           | 数据库         |
| 可读性   | 高                           | 低               | 中                   | 中             |
| 性能     | 取决于查询优化器             | 取决于查询优化器 | 通常更快（物化存储） | 通常比子查询快 |
| 支持递归 | 是                           | 否               | 否                   | 否             |
| 适用场景 | 多次引用的复杂查询、递归查询 | 简单的嵌套查询   | 大型数据的临时存储   | 大量固定数据   |

---

## 性能注意事项

1. **优化器行为**：MySQL 8.0 的优化器会将非递归 CTE 转换为等效的子查询，性能取决于查询的复杂性。
2. **重复计算**：CTE 不会自动物化（除非优化器认为必要），如果多次引用同一个 CTE，可能会导致重复计算。
3. **递归查询的深度限制**：递归 CTE 的默认递归深度为 1000，可以通过 `max_recursive_iterations` 系统变量调整。
4. **索引策略**：CTE 内部查询可以利用基表索引，但无法直接为 CTE 创建索引。

---

## 进阶实践建议

### 动态参数传递

 CTE 支持与预处理语句结合实现动态查询：

```sql
PREPARE stmt FROM '
WITH cte AS (SELECT * FROM orders WHERE year = ?)
SELECT COUNT(*) FROM cte';
EXECUTE stmt USING 2023;
```

### 递归 CTE 防循环

 处理图数据时增加路径追踪：

```sql
WITH RECURSIVE graph_path AS (
    SELECT start_node, end_node, CAST(start_node AS CHAR(200)) AS path
    FROM edges WHERE start_node = 'A'
    UNION ALL
    SELECT g.start_node, e.end_node, CONCAT(g.path, '->', e.end_node)
    FROM edges e
    INNER JOIN graph_path g ON e.start_node = g.end_node
    WHERE LOCATE(e.end_node, g.path) = 0  -- 防止循环
)
SELECT * FROM graph_path;
```

### 与窗口函数结合

```sql
WITH sales_ranking AS (
    SELECT 
        product_id,
        RANK() OVER (PARTITION BY category ORDER BY sales DESC) AS rank,
        SUM(sales) OVER (PARTITION BY region) AS regional_total
    FROM sales_data
)
SELECT * FROM sales_ranking WHERE rank <= 3;
```

---

## 总结

MySQL 8.0 中的 CTE 是一个强大的工具，特别是递归 CTE 的引入，使得处理层次结构数据变得更加简单。CTE 提高了查询的可读性和可维护性，是复杂 SQL 查询的理想选择。在实际应用中，合理使用 CTE 可以显著简化代码逻辑，同时提升开发效率。