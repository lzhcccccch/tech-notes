## Sublime Text 安装 Json 格式化插件

[toc]

#### 1. 安装 Package Control

​	首先需要安装 `Package Control` 如果已安装则跳过。

​	按 `Command + Shift + P` 打开命令框，搜索 PC 选择 `Install Package Control` 进行安装

![img](pic/01.png)

​	

​	选择之后稍微等待一会，成功后弹窗如下：

![img](pic/02.png)

---

#### 2. 安装 Pretty Json

​	按 `Command + Shift + P` 打开命令框，搜索 PCI，打开 package 安装框

![img](pic/03.png)



​	搜索 Pretty JSON，进行安装

![img](pic/04.png) 

---

#### 3. 格式化 json

> Mac： command + control + J
>
> Windows： Ctrl + Alt + J

---

#### 4. 快捷键失效

查看已经安装的插件以及添加快捷键设置

![](pic/05.png)

将格式化 JSON 的快捷键添加进去

![](pic/06.png)

配置信息如下：

> [
> 	{ "keys": ["ctrl+command+j"], "command": "pretty_json" },
> ]