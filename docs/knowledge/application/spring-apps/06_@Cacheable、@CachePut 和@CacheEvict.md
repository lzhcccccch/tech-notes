# 缓存注解 @Cacheable、@CachePut 和 @CacheEvict

[toc]

## 简介

Spring 框架提供了强大的缓存注解功能，主要包括 `@Cacheable`、`@CachePut` 和 `@CacheEvict` 三个核心注解，它们用于控制方法级别的缓存行为。本文将详细介绍这些注解的使用方法和最佳实践。

---

## @Cacheable 详解

`@Cacheable` 是最常用的缓存注解，主要用于缓存方法的返回值。

### 工作原理

- 首次调用：执行方法并缓存结果
- 后续调用：如果缓存中存在数据，直接返回缓存数据，不执行方法
- 如果缓存中不存在，执行方法并缓存结果

### 基本用法

```java
@Cacheable("users")
public User getUser(Long id) {
    // 如果缓存中没有数据，才会执行此方法
    return userRepository.findById(id);
}
```

### 高级配置

```java
@Cacheable(
    value = "users",                  // 缓存名称，必须指定
    key = "#id",                      // 缓存key
    condition = "#id > 0",            // 缓存条件
    unless = "#result == null",       // 不缓存的条件
    sync = true,                      // 是否同步加载
    cacheNames = {"users", "temp"},   // 多个缓存名称
    keyGenerator = "customKeyGenerator" // 自定义key生成器
)
public User getUser(Long id, String name) {
    return userRepository.findByIdAndName(id, name);
}
```

### SpEL 表达式支持

1. **方法参数**：
```java
@Cacheable(value = "users", key = "#user.id + '_' + #user.name")
public User saveUser(User user) {
    return userRepository.save(user);
}
```

2. **复杂键生成**：
```java
@Cacheable(value = "users", key = "T(java.util.Objects).hash(#id, #name)")
public User findUser(Long id, String name) {
    return userRepository.findByIdAndName(id, name);
}
```

3. **条件表达式**：
```java
@Cacheable(
    value = "users",
    condition = "#user.age > 18 and #user.name != null",
    unless = "#result?.status == 'INACTIVE'"
)
public User processUser(User user) {
    return userService.process(user);
}
```

---

## @CachePut 详解

`@CachePut` 用于更新缓存，与 `@Cacheable` 的主要区别是它总是会执行方法。

### 工作原理

- 总是执行方法
- 将返回值放入缓存
- 适合更新操作

### 基本用法

```java
@CachePut(value = "users", key = "#user.id")
public User updateUser(User user) {
    return userRepository.save(user);
}
```

### 与@Cacheable配合使用

```java
@Service
public class UserService {
    
    @Cacheable(value = "users", key = "#id")
    public User getUser(Long id) {
        return userRepository.findById(id);
    }
    
    @CachePut(value = "users", key = "#user.id")
    public User updateUser(User user) {
        return userRepository.save(user);
    }
}
```

###  高级用法

```java
@CachePut(
    value = "users",
    key = "#user.id",
    condition = "#user.version > #root.args[1]",
    unless = "#result.status == 'ERROR'"
)
public User updateUserWithVersion(User user, Integer oldVersion) {
    // 更新逻辑
    return updatedUser;
}
```

---

## @CacheEvict 详解

`@CacheEvict` 用于删除缓存，通常用在删除或更新操作上。

### 工作原理

- 从缓存中删除一个或多个条目
- 可以在方法执行前或执行后删除缓存

### 基本用法

```java
@CacheEvict(value = "users", key = "#id")
public void deleteUser(Long id) {
    userRepository.deleteById(id);
}
```

### 清除所有缓存

```java
@CacheEvict(value = "users", allEntries = true)
public void clearUserCache() {
    // 方法体可以为空
}
```

### 高级配置

