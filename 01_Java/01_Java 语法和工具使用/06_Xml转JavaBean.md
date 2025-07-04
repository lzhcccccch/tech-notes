## Xml转JavaBean

[toc]

#### 一、 概述

在日常编码中，我们接触最多的除了JSON外，就是XML格式了，本文整理XML和JavaBean的转换方式。

XML报文，以该报文为例进行转换。

~~~xml
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <soap:Body>
        <LXQueryResponse xmlns="http://www.yuanh.com.cn/">
            <LXQueryResult>
                <BSUCCESS>Y</BSUCCESS>
                <MSG>成功!</MSG>
                <LXINFOS>
                    <LXINFO>
                        <CLXCODE>LX1007160312</CLXCODE>
                        <CLXNAME>测试</CLXNAME>
                        <CDEPCODE>BD1001090324</CDEPCODE>
                        <CDEPNAME>黄岛云工厂生产</CDEPNAME>
                        <CBUDGETTYPECODE>BT001</CBUDGETTYPECODE>
                        <CSALETYPE>内销</CSALETYPE>
                    </LXINFO>
                    <LXINFO>
                        <CLXCODE>LX1007160309</CLXCODE>
                        <CLXNAME>测试</CLXNAME>
                        <CDEPCODE>BD1001090324</CDEPCODE>
                        <CDEPNAME>黄岛云工厂生产</CDEPNAME>
                        <CBUDGETTYPECODE>BT001</CBUDGETTYPECODE>
                        <CSALETYPE>内销</CSALETYPE>
                    </LXINFO>
                    <LXINFO>
                        <CLXCODE>LX1007160311</CLXCODE>
                        <CLXNAME>测试</CLXNAME>
                        <CDEPCODE>BD1001090324</CDEPCODE>
                        <CDEPNAME>黄岛云工厂生产</CDEPNAME>
                        <CBUDGETTYPECODE>BT001</CBUDGETTYPECODE>
                        <CSALETYPE>内销</CSALETYPE>
                    </LXINFO>
                    <LXINFO>
                        <CLXCODE>LX1007160313</CLXCODE>
                        <CLXNAME>测试</CLXNAME>
                        <CDEPCODE>BD1001090324</CDEPCODE>
                        <CDEPNAME>黄岛云工厂生产</CDEPNAME>
                        <CBUDGETTYPECODE>BT001</CBUDGETTYPECODE>
                        <CSALETYPE>内销</CSALETYPE>
                    </LXINFO>
                    <LXINFO>
                        <CLXCODE>LX1007160310</CLXCODE>
                        <CLXNAME>测试</CLXNAME>
                        <CDEPCODE>BD1001090324</CDEPCODE>
                        <CDEPNAME>黄岛云工厂生产</CDEPNAME>
                        <CBUDGETTYPECODE>BT001</CBUDGETTYPECODE>
                        <CSALETYPE>内销</CSALETYPE>
                    </LXINFO>
                </LXINFOS>
            </LXQueryResult>
        </LXQueryResponse>
    </soap:Body>
</soap:Envelope>
~~~

---

#### 二、 XStream

引入依赖

~~~Java
<!-- https://mvnrepository.com/artifact/com.thoughtworks.xstream/xstream -->
<dependency>
    <groupId>com.thoughtworks.xstream</groupId>
    <artifactId>xstream</artifactId>
    <version>1.4.20</version>
</dependency>
~~~

使用XStream需要对上述报文进行格式转换，转换为以下格式：

对比两个XML数据的不同，发现在XStream处理XML格式数据时，在保留第一行XML的基本定义之外，只需要保留数据格式，不需要其他定义，否则会转换报错。

~~~xml
<?xml version="1.0" encoding="utf-8"?>
<LXQueryResult>
    <BSUCCESS>Y</BSUCCESS>
    <MSG>成功!</MSG>
    <LXINFOS>
        <LXINFO>
            <CLXCODE>LX1007160312</CLXCODE>
            <CLXNAME>测试</CLXNAME>
            <CDEPCODE>BD1001090324</CDEPCODE>
            <CDEPNAME>黄岛云工厂生产</CDEPNAME>
            <CBUDGETTYPECODE>BT001</CBUDGETTYPECODE>
            <CSALETYPE>内销</CSALETYPE>
        </LXINFO>
        <LXINFO>
            <CLXCODE>LX1007160309</CLXCODE>
            <CLXNAME>测试</CLXNAME>
            <CDEPCODE>BD1001090324</CDEPCODE>
            <CDEPNAME>黄岛云工厂生产</CDEPNAME>
            <CBUDGETTYPECODE>BT001</CBUDGETTYPECODE>
            <CSALETYPE>内销</CSALETYPE>
        </LXINFO>
        <LXINFO>
            <CLXCODE>LX1007160311</CLXCODE>
            <CLXNAME>测试</CLXNAME>
            <CDEPCODE>BD1001090324</CDEPCODE>
            <CDEPNAME>黄岛云工厂生产</CDEPNAME>
            <CBUDGETTYPECODE>BT001</CBUDGETTYPECODE>
            <CSALETYPE>内销</CSALETYPE>
        </LXINFO>
        <LXINFO>
            <CLXCODE>LX1007160313</CLXCODE>
            <CLXNAME>测试</CLXNAME>
            <CDEPCODE>BD1001090324</CDEPCODE>
            <CDEPNAME>黄岛云工厂生产</CDEPNAME>
            <CBUDGETTYPECODE>BT001</CBUDGETTYPECODE>
            <CSALETYPE>内销</CSALETYPE>
        </LXINFO>
        <LXINFO>
            <CLXCODE>LX1007160310</CLXCODE>
            <CLXNAME>测试</CLXNAME>
            <CDEPCODE>BD1001090324</CDEPCODE>
            <CDEPNAME>黄岛云工厂生产</CDEPNAME>
            <CBUDGETTYPECODE>BT001</CBUDGETTYPECODE>
            <CSALETYPE>内销</CSALETYPE>
        </LXINFO>
    </LXINFOS>
</LXQueryResult>
~~~

根据XML数据创建JavaBean

~~~Java
@Data
public class BccProApprovalInfoItemRes implements Serializable {

    private String CLXCODE;

    private String CLXNAME;

    private String CDEPCODE;

    private String CDEPNAME;

    private String CBUDGETTYPECODE;

    private String CSALETYPE;
    
}
~~~

~~~java
@Data
public class BccProApprovalInfoRes implements Serializable {

    private String BSUCCESS;

    private String MSG;

    private List<Object> LXINFOS;

}
~~~

进行XML向JavaBean的转换

~~~java
String responseStr = 概述中的XML报文；
// 处理成上述可以转换的报文(只保留基本定义和数据)
responseStr = responseStr.substring(0, 38) + responseStr.substring(responseStr.indexOf("<LXQueryResult>"), responseStr.indexOf("</LXQueryResponse>"));

// DomDriver 可以不引入其他依赖
XStream xs = new XStream(new DomDriver());
xs.allowTypesByRegExp(new String[]{".*"});
// XML和JavaBean的映射
xs.alias("LXQueryResult", BccProApprovalInfoRes.class);
xs.alias("LXINFO", BccProApprovalInfoItemRes.class);
// 进行转换
Object object = xs.fromXML(responseStr);

ObjectMapper objectMapper = new ObjectMapper();
// 将Object转换为想要的JavaBean类型
BccProApprovalInfoRes res = objectMapper.convertValue(object, BccProApprovalInfoRes.class);
~~~



