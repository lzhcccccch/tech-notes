## Elastic Search DSL 查询语句

[toc]

### 简介

在 Elasticsearch 的 Discover 中使用 DSL（Domain-Specific Language）进行查询时，可以通过编写 JSON 格式的查询语句来进行复杂的搜索和过滤。

---

### 索引查询

在 Elasticsearch 的 DSL 查询中，指定查询的索引通常是在发送 HTTP 请求时在 URL 路径中指定的。例如，通过使用 Elasticsearch 的 `_search` API，可以在 URL 中指定要查询的索引名称。

#### 使用 HTTP 请求指定索引

##### 单个索引查询

如果你要查询一个特定的索引，可以在 URL 中指定该索引名称。

```sh
POST /index_name/_search
{
  "query": {
    "match_all": {}
  }
}
```

##### 多个索引查询

如果你想查询多个索引，可以在 URL 中列出这些索引名称，使用逗号分隔。

```sh
POST /index1,index2/_search
{
  "query": {
    "match_all": {}
  }
}
```

##### 所有索引查询

要查询所有索引，可以使用 `_all` 或 `*` 。

```sh
POST /_all/_search
{
  "query": {
    "match_all": {}
  }
}
```

或者：

```sh
POST /*/_search
{
  "query": {
    "match_all": {}
  }
}
```

#### Kibana Console 指定索引

在 Kibana Console 中，你可以直接在请求的第一行指定索引。

##### 单个索引

```plaintext
GET /index_name/_search
{
  "query": {
    "match_all": {}
  }
}
```

##### 多个索引

```plaintext
GET /index1,index2/_search
{
  "query": {
    "match_all": {}
  }
}
```

##### 通配符匹配索引

使用通配符匹配一组索引。

```plaintext
GET /index*/_search
{
  "query": {
    "match_all": {}
  }
}
```

#### 索引别名

有时，为了简化对多个索引的查询管理，可以使用索引别名。索引别名允许你为一个或多个索引指定一个逻辑名称。

##### 创建别名

```sh
POST /_aliases
{
  "actions": [
    {
      "add": {
        "index": "index1",
        "alias": "my_alias"
      }
    },
    {
      "add": {
        "index": "index2",
        "alias": "my_alias"
      }
    }
  ]
}
```

##### 使用别名查询

```plaintext
POST /my_alias/_search
{
  "query": {
    "match": {
      "field": "value"
    }
  }
}
```

---

### DSL 语句查询

#### 基本查询

基本查询语句是查询粒度最小的条件，通常要被组合在布尔查询、过滤器查询、聚合查询等条件中形成复杂的查询。下面是常用的几个语法。

##### Match 查询

用于全文检索，会分析查询字符串并进行匹配。

```json
{
  "query": {
    "match": {
      "field_name": "search text"
    }
  }
}
```

##### Multi Match 查询

用于在多个字段中搜索文本。

~~~json
{
  "query": {
    "multi_match": {
      "query": "search_text",
      "fields": ["field1", "field2"]
    }
  }
}
~~~

##### Term 查询

用于精确匹配，不进行分词。

```json
{
  "query": {
    "term": {
      "field_name": "exact_value"
    }
  }
}
```

##### Range 查询

用于范围查询，可以指定开始和结束范围。

```json
{
  "query": {
    "range": {
      "field_name": {
        "gte": 10,
        "lte": 20
      }
    }
  }
}
```

---

#### 布尔查询

布尔查询允许组合多个查询条件，可以使用 `must`、`should`、`filter` 和 `must_not` 进行组合。

```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "field1": "value1" } },
        { "range": { "field2": { "gte": 10 } } }
      ],
      "should": [
        { "match": { "field3": "value3" } }
      ],
      "must_not": [
        { "term": { "field4": "value4" } }
      ]
    }
  }
}
```

---

#### 过滤器查询

过滤器查询通常用于不需要评分的精确匹配。

```json
{
  "query": {
    "bool": {
      "filter": [
        { "term": { "field1": "value1" } },
        { "range": { "field2": { "gte": 10, "lte": 20 } } }
      ]
    }
  }
}
```

