## Redis常用命令

[toc]

#### 一、 键（Key）

```shell
keys *        查看当前库所有key
 
exits key  判断某个key是否存在
 
type key  查看key是什么类型
 
del key        删除指定的key数据
 
unlink key        根据value选择非阻塞删除（仅将keys从keyspace元数据中删除，真正的删除会在后续异步操作）
 
expire key 10  为给定的key设置过期时间（10s）
 
ttl key        查看还有多少秒过期：-1表示永不过期，-2表示已经过期
 
select        切换数据库
 
dbsize        查看当前数据库的key数量
 
flushdb        清空当前库
 
flushall  通杀全部库
```

#### 二、字符串（String）

```shell
set <key><value>  添加键值对
 
get <key>  查询对应键值
 
append <key><value>  将给定的value追加到原值的末尾
 
strlen <key>  获得值的长度
 
setnx <key><value>  只有key不存在时，设置key值
 
incr <key>  将key中储存的数字值增1，只能对数字值操作，如果为空，新增值为1
 
decr <key>  将key中储存的数字值建减1，只能对数字值操作，如果为空，新增值为-1
 
incrby / decrvy <key><步长>  将key中储存的数字值增减，自定义步长
 
mset <key1><value1><key2><value2>……  同时设置一个或多个 key-value 对
 
mget <key1><key2><key3>……  同时获取一个或多个value
 
msetnax  <key1><value1><key2><value2>……  同时设置一个或多个key-value对，当且仅当所有给定key都不存在
 
getrange <key><起始位置><结束位置>  获得值的范围，类似java中的substring，前包，后包
 
setrange <key><起始位置><value>  用<value>覆写<key>所存储的字符串值，从起始位置开始（索引从0开始）
 
setex <key><过期时间><value>  设置键值的同时，设置过期时间（单位：秒）
 
getset <key><value>  以新换旧，设置了新值的同时获得旧值
```

#### 三、列表（List）

```shell
lpush / rpush <key><value1><value2><value3>……  从左边/右边插入一个或多个值
 
lpop / rpop <key>  从左边/右边吐出一个值。值在键在，值光键亡。
 
rpoplpush <key1><key2>  从<key1>列表右边吐出一个值，插到<key2>列表左边
 
lrange <key><start><stop>  按照索引下标获得元素（从左到右）
 
lrange mylist 0 -1  0左边第一个，-1右边第一个（0 -1 表示获取所有）
 
lindex <key><index>  按照索引下标获得元素（从左到右）
 
llen <key>  获得列表长度
 
linsert <key> before <value><newvalue>  在<value>后面插入<newvalue>插入值
 
lrem <key><n><value>  从左边删除n个vlaue（从左到右）
 
lset <key><index><value>  将列表key下标为index的值替换成value
```

#### 四、集合（Set）

```shell
sadd <key><value1><value2>……        将一个或多个member元素加入到集合key中，已经存在的member元素将被忽略
 
smembers <key>        取出该集合的所有值
 
sismember <key><value>        判断集合<key>是否为该<value>值，有1，没有0
 
scard <key>        返回该集合的元素个数
 
srem <key><value1><valu2>……        删除集合中的某个元素
 
spop <key>        随机从该集合中吐出一个值
 
srandmember <key><n>        随机从该集合中取出n个值，不会从集合中删除
 
smove <source><destination>value        把集合中的一个值从一个集合移动到另一额集合
 
sinter<key1><key2>        返回两个集合的交集元素
 
sunion <key1><key2>        返回两个集合的并集元素
 
sdiff <key1><key2>        返回两个集合的差集元素
```

#### 五、哈希（Hash)

```Go
hset <key><field><value>  给<key>结合中的<filed>键赋值<value>
 
hget <key1><field>  从<key1>集合<field>取出value
 
hmset <key1><field1><value1><field2><value2>……  批量设置hash的值
 
hexits <key1><filed>  查看哈希表key中，给定域field是否存在
 
hkeys <key>  列出该hash集合的所有field
 
hvals <key>  列出该hash集合的所有value
 
hincrby <key><field><increment>  为哈希表key中的域field的值加上增量 1 -1
 
hsetnx <key><field><value>  将哈希表key中的域field的值设置为value，当且仅当域field不存在
```

#### 六、有序集合（Zset）

```shell
zadd <key><score1><value1><score2><value2>……  将一个或多个member元素机器score值加入到有序集key中
 
zrange <key><start><stop> [WITHSCORES]  返回有序集key中，下标在strart到stop之间的元素（带WITHSCORES，可以让分数一起返回）
 
zrangebyscore key minmax [withscores][limit offset count]  返回有序集key中，所有score值介于min和max之间的成员(从小到大)
 
zrevrangebyscore key maxmin [withscores][limit offet count]  同上，从大到小排序
 
zincrby <key><increment><value>  为元素的score加上增量
 
zrem <key><value>  删除该集合下，指定值的元素
 
zcount <key><min><max>  统计该集合，分数区间内的元素个数
 
zrank <key><value>  返回该值在集合中的排名，从0开始
```