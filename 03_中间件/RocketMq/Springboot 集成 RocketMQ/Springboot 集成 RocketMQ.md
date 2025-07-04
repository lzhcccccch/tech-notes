## Springboot 集成 RocketMQ

[toc]

#### 一、 背景

本文主要介绍如何在项目中基于 **RocketMQTemplate** 使用 RocketMQ 进行消息的发送与接收，对于基本概念不做过多介绍。

#### 二、 消息方式

只是基于下面的代码实现来进行消息方式的分类

##### 1. 不需要回传的消息发送：syncSend/asyncSend/sendOneWay/convertAndSend/syncSendOrderly

- 同步消息：消息体可以是 Object 和 Message， 但是只有 Message 格式的可以发送延迟消息
  - 单个消息发送
  - 批量消息发送
  - 顺序消息发送（可单个可批量）
  - 延迟消息发送（消息体为 Message，只是多传一个 **deLayLevel** 参数）
- 异步消息：消息体可以是 Object 和 Message， 但是只有 Message 格式的可以发送延迟消息
  - 单个消息发送
  - 批量消息发送
  - 顺序消息发送（可单个可批量）
  - 延迟消息发送（消息体为 Message，只是多传一个 **deLayLevel** 参数）
- 单向消息：只管发送，不管是否发送成功，不适合发送较为重要的消息
  - 单个消息发送
- ConvertAndSend：底层调用了 syncSend(同步发送)

##### 2. 需要回传的消息发送：sendAndReceive

- 指定回调函数：更像是异步发送
- 不指定回调函数：更像是同步发送

##### 3. 事务消息：sendMessageInTransaction

需要增加事物的监听器

消费者与 1 类似，实现 **RocketMQListener** 接口即可

事务消息不支持延迟消息和批量消息

---

#### 三、代码实现

##### 1. 导入 maven 依赖

~~~java
				<dependency>
            <groupId>org.apache.rocketmq</groupId>
            <artifactId>rocketmq-client</artifactId>
            <version>5.0.0-ALPHA</version>
        </dependency>

        <dependency>
            <groupId>org.apache.rocketmq</groupId>
            <artifactId>rocketmq-all</artifactId>
            <version>5.0.0-ALPHA</version>
            <type>pom</type>
        </dependency>

        <dependency>
            <groupId>org.apache.rocketmq</groupId>
            <artifactId>rocketmq-spring-boot-starter</artifactId>
            <version>2.2.2</version>
        </dependency>
~~~

---

##### 2. 启动类

~~~java
@SpringBootApplication
public class RocketMqApplication {

    public static void main(String[] args) {
        SpringApplication.run(RocketMqApplication.class, args);
        System.out.println("--------- start ----------");
    }

}
~~~

---

##### 3. 配置文件

~~~java
server:
  port: 8083

spring:
  application:
    name: Practice-RocketMq

rocketmq:
  name-server: ip:port
  producer:
    group: GROUP_ZACHARY_TEST
    send-message-timeout: 3000  # 发送消息超时时间，单位：毫秒。默认为 3000 。
    retry-times-when-send-failed: 2   # 同步发送消息时，失败重试次数。默认为 2 次。
    retry-times-when-send-async-failed:   2 # 异步发送消息时，失败重试次数。默认为 2 次。
    compress-message-body-threshold: 4096 # 消息压缩阀值，当消息体的大小超过该阀值后，进行消息压缩。默认为 4 * 1024B
    max-message-size: 4194304 # 消息体的最大允许大小。。默认为 4 * 1024 * 1024B
    retry-next-server: false # 发送消息给 broker 时，如果发送失败，是否重试另外一台 Broker 。默认为 false
  consumer:
    group: GROUP_ZACHARY_TEST
~~~

---

##### 4. 不需要回传消息的生产者

~~~java
@Slf4j
@RestController
@RequestMapping("/rocketmq")
public class RocketProvider {