---

#### 聚合查询

聚合查询用于统计和分组。

```json
{
  // 展示 0 条数据详情
  "size": 0,
  // 聚合信息，根据 serviceId 分组，统计数量
  "aggs": {
    "service_count": {
      "terms": {
        "field": "serviceId.keyword"
      }
    }
  }
}
```

---

#### 嵌套查询

对于嵌套对象，需要使用嵌套查询。

```json
{
  "query": {
    "nested": {
      "path": "nested_path",
      "query": {
        "bool": {
          "must": [
            { "match": { "nested_path.field_name": "value" } }
          ]
        }
      }
    }
  }
}
```

---

#### 脚本查询

Script Query 允许使用脚本来自定义查询逻辑。

~~~json
{
  "query": {
    "script_score": {
      "query": {
        "match_all": {}
      },
      "script": {
        "source": "doc['field_name'].value * factor",
        "params": {
          "factor": 1.5
        }
      }
    }
  }
}
~~~

---

#### 示例：综合查询

一个综合的查询示例，结合了布尔查询、过滤器查询和聚合查询。

```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "title": "Elasticsearch" } },
        { "range": { "publish_date": { "gte": "2023-01-01", "lte": "2023-12-31" } } }
      ],
      "filter": [
        { "term": { "status": "published" } }
      ]
    }
  },
  "aggs": {
    "authors": {
      "terms": {
        "field": "author.keyword"
      }
    }
  },
  "size": 10,
  "from": 0
}
```

#### 关键字段解释

- **query**：表示查询部分，包含具体的查询条件。
- **bool**：布尔查询，组合多个查询条件。
- **must**：必须匹配的条件。
- **should**：可以匹配的条件，至少匹配一个。
- **must_not**：不能匹配的条件。
- **filter**：过滤器条件，类似 `must` 但不影响评分。
- **match**：全文匹配查询。
- **term**：精确匹配查询。
- **range**：范围查询。
- **aggs**：聚合部分，用于统计和分组。
- **size**：返回结果的数量。
- **from**：结果的偏移量，用于分页。

---

### 结果排序

在 Elasticsearch 的 DSL 查询中，可以通过 `sort` 字段来对查询结果进行排序。排序可以基于一个或多个字段，并指定升序（`asc`）或降序（`desc`）。下面是一些常见的排序用法和示例。

#### 基本排序

##### 按单个字段排序

默认是升序排序。

```json
{
  "query": {
    "match_all": {}
  },
  "sort": [
    { "field_name": "asc" }
  ]
}
```

##### 按多个字段排序

可以按多个字段进行排序，当第一个字段相同时，按第二个字段排序。

```json
{
  "query": {
    "match_all": {}
  },
  "sort": [
    { "field1": "asc" },
    { "field2": "desc" }
  ]
}
```

#### 特殊字段排序

ElasticSearch支持对一些特殊字段（如 _score、 _doc）进行排序。

##### 根据 _score 排序

按文档的相关性得分排序，通常用于全文搜索。

~~~json
{
  "query": {
    "match": {
      "field_name": "search_text"
    }
  },
  "sort": [
    "_score"
  ]
}
~~~

##### 根据 _doc 排序

按文档ID排序，通常用于稳定的分页。

~~~json
{
  "query": {
    "match_all": {}
  },
  "sort": [
    "_doc"
  ]
}
~~~

#### 自定义排序选项

##### 按嵌套字段排序

对于嵌套字段，需要指定路径。

```json
{
  "query": {
    "match_all": {}
  },
  "sort": [
    {
      "nested_field.field_name": {
        "order": "asc",
        "nested": {
          "path": "nested_field"
        }
      }
    }
  ]
}
```

##### 按脚本排序

使用脚本自定义排序逻辑。

```json
{
  "query": {
    "match_all": {}
  },
  "sort": [
    {
      "_script": {
        "type": "number",
        "script": {
          "source": "doc['field_name'].value * 2",
          "lang": "painless"
        },
        "order": "asc"
      }
    }
  ]
}
```

#### 结合查询和排序的示例

##### 基本查询并排序

