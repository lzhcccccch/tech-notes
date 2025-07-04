# JavaScript 中将值转为布尔类型的方法

[toc]

## 显式转换

### 使用 `Boolean()` 函数

`Boolean(value)` 会将任意值转换为布尔类型，返回 `true` 或 `false`。

**示例：**
```javascript
Boolean(0)        // false
Boolean("hello")  // true
Boolean({})       // true
Boolean("")       // false
```

### 使用双重否定 `!!`

`!!value` 先将值逻辑取反（变成布尔类型并取反），再取反一次，最终得到原值对应的布尔类型。

**示例：**
```javascript
!!0        // false
!!"abc"    // true
!!null     // false
!![]       // true
```

---

## 隐式转换

JavaScript 在某些上下文中会自动把值转换为布尔类型：

- **条件判断**  
  ```javascript
  if (value) { ... }
  while (value) { ... }
  ```
- **逻辑运算符**  
  例如 `&&`、`||`、`!`，在判断时会隐式转换为布尔类型。

---

## 转换规则

### 假值

下列 6 种值在转换为布尔类型时结果为 `false`：

| 值          | 说明         |
| ----------- | ------------ |
| `false`     | 布尔值 false |
| `0`、`-0`   | 数字 0 和 -0 |
| `""`        | 空字符串     |
| `null`      | 空对象指针   |
| `undefined` | 未定义       |
| `NaN`       | 非数值       |

**示例：**
```javascript
Boolean(false)      // false
Boolean(0)          // false
Boolean("")         // false
Boolean(null)       // false
Boolean(undefined)  // false
Boolean(NaN)        // false
```

### 真值（Truthy）

**除了上述 6 种假值外，其他所有值都为真值。**

- 非空字符串：`"abc"`
- 非零数字：`123`、`-5`
- 所有对象（包括空对象 `{}`、空数组 `[]`）
- Symbol、BigInt
- 函数

**示例：**
```javascript
Boolean("hello")    // true
Boolean(42)         // true
Boolean([])         // true
Boolean({})         // true
Boolean(function(){}) // true
Boolean(Symbol())   // true
```

---

## 对象和特殊类型的转换

- **对象（包括数组、函数等）**：始终为 `true`，即使是空对象、空数组。
- **Symbol、BigInt**：始终为 `true`（除了 `Symbol()` 构造时不能直接用作条件判断，否则会报错）。

---

## 应用场景

- 判断变量是否有值
- 过滤数组中的假值
- 计算属性或条件渲染

**示例：过滤数组中的真值**
```javascript
const arr = [0, 1, false, 2, '', 3, null];
const filtered = arr.filter(Boolean); // [1, 2, 3]
```

---

## 总结

- 显式转换：`Boolean(value)` 或 `!!value`
- 隐式转换：在条件判断、逻辑运算符中自动发生
- 只有 6 种假值，其余全为真值
- 对象（无论内容）始终为真（`true`）
