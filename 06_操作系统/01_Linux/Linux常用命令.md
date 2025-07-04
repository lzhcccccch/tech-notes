## Linux常用命令

[toc]

#### 创建文件夹、文件

##### mkdir 

~~~ bash
mkdir fileName 
~~~

##### touch

~~~bash
touch dir/file.type

touch file.type
~~~

touch 命令用的并不多，主要用于修改指定文件的访问和修改时间属性。

当文件不存在时，则创建一个新的文件。touch只能创建空文件。

##### vi

~~~bash
vi file.type
~~~

vi 命令可以直接创建并打开该 type 类型的文件

##### echo

~~~bash
echo “xxx” > file.type
~~~

echo 命令可以直接创建文件并将 xxx 写入文件 

##### less、more、 cat

三者都是将文件内容输出到标准输出，其中less和more可以分页显示，cat是显示全部。

三者可以根据已经存在的文件创建新的文件。假设已经存在文件1.txt。

~~~bash
cat 1.txt > 2.txt

less 1.txt > 3.txt

more 1.txt > 4.txt
~~~

此时创建的文件内容都和1.txt中文件内容相同。

---

#### 查看进程以及端口

##### losf -i:port 

lsof -i 用以显示符合条件的进程情况，lsof （list open files) 是一个列出当前系统打开文件的工具。

> root 用户执行lsof -i 命令
>
> 各列信息意义如下：
> command ：进程的名称  PID ：进程标识符
> USER：进程所有者
> FD：文件描述符，应用程序通过文件描述识别该文件。如cwd，txt等
> TYPE：文件类型，如DIR,REG 等
> DEVICE:指定磁盘名称
> SIZE:文件的大小
> NODE：索引节点（文件在磁盘上的标识）
> NAME：打开文件的确切名称

~~~bash
lsof -i ：port
~~~

查看指定某一端口的占用情况。

~~~bash
ps aux | grep pid
~~~

 根据上面命令查出的 pid，可以查询进程信息。

##### netstat -tunlp |grep port

netstat -tunlp 用于显示tcp，ucp的端口和进程等相关情况

>-t (tcp) 仅显示tcp相关选项     -u (udp) 仅显示udp相关选项
>
>-n 拒绝显示列名，能显示数字的全部转化为数字  
>
>-l 仅显示出在listen(监听）的服务状态
>
>-p 显示潜力相关链接的程序名

~~~bash
netstat -tunlp |grep port
~~~

  用于查看指定端口号的进程。

---

#### 查看文件大小

#####  `ls` 

- 显示文件大小（以字节为单位）：

  ```bash
  ls -l filename
  ```

- 人类可读格式（如 KB、MB）：

  ```bash
  ls -lh filename
  ```

##### `du` 

- 显示文件大小（以字节为单位）：

  ```bash
  du -b filename
  ```

- 人类可读格式：

  ```bash
  du -h filename
  ```

1. **使用 `stat` 命令**：

   - 显示详细的文件信息，包括大小：

     ```bash
     stat filename
     ```

---

#### 查看文件夹大小

##### `du`

- 显示文件夹大小（以字节为单位）：

  ```bash
  du -sb foldername
  ```

- 人类可读格式：

  ```bash
  du -sh foldername
  ```

- 显示文件夹内所有文件和子文件夹的大小：

- ```bash
  du -ah foldername
  ```

---













#### 将 springboot 项目部署到Linux 并启动

>  下载 jdk，使用 yum 方式安装，环境变量可自动配置

~~~bash
yum install -y java-1.8.0-openjdk-devel.x86_64
~~~

###### 首次部署需要在相应文件夹下执行以下命令：

启动程序

~~~bash
nohup java -jar springbootProject.jar &
~~~

退出 

~~~bash
ctrl+c
~~~

查看日志

~~~bash
tail -500f nohup.out
~~~

###### 非首次部署需要在相应文件夹下执行以下命令：

捕获上一个版本程序的进程

~~~bash
ps - ef|grep springbootProject.jar
~~~

杀死对应的进程

~~~bash
kill 进程号
~~~

启动程序

~~~bash
nohup java -jar springbootProject.jar &
~~~

退出

~~~bash
ctrl+c 
~~~

查看日志

~~~bash
tail -500f nohup.out
~~~

---