按 `publish_date` 降序排序的基本查询。

```json
{
  "query": {
    "match": {
      "title": "Elasticsearch"
    }
  },
  "sort": [
    { "publish_date": "desc" }
  ]
}
```

##### 复杂查询并排序

按多个字段排序的复杂查询。

```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "title": "Elasticsearch" } },
        { "range": { "publish_date": { "gte": "2023-01-01", "lte": "2023-12-31" } } }
      ],
      "filter": [
        { "term": { "status": "published" } }
      ]
    }
  },
  "sort": [
    { "publish_date": "desc" },
    { "author.keyword": "asc" }
  ]
}
```

##### 脚本排序示例

自定义脚本排序，按 `popularity` 字段的平方值排序。

```json
{
  "query": {
    "match_all": {}
  },
  "sort": [
    {
      "_script": {
        "type": "number",
        "script": {
          "source": "Math.pow(doc['popularity'].value, 2)",
          "lang": "painless"
        },
        "order": "desc"
      }
    }
  ]
}
```

#### 关键字段解释

- **query**：表示查询部分，包含具体的查询条件。
- **sort**：表示排序部分，定义排序字段及排序顺序。
- **order**：排序顺序，可以是 `asc`（升序）或 `desc`（降序）。
- **nested**：嵌套字段排序时需要指定嵌套路径。
- **_script**：自定义脚本排序。

---

### 实战应用

现有索引 `psi_orw_http_request_log` 、文档内容（如下）和一个查询语句（如下），该查询语句包含了基本查询语法、排序和分组的使用，现在对该查询语句进行逐步拆解分析。该语句以 `must` 、`filter`为例，也可替换为 `should`、`must not`，也可以结合使用。`must`、 `should`、`filter`、`must not` 这四个条件为同级。

#### 文档内容

~~~json
{
  "_index" : "psi_orw_http_request_log-000003",
  "_type" : "_doc",
  "_id" : "1793898058879565824",
  "_score" : 1.0,
  "_source" : {
    "id" : 1793898058879565824,
    "type" : null,
    "serviceId" : "cloud-order",
    "requestUri" : "/productionOrder/selectAllPage",
    "method" : "GET",
    "requestParam" : "pageNum=1&pageSize=10&dateType=6&checkDateStart=2024-05-24&checkDateEnd=2024-05-24&createBy=18009215",
    "responseData" : null,
    "operationLocation" : "Unknown address :10.179.201.208",
    "userAgent" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "remoteAddr" : "10.179.201.208",
    "executeTime" : null,
    "requestTime" : {
      "dayOfYear" : 145,
      "dayOfWeek" : "FRIDAY",
      "month" : "MAY",
      "dayOfMonth" : 24,
      "year" : 2024,
      "monthValue" : 5,
      "nano" : 883000000,
      "hour" : 14,
      "minute" : 53,
      "second" : 20,
      "chronology" : {
        "calendarType" : "iso8601",
        "id" : "ISO"
      }
    },
    "responseTime" : null,
    "title" : null,
    "createdAt" : {
      "dayOfYear" : 145,
      "dayOfWeek" : "FRIDAY",
      "month" : "MAY",
      "dayOfMonth" : 24,
      "year" : 2024,
      "monthValue" : 5,
      "nano" : 908000000,
      "hour" : 14,
      "minute" : 53,
      "second" : 20,
      "chronology" : {
        "calendarType" : "iso8601",
        "id" : "ISO"
      }
    },
    "updatedAt" : {
      "dayOfYear" : 145,
      "dayOfWeek" : "FRIDAY",
      "month" : "MAY",
      "dayOfMonth" : 24,
      "year" : 2024,
      "monthValue" : 5,
      "nano" : 908000000,
      "hour" : 14,
      "minute" : 53,
      "second" : 20,
      "chronology" : {
        "calendarType" : "iso8601",
        "id" : "ISO"
      }
    },
    "createdBy" : "18009215",
    "businessType" : null
  }
}
~~~

#### 查询语句

现在有以下查询语句，对其拆解进行分析：