```java
@CacheEvict(
    value = "users",
    key = "#user.id",
    beforeInvocation = true,  // 方法执行前清除缓存
    condition = "#user.status == 'DELETED'"
)
public void removeUser(User user) {
    userRepository.delete(user);
}
```

---

## 复合注解 @Caching

### 组合多个缓存操作

```java
@Caching(
    cacheable = {
        @Cacheable(value = "users", key = "#username"),
        @Cacheable(value = "users", key = "#email")
    },
    put = {
        @CachePut(value = "users", key = "#result.id"),
        @CachePut(value = "users", key = "#result.email")
    },
    evict = {
        @CacheEvict(value = "userList", allEntries = true)
    }
)
public User saveUser(String username, String email) {
    return userRepository.save(new User(username, email));
}
```

---

## 缓存配置

### 基础配置

```java
@Configuration
@EnableCaching
public class CacheConfiguration {
    
    @Bean
    public CacheManager cacheManager() {
      	// 默认是 Set
        SimpleCacheManager cacheManager = new SimpleCacheManager();
        List<Cache> caches = new ArrayList<>();
        
        // 配置不同的缓存
        caches.add(new ConcurrentMapCache("users"));
        caches.add(new ConcurrentMapCache("roles"));
        
        cacheManager.setCaches(caches);
        return cacheManager;
    }
}
```

### 使用Caffeine缓存

```java
@Configuration
@EnableCaching
public class CaffeineConfiguration {
    
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        
        // 默认配置
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .initialCapacity(100)
            .maximumSize(500)
            .expireAfterWrite(10, TimeUnit.MINUTES)
            .recordStats());
        
        // 特定缓存配置
        Map<String, Caffeine<Object, Object>> cacheSpecs = new HashMap<>();
        
        cacheSpecs.put("users", Caffeine.newBuilder()
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .maximumSize(1000));
            
        cacheSpecs.put("posts", Caffeine.newBuilder()
            .expireAfterWrite(15, TimeUnit.MINUTES)
            .maximumSize(2000));
            
        cacheManager.setCacheSpecs(cacheSpecs);
        return cacheManager;
    }
}
```

### Redis缓存配置

```java
@Configuration
@EnableCaching
public class RedisConfiguration {
    
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        RedisCacheManager cacheManager = RedisCacheManager.builder(redisConnectionFactory)
            .cacheDefaults(RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                    .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                    .fromSerializer(new GenericJackson2JsonRedisSerializer())))
            .withInitialCacheConfigurations(customCacheConfigurations())
            .build();
            
        return cacheManager;
    }
    
    private Map<String, RedisCacheConfiguration> customCacheConfigurations() {
        Map<String, RedisCacheConfiguration> configMap = new HashMap<>();
        
        configMap.put("users", RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofHours(1)));
            
        configMap.put("posts", RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30)));
            
        return configMap;
    }
}
```

---

## 使用场景示例

### 自定义KeyGenerator

```java
@Configuration
public class CacheKeyConfiguration {
    
    @Bean
    public KeyGenerator customKeyGenerator() {
        return (target, method, params) -> {
            StringBuilder sb = new StringBuilder();
            sb.append(target.getClass().getSimpleName());
            sb.append(":");
            sb.append(method.getName());
            sb.append(":");
            for (Object param : params) {
                sb.append(param.toString());
                sb.append("-");
            }
            return sb.toString();
        };
    }
}
```

### 异常处理

```java
@Cacheable(
    value = "users",
    key = "#id",
    unless = "#result == null",
    condition = "#id > 0"
)
public User getUser(Long id) {
    try {
        return userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    } catch (Exception e) {
        // 异常处理，可能需要清除缓存
        cacheManager.getCache("users").evict(id);
        throw e;
    }
}
```

### 缓存预热

```java
@Component
public class CacheWarmer implements ApplicationListener<ContextRefreshedEvent> {
    
    @Autowired
    private UserService userService;
    
    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        // 系统启动时预热缓存
        List<User> frequentUsers = userService.findFrequentUsers();
        for (User user : frequentUsers) {
            userService.getUser(user.getId()); // 触发缓存
        }
    }
}
```

