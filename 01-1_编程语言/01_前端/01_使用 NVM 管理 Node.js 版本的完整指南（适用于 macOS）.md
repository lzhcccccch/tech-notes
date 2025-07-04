# 使用 NVM 管理 Node.js 版本的完整指南（适用于 macOS）

[toc]

在 macOS 上使用 NVM（Node Version Manager）可以方便地管理多个 Node.js 版本。以下是详细的安装、配置和使用指南。

也可以根据 NVM 的 GitHub 仓库中的说明进行安装，地址如下：

> https://github.com/nvm-sh/nvm?tab=readme-ov-file#install--update-script

---

## 一、安装 NVM 和 Node.js

### 1. 安装 NVM
通过以下命令安装 NVM：
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

或者

~~~bash 
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
~~~

安装完成后，可以先验证是否安装成功，如果没有安装成功，则执行下面的操作。

编辑 shell 配置文件（如 `~/.bash_profile` 或 `~/.zshrc`），添加以下内容：

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

然后执行以下命令使配置生效：
```bash
source ~/.bash_profile  # 如果使用的是 bash
source ~/.zshrc         # 如果使用的是 zsh
```

### 2. 验证 NVM 是否安装成功
运行以下命令：
```bash
nvm --version
```
如果返回版本号，则说明安装成功。

### 故障排除

如果安装不成功，可以参考以下解决方案，截图来自官网，更多解决方案可查看官网。

#### Linux

![image-20250507234550115](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20250507234550115.png)

#### MacOS

![](https://raw.githubusercontent.com/lzhcccccch/MyNotes/main/img/image-20250507234847061.png)

---

## 二、切换 Node.js 镜像源（可选）

由于国内网络原因，建议将 Node.js 的下载镜像源设置为淘宝镜像：

1. 编辑 shell 配置文件：
   ```bash
   vim ~/.bash_profile  # 或者 ~/.zshrc
   ```

2. 添加以下内容：
   ```bash
   export NVM_NODEJS_ORG_MIRROR=http://npm.taobao.org/mirrors/node
   export NVM_IOJS_ORG_MIRROR=http://npm.taobao.org/mirrors/iojs
   ```

3. 保存后执行：
   ```bash
   source ~/.bash_profile  # 或 source ~/.zshrc
   ```

---

## 三、使用 NVM 管理 Node.js 版本

### 1. 安装 Node.js

- 安装最新版本：
  ```bash
  nvm install node
  ```

- 安装最新的长期支持（LTS）版本：
  ```bash
  nvm install --lts
  ```

- 安装指定版本（例如 v14.7.0）：
  ```bash
  nvm install v14.7.0
  ```

### 2. 查看和切换版本

- 查看已安装的版本：
  ```bash
  nvm ls
  ```

- 查看远程可用版本：
  ```bash
  nvm ls-remote
  ```

- 切换到指定版本（例如 v14.7.0）：
  ```bash
  nvm use v14.7.0
  ```

- 设置默认版本：
  ```bash
  nvm alias default v14.7.0
  ```

---

## 四、启动项目及常见问题

### 1. 启动项目

在项目目录下运行以下命令：
```bash
npm install   # 安装依赖
npm run serve # 启动项目
```

`npm install` 是把依赖下载下来，也可以通过拷贝的方式，将依赖拷贝到 **node_modules** 目录下，直接执行  `npm run serve` 即可。

### 2. 权限问题

如果运行命令时报错 `Permission denied`，可以通过以下方式修改文件权限：
```bash
chmod 777 node_modules/.bin/<文件名>
```
或者：
```bash
chmod +x node_modules/.bin/<文件名>
```

---

## 五、常用 NVM 命令

| 命令                         | 功能                        |
| ---------------------------- | --------------------------- |
| `nvm ls`                     | 查看已安装的 Node.js 版本   |
| `nvm ls-remote`              | 查看远程可用的 Node.js 版本 |
| `nvm install <版本号>`       | 安装指定版本的 Node.js      |
| `nvm use <版本号>`           | 切换到指定版本的 Node.js    |
| `nvm alias default <版本号>` | 设置默认使用的 Node.js 版本 |

---

