





#### 安装 docker-compose

直接使用命令安装，但是速度很慢。

~~~sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.29.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
~~~



快速安装方式：

> [发布 · docker/compose --- Releases · docker/compose (github.com)](https://github.com/docker/compose/releases)

去 GitHub 上下载最新版的文件，文件名 `docker-compose-linux-x86_64`。

将文件放到目录 `/usr/local/bin/` 下，然后执行命令

~~~sh
-- 授权
sudo chmod +x /usr/local/bin/docker-compose
-- 验证
docker-compose --version
~~~

---

#### 修改 docker 仓库镜像源

创建名为 `daemon.json` 的文件，放到 `/etc/docker` 目录下，文件内容如下：

~~~json
{
    "registry-mirrors":
    [
        "https://dockerpull.cn"
    ]
}
~~~

重启 docker 并进行验证，在输出的信息中，能够看到 `Registry Mirrors` 部分列出了配置的镜像源。

~~~sh
-- 重启
sudo systemctl daemon-reload
sudo systemctl restart docker
-- 验证
docker info
~~~

