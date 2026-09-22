# Spring Boot 常用注解

[toc]

## 简介

Spring Boot 作为当今最流行的 Java 开发框架，其强大的功能很大程度上依赖于其丰富的注解系统。本文将全面介绍 Spring Boot 的核心注解体系，包括 Spring 核心注解、Spring MVC 注解、Spring Boot 特有注解、Spring AOP 注解以及 Spring Data JPA 注解。通过系统化的学习和实践这些注解，开发者可以更好地利用 Spring Boot 的特性，提高开发效率，构建高质量的应用程序。

---

## Spring 核心注解
Spring 核心注解是 Spring Framework 的基础，它们定义了 Spring 应用程序的骨架结构。主要包括以下几个方面：

### 组件注解（@Component 及其衍生注解）

#### @Component

最基础的 Spring 组件注解，表示一个类是 Spring 管理的组件。

```java
@Component
public class CommonComponent {
    // 通用组件实现
}
```

使用场景：

- 通用组件标记
- 不属于特定层的组件
- 自定义组件

#### @Service

用于标注业务层组件。

```java
@Service
public class UserService {
    private final UserRepository userRepository;
    
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    public User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    }
}
```

最佳实践：

- 使用构造器注入
- 保持业务逻辑的独立性
- 避免在服务层直接处理 Web 相关的对象

#### @Repository

用于标注数据访问层组件。

```java
@Repository
public class JpaUserRepository implements UserRepository {
    @PersistenceContext
    private EntityManager entityManager;
    
    @Override
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(entityManager.find(User.class, id));
    }
}
```

特点：

- 自动异常转换
- 数据访问层统一管理
- 事务管理支持

#### @Controller

用于标注 Web 控制层组件。

```java
@Controller
@RequestMapping("/users")
public class UserController {
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @GetMapping("/{id}")
    public String getUser(@PathVariable Long id, Model model) {
        model.addAttribute("user", userService.findById(id));
        return "user/detail";
    }
}
```

#### @RestController

RESTful Web 服务的控制器。

```java
@RestController
@RequestMapping("/api/users")
public class UserRestController {
    private final UserService userService;
    
    public UserRestController(UserService userService) {
        this.userService = userService;
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }
}
```

### 配置相关注解

#### @Configuration

标识一个类为配置类。

```java
@Configuration
public class AppConfig {
    @Bean
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:mysql://localhost:3306/mydb");
        config.setUsername("user");
        config.setPassword("password");
        return new HikariDataSource(config);
    }
    
    @Bean
    public JdbcTemplate jdbcTemplate(DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
```

#### @Bean

在配置类中定义 Bean。

```java
@Configuration
public class SecurityConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    @Conditional(CustomSecurityCondition.class)
    public SecurityManager securityManager() {
        return new CustomSecurityManager();
    }
}
```

Bean 的作用域：

```java
@Bean
@Scope("singleton") // 默认
public UserService userService() { ... }

@Bean
@Scope("prototype")
public PrototypeBean prototypeBean() { ... }

@Bean
@Scope("request")
public RequestScopedBean requestBean() { ... }
```

#### @Autowired

自动装配依赖，支持多种注入方式。

1. 构造器注入（推荐）：

```java
@Service
public class UserService {
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    @Autowired // 可以省略，因为只有一个构造器
    public UserService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }
}
```

2. Setter 注入：

```java
@Service
public class NotificationService {
    private MessageSender messageSender;
    
    @Autowired
    public void setMessageSender(MessageSender messageSender) {
        this.messageSender = messageSender;
    }
}
```

3. 字段注入（不推荐）：

```java
@Service
public class OrderService {
    @Autowired
    private PaymentService paymentService; // 不推荐这种方式
}
```

#### @Qualifier

当存在多个同类型的 Bean 时，使用 @Qualifier 指定注入哪个 Bean。

```java
@Configuration
public class MessagingConfig {
    @Bean
    public MessageSender emailSender() {
        return new EmailMessageSender();
    }
    
    @Bean
    public MessageSender smsSender() {
        return new SmsMessageSender();
    }
}

@Service
public class NotificationService {
    private final MessageSender messageSender;
    
    @Autowired
    public NotificationService(@Qualifier("emailSender") MessageSender messageSender) {
        this.messageSender = messageSender;
    }
}
```

