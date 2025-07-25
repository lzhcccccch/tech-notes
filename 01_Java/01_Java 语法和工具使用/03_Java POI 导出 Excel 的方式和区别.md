### Java POI 导出 Excel 的方式和区别

[toc]

#### 一、 3 种方式

##### 	1. HSSFWorkbook 

​	该方式针对的是 Excel2003 或之前的版本，扩展名为 .xls。该方式的缺陷是只能导出 65535 行数据，超过则会报错，因为此方式导出的数据不会超过 70000 行，所以基本不会发生 **OutOfMemoryError ** 内存溢出的错误。

##### 	2. XSSFWorkbook

​	该方式的出现是因为第一种 HSSFWorkbook 的局限而产生，该方式对应的是 Excel2007(1048576行, 16384列) 以及之后的版本，扩展名为 .xlsx。由于支持导出的数据量比较大，所以会产生 **OutOfMemoryError ** 内存溢出的错误。造成内存溢出的原因是因为所写出的内容都是被保存在内容里，随着数据量的增大，内存占用就越大，很容易就 OOM 了。

##### 	3. SXSSFWorkbook

​	该方式是为了弥补第二种 XSSFWorkbook 会产生内存溢出的错误而产生，该方式对应的 Excel2007(1048576行, 16384列) 以及之后的版本，扩展名为 .xlsx。该方式解决了 OOM 的问题，支持在写文件的过程中将内存的数据写入到硬盘中。

---

#### 二、 产生 OOM 的原因

> OOM: 全称 OutOfMemoryError，内存溢出。

​	造成 OOM 的主要原因就是因为在进行 Excel 内容导出的时候，所有的内容是在内存中进行，那么随着写出的数据量的增大，内存占用也就越大，很容易就产生 OOM。

​	其实，就算生成很小的 Excel，占用的内存是远大于它的实际大小的，如果还要设置各种单元格样式，那么会更加占用内存。

---

#### 三、 解决办法

​	既然产生 OOM 的原因是因为在内存中写的内容过多，那么是不是可以考虑将已经写完的内容保存到硬盘中，边保存边写入呢？答案是肯定的。

​	SXSSFWorkbook 之所以能避免内存泄漏，采用的也是一边将内容写入到内存中，一边将内存中写好的内容保存到硬盘中，但是并不是写一条就保存一条。

~~~ java
// 可以通过构造方法进行设置内存中保存的数据数， 100 就表示在内存中保存 100 行，当行数达到 100 时，就将内容写到硬盘中。
SXSSFWorkbook wb = new SXSSFWorkbook(100);
~~~

​	SXSSFWorkbook 其实就是用空间换内存，不过这也有一个弊端，就是我们只能通过程序访问到还在内存中的 rows，已经被保存到硬盘中的 rows 是不可见/不可访问的，这也意味着我们无法使用公式求值、sheet.clone()、无法动态改变表头等，只能访问一定量的数据。

---

#### 四、 项目地址

`https://github.com/lzhcccccch/ImportAndExportExcel.git`

