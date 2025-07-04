## MacOS Catalina 10.15 基本软件的安装

[toc]

#### 一、finalshell

>打开终端按顺序执行下列命令, 每条命令执行完回车

>`curl -o finalshell_install.sh www.hostbuf.com/downloads/finalshell_install.sh'`

> `chmod +x finalshell_install.sh`

> `sudo ./finalshell_install.sh`

> 输入电脑解锁密码即可进行安装

#### 二、sourcetree

> 自行下载安装包, 官网下载较慢

> 官网地址: https://www.sourcetreeapp.com/

> 跳过注册直接开始使用, 执行下列命令:

> `defaults write com.torusknot.SourceTreeNotMAS completedWelcomeWizardVersion 3`

#### 三、git

##### 安装

> 自行下载安装包, 官网地址: https://git-scm.com/download/mac

> 安装过程中一直点击 “继续” 即可

或者

终端运行 `xcode-select --install` 命令，安装Xcode，安装后自带Git命令以及其他命令。

##### 配置

###### 环境变量

>安装完成之后, 在终端中直接执行 git 命令会报错, 这是因为 git 默认安装到 /usr/local/bin 目录下, 而执行 git 命令会自动去找 /usr/bin 目录下的命令, 所以会发生冲突, 此时只需要配置环境变量即可

>输入以下命令打开配置文件, 然后按 i 键进入编辑模式

> `vim ~/.bash_profile`

> 配置以下环境变量

> `export GIT_HOME=/usr/local`		# 设置 git 的安装目录位置
>
> `export PATH=$PATH:$GIT_HOME/bin`		# 设置 path 变量

> 保存配置的环境变量信息: 按 esc, 然后输入 `:wq` 

> 若以上操作还仍不能在根目录下正常执行 git 命令, 则执行 `source ~/.bash_profile` 命令激活配置文件

###### IDEA

> 即使安装了 git, 在 IDEA 中仍会提示相关错误, 此时需要在 IEDA 中配置 git

> file-->setting-->直接搜索 git --> 设置 Path to Git executable 的值 : `usr/local/git/bin/git` 该值为 git 的可执行文件的路径