#### @Value

注入配置属性或表达式的值。

```java
@Component
public class AppProperties {
    @Value("${app.name}")
    private String appName;
    
    @Value("${app.description:Default description}")
    private String description;
    
    @Value("#{systemProperties['user.region']}")
    private String region;
    
    @Value("#{T(java.lang.Math).random() * 100.0}")
    private double randomNumber;
}
```

### 条件注解

#### @Profile

基于环境的条件配置。

```java
@Configuration
@Profile("development")
public class DevConfig {
    @Bean
    public DataSource dataSource() {
        return new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2)
            .build();
    }
}

@Configuration
@Profile("production")
public class ProdConfig {
    @Bean
    public DataSource dataSource() {
        // 生产环境数据源配置
    }
}
```

#### @Conditional

更细粒度的条件配置。

```java
@Configuration
public class CacheConfig {
    @Bean
    @ConditionalOnClass(name = "redis.clients.jedis.Jedis")
    public CacheManager redisCacheManager() {
        return new RedisCacheManager();
    }
    
    @Bean
    @ConditionalOnMissingBean(CacheManager.class)
    public CacheManager simpleCacheManager() {
        return new SimpleCacheManager();
    }
}
```

### 注意事项

1. 优先使用构造器注入
2. 使用 final 字段
3. 遵循单一职责原则
4. 避免循环依赖

### 小结

Spring 核心注解是构建 Spring 应用的基础，正确使用这些注解可以：

- 实现松耦合的系统设计
- 提高代码的可维护性
- 简化配置管理
- 提升开发效率

---

## Spring MVC 注解
Spring MVC 是 Spring Framework 中最常用的 Web 框架。Web 开发中最常用的注解集合：

### 控制器注解

#### @Controller 与 @RestController

```java
// 传统 Web MVC 控制器
@Controller
@RequestMapping("/web")
public class WebController {
    @GetMapping("/page")
    public String getPage(Model model) {
        model.addAttribute("message", "Hello World");
        return "page";  // 返回视图名
    }
}

// RESTful API 控制器
@RestController
@RequestMapping("/api")
public class ApiController {
    @GetMapping("/data")
    public ResponseEntity<Map<String, String>> getData() {
        return ResponseEntity.ok(Map.of("message", "Hello World"));
    }
}
```

#### @RequestMapping 及其变体

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    // GET 请求
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) { ... }
    
    // POST 请求
    @PostMapping
    public User createUser(@RequestBody User user) { ... }
    
    // PUT 请求
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User user) { ... }
    
    // DELETE 请求
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) { ... }
    
    // PATCH 请求
    @PatchMapping("/{id}")
    public User patchUser(@PathVariable Long id, @RequestBody Map<String, Object> updates) { ... }
    
    // 自定义请求方法和请求头
    @RequestMapping(
        method = RequestMethod.GET,
        headers = "Accept=application/json",
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public List<User> getUsersWithHeader() { ... }
}
```

### 请求参数处理注解

#### @RequestParam

处理查询参数和表单数据。

```java
@GetMapping("/search")
public List<User> searchUsers(
    @RequestParam(required = false) String name,
    @RequestParam(defaultValue = "1") int page,
    @RequestParam(value = "size", defaultValue = "10") int pageSize,
    @RequestParam(name = "sort", required = false) List<String> sortFields
) {
    return userService.searchUsers(name, page, pageSize, sortFields);
}
```

#### @PathVariable

处理 URL 路径变量。

```java
@GetMapping("/users/{userId}/orders/{orderId}")
public Order getOrder(
    @PathVariable("userId") Long userId,
    @PathVariable Long orderId,  // 变量名匹配时可以省略 value
    @PathVariable(required = false) String type
) {
    return orderService.getOrder(userId, orderId, type);
}
```

#### @RequestBody

处理请求体数据。

```java
@PostMapping("/users")
public ResponseEntity<User> createUser(
    @RequestBody @Valid UserCreateRequest request,
    @RequestHeader("X-API-Version") String apiVersion
) {
    User user = userService.createUser(request);
    return ResponseEntity.created(URI.create("/api/users/" + user.getId()))
        .body(user);
}
```

#### @RequestHeader

处理请求头信息。

```java
@GetMapping("/info")
public Map<String, String> getInfo(
    @RequestHeader("User-Agent") String userAgent,
    @RequestHeader(value = "Accept-Language", defaultValue = "en-US") String language,
    @RequestHeader HttpHeaders headers  // 获取所有请求头
) {
    return Map.of(
        "userAgent", userAgent,
        "language", language,
        "allHeaders", headers.toString()
    );
}
```

### 响应处理注解

#### @ResponseBody

```java
@Controller
public class MixedController {
    @GetMapping("/view")
    public String getView() {  // 返回视图
        return "view-name";
    }
    
