# 从零理解 Agent 的工具调用循环

<p class="article-meta">发布于 2026-09-05 · 分类：AI 实践 · 阅读约 10 分钟</p>

> 本文是占位示例，内容用于演示代码高亮和多级标题。

Agent 的核心并不神秘：模型根据当前上下文决定下一步动作，程序执行动作并把结果放回上下文，直到任务完成或达到停止条件。

## 最小循环

```python
messages = [
    {"role": "user", "content": "查询上海天气并给出出行建议"}
]

for step in range(8):
    response = model.respond(messages, tools=tool_specs)

    if response.final_answer:
        return response.final_answer

    result = execute_tool(response.tool_call)
    messages.extend([response.message, result])

raise RuntimeError("Agent exceeded the maximum number of steps")
```

## 真正重要的工程约束

### 停止条件

最大步数只是最后一道保险。更好的系统还会限制总耗时、工具调用成本、重复调用和输出大小。

### 工具结果

工具返回值应该稳定、结构化，并区分成功、可重试错误和不可重试错误。含糊的字符串会把复杂度推给模型。

### 可观测性

至少记录每一步的模型输入摘要、工具名称、参数、耗时、结果状态和最终停止原因。没有这些信息，线上问题几乎无法复盘。

## 小结

Agent 是一个受约束的反馈循环。模型能力决定上限，而工具设计、停止策略和可观测性决定它能否稳定工作。

