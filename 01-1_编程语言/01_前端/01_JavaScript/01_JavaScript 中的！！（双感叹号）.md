# JavaScript 中的！！（双感叹号）

[toc]

## 基本概念

`!!` 是 JavaScript 中的双重逻辑非运算符，用于将任意值强制转换为布尔值（`true` 或 `false`）。

- 第一个`!`：将值转为布尔类型后取反。
- 第二个`!`：再取反一次，得到原值对应的布尔值。

---

## 判断规则

- **假值（Falsy）：** 只有 6 个：`false`、`0/-0`、`""`、`null`、`undefined`、`NaN`
- **真值（Truthy）：** 除了上面 6 个，其他全部为 `true`，包括所有对象、非空字符串、非零数字等。
- 即使对象为空、数组为空、对象属性全为 `undefined`，只要是对象，都是 `true`。

---

## 使用场景

`!!` 常用于需要将某个变量或表达式明确转为布尔值时，尤其是在判断、过滤属性场景下。

### 示例

~~~javascript
const a = "hello";
console.log(!!a); // true

const b = "";
console.log(!!b); // false

const c = 0;
console.log(!!c); // false

const d = 123;
console.log(!!d); // true

const e = null;
console.log(!!e); // false
~~~

---

## 实际使用

### 判断对象是否存在

~~~javascript
if (!!user) {
  // user 存在
}
~~~

### 过滤数组中的假值

```javascript
const arr = [0, 1, false, 2, '', 3, null];
const filtered = arr.filter(item => !!item);
// filtered = [1, 2, 3]
```

### 计算属性返回布尔值

```javascript
const isAuthenticated = computed(() => {
    return !!user.value && !!localStorage.getItem('token');
});
```

这样可以保证 `isAuthenticated` 始终是 `true` 或 `false`，而不是其它类型的值。

---

## 等价用法

`!!value` 等价于 `Boolean(value)`：

```javascript
!!value === Boolean(value)
```

---

## 总结

- `!!` 可将任意值转为布尔值，简洁高效。
- 常用于条件判断、数据过滤、计算属性等场景。
- JavaScript 判断真假，核心就是看值是否属于“假值”集合。对象（无论内容如何）始终为 `true`。