    @GetMapping("/data")
    @ResponseBody
    public Map<String, Object> getData() {  // 返回 JSON
        return Map.of("key", "value");
    }
}
```

#### @ResponseStatus

```java
@PostMapping("/users")
@ResponseStatus(HttpStatus.CREATED)
public User createUser(@RequestBody User user) {
    return userService.createUser(user);
}

@ResponseStatus(code = HttpStatus.NOT_FOUND, reason = "User not found")
public class UserNotFoundException extends RuntimeException {
    // 自定义异常
}
```

### 数据验证注解

#### @Valid 和 @Validated

```java
public class UserRequest {
    @NotBlank
    @Size(min = 2, max = 50)
    private String name;
    
    @Email
    private String email;
    
    @Min(18)
    private int age;
    
    // getters and setters
}

@RestController
@Validated
public class UserController {
    @PostMapping("/users")
    public User createUser(@RequestBody @Valid UserRequest request) {
        return userService.createUser(request);
    }
    
    @GetMapping("/users/{id}")
    public User getUser(@PathVariable @Min(1) Long id) {
        return userService.getUser(id);
    }
}
```

### 异常处理注解

#### @ExceptionHandler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiError handleUserNotFound(UserNotFoundException ex) {
        return new ApiError("USER_NOT_FOUND", ex.getMessage());
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError handleValidationErrors(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .collect(Collectors.toList());
        
        return new ApiError("VALIDATION_FAILED", errors);
    }
}
```

### 跨域处理注解

#### @CrossOrigin

```java
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class ApiController {
    @GetMapping("/data")
    @CrossOrigin(
        origins = {"http://domain1.com", "http://domain2.com"},
        methods = {RequestMethod.GET, RequestMethod.POST},
        allowedHeaders = "Content-Type",
        exposedHeaders = "X-Custom-Header",
        maxAge = 3600
    )
    public Map<String, Object> getData() {
        return Map.of("data", "value");
    }
}
```

### 小结

Spring MVC 注解提供了强大而灵活的 Web 开发能力：

- 简化了 RESTful API 的开发
- 提供了全面的请求处理能力
- 支持灵活的数据验证
- 具备完善的错误处理机制

---

## Spring Boot 特有注解
Spring Boot 在 Spring Framework 的基础上引入了许多便捷的注解，这些注解大大简化了应用程序的配置和开发过程。Spring Boot 框架独有的便捷注解：

### 应用程序配置注解

#### @SpringBootApplication

Spring Boot 应用程序的核心注解，它结合了三个重要注解：

```java
@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}

// 等价于以下三个注解的组合：
@Configuration
@EnableAutoConfiguration
@ComponentScan
public class MyApplication {
    // ...
}
```

#### @EnableAutoConfiguration

启用 Spring Boot 的自动配置机制。

```java
@Configuration
@EnableAutoConfiguration(exclude = {
    DataSourceAutoConfiguration.class,
    SecurityAutoConfiguration.class
})
public class CustomConfig {
    // 自定义配置
}
```

### 配置属性注解

#### @ConfigurationProperties

将配置文件中的属性映射到 Java 对象。

