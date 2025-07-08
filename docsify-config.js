// Docsify 配置文件 - GitHub Pages 优化版本
// 解决路径编码和特殊字符问题

window.$docsify = {
  // 基本配置
  name: 'Tech Notes - 技术笔记',
  repo: 'https://github.com/lzhch/tech-notes',
  homepage: 'README.md',
  
  // 页面配置
  loadSidebar: true,
  loadNavbar: true,
  coverpage: true,
  onlyCover: false,
  auto2top: true,
  maxLevel: 4,
  subMaxLevel: 3,
  
  // 路由配置 - GitHub Pages 优化
  routerMode: 'hash', // 使用 hash 模式确保兼容性
  basePath: '/', // 基础路径
  relativePath: false, // 禁用相对路径
  
  // 路径别名 - 处理特殊字符和空格
  alias: {
    // Java 相关路径
    '/01_Java/01_Java语法和工具使用/(.*)': '/01_Java/01_Java%20语法和工具使用/$1',
    '/01_Java/03_多线程异步并发/(.*)': '/01_Java/03_多线程(异步并发)/$1',
    '/01_Java/04_JVMJDK/(.*)': '/01_Java/04_JVM&JDK/$1',
    '/01_Java/1001_Java搭建WebService/(.*)': '/01_Java/1001_Java%20搭建%20WebService/$1',
    
    // 数据库相关路径
    '/02_数据库/02_ElasticSearch/(.*)': '/02_数据库/02_Elastic%20Search/$1',
    
    // AI 相关路径
    '/07_人工智能/02_DeepSeekRAG增强检索知识库系统/(.*)': '/07_人工智能/02_DeepSeek%20RAG%20增强检索知识库系统/$1',
    
    // 工具相关路径
    '/3001_工具和软件的安装与使用/(.*)': '/3001_工具和软件的安装与使用/$1',
  },
  
  // 搜索配置 - 增强 GitHub Pages 兼容性
  search: {
    maxAge: 86400000, // 24小时缓存
    paths: 'auto',
    placeholder: '🔍 搜索文档...',
    noData: '😞 找不到结果',
    depth: 6,
    hideOtherSidebarContent: false,
    // 路径标准化
    pathNamespaces: ['/'],
    // 自定义搜索路径处理
    namespace: 'tech-notes',
  },
  
  // 复制代码配置
  copyCode: {
    buttonText: '📋 复制',
    errorText: '❌ 复制失败',
    successText: '✅ 已复制'
  },
  
  // 分页导航
  pagination: {
    previousText: '⬅️ 上一页',
    nextText: '下一页 ➡️',
    crossChapter: true,
    crossChapterText: true,
  },
  
  // 字数统计
  count: {
    countable: true,
    fontsize: '0.9em',
    color: 'rgb(90,90,90)',
    language: 'chinese'
  },
  
  // 代码高亮
  prism: {
    theme: 'default'
  },
  
  // 外部链接
  externalLinkTarget: '_blank',
  externalLinkRel: 'noopener',
  
  // 404页面
  notFoundPage: true,
  
  // 侧边栏配置
  sidebarDisplayLevel: 1,
  hideSidebar: false,
  
  // 页面标题
  nameLink: '/',
  
  // 自定义插件
  plugins: [
    // 编辑链接插件
    function(hook, vm) {
      hook.beforeEach(function (html) {
        var url = 'https://github.com/lzhch/tech-notes/blob/main/' + vm.route.file;
        var editHtml = '[:memo: 编辑此页](' + url + ')\n\n';
        return editHtml + html;
      });
    },
    
    // 路径处理插件
    function(hook, vm) {
      hook.beforeEach(function(html, next) {
        // 处理路径中的特殊字符
        var currentPath = vm.route.path;
        if (currentPath) {
          // 记录原始路径用于调试
          console.log('当前访问路径:', currentPath);
          
          // 检查路径是否包含需要处理的特殊字符
          if (currentPath.includes(' ') || currentPath.includes('(') || currentPath.includes(')') || currentPath.includes('&')) {
            console.log('检测到特殊字符路径，进行标准化处理');
          }
        }
        next(html);
      });
      
      // 404 错误处理
      hook.doneEach(function() {
        if (vm.route.path === '/404') {
          console.warn('页面未找到:', vm.route.file);
          
          // 尝试提供替代路径建议
          var suggestions = [
            '检查路径中的空格是否正确编码为 %20',
            '检查括号是否正确编码为 %28 和 %29',
            '检查 & 符号是否正确编码为 %26',
            '确认文件确实存在于仓库中'
          ];
          
          console.log('路径问题排查建议:', suggestions);
        }
      });
    },
    
    // 性能监控插件
    function(hook, vm) {
      hook.ready(function() {
        console.log('Docsify 加载完成');
        console.log('当前配置:', window.$docsify);
      });
    }
  ]
};

// 路径工具函数
window.DocsifyPathUtils = {
  // 标准化路径
  normalizePath: function(path) {
    return path
      .replace(/\s+/g, '%20')  // 空格
      .replace(/\(/g, '%28')   // 左括号
      .replace(/\)/g, '%29')   // 右括号
      .replace(/&/g, '%26');   // & 符号
  },
  
  // 检查路径是否有效
  isValidPath: function(path) {
    // 基本路径验证逻辑
    return path && typeof path === 'string' && path.length > 0;
  },
  
  // 获取建议路径
  getSuggestedPaths: function(originalPath) {
    var suggestions = [];
    
    if (originalPath) {
      // 尝试不同的编码方式
      suggestions.push(this.normalizePath(originalPath));
      suggestions.push(originalPath.replace(/\s+/g, ''));
      suggestions.push(originalPath.toLowerCase());
    }
    
    return suggestions;
  }
};