    private final RocketMQTemplate rocketMQTemplate;

    public RocketProvider(RocketMQTemplate rocketMQTemplate) {
        this.rocketMQTemplate = rocketMQTemplate;
    }

    /**
     * 同步发送消息: 阻塞发送 消息体可以是 Object 和 Message 可批量发送
     * producer 向 broker 发送消息, 执行 API 时同步等待, 直到 broker 服务器返回发送结果.
     * 默认执行 2 次, 不指定超时时间则默认用 produce 全局的超时时间(3 秒)
     *
     * @param params
     */
    @PostMapping("/syncSend")
    public void syncSend(@RequestBody Map<String, Object> params) {
        Assert.notNull(params, "MQ 入参不能为空");
        log.info("rocketmq syncSend params :{} " + params.toString());
        String defaultTopic = RocketMqConfig.DEFAULT_TOPIC;
        SendResult objectSendResult = this.rocketMQTemplate.syncSend(defaultTopic, params);
        log.info("rocketmq syncSend result :{} " + JSONObject.toJSONString(objectSendResult));

        /**
         *  Message 类型的消息可以带一些自定义的头部的信息, 比如 Tags Keys ...
         */
        params.put("type", "message");
        Message<Map<String, Object>> message = MessageBuilder.withPayload(params)
                .setHeader(RocketMQHeaders.KEYS, "selfKeys")
                .setHeader(RocketMQHeaders.TAGS, "syncMessage")
                .build();
        log.info("rocketmq syncSend message :{} " + JSONObject.toJSONString(message));
        /**
         *  params: 主题  消息内容   超时时间    延迟等级
         *  delayLevel: 延迟等级, 不同的延迟等级对应不同的延迟时间, 默认支持 18 个等级 "1s 5s 10s 30s 1m 2m 3m 4m 5m 6m 7m 8m 9m 10m 20m 30m 1h 2h"
         *  当消息写入到 broker 中, 不能立马被消费, 需要等待一定时间才可以进行消息, 可以实现定时器等功能, 比如订单超时关闭(设置延迟 30 分钟, 未支付则 MQ 消费取消订单)
         */
        SendResult messageSendResult = this.rocketMQTemplate.syncSend(defaultTopic, message, 3000, 1);
        log.info("rocketmq syncSend result :{} " + JSONObject.toJSONString(messageSendResult));

        /**
         *  批量发送: 消息体只能是 Message 类型
         */
        List<Message> list = this.initList(params).get();
        log.info("rocket batch syncSend params :{} " + JSONObject.toJSONString(list));
        SendResult syncSend = this.rocketMQTemplate.syncSend(defaultTopic, list);
        log.info("batch syncSend result :{} " + JSONObject.toJSONString(syncSend));

        /**
         *  顺序发送: 可发送单个消息, 也可以批量发送
         */
        log.info("orderly syncSend params :{} " + JSONObject.toJSONString(list));
        // 批量发送: 第三个参数是指定发送的队列, 循环发送时可指定为 index
        // 顺序发送可以保证消息有序的被消费, 比如一个完整的订单: 创建订单-->支付-->完成 则需要保证消费消息的顺序, 所以要将这一组消息(三条) 发送到同一个队列进行有序消费
        SendResult syncSendOrderly = this.rocketMQTemplate.syncSendOrderly(defaultTopic, list, "1", 3000);
        log.info("orderly syncSend result :{} " + JSONObject.toJSONString(syncSendOrderly));

        log.info("for orderly syncSend params :{} " + JSONObject.toJSONString(message));
        for (int i = 0; i < 3; i++) {
            SendResult orderly = this.rocketMQTemplate.syncSendOrderly(defaultTopic, message, i + "");
            log.info("foreach orderly syncSend result :{} " + JSONObject.toJSONString(orderly));
        }
    }