```java
@Configuration
@ConfigurationProperties(prefix = "app")
@Validated
public class AppProperties {
    @NotNull
    private String name;
    
    private String description;
    
    @Min(1)
    @Max(100)
    private int maxConnections = 20;
    
    private Map<String, String> settings = new HashMap<>();
    
    // getters and setters
}

# application.yml
app:
  name: "My Application"
  description: "Sample Application"
  max-connections: 50
  settings:
    timeout: "5s"
    retry-count: "3"
```

#### @EnableConfigurationProperties

启用 @ConfigurationProperties 注解的配置类。

```java
@Configuration
@EnableConfigurationProperties(AppProperties.class)
public class AppConfig {
    @Autowired
    private AppProperties appProperties;
    
    @Bean
    public SomeService someService() {
        return new SomeService(appProperties);
    }
}
```

### 条件注解

#### @ConditionalOnClass

根据类路径中是否存在指定类来决定是否创建 Bean。

```java
// 示例：当 RedisTemplate 类存在时才创建配置
@Configuration
@ConditionalOnClass(name = "org.springframework.data.redis.core.RedisTemplate")
public class RedisConfig {
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        return template;
    }
}
```

#### @ConditionalOnMissingBean

当容器中不存在指定的 Bean 时才创建新的 Bean。

```java
// 示例：当没有 DataSource Bean 时创建默认数据源
@Configuration
public class DataSourceAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public DataSource defaultDataSource() {
        return DataSourceBuilder.create()
                .url("jdbc:h2:mem:testdb")
                .username("sa")
                .password("")
                .build();
    }
}
```

#### @ConditionalOnProperty

根据配置文件中的属性值决定是否创建 Bean。

```java
// 示例：根据配置属性启用/禁用功能
@Configuration
@ConditionalOnProperty(
    prefix = "app.feature",
    name = "enabled",
    havingValue = "true",
    matchIfMissing = false // 如果未设置属性，是否应该匹配条件。默认为false。
)
public class FeatureConfiguration {
    @Bean
    public FeatureService featureService() {
        return new FeatureService();
    }
}
```

#### @ConditionalOnWebApplication 和 @ConditionalOnNotWebApplication

@ConditionalOnWebApplication：仅在 Web 应用环境下创建 Bean；

@ConditionalOnNotWebApplication：仅在非 Web 应用环境下创建 Bean。

```java
@Configuration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class WebConfig {
    // Web 应用特定配置
}

@Configuration
@ConditionalOnNotWebApplication
public class StandaloneConfig {
    // 非 Web 应用配置
}
```

### 端点和监控注解

#### @Endpoint

自定义 Actuator 端点。

```java
@Endpoint(id = "custom")
public class CustomEndpoint {
    @ReadOperation
    public Map<String, Object> getInfo() {
        return Map.of(
            "status", "UP",
            "details", "Custom endpoint details"
        );
    }
    
    @WriteOperation
    public void updateInfo(@Selector String key, String value) {
        // 更新操作
    }
}
```

#### @WebEndpoint

```java
@WebEndpoint(id = "status")
public class StatusEndpoint {
    @ReadOperation
    public Health getStatus() {
        return Health.up()
            .withDetail("lastChecked", new Date())
            .build();
    }
}
```

### 缓存注解增强

#### @CacheConfig

```java
@Service
@CacheConfig(cacheNames = "users")
public class UserService {
    @Cacheable(key = "#id")
    public User getUser(Long id) {
        return userRepository.findById(id).orElse(null);
    }
    
    @CachePut(key = "#user.id")
    public User updateUser(User user) {
        return userRepository.save(user);
    }
    
    @CacheEvict(allEntries = true)
    public void clearCache() {
        // 清除缓存
    }
}
```

### 测试注解

#### @SpringBootTest

```java
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = "spring.profiles.active=test"
)
class MyApplicationTests {
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void contextLoads() {
        // 测试上下文加载
    }
    
    @Test
    void testEndpoint() {
        ResponseEntity<String> response = restTemplate.getForEntity("/api/test", String.class);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}
```

#### @TestConfiguration