### 缓存监控

```java
@Configuration
public class CacheMonitoringConfiguration {
    
    @Bean
    public CacheMetricsRegistrar cacheMetricsRegistrar(
            MeterRegistry registry,
            CacheManager cacheManager) {
        
        return new CacheMetricsRegistrar(registry, cacheManager);
    }
}
```

### 多级缓存

自定义多级缓存类

~~~java
public class MultiLevelCache implements Cache {

    private final Cache localCache; // 本地缓存
    private final Cache redisCache; // 分布式缓存

    public MultiLevelCache(Cache localCache, Cache redisCache) {
        this.localCache = localCache;
        this.redisCache = redisCache;
    }

    @Override
    public String getName() {
        return redisCache.getName(); // 使用二级缓存名称
    }

    @Override
    public Object getNativeCache() {
        return redisCache.getNativeCache();
    }

    @Override
    public ValueWrapper get(Object key) {
        // 先查一级缓存
        ValueWrapper value = localCache.get(key);
        if (value != null) {
            return value;
        }

        // 再查二级缓存
        value = redisCache.get(key);
        if (value != null) {
            // 回填到一级缓存
            localCache.put(key, value.get());
        }
        return value;
    }

    @Override
    public void put(Object key, Object value) {
        // 同时更新一级缓存和二级缓存
        localCache.put(key, value);
        redisCache.put(key, value);
    }

    @Override
    public void evict(Object key) {
        // 同时清除一级缓存和二级缓存
        localCache.evict(key);
        redisCache.evict(key);
    }

    @Override
    public void clear() {
        // 同时清空一级缓存和二级缓存
        localCache.clear();
        redisCache.clear();
    }
}
~~~

自定义 CacheManager

~~~java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(CaffeineCacheManager caffeineCacheManager,
                                     RedisCacheManager redisCacheManager) {
        // 自定义多级缓存 CacheManager
        return new MultiLevelCacheManager(caffeineCacheManager, redisCacheManager);
    }
}

class MultiLevelCacheManager implements CacheManager {

    private final CacheManager localCacheManager; // 一级缓存管理器
    private final CacheManager redisCacheManager; // 二级缓存管理器

    public MultiLevelCacheManager(CacheManager localCacheManager, CacheManager redisCacheManager) {
        this.localCacheManager = localCacheManager;
        this.redisCacheManager = redisCacheManager;
    }

    @Override
    public Cache getCache(String name) {
        // 创建多级缓存
        Cache localCache = localCacheManager.getCache(name);
        Cache redisCache = redisCacheManager.getCache(name);
        return new MultiLevelCache(localCache, redisCache);
    }

    @Override
    public Collection<String> getCacheNames() {
        return redisCacheManager.getCacheNames();
    }
}
~~~

---

## 使用建议

1. **合理选择注解**：
   - 查询操作：使用 `@Cacheable`
   - 更新操作：使用 `@CachePut`
   - 删除操作：使用 `@CacheEvict`

2. **注意事项**：
   - 缓存键的设计要合理，避免冲突
   - 考虑缓存过期策略
   - 注意缓存一致性问题
   - 合理设置缓存容量和过期时间
   - 考虑并发情况下的缓存处理

3. **性能考虑**：
   - 只缓存真正需要的数据
   - 避免缓存大对象
   - 设置合适的过期时间
   - 监控缓存命中率

---

## 总结

这些缓存注解是 Spring 框架提供的强大功能，合理使用可以显著提升应用性能。但要注意在使用时考虑缓存策略、过期时间、内存占用等因素，以确保系统的稳定性和可靠性。在实际应用中，需要根据具体场景选择合适的缓存策略和配置，同时要注意缓存的一致性、过期策略和内存占用等问题。