~~~json
GET /psi_orw_http_request_log/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "serviceId": "cloud-activiti"
          }
        },
        {
          "multi_match": {
            "query": "flow",
            "fields": [
              "requestUri",
              "requestUri"
            ]
          }
        },
        {
          "term": {
            "createdAt.year": {
              "value": 2024
            }
          }
        },
        {
          "term": {
            "createdAt.monthValue": {
              "value": 7
            }
          }
        },
        {
          "range": {
            "createdAt.dayOfMonth": {
              "gte": 1,
              "lte": 31
            }
          }
        },
        {
          "range": {
            "createdAt.hour": {
              "gte": 0,
              "lte": 23
            }
          }
        },
        {
          "range": {
            "createdAt.minute": {
              "gte": 0,
              "lte": 59
            }
          }
        }
      ],
      "filter": [
        {
          "range": {
            "createdAt.hour": {
              "gte": 0,
              "lte": 23
            }
          }
        },
        {
          "range": {
            "createdAt.minute": {
              "gte": 0,
              "lte": 59
            }
          }
        }
      ]
    }
  },
  "sort": [
    {
      "createdAt.year": {
        "order": "desc"
      }
    },
    {
      "createdAt.monthValue": {
        "order": "desc"
      }
    },
    {
      "createdAt.dayOfMonth": {
        "order": "desc"
      }
    },
    {
      "createdAt.hour": {
        "order": "desc"
      }
    },
    {
      "createdAt.minute": {
        "order": "desc"
      }
    },
    {
      "createdAt.second": {
        "order": "desc"
      }
    }
  ],
  "aggs": {
    "monthly_count": {
      "terms": {
        "field": "createdAt.dayOfMonth",
        "order": {
          "_key": "asc"
        },
        "size": 30
      }
    },
    "monthly_count1": {
      "terms": {
        "field": "createdAt.dayOfMonth",
        "order": {
          "_count": "asc"
        }
      }
    },
    "dayly_max_hour": {
      "terms": {
        "field": "createdAt.dayOfMonth",
        "order": {
          "max_hour": "desc"
        }
      },
      "aggs": {
        "max_hour": {
          "max": {
            "field": "createdAt.hour"
          }
        }
      }
    }
  },
  "size": 5,
  "from": 0
}
~~~

#### 语句拆解分析

##### must

查询 `serviceId` 模糊匹配值为 `cloud-activiti`，`requestUri` 模糊匹配值为 `flow`， 2024 年 7 月份 的数据。简单来说，查询 2024 年 7 月份，接口 `flow` 的调用信息。

`multi_match` 的作用是匹配多个字段中包含 `flow` 的数据，这里写了两次`requestUri` 代替。

其中 `range` 是为了练习使用，可以简写为以下语句：

~~~json
"must": [
  {
    "match": {
      "serviceId": "cloud-activiti"
    }
  },
  {
    "multi_match": {
      "query": "flow",
      "fields": [
        "requestUri",
        "requestUri"
      ]
    }
  },
  {
    "term": {
      "createdAt.year": {
        "value": 2024
      }
    }
  },
  {
    "term": {
      "createdAt.monthValue": {
        "value": 7
      }
    }
  }
]
~~~

##### filter

`filter` 和 `must` 同级使用，这里过滤了时间，用于练习。

##### sort

根据时间（年月日时分秒）倒序。

##### aggs

对查询结果进行分组和信息统计，上面的语句中统计了三组信息，分别介绍。

前提是，查询结果是 2024 年 7 月份，接口 `flow` 的调用信息。

###### monthly_count

统计 7 分月每天的调用次数，按照 Key（field 的值 createdAt.dayOfMonth） 升序，查询 30 条。查询结果如下：

