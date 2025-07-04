## MySQL 多条件 `IN` 查询的实现与优化

[toc]

#### 背景

在复杂业务场景中，经常需要在单次查询中匹配多个条件组合，找到符合这些组合的数据。为提高查询性能和简化 SQL 语句，可以使用多条件 IN 子句来实现这一需求。

例如，我们希望从物料表中查找同时匹配特定的物料编号、供应商编号和工厂编号的记录。

---

#### 查询需求

目标是在单次查询中找出符合以下多个条件组合的数据：

- (materiel_no = 'a', supplier_no = 'a', factory_no = 'a')
- (materiel_no = 'b', supplier_no = 'b', factory_no = 'b')
- …

---

#### SQL 查询写法

为了实现上述需求，可以使用 MySQL 的 `IN` 子句。以下是一个 SQL 查询示例，它通过指定多个条件来检索符合要求的记录：

```sql
SELECT materiel_no, supplier_no, factory_no, box_size
FROM material_adnum
WHERE (materiel_no, supplier_no, factory_no) 
IN (('0320201857', 'V12972', '8710'), ('0320401023', 'V12684', '8310'));
```

**说明：**

- 使用 (column1, column2, column3) IN ((value1, value2, value3), ...) 格式，能够在单次查询中匹配多组条件。
- 这种写法简洁高效，特别适用于批量查询特定记录的场景。

**MyBatis 实现：**

在使用 MyBatis 进行动态 SQL 查询时，我们可以利用 `<foreach>` 标签来实现类似的多条件查询。以下是 MyBatis 的 XML 配置示例：

```xml
<select id="selectByConditions" resultType="MaterialAdnum">
    select materiel_no, supplier_no, factory_no, box_size
    from material_adnum
    where (materiel_no, supplier_no, factory_no) in
    <foreach collection="list" item="item" open="(" separator="," close=")">
        (#{item.materialNo}, #{item.supplierNo}, #{item.factoryNo})
    </foreach>
</select>
```

代码说明

- `collection="list"`：表示传入的查询条件列表。
- `item="item"`：表示列表中的每个元素，即单个条件组合。
- `open="(" separator="," close=")"`：用于生成括号包裹的 `IN` 子句，并以逗号分隔多个条件。

通过这种方式，我们可以动态生成包含多个条件的 `IN` 查询，确保灵活性和可扩展性。

---

#### 性能优化与注意事项

在实际应用中，当条件列表非常长时，`IN` 查询可能会影响性能。以下是一些优化建议：

1. **控制列表长度**：确保传入的条件列表不会过长，避免因过多的条件导致查询性能下降。
2. **分批查询**：如果条件列表过长，可以考虑将查询分批执行，每批处理一部分条件，从而减轻数据库压力。
3. **使用索引**：确保相关的查询字段（如 `materiel_no`、`supplier_no`、`factory_no`）上有适当的索引，以加速查询。
4. **临时表优化**：在极端情况下，可以将条件插入临时表中，然后基于临时表进行查询，这样可以有效分离查询逻辑，减轻主表的压力。
5. **分区表**：对数据量特别大的表，可以考虑使用表分区，将数据按特定字段（如 factory_no）分区，减少查询的扫描范围。
6. **避免非必要的计算**：在 WHERE 子句中使用常量值，避免使用函数或复杂表达式来优化查询性能。

---

#### 适用场景

- **库存管理系统**：批量查询物料库存信息。
- **采购订单系统**：核对多个订单条件的匹配情况。
- **数据同步与清洗**：根据多个条件组合进行数据筛选和验证。

---

#### 总结

使用多条件 IN 子句可以简化 SQL 查询的书写，提高查询效率。在实际使用时，应根据业务场景和数据量，选择合适的索引和优化策略，确保系统的高性能和稳定性。