    /**
     * 异步发送消息: 非阻塞 消息体可以是 Object 和 Message 可批量发送
     * producer 向 broker 发送消息时指定消息发送成功和发送异常的回调方法, 调用 API 后立即返回
     * producer 发送消息线程不阻塞, 消息发送成功或者失败的回调任务在一个新的线程中执行
     *
     * @param params
     */
    @PostMapping("/asyncSend")
    public void asyncSend(@RequestBody Map<String, Object> params) {
        Assert.notNull(params, "MQ 入参不能为空");
        log.info("rocketmq asyncSend params :{} " + params.toString());
        String defaultTopic = RocketMqConfig.DEFAULT_TOPIC;
        /**
         *  指定异步发送成功或者失败之后的处理方法
         */
        SendCallback callback = new SendCallback() {
            @Override
            public void onSuccess(SendResult sendResult) {
                log.info("异步 MQ 发送成功, result :{} " + JSONObject.toJSONString(sendResult));
            }

            @Override
            public void onException(Throwable throwable) {
                log.info("异步 MQ 发送失败! result :{} " + throwable.getMessage());
                System.out.println(throwable.getStackTrace());
            }
        };
        this.rocketMQTemplate.asyncSend(defaultTopic, params, callback, 3000);
        log.info("rocketmq asyncSend params end :{} ");

        /**
         *  Message 包装
         */
        params.put("type", "message");
        Message<Map<String, Object>> message = MessageBuilder.withPayload(params)
                .setHeader(RocketMQHeaders.TAGS, "asyncMessage")
                .build();
        log.info("rocketmq asyncSend message :{} " + JSONObject.toJSONString(message));
        this.rocketMQTemplate.asyncSend(defaultTopic, message, callback);
        log.info("rocketmq asyncSend message end :{} ");

        /**
         *  批量发送, 消息体只能是 Message 类型
         */
        List<Message> list = this.initList(params).get();
        log.info("rocket batch asyncSend params :{} " + JSONObject.toJSONString(list));
        this.rocketMQTemplate.asyncSend(defaultTopic, list, callback, 3000);
        log.info("batch asyncSend result :{} ");

        /**
         *  顺序发送
         */
        log.info("orderly asyncSend params :{} " + JSONObject.toJSONString(message));
        this.rocketMQTemplate.asyncSendOrderly(defaultTopic, message, "1", callback, 3000);
        log.info("orderly asyncSend result :{} ");

        log.info("for orderly asyncSend params :{} " + JSONObject.toJSONString(list));
        for (int i = 0; i < 3; i++) {
            this.rocketMQTemplate.asyncSendOrderly(defaultTopic, list, i + "", callback, 3000);
            log.info("for orderly asyncSend result :{} ");
        }
    }

    /**
     * 单向消息: 非阻塞消息  消息体可以是 Object 和 Message 可批量发送
     * producer 向 broker 发送消息, 执行 API 时直接返回, 不等待服务器返回结果
     *
     * @param params
     */
    @PostMapping("/sendOneWay")
    public void sendOneWay(@RequestBody Map<String, Object> params) {
        Assert.notNull(params, "MQ 入参不能为空");
        String defaultTopic = RocketMqConfig.DEFAULT_TOPIC;
        log.info("rocketMQ sendOneWay params :{} " + params.toString());
        this.rocketMQTemplate.sendOneWay(defaultTopic + ":sendOneWayObject", params);
        log.info("rocketMQ sendOneWay end :{}");

        params.put("type", "message");
        Message<Map<String, Object>> message = MessageBuilder.withPayload(params)
                .setHeader(RocketMQHeaders.TAGS, "sendOneWayMessage")
                .build();
        log.info("rocketMQ sendOneWay message :{} " + JSONObject.toJSONString(message));
        this.rocketMQTemplate.sendOneWay(defaultTopic, message);
        log.info("rocketMQ sendOneWay end :{} ");
    }