```java
@TestConfiguration
public class TestConfig {
    @Bean
    public TestService testService() {
        return new TestService();
    }
}

@SpringBootTest
class ServiceTests {
    @Autowired
    private TestService testService;
    
    // 测试方法
}
```

### 安全配置注解

#### @EnableWebSecurity

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
                .antMatchers("/public/**").permitAll()
                .anyRequest().authenticated()
            .and()
            .formLogin()
                .loginPage("/login")
                .permitAll();
    }
}
```

### 小结

Spring Boot 特有注解极大地简化了应用程序的开发：

- 自动配置减少了手动配置的需求
- 条件注解提供了灵活的配置方案
- 配置属性注解简化了外部配置的处理
- 测试注解支持全面的测试场景

---

## Spring AOP 注解
面向切面编程（AOP）是 Spring 框架的核心特性之一。面向编程注解：

### 核心注解

#### @Aspect

定义切面类。

```java
@Aspect
@Component
public class LoggingAspect {
    private final Logger logger = LoggerFactory.getLogger(this.getClass());
    
    // 切面方法将在这里定义
}
```

#### @EnableAspectJAutoProxy

启用 AspectJ 自动代理。

```java
@Configuration
@EnableAspectJAutoProxy(proxyTargetClass = true)
public class AopConfig {
    // AOP 配置
}
```

### 切点表达式注解

#### @Pointcut

定义可重用的切点。

```java
@Aspect
@Component
public class ServiceAspect {
    // 所有 service 包下的方法
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void serviceLayer() {}
    
    // 带有 @Transactional 注解的方法
    @Pointcut("@annotation(org.springframework.transaction.annotation.Transactional)")
    public void transactionalOperation() {}
    
    // 组合切点
    @Pointcut("serviceLayer() && transactionalOperation()")
    public void transactionalServiceOperation() {}
}
```

### 通知注解

#### @Before

前置通知。

```java
@Aspect
@Component
public class MethodLoggingAspect {
    private final Logger logger = LoggerFactory.getLogger(this.getClass());
    
    @Before("execution(* com.example.service.*.*(..))")
    public void logBefore(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();
        logger.info("Executing method: {} with arguments: {}", methodName, Arrays.toString(args));
    }
}
```

#### @After

后置通知。

```java
@Aspect
@Component
public class ResourceCleanupAspect {
    @After("execution(* com.example.service.*.*(..))")
    public void cleanup(JoinPoint joinPoint) {
        // 资源清理逻辑
        String methodName = joinPoint.getSignature().getName();
        logger.info("Cleaned up resources after executing: {}", methodName);
    }
}
```

####  @AfterReturning

返回通知。

```java
@Aspect
@Component
public class ResultLoggingAspect {
    @AfterReturning(
        pointcut = "execution(* com.example.service.*.*(..))",
        returning = "result"
    )
    public void logResult(JoinPoint joinPoint, Object result) {
        String methodName = joinPoint.getSignature().getName();
        logger.info("Method {} returned: {}", methodName, result);
    }
}
```

#### @AfterThrowing

异常通知。

```java
@Aspect
@Component
public class ExceptionLoggingAspect {
    @AfterThrowing(
        pointcut = "execution(* com.example.service.*.*(..))",
        throwing = "ex"
    )
    public void logException(JoinPoint joinPoint, Exception ex) {
        String methodName = joinPoint.getSignature().getName();
        logger.error("Exception in {}: {}", methodName, ex.getMessage(), ex);
    }
}
```

#### @Around

环绕通知。

```java
@Aspect
@Component
public class PerformanceMonitoringAspect {
    @Around("execution(* com.example.service.*.*(..))")
    public Object measureExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        
        try {
            // 执行原方法
            Object result = joinPoint.proceed();
            
            long executionTime = System.currentTimeMillis() - startTime;
            String methodName = joinPoint.getSignature().getName();
            logger.info("Method {} executed in {} ms", methodName, executionTime);
            
            return result;
        } catch (Throwable ex) {
            logger.error("Exception during method execution", ex);
            throw ex;
        }
    }
}
```

### 示例

#### 方法执行时间监控

```java
@Aspect
@Component
public class PerformanceAspect {
    private final Logger logger = LoggerFactory.getLogger(this.getClass());
    
