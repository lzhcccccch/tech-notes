## event.returnValue和return false

[toc]

#### 1. 含义

> returnValue 是 IE 的一种属性，优先级比 return false 要高，可以阻止事件继续执行下去，默认值为 true。

---

#### 2. 作用

> event.returnValue：当捕捉到事件(event)时会做一些判断，判断失败，则会阻止事件继续执行，可以达到”不能在输入框内输入非法字符”以及”在输入框中按回车键实现点击事件(搜索功能)”等。window.event.returnValue=false 放在提交表单中的 onclick 事件中则不会提交表单，如果放到超链接中则不执行超链接。

~~~java
function searchByEnter() {
	if (event.keyCode == 13) { // 回车键code为13
		event.returnValue = false;
		$("#search_button").trigger("click");
	}
}
~~~

如上代码，在输入框中按回车键之后，则会执行点击事件，代码可以执行完，但是该事件不会继续执行。如果没有 event.returnValue = false; 这行代码，那么即使是输入回车，事件仍可重复继续下去。

return false：禁止一些浏览器的默认行为，由于原先默认的行为是ture，例如，<a>链接，点击事件发生后，紧接着的默认事件就是跳转链接，但是,在 onclick=function(){return false;} 之后，就可以对紧接着的默认行为禁止掉。

---

#### 3. 扩充 onClick='return add_onclick()'  onClick='add_onclick()' 的区别

> js 在事件中调用函数时用 return 返回值实际上是对 window.event.returnvalue 进行设置。而该值决定了当前操作是否继续。当返回的是 true 时，将继续操作。当返回是 false 时，将中断操作。

~~~html
<a href="test.html" onclick="return add_onclick()">Open</a>
~~~

如上代码，如果 add_onclick() 方法返回为 true，那么就会打开 test 界面；反之，如果返回为 false，那么仍然会继续执行 add_onclick() 里面的代码，但是执行完毕并不会打开 test 界面（除非在 add_onclick() 方法里面有打开界面的操作）。这就是所谓的会中断事件的操作，不会执行点击事件，但是会执行完代码。

~~~html
<a href="test.html" onclick="add_onclick()">Open</a>
~~~

如上代码，不管 add_onclick() 方法返回什么值，都会在执行完 add_onclick() 方法之后打开 test 界面。

> onclick 和 href 同时存在时，先执行 onclick 再执行 href 