    /**
     * convertAndSend: 底层也是调用了 syncSend
     *
     * @param params
     */
    @PostMapping("/convertAndSend")
    public void convertAndSend(@RequestBody Map<String, Object> params) {
        log.info("convertAndSend params :{} " + JSONObject.toJSONString(params));
        String defaultTopic = RocketMqConfig.DEFAULT_TOPIC;
        this.rocketMQTemplate.convertAndSend(defaultTopic, params);

        Message<Map<String, Object>> message = MessageBuilder.withPayload(params).build();
        this.rocketMQTemplate.convertAndSend(defaultTopic, message);
        log.info("convertAndSend result :{} ");
    }

    /**
     * 事务消息:
     *
     * @param params
     */
    @PostMapping("/sendMessageInTransaction")
    public void sendMessageInTransaction(@RequestBody Map<String, Object> params) {
        log.info("sendMessageInTransaction params :{} " + JSONObject.toJSONString(params));
        String defaultTopic = RocketMqConfig.DEFAULT_TOPIC;

        Message<Map<String, Object>> message = MessageBuilder.withPayload(params).build();
        TransactionSendResult transactionSendResult = this.rocketMQTemplate.sendMessageInTransaction(defaultTopic, message, params);
        log.info("transactionSendResult :{} " + JSONObject.toJSONString(transactionSendResult));
    }


    /**
     * @description: 初始化列表
     * @param: [params]
     * @return: java.util.Optional<java.util.List < org.springframework.messaging.Message>>
     * @author: liuzhichao 2022/6/21 15:47
     */
    private Optional<List<Message>> initList(Map<String, Object> params) {
        List<Message> list = new ArrayList<>(10);
        Message message1 = MessageBuilder.withPayload(params).build();
        list.add(message1);
        Map<String, Object> param1 = new HashMap<>(3);
        param1.put("content", 1002);
        Message message2 = MessageBuilder.withPayload(param1).build();
        list.add(message2);
        Map<String, Object> param2 = new HashMap<>(3);
        param2.put("content", 1003);
        Message message3 = MessageBuilder.withPayload(param2).build();
        list.add(message3);
        Map<String, Object> param3 = new HashMap<>(3);
        param3.put("content", 1004);
        Message message4 = MessageBuilder.withPayload(param3).build();
        list.add(message4);
        Map<String, Object> param4 = new HashMap<>(3);
        param4.put("content", 1005);
        Message message5 = MessageBuilder.withPayload(param4).build();
        list.add(message5);

        return Optional.ofNullable(list);
    }

}
~~~

---

##### 5. 不需要回传消息的消费者

~~~java
@Slf4j
@Component
@RocketMQMessageListener(
        // topic: 消息的发送者使用同一个topic
        topic = RocketMqConfig.DEFAULT_TOPIC,
        // group: 不用和生产者group相同(在 RocketMQ 中消费者和发送者组没有关系)
        consumerGroup = RocketMqConfig.DEFAULT_CONSUMER_GROUP,
        // tag: 设置为 * 时, 表示全部
        selectorExpression = "*",
        // selectorExpression = "sendOneWayObject", // 过滤的不是 Message 类型的 Header 中的 TAG, 而是过滤发送的时候以 topic:tag 形式的 tag
        // 消费模式: 默认 CLUSTERING(CLUSTERING: 负载均衡)(BROADCASTING: 广播机制)
        messageModel = MessageModel.CLUSTERING)
public class RocketConsumer implements RocketMQListener<Map<String, Object>> {

    /**
     *  监听方法
     * @param message
     * 参数可以是 MessageExt 类型, 该类型会携带一些 message 的基本信息, 比如头信息等
     */
    @Override
    public void onMessage(Map<String, Object> message) {
        log.info("rocketMQ receive message params :{} " + JSONObject.toJSONString(message));
    }

}
~~~

---

##### 6. 需要回传消息的生产者

