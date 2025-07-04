# Git 多身份配置管理指南

[toc]

## 背景

在日常开发中，我们经常需要在不同的项目中使用不同的 Git 身份信息。比如公司项目需要使用公司邮箱，个人项目使用个人邮箱。本文将介绍几种有效的解决方案。

## 配置原理

Git 配置有三个级别：
- **系统级别**：`--system`（影响所有用户）
- **全局级别**：`--global`（影响当前用户的所有仓库）
- **本地级别**：`--local`（仅影响当前仓库）

配置优先级：**本地 > 全局 > 系统**

## 方案一：本地仓库配置（最简单）

### 适用场景
- 少量个人项目需要特殊配置
- 临时性的配置需求

### 操作步骤

```bash
# 进入项目目录
cd /path/to/your/project

# 设置该仓库的用户信息
git config user.name "Your Personal Name"
git config user.email "your.personal@email.com"

# 验证配置
git config user.name
git config user.email
```

### 优缺点
- ✅ **优点**：简单直接，立即生效
- ❌ **缺点**：需要为每个项目单独设置，容易遗忘

## 方案二：条件配置（推荐）

### 适用场景
- 有固定的项目目录结构
- 希望自动化管理配置

### 配置步骤

#### 1. 设置目录结构
```
~/
├── work/          # 工作项目
├── personal/      # 个人项目
└── github/        # GitHub 项目
```

#### 2. 编辑全局配置
```bash
git config --global --edit
```

#### 3. 配置 `~/.gitconfig`
```ini
[user]
    name = Company Employee
    email = employee@company.com

# 个人项目配置
[includeIf "gitdir:~/personal/"]
    path = ~/.gitconfig-personal

[includeIf "gitdir:~/github/"]
    path = ~/.gitconfig-personal

# 可以添加更多目录
[includeIf "gitdir:~/Documents/personal-projects/"]
    path = ~/.gitconfig-personal
```

#### 4. 创建个人配置文件
```bash
# 创建个人配置文件
touch ~/.gitconfig-personal
```

编辑 `~/.gitconfig-personal`：
```ini
[user]
    name = Your Personal Name
    email = your.personal@email.com
    signingkey = PERSONAL_GPG_KEY_ID

[commit]
    gpgsign = true
```

### 优缺点
- ✅ **优点**：一次设置，自动生效；管理清晰
- ❌ **缺点**：需要按目录组织项目

## 方案三：基于远程仓库 URL 的条件配置

### 适用场景
- 根据代码托管平台区分身份
- 项目目录结构不固定

### 配置示例
```ini
[user]
    name = Company Employee
    email = employee@company.com

# 基于 GitHub 个人账户
[includeIf "hasconfig:remote.*.url:git@github.com:yourusername/**"]
    path = ~/.gitconfig-personal

[includeIf "hasconfig:remote.*.url:https://github.com/yourusername/**"]
    path = ~/.gitconfig-personal

# 基于公司 GitLab
[includeIf "hasconfig:remote.*.url:git@gitlab.company.com:**"]
    path = ~/.gitconfig-work
```

### 优缺点
- ✅ **优点**：基于实际的远程仓库自动识别
- ❌ **缺点**：需要先添加远程仓库才能生效

## 方案四：脚本自动化

### 创建切换脚本

#### 方法 1：独立脚本
```bash
#!/bin/bash
# ~/bin/git-personal

git config user.name "Your Personal Name"
git config user.email "your.personal@email.com"
echo "✅ 已切换到个人 Git 配置"
echo "用户名: $(git config user.name)"
echo "邮箱: $(git config user.email)"
```

```bash
#!/bin/bash
# ~/bin/git-work

git config user.name "Company Employee"
git config user.email "employee@company.com"
echo "✅ 已切换到工作 Git 配置"
echo "用户名: $(git config user.name)"
echo "邮箱: $(git config user.email)"
```

使脚本可执行：
```bash
chmod +x ~/bin/git-personal
chmod +x ~/bin/git-work
```

#### 方法 2：Git 别名
```bash
# 添加别名
git config --global alias.personal '!git config user.name "Your Personal Name" && git config user.email "your.personal@email.com" && echo "切换到个人配置"'

git config --global alias.work '!git config user.name "Company Employee" && git config user.email "employee@company.com" && echo "切换到工作配置"'
```

使用：
```bash
git personal  # 切换到个人配置
git work      # 切换到工作配置
```

## 验证和检查配置

### 基本检查命令
```bash
# 查看当前用户信息
git config user.name
git config user.email

# 查看配置来源
git config --show-origin user.name
git config --show-origin user.email

# 查看所有配置
git config --list --show-origin
```

### 测试配置是否生效
```bash
# 在不同目录下测试
cd ~/work/some-project
git config user.email  # 应该显示公司邮箱

cd ~/personal/some-project  
git config user.email  # 应该显示个人邮箱
```

## 最佳实践建议

### 1. 推荐的目录结构
```
~/
├── work/              # 所有工作项目
│   ├── project1/
│   └── project2/
├── personal/          # 个人项目
│   ├── my-blog/
│   └── side-project/
└── github/            # GitHub 开源项目
    ├── awesome-tool/
    └── learning-repo/
```

### 2. 完整的配置示例

**`~/.gitconfig`（全局配置）：**
```ini
[user]
    name = Company Employee
    email = employee@company.com
    signingkey = WORK_GPG_KEY_ID

[commit]
    gpgsign = true

[includeIf "gitdir:~/personal/"]
    path = ~/.gitconfig-personal

[includeIf "gitdir:~/github/"]
    path = ~/.gitconfig-personal

[alias]
    personal = !git config user.name "Personal Name" && git config user.email "personal@email.com" && echo "切换到个人配置"
    work = !git config user.name "Company Employee" && git config user.email "employee@company.com" && echo "切换到工作配置"
```

**`~/.gitconfig-personal`（个人配置）：**
```ini
[user]
    name = Your Personal Name
    email = your.personal@email.com
    signingkey = PERSONAL_GPG_KEY_ID

[commit]
    gpgsign = true
```

### 3. 提交前检查清单
- [ ] 确认当前用户信息：`git config user.email`
- [ ] 检查 GPG 签名密钥（如果使用）
- [ ] 验证远程仓库地址

### 4. 常见问题排查

#### 配置不生效
```bash
# 检查条件配置路径是否正确
git config --show-origin --get-regexp user

# 检查目录路径匹配
pwd  # 确认当前目录是否在条件配置范围内
```

#### 忘记设置个人项目配置
```bash
# 快速检查最近的提交
git log --oneline -5 --pretty=format:"%h %an <%ae> %s"
```

## 总结

| 方案         | 适用场景     | 自动化程度 | 配置复杂度 |
| ------------ | ------------ | ---------- | ---------- |
| 本地配置     | 少量项目     | 低         | 简单       |
| 条件配置     | 固定目录结构 | 高         | 中等       |
| URL 条件配置 | 基于托管平台 | 高         | 中等       |
| 脚本自动化   | 灵活切换     | 中         | 简单       |

**推荐方案**：使用**条件配置**作为主要方案，配合**脚本自动化**作为补充，这样既能实现自动化管理，又保持了灵活性。