    @Around("@annotation(com.example.annotation.MonitorPerformance)")
    public Object monitorPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        
        Object result = joinPoint.proceed();
        
        stopWatch.stop();
        String methodName = joinPoint.getSignature().getName();
        logger.info("Method {} executed in {} ms", methodName, stopWatch.getTotalTimeMillis());
        
        return result;
    }
}

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface MonitorPerformance {}
```

#### 接口日志记录

```java
@Aspect
@Component
public class ApiLoggingAspect {
    @Around("@annotation(org.springframework.web.bind.annotation.RequestMapping)")
    public Object logApiCall(ProceedingJoinPoint joinPoint) throws Throwable {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder
            .currentRequestAttributes()).getRequest();
        
        String requestBody = getRequestBody(request);
        logger.info("API Request - URI: {}, Method: {}, Body: {}", 
            request.getRequestURI(), request.getMethod(), requestBody);
        
        Object response = joinPoint.proceed();
        
        logger.info("API Response: {}", response);
        return response;
    }
}
```

### 注意事项

1. 避免循环依赖
2. 合理使用切面粒度
3. 注意性能影响
4. 正确处理异常
5. 遵循单一职责原则

### 小结

Spring AOP 注解提供了强大的面向切面编程能力：

- 简化了横切关注点的处理
- 提供了灵活的切点表达式
- 支持多种类型的通知
- 适用于多种实际应用场景

---

## Spring Data JPA 注解
Spring Data JPA 提供了一套强大的注解体系，用于简化数据库访问层的开发。数据访问层相关注解：

### 实体类注解

#### @Entity

标记一个类为 JPA 实体。

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "username", nullable = false, unique = true)
    private String username;
    
    @Column(name = "email", length = 100)
    private String email;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // getters and setters
}
```

####  @Table

指定实体映射的数据库表。

```java
@Entity
@Table(
    name = "products",
    indexes = {
        @Index(name = "idx_product_name", columnList = "name"),
        @Index(name = "idx_product_category", columnList = "category_id")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_product_code", columnNames = "product_code")
    }
)
public class Product {
    // 实体属性
}
```

### 字段映射注解

#### 主键生成策略

```java
@Entity
public class Order {
    // 自增主键
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // UUID 主键
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
        name = "UUID",
        strategy = "org.hibernate.id.UUIDGenerator"
    )
    private String id;
    
    // 序列生成器
    @Id
    @GeneratedValue(
        strategy = GenerationType.SEQUENCE,
        generator = "order_seq"
    )
    @SequenceGenerator(
        name = "order_seq",
        sequenceName = "order_sequence",
        allocationSize = 1
    )
    private Long id;
}
```

#### 关系映射

##### 一对多关系

```java
@Entity
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToMany(
        mappedBy = "department",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private Set<Employee> employees = new HashSet<>();
}

@Entity
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;
}
```

##### 多对多关系

```java
@Entity
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToMany
    @JoinTable(
        name = "student_course",
        joinColumns = @JoinColumn(name = "student_id"),
        inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    private Set<Course> courses = new HashSet<>();
}

@Entity
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToMany(mappedBy = "courses")
    private Set<Student> students = new HashSet<>();
}
```

#### 嵌入式对象

```java
@Embeddable
public class Address {
    private String street;
    private String city;
    private String state;
    private String zipCode;
}

@Entity
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Embedded
    private Address address;
    
    @AttributeOverrides({
        @AttributeOverride(name = "street", column = @Column(name = "shipping_street")),
        @AttributeOverride(name = "city", column = @Column(name = "shipping_city")),
        @AttributeOverride(name = "state", column = @Column(name = "shipping_state")),
        @AttributeOverride(name = "zipCode", column = @Column(name = "shipping_zip_code"))
    })
    @Embedded
    private Address shippingAddress;
}
```

### Repository 注解