~~~java
@Slf4j
@RestController
@RequestMapping("/rocket/reply")
public class RocketReplyProvider {

    private final RocketMQTemplate rocketMQTemplate;

    public RocketReplyProvider(RocketMQTemplate rocketMQTemplate) {
        this.rocketMQTemplate = rocketMQTemplate;
    }

    @PostMapping("/sendAndReceive")
    public void sendAndReceive(@RequestBody Map<String, Object> params) {
        String defaultTopic = RocketMqConfig.DEFAULT_TOPIC;
        /**
         *  不指定回调函数的方法更像是同步执行, 要等待 consumer 返回结果才继续执行
         *  provider 发送-->consumer 接收-->consumer 返回结果-->provider 拿到结果
         */
        log.info("rocket sendAndReceive params :{} " + JSONObject.toJSONString(params));
        Map receive = this.rocketMQTemplate.sendAndReceive(defaultTopic, params, Map.class, 5000);
        log.info("rocket sendAndReceive result :{} " + JSONObject.toJSONString(receive));

        Message<Map<String, Object>> message = MessageBuilder.withPayload(params).build();
        log.info("rocket sendAndReceive message :{} " + JSONObject.toJSONString(message));
        Map messageReceive = this.rocketMQTemplate.sendAndReceive(defaultTopic, message, Map.class, 5000);
        log.info("rocket sendAndReceive result :{} " + JSONObject.toJSONString(messageReceive));

        /**
         *  指定回调函数更像是异步发送, 不必等待 consumer 返回结果便继续执行下面代码
         */
        params.put("method", "callback");
        log.info("sendAndReceive callback params :{} " + JSONObject.toJSONString(params));
        this.rocketMQTemplate.sendAndReceive(defaultTopic, params, new RocketMQLocalRequestCallback() {
            @Override
            public void onSuccess(Object message) {
                log.info("具有回传消息的 MQ 发送成功, result :{} " + JSONObject.toJSONString(message));
            }

            @Override
            public void onException(Throwable e) {
                log.info("具有回传消息的 MQ 发送失败! result :{} " + e.getMessage());
            }
        }, 6000);
        log.info("sendAndReceive callback result :{} ");

        params.put("type", "message");
        Message<Map<String, Object>> mapMessage = MessageBuilder.withPayload(params).build();
        log.info("sendAndReceive callback message :{} " + JSONObject.toJSONString(mapMessage));
        this.rocketMQTemplate.sendAndReceive(defaultTopic, mapMessage, new RocketMQLocalRequestCallback() {
            @Override
            public void onSuccess(Object message) {
                log.info("具有回传消息的 MQ 发送成功, result :{} " + JSONObject.toJSONString(message));
            }

            @Override
            public void onException(Throwable e) {
                log.info("具有回传消息的 MQ 发送失败! result :{} " + e.getMessage());
            }
        }, 6000);
        log.info("sendAndReceive callback result :{} ");
    }

}
~~~

---

##### 7. 需要回传消息的消费者

~~~java
@Slf4j
@RestController
@RequestMapping("/rocket/reply")
public class RocketReplyProvider {

    private final RocketMQTemplate rocketMQTemplate;

    public RocketReplyProvider(RocketMQTemplate rocketMQTemplate) {
        this.rocketMQTemplate = rocketMQTemplate;
    }

