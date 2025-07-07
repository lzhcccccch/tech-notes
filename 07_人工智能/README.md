# 🤖 人工智能技术

> 人工智能正在改变世界，本部分涵盖 AI 相关的核心技术、工具使用和实践应用，包括大语言模型、RAG 系统等前沿技术。

## 📚 内容概览

### 💬 大语言模型与提示工程
- **[Prompt 工程](01_Prompt/)** - 提示词设计与优化
  - ChatGPT 提示词技巧
  - Prompt 设计原则
  - 角色扮演与情境设定
  - 思维链推理
  - 少样本学习

### 🔍 知识检索增强
- **[RAG 增强检索知识库系统](02_DeepSeek%20RAG%20增强检索知识库系统/)** - 检索增强生成技术
  - RAG 系统架构设计
  - 向量数据库应用
  - 文档切分与索引
  - 检索策略优化
  - DeepSeek 模型集成

## 🎯 技术架构

### RAG 系统核心组件
```
用户查询 → 查询理解 → 向量检索 → 上下文构建 → LLM 生成 → 结果返回
    ↓           ↓           ↓           ↓           ↓           ↓
  意图识别   → 向量化    → 相似度计算 → Prompt构建 → 文本生成  → 后处理
```

### 技术栈对比

| 组件 | 开源方案 | 商业方案 | 特点 |
|------|----------|----------|------|
| **LLM** | Llama, ChatGLM | GPT-4, Claude | 模型能力与成本平衡 |
| **向量数据库** | Chroma, FAISS | Pinecone, Weaviate | 检索性能与扩展性 |
| **Embedding** | Sentence-BERT | OpenAI Embeddings | 语义理解准确性 |
| **框架** | LangChain, LlamaIndex | 自研框架 | 开发效率与定制化 |

## 🚀 实践应用场景

### 企业级应用
- **智能客服系统** - 基于企业知识库的自动问答
- **文档智能分析** - 合同、报告等文档的智能解读
- **代码助手** - 代码生成、bug 修复、代码解释
- **内容创作** - 营销文案、技术文档自动生成

### 个人应用
- **学习助手** - 个人知识库问答系统
- **写作助手** - 文章大纲生成、内容扩展
- **研究工具** - 论文总结、文献检索
- **生活助手** - 日程管理、决策支持

## 🔧 开发工具与框架

### 主流框架
- **LangChain** - 构建 LLM 应用的 Python 框架
- **LlamaIndex** - 专注于数据连接的 LLM 框架
- **Semantic Kernel** - 微软开源的 AI 编排框架
- **AutoGPT** - 自主 AI 代理框架

### 向量数据库
- **Chroma** - 轻量级向量数据库
- **Pinecone** - 云原生向量数据库
- **Weaviate** - 开源向量搜索引擎
- **Milvus** - 云原生向量数据库

### 模型服务
- **Ollama** - 本地大模型运行工具
- **vLLM** - 高性能 LLM 推理引擎
- **Text Generation WebUI** - 开源模型 Web 界面
- **FastChat** - 分布式多模型服务平台

## 📖 学习资源

### 理论基础
- [深度学习](https://www.deeplearningbook.org/) - Ian Goodfellow 等著
- [统计学习方法](https://book.douban.com/subject/10590856/) - 李航著
- [机器学习](https://book.douban.com/subject/26708119/) - 周志华著

### 实践教程
- [Hugging Face 课程](https://huggingface.co/course)
- [LangChain 官方文档](https://python.langchain.com/)
- [OpenAI Cookbook](https://github.com/openai/openai-cookbook)

### 前沿资讯
- [Papers With Code](https://paperswithcode.com/)
- [AI 研习社](https://www.yanxishe.com/)
- [机器之心](https://www.jiqizhixin.com/)

## 🎯 学习路径

### 入门路径
1. **基础概念** → **Prompt 工程** → **API 调用**
2. **向量检索** → **RAG 原理** → **简单应用**
3. **框架使用** → **项目实践** → **效果优化**

### 进阶路径
1. **模型微调** → **架构设计** → **性能优化**
2. **多模态应用** → **Agent 开发** → **系统集成**
3. **前沿技术** → **论文研读** → **技术创新**

---

💡 **提示**: AI 技术发展迅速，建议关注最新动态，多动手实践，理论与应用相结合。
