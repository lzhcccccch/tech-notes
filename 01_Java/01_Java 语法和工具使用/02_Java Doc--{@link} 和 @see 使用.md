## Java Doc -- {@link} 和 @see 使用

[toc]

#### 一、 简介

在写 Java 代码时，我们可以写代码跳转的注释，我们可以通过【command+鼠标左键】实现跳转，常用的有 {@link} 和 @see。

比如我们有一个状态字段 status，该字段对应一个枚举类，则可以该字段的注释中使用  {@link} 或 @see 指向状态枚举类，简化我们在搜索代码的时间。

---

#### 二、 {@link}

{@link} 前面带有注释仍然可以跳转。

##### 1. 跳转到类、方法、字段

~~~java
/**
*  xxx
*  xxx {@link  [package.]<class>#[method||field]}
*/
~~~

主要用法如上，完整路径为【包名.类名#方法名或者字段名】

- 跳转到类 **{@link [package.] 类名}** ，在同一路径下，包名应该可以省略
- 如果是跳转当前类可以省略包名和类名，直接使用 **{@link #[method||field]}** 即可

##### 2. 跳转到网址

~~~java
/**
*  xxx 路径一定要带 http 或者 https 
*  xxx {@link <a href="http://www.xxx.com">这是一个网址</a>}
*/
~~~

---

#### 三、 @see

@see 前面不可以带有注释， 否则不能跳转

##### 1. 跳转到类、方法、字段

~~~java
/**
*  xxx
*  @see  [package.]<class>#[method||field]
*/
~~~

主要用法如上，完整路径为【包名.类名#方法名或者字段名】

- 跳转到类 **@see [package.] 类名** ，在同一路径下，包名应该可以省略
- 如果是跳转当前类可以省略包名和类名，直接使用 **@see #[method||field]** 即可

##### 2. 跳转到网址

~~~java
/**
*  xxx 路径一定要带 http 或者 https 
*  @see <a href="http://www.xxx.com">这是一个网址</a>
*/
~~~