#### @Repository

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // 自定义查询方法
    Optional<User> findByUsername(String username);
    
    List<User> findByEmailContaining(String email);
    
    @Query("SELECT u FROM User u WHERE u.createdAt > :date")
    List<User> findRecentUsers(@Param("date") LocalDateTime date);
}
```

#### @Query、@Modifying

```java
public interface ProductRepository extends JpaRepository<Product, Long> {
    // 修改查询
    @Modifying
    @Query("UPDATE Product p SET p.price = :newPrice WHERE p.category = :category")
    int updatePriceByCategory(@Param("category") String category, @Param("newPrice") BigDecimal newPrice);
    
    // 原生 SQL 查询
    @Query(
        value = "SELECT * FROM products WHERE price > ?1",
        nativeQuery = true
    )
    List<Product> findExpensiveProducts(BigDecimal price);
    
    // 命名查询
    @Query(name = "Product.findByCategoryAndPrice")
    List<Product> findProductsByCategoryAndPrice(
        @Param("category") String category,
        @Param("price") BigDecimal price
    );
}
```

### 事务注解

#### @Transactional

```java
@Service
public class OrderService {
    @Transactional(
        readOnly = false,
        isolation = Isolation.READ_COMMITTED,
        propagation = Propagation.REQUIRED,
        rollbackFor = {Exception.class},
        timeout = 30
    )
    public Order createOrder(OrderRequest request) {
        // 创建订单逻辑
    }
    
    @Transactional(readOnly = true)
    public Order getOrder(Long id) {
        return orderRepository.findById(id)
            .orElseThrow(() -> new OrderNotFoundException(id));
    }
}
```

### 审计注解

#### 实体审计

```java
@EntityListeners(AuditingEntityListener.class)
@MappedSuperclass
public abstract class Auditable {
    @CreatedBy
    @Column(updatable = false)
    private String createdBy;
    
    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedBy
    private String lastModifiedBy;
    
    @LastModifiedDate
    private LocalDateTime lastModifiedAt;
}

@Entity
public class Invoice extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // 其他字段
}
```

#### @EnableJpaAuditing

启用审计

```java
@Configuration
@EnableJpaAuditing
public class JpaConfig {
    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> Optional.ofNullable(SecurityContextHolder.getContext())
            .map(SecurityContext::getAuthentication)
            .map(Authentication::getName);
    }
}
```

### 示例

#### 乐观锁（@Version）

```java
@Entity
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private BigDecimal balance;
    
    @Version
    private Long version;
    
    public void withdraw(BigDecimal amount) {
        this.balance = this.balance.subtract(amount);
    }
}
```

#### 软删除

```java
@Entity
@SQLDelete(sql = "UPDATE users SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private boolean deleted = false;
    
    // 其他字段
}
```

#### 枚举映射

```java
@Entity
public class Order {
    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    
    @Convert(converter = PaymentMethodConverter.class)
    private PaymentMethod paymentMethod;
}

@Converter
public class PaymentMethodConverter implements AttributeConverter<PaymentMethod, String> {
    @Override
    public String convertToDatabaseColumn(PaymentMethod attribute) {
        return attribute != null ? attribute.getCode() : null;
    }
    
    @Override
    public PaymentMethod convertToEntityAttribute(String dbData) {
        return dbData != null ? PaymentMethod.fromCode(dbData) : null;
    }
}
```

#### 大对象处理

```java
@Entity
public class Document {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Lob
    @Basic(fetch = FetchType.LAZY)
    private byte[] content;
    
    @Lob
    @Basic(fetch = FetchType.LAZY)
    private String largeText;
}
```

---

## 总结

Spring Boot 注解体系是一个完整而强大的工具集，它极大地简化了 Java 企业级应用的开发流程。通过合理使用这些注解，我们可以：

1. **提高开发效率**：减少样板代码，快速实现功能
2. **增强代码可读性**：通过注解清晰地表达代码意图
3. **实现松耦合**：促进面向接口编程，提高系统可维护性
4. **简化配置**：减少 XML 配置，实现约定优于配置

通过系统地学习和运用这些注解，开发者可以充分发挥 Spring Boot 框架的优势，构建出高质量、易维护的企业级应用程序。