    /**
     *  发送具有回传消息的 Message: 
     *      该方式适用于 producer 发送了消息之后需要根据 broker 的消费拿到一些参数或者要根据结果进行业务处理的场景
     *  有两种形式: 
     *      1. 不指定回调函数: 该方式更像同步发送, 会返回发送结果(成功与否)以及自定义的返回参数, 可以在拿到结果后进行处理
     *      2. 指定回调函数: 该方式更像是异步发送, broker 的处理结果通过回调函数返回, 可以在指定的回调函数中处理相应的逻辑
     * @param params
     */
    @PostMapping("/sendAndReceive")
    public void sendAndReceive(@RequestBody Map<String, Object> params) {
        String defaultTopic = RocketMqConfig.DEFAULT_TOPIC;
        /**
         *  不指定回调函数的方法更像是同步执行, 要等待 consumer 返回结果才继续执行
         *  provider 发送-->consumer 接收-->consumer 返回结果-->provider 拿到结果
         */
        log.info("rocket sendAndReceive params :{} " + JSONObject.toJSONString(params));
        Map receive = this.rocketMQTemplate.sendAndReceive(defaultTopic, params, Map.class, 5000);
        log.info("rocket sendAndReceive result :{} " + JSONObject.toJSONString(receive));

        Message<Map<String, Object>> message = MessageBuilder.withPayload(params).build();
        log.info("rocket sendAndReceive message :{} " + JSONObject.toJSONString(message));
        Map messageReceive = this.rocketMQTemplate.sendAndReceive(defaultTopic, message, Map.class, 5000);
        log.info("rocket sendAndReceive result :{} " + JSONObject.toJSONString(messageReceive));

        /**
         *  指定回调函数更像是异步发送, 不必等待 consumer 返回结果便继续执行下面代码
         */
        params.put("method", "callback");
        log.info("sendAndReceive callback params :{} " + JSONObject.toJSONString(params));
        this.rocketMQTemplate.sendAndReceive(defaultTopic, params, new RocketMQLocalRequestCallback() {
            @Override
            public void onSuccess(Object message) {
                log.info("具有回传消息的 MQ 发送成功, result :{} " + JSONObject.toJSONString(message));
            }

            @Override
            public void onException(Throwable e) {
                log.info("具有回传消息的 MQ 发送失败! result :{} " + e.getMessage());
            }
        }, 6000);
        log.info("sendAndReceive callback result :{} ");

        params.put("type", "message");
        Message<Map<String, Object>> mapMessage = MessageBuilder.withPayload(params).build();
        log.info("sendAndReceive callback message :{} " + JSONObject.toJSONString(mapMessage));
        this.rocketMQTemplate.sendAndReceive(defaultTopic, mapMessage, new RocketMQLocalRequestCallback() {
            @Override
            public void onSuccess(Object message) {
                log.info("具有回传消息的 MQ 发送成功, result :{} " + JSONObject.toJSONString(message));
            }

            @Override
            public void onException(Throwable e) {
                log.info("具有回传消息的 MQ 发送失败! result :{} " + e.getMessage());
            }
        }, 6000);
        log.info("sendAndReceive callback result :{} ");
    }

}
~~~

---

##### 8. 事务消息的发送方式

发送事务消息需要指定监听器，发送者和接收者可以与上面的通用

~~~java
    /**
     * 事务消息:
     * RocketMQ 事务消息是指应用本地事务和发送消息操作可以被定义到全局事务中, 要么同时成功, 要么同时失败.
     * RocketMQ 的事务消息提供类似 X/Open XA 的分布式事务功能, 通过事务消息能达到分布式事务的最终一致
     * @param params
     */
    @PostMapping("/sendMessageInTransaction")
    public void sendMessageInTransaction(@RequestBody Map<String, Object> params) {
        log.info("sendMessageInTransaction params :{} " + JSONObject.toJSONString(params));
        String defaultTopic = RocketMqConfig.DEFAULT_TOPIC;

        Message<Map<String, Object>> message = MessageBuilder.withPayload(params).build();
        TransactionSendResult transactionSendResult = this.rocketMQTemplate.sendMessageInTransaction(defaultTopic, message, params);
        log.info("transactionSendResult :{} " + JSONObject.toJSONString(transactionSendResult));
    }
~~~

监听器

~~~java
@Slf4j
@RocketMQTransactionListener
public class TransactionListener implements RocketMQLocalTransactionListener {

    /**
     * 1. producer 向 broker 发送消息
     * 2. broker 将消息存储到 RMQ_SYS_TRANS_HALF_TOPIC 主题下之后, 向 producer 发送 ACK 消息确认, 此时消息成为半消息
     * 3. producer 开始执行本地事务逻辑
     * 4. producer 根据本地事务执行结果向 broker 提交二次确认(Commit 或者 Rollback) :
     *  4.1 broker 接收到 Commit 状态则将半消息标记为可投递, 重新发送到原 Topic 下, broker 重新进行消费
     *  4.2 broker 接收到 Rollback 状态则将消息丢弃
     *
     * 在断网或者是应用重启的特殊情况下, 上述步骤 4 提交的二次确认最终未到达 broker，经过固定时间后相关 broker 将对该消息发起消息回查
     * producer 收到消息回查后, 需要检查对应消息的本地事务执行的最终结果
     * producer 根据检查得到的本地事务的最终状态再次提交二次确认, broker 仍按照步骤 4 对半消息进行操作。
     */

    /**
     * 执行本地事务
     * @param msg
     * @param arg
     * @return 通过返回结果来判断是提交还是回滚还是未知状态
     */
    @Override
    public RocketMQLocalTransactionState executeLocalTransaction(Message msg, Object arg) {
        log.info("RocketMQ 事务消息消费者 - 执行本地事务... params :{} " + JSONObject.toJSONString(msg));
        /** msg 的 payload 消息格式为 base64 加密后的, 但是用 base64 进行解密失败 */
        // String json = Base64.getDecoder().decode(msg.getPayload().toString()).toString();
        // Map<String, Object> params = JSONObject.toJavaObject(JSONObject.parseObject(json), Map.class);
        // Integer content = (Integer) params.get("content");

        Map<String, Object> params = (Map<String, Object>) arg;
        Integer content = (Integer) params.get("content");
        if (content > 1000 && content < 2000) {
            log.info("executeLocalTransaction commit params :{} " + content);
            // 消息通过, 允许消费者消费消息
            return RocketMQLocalTransactionState.COMMIT;
        }
        if (content > 2000) {
            log.info("executeLocalTransaction rollback params :{} " + content);
            // 明确回复回滚操作, 消息将会被删除, 不允许被消费
            return RocketMQLocalTransactionState.ROLLBACK;
        }

        log.info("executeLocalTransaction unknown params :{} " + content);
        // 消息无响应, 代表需要回查本地事务状态来决定是提交还是回滚事务
        return RocketMQLocalTransactionState.UNKNOWN;
    }

    /**
     * 回查本地事务, 根据检查结果(return)来判断是提交还是回滚
     * @param msg
     * @return
     */
    @Override
    public RocketMQLocalTransactionState checkLocalTransaction(Message msg) {
        log.info("RocketMQ 事务消息消费者 - 回查本地事务... params :{} " + JSONObject.toJSONString(msg));

        /** msg 消息的 payload 为字节码, 不知道该怎么解析 */
        // String json = Base64.getDecoder().decode(msg.getPayload().toString()).toString();
        // Map<String, Object> params = JSONObject.toJavaObject(JSONObject.parseObject(json), Map.class);
        // Integer content = (Integer) params.get("content");
        //
        // if (content > 1000 && content < 2000) {
        //     log.info("checkLocalTransaction commit params :{} " + content);
        //     return RocketMQLocalTransactionState.COMMIT;
        // }
        // if (content > 2000) {
        //     log.info("checkLocalTransaction rollback params :{} " + content);
        //     return RocketMQLocalTransactionState.ROLLBACK;
        // }

        log.info("checkLocalTransaction unknown params :{} ");
        return RocketMQLocalTransactionState.UNKNOWN;
    }

}
~~~

---

#### 四、项目地址

> https://github.com/Liuuzhichao/Personal-Practice/tree/master/RocketMQ