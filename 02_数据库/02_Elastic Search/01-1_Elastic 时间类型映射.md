## ElasticSearch 时间类型映射

[toc]

#### 简介

本文档描述了在 ElasticSearch 中处理与时间类型相关的字段映射及操作，包括在 Java 中如何定义时间字段，以及如何构建与时间相关的 DSL 查询语句。

---

#### Java 代码

以下是一个典型的 Java 类 `HttpElasticsearchDto`，用于映射到 ElasticSearch 索引中的文档。该类定义了多个字段，其中 `requestTime` 是一个时间类型字段，并且使用了特定的日期格式。

~~~json
package com.cloud.system.mq.elasticsearch;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.hibernate.validator.constraints.Range;
import org.springframework.data.elasticsearch.annotations.DateFormat;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Document(indexName = "psi_orw_http_request_log_new")
public class HttpElasticsearchDto implements Serializable {

	@Serial
	private static final long serialVersionUID = -7989915281096883614L;

	private Long id;

	@ApiModelProperty(value = "0 正常，9错误")
	@Field(type = FieldType.Integer)
	@Range
	private Integer type;

	@ApiModelProperty(value = "请求路径")
	@Field(type = FieldType.Text)
	private String requestUri;

	@ApiModelProperty(value = "执行时间 毫秒")
	@Field(type = FieldType.Long)
	private Long executeTime;

	@ApiModelProperty(value = "请求时间")
	@Field(type = FieldType.Date, format = DateFormat.date_hour_minute_second_fraction)
	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS")
	private LocalDateTime requestTime;

}
~~~

**关键字段解释**

- **`requestTime`**: 使用 `FieldType.Date` 类型，指定日期格式为 `DateFormat.date_hour_minute_second_fraction`，并通过 `JsonFormat` 注解设置日期的格式化规则为 `"yyyy-MM-dd'T'HH:mm:ss.SSS"`。

---

#### 文档结构

以下是 ElasticSearch 中文档的结构示例。该结构显示了如何映射和存储 `HttpElasticsearchDto` 类中的数据。

~~~json
{
  "_index" : "psi_orw_http_request_log_new-000001",
  "_type" : "_doc",
  "_id" : "1846444641640112128",
  "_score" : null,
  "_ignored" : [
    "requestParam.keyword"
  ],
  "_source" : {
    "_class" : "com.cloud.system.mq.elasticsearch.HttpElasticsearchDto",
    "id" : 1846444641640112128,
    "serviceId" : "cloud-settle",
    "requestUri" : "/interfaceForOuterNet/moldProcessOutsourcingSettleDetail/getSettleInfoByOemOrderCodes",
    "method" : "POST",
    "requestParam" : """嘻嘻嘻嘻嘻嘻休息休息""",
    "operationLocation" : "Unknown address :10.206.75.129",
    "userAgent" : "Apache-HttpClient/4.5 (Java/1.8.0_25)",
    "remoteAddr" : "10.206.75.129",
    "requestTime" : "2024-10-16T14:00:10.248",
    "createdAt" : "2024-10-16T14:54:42.506",
    "updatedAt" : "2024-10-16T14:54:42.506"
  },
  "sort" : [
    1729087210248
  ]
}
~~~

---

#### 索引映射关系(ElasticSearch Mapping)

以下是 ElasticSearch 中字段的映射结构定义，其中时间字段 `requestTime` 和 `updatedAt` 使用了 `date` 类型，并指定了 `strict_date_optional_time` 格式。

~~~json
{
  "mappings": {
    "_doc": {
      "dynamic": "true",
      "dynamic_date_formats": [
        "strict_date_optional_time",
        "yyyy/MM/dd HH:mm:ss Z||yyyy/MM/dd Z"
      ],
      "dynamic_templates": [],
      "date_detection": true,
      "numeric_detection": false,
      "properties": {
        "_class": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "createdAt": {
          "type": "date",
          "format": "strict_date_optional_time"
        },
        "createdBy": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "id": {
          "type": "long"
        },
        "method": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "operationLocation": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "remoteAddr": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "requestParam": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "requestTime": {
          "type": "date",
          "format": "strict_date_optional_time"
        },
        "requestUri": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "serviceId": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "updatedAt": {
          "type": "date",
          "format": "strict_date_optional_time"
        },
        "userAgent": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        }
      }
    }
  }
}
~~~

---

#### DSL 语句

以下是一个 DSL 查询示例，搜索指定 `serviceId` 为 "cloud-activiti"，并匹配特定时间范围内的日志记录。该查询还包含排序和分页操作。

~~~json
GET /psi_orw_http_request_log_new/_search
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
            "query": "appId",
            "fields": [
              "requestParam",
              "requestParam.keyword"
            ]
          }
        },
        {
          "range": {
            "requestTime": {
              "gte": "2024-10-15T14:00:10.248",
              "lte": "2024-10-16T14:00:10.248"
            }
          }
        }
      ]
    }
  },
  "sort": [
    {
      "requestTime": {
        "order": "desc"
      }
    }
  ],
  "size": 5,
  "from": 0
}
~~~

**关键点解释**

- **时间范围过滤 (`range`)**: 查询 `requestTime` 字段在指定的时间范围内的日志。
- **排序 (`sort`)**: 按照 `requestTime` 进行降序排列，确保最新的记录优先展示。
- **分页 (`size` 和 `from`)**: 设定返回结果的数量和分页参数。

---

#### 结论

本文档展示了如何在 ElasticSearch 中映射和查询时间字段，包括在 Java 代码中使用适当的注解和格式化规则，以及在 DSL 查询中如何过滤和排序与时间相关的记录。 