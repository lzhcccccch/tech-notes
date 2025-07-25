# MVCC-版本链清理

[toc]

## 简介

MySQL 中的 MVCC 机制通过版本链来管理数据的多版本存储，以支持高并发的读写操作。然而，随着事务的进行，旧版本的数据会不断累积，导致存储空间的浪费。为了避免这种情况，InnoDB 存储引擎实现了自动清理机制来管理和清理不再需要的旧版本数据。

---

## 依赖机制

版本链清理这个过程主要依赖于以下几个机制：

1. **回滚段（Undo Log）和回滚段的清理**：
   - InnoDB 在进行数据修改时，会将旧版本的数据保存在回滚段中，以支持 MVCC 和事务回滚。回滚段的数据在事务提交后并不会立即删除，因为其他事务可能仍然需要访问这些旧版本数据。
   - 当所有引用某个回滚段的事务都结束时，InnoDB 会标记这些回滚段中的数据为可清理。这些数据会在后台由专门的清理线程进行物理删除，从而释放存储空间。
2. **Purge 线程**：
   - InnoDB 有一个专门的后台线程，称为 Purge 线程。Purge 线程的任务是定期清理已经不再需要的旧版本数据。这些旧版本数据包括回滚段中的记录以及数据页中的版本链。
   - Purge 线程通过扫描回滚段中的数据来确定哪些旧版本已经不再被任何活跃事务引用。如果确定某个旧版本数据可以被清理，Purge 线程会将其从回滚段和数据页中删除。
3. **一致性视图的影响**：
   - 一致性视图记录了当前所有活跃事务的事务ID（`m_ids`）。只有当旧版本数据的创建事务ID（`DB_TRX_ID`）小于 `m_ids` 中最小的事务ID 时，才认为该版本数据可以被清理。
   - 这意味着，如果有长时间运行的事务存在，它会延迟旧版本数据的清理，因为这些旧版本数据可能仍然对该长事务可见。

---

## Purge 操作的触发时机

Purge操作是InnoDB定期执行的维护任务，由后台线程负责。它会在以下情况下被触发：

- 当事务提交时，如果该事务产生了undo log记录，这些记录可能会被标记为可清理。
- 定期检查点（checkpoint）时，系统会检查undo log的大小和系统配置，决定是否需要执行Purge。
- 当undo log表空间达到其配置的限制时，会触发Purge来回收空间。

---

## 版本链清理的详细过程

1. **标记可清理的旧版本**：
   - Purge操作会查看undo log记录，并确定哪些记录不再被任何活跃事务所需要。这通常是通过比较undo log记录的事务ID与当前系统中最早的活跃事务ID来完成的。如果undo log记录的事务ID小于最早的活跃事务ID，则可以安全地清理该记录。
2. **Purge 线程扫描回滚段**：
   - Purge 线程会定期扫描回滚段，找到那些已标记为可清理的旧版本数据。Purge 线程通过遍历回滚段中的 `DB_TRX_ID` 和一致性视图中的 `m_ids` 来确定哪些旧版本数据可以被安全地删除。（Purge操作会遍历版本链，从最老的undo log记录开始，向前追溯到更早的版本，直到找到一个仍然可能被需要的版本。）
3. **物理删除旧版本数据**：
   - 一旦确定某个旧版本数据可以被清理，Purge 线程会将其从回滚段和数据页中物理删除。这包括更新版本链，确保版本链的完整性和正确性。
4. **释放空间**：
   - 通过物理删除旧版本数据，Purge 线程释放了存储空间，减少了数据页和回滚段的存储压力。

---

## 示例操作流程

假设有以下表和数据：

```sql
CREATE TABLE example (
    id INT PRIMARY KEY,
    value VARCHAR(50)
);

INSERT INTO example (id, value) VALUES (1, 'A'), (2, 'B'), (3, 'C');
```

现在进行一些数据操作：

```sql
-- 事务1：启动事务
START TRANSACTION;
SELECT * FROM example WHERE id = 1; -- 创建一致性视图

-- 事务2：启动并更新数据
START TRANSACTION;
UPDATE example SET value = 'B' WHERE id = 1;
COMMIT;

-- 事务3：启动并更新数据
START TRANSACTION;
UPDATE example SET value = 'C' WHERE id = 1;
COMMIT;

-- 事务1：快照读
SELECT * FROM example WHERE id = 1; -- 仍然读取旧版本数据 'A'
COMMIT;
```

在上述操作中，事务1 创建了一致性视图，记录了系统中活跃的事务ID。事务2 和事务3 进行数据更新，创建了新的数据版本，并将旧版本数据存储在回滚段中。

当事务1 提交后，InnoDB 会进行以下步骤：

1. **标记旧版本数据**：
   - 事务2 创建的版本 `value = 'B'` 和事务3 创建的版本 `value = 'C'` 可能会被标记为可清理，具体取决于其他事务的状态。
2. **Purge 线程扫描**：
   - Purge 线程扫描回滚段，找到 `DB_TRX_ID` 小于所有活跃事务最小ID 的旧版本数据。
3. **物理删除**：
   - 确定可清理的数据版本后，Purge 线程将其物理删除，更新版本链。
4. **释放空间**：
   - 删除旧版本数据后，释放回滚段和数据页的存储空间。

---

## 延迟清理

InnoDB的Purge操作是延迟执行的，它不会立即在事务提交后清理undo log记录，这是因为可能有其他事务仍然需要这些记录来构建它们的Read View。Purge操作会等到所有可能需要旧版本的事务都已经结束后才执行清理。

---

## 配置和监控

在MySQL中，可以通过一些配置项来控制Purge操作的行为，例如：

- `innodb_purge_threads`: 设置Purge操作使用的线程数。
- `innodb_purge_batch_size`: 控制每次Purge操作清理的undo log记录数。

此外，还可以通过InnoDB的监控输出来检查Purge操作的状态，例如通过`SHOW ENGINE INNODB STATUS`命令。

---

## 总结

MySQL 中的 MVCC 机制通过版本链和回滚段来管理数据的多版本存储。在高并发环境中，Purge 线程的清理工作至关重要。它确保了存储空间的有效利用，同时维持了数据版本的正确性和一致性。通过定期清理旧版本数据，InnoDB 能够在支持高并发读写操作的同时，避免存储空间的浪费。