~~~json
"monthly_count" : {
  "doc_count_error_upper_bound" : 0,
  "sum_other_doc_count" : 0,
  "buckets" : [
    {
      "key" : 1,
      "doc_count" : 150
    },
    {
      "key" : 2,
      "doc_count" : 152
    },
    {
      "key" : 3,
      "doc_count" : 234
    },
    {
      "key" : 4,
      "doc_count" : 285
    },
    {
      "key" : 5,
      "doc_count" : 251
    },
    {
      "key" : 6,
      "doc_count" : 77
    },
    {
      "key" : 7,
      "doc_count" : 32
    },
    {
      "key" : 8,
      "doc_count" : 246
    },
    {
      "key" : 9,
      "doc_count" : 161
    },
    {
      "key" : 10,
      "doc_count" : 157
    },
    {
      "key" : 11,
      "doc_count" : 198
    },
    {
      "key" : 12,
      "doc_count" : 202
    },
    {
      "key" : 13,
      "doc_count" : 58
    },
    {
      "key" : 14,
      "doc_count" : 30
    },
    {
      "key" : 15,
      "doc_count" : 159
    },
    {
      "key" : 16,
      "doc_count" : 205
    },
    {
      "key" : 17,
      "doc_count" : 141
    },
    {
      "key" : 18,
      "doc_count" : 276
    },
    {
      "key" : 19,
      "doc_count" : 309
    },
    {
      "key" : 20,
      "doc_count" : 121
    },
    {
      "key" : 21,
      "doc_count" : 30
    },
    {
      "key" : 22,
      "doc_count" : 248
    },
    {
      "key" : 23,
      "doc_count" : 151
    }
  ]
}
~~~

###### monthly_count1

统计 7 分月每天的调用次数，按照调用次数升序，不指定查询数量，使用默认值，这里默认是 10 条。查询结果如下：

~~~json
"monthly_count1" : {
  "doc_count_error_upper_bound" : 0,
  "sum_other_doc_count" : 2931,
  "buckets" : [
    {
      "key" : 14,
      "doc_count" : 30
    },
    {
      "key" : 21,
      "doc_count" : 30
    },
    {
      "key" : 7,
      "doc_count" : 32
    },
    {
      "key" : 13,
      "doc_count" : 58
    },
    {
      "key" : 6,
      "doc_count" : 77
    },
    {
      "key" : 20,
      "doc_count" : 121
    },
    {
      "key" : 17,
      "doc_count" : 141
    },
    {
      "key" : 1,
      "doc_count" : 150
    },
    {
      "key" : 23,
      "doc_count" : 151
    },
    {
      "key" : 2,
      "doc_count" : 152
    }
  ]
}
~~~

###### dayly_max_hour

统计 7 分月每天最后一次是几点调用的，按照最后一次调用的小时树倒序，不指定查询数量，使用默认值，这里默认是 10 条。

说明：每天的最大小时数是一个不存在的字段，所以需要重新聚合形成这么一个字段，才能用于排序。

查询结果如下：

~~~json
"dayly_max_hour" : {
  "doc_count_error_upper_bound" : 0,
  "sum_other_doc_count" : 1902,
  "buckets" : [
    {
      "key" : 2,
      "doc_count" : 152,
      "max_hour" : {
        "value" : 23.0
      }
    },
    {
      "key" : 19,
      "doc_count" : 309,
      "max_hour" : {
        "value" : 23.0
      }
    },
    {
      "key" : 6,
      "doc_count" : 77,
      "max_hour" : {
        "value" : 22.0
      }
    },
    {
      "key" : 8,
      "doc_count" : 246,
      "max_hour" : {
        "value" : 22.0
      }
    },
    {
      "key" : 12,
      "doc_count" : 202,
      "max_hour" : {
        "value" : 22.0
      }
    },
    {
      "key" : 17,
      "doc_count" : 141,
      "max_hour" : {
        "value" : 22.0
      }
    },
    {
      "key" : 18,
      "doc_count" : 276,
      "max_hour" : {
        "value" : 22.0
      }
    },
    {
      "key" : 4,
      "doc_count" : 285,
      "max_hour" : {
        "value" : 21.0
      }
    },
    {
      "key" : 5,
      "doc_count" : 251,
      "max_hour" : {
        "value" : 21.0
      }
    },
    {
      "key" : 7,
      "doc_count" : 32,
      "max_hour" : {
        "value" : 21.0
      }
    }
  ]
}
~~~

##### size

查询数量

##### from

查询偏移量，从第几条开始查询。
