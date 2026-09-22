(function () {
  const SPRING_ARTICLE_BASE = 'knowledge/application/spring-apps/';
  const SPRING_ARTICLES = [
    ['Spring Boot 注解基础概念', 'Spring Boot 注解基础概念'],
    ['Spring Boot 常用注解', 'Spring Boot 常用注解'],
    ['@Configuration 和 @Component 的区别', '@Configuration 和 @Component 的区别'],
    ['Spring 依赖注入：@Autowired 与 @Resource', 'Spring 依赖注入 @Autowired 与 @Resource'],
    ['为什么不推荐使用 @Autowired', '为什么不推荐使用 @Autowired'],
    ['为什么不推荐使用 @Value 加载配置', '为什么不推荐使用 @Value 加载配置'],
    ['Spring MVC HandlerMethod 技术解析', 'Spring MVC HandlerMethod 技术解析'],
    ['Spring MVC 请求参数注解', 'Spring MVC 请求参数注解'],
    ['ResponseBodyAdvice 接口使用', 'ResponseBodyAdvice 接口使用'],
    ['@Valid 和 @Validated', '@Valid 和 @Validated'],
    ['Spring Boot 参数分组校验', 'Spring Boot 参数分组校验'],
    ['Spring Web 时间格式化注解', 'Spring Web 时间格式化注解'],
    ['Spring MVC LocalDateTime 自动转换', 'Spring MVC LocalDateTime 自动转换'],
    ['Spring 事件推送机制', 'Spring 事件推送机制'],
    ['Spring @Async 注解', 'Spring @Async 注解'],
    ['Spring @Async 注意事项', 'Spring @Async 注意事项'],
    ['Spring 缓存注解', 'Spring 缓存注解'],
    ['Spring 事务管理详解', 'Spring 事务管理详解'],
    ['Spring 只读事务详解', 'Spring 只读事务详解'],
    ['多数据源集成方案草稿', '多数据源集成方案草稿'],
    ['Spring Boot 多数据源及事务实现方案', 'Spring Boot 多数据源及事务实现方案'],
    ['多数据源切换复盘', '多数据源切换复盘'],
    ['Spring Boot Admin 与 Actuator 应用监控', 'Spring Boot Admin 与 Actuator 应用监控']
  ].map(function (article) {
    return {
      title: article[0],
      path: SPRING_ARTICLE_BASE + article[1]
    };
  });

  const storedTheme = localStorage.getItem('tech-notes-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');

  document.documentElement.dataset.theme = initialTheme;

  function syncThemeButton() {
    const button = document.getElementById('theme-toggle');
    if (!button) return;

    const isDark = document.documentElement.dataset.theme === 'dark';
    const label = button.querySelector('.theme-toggle__text');
    button.setAttribute('aria-label', isDark ? '切换亮色模式' : '切换深色模式');
    if (label) label.textContent = isDark ? '亮色' : '深色';
  }

  function syncGiscusTheme(theme) {
    const frame = document.querySelector('iframe.giscus-frame');
    if (!frame) return;

    frame.contentWindow.postMessage(
      { giscus: { setConfig: { theme: theme === 'dark' ? 'dark' : 'light' } } },
      'https://giscus.app'
    );
  }

  function installThemeToggle() {
    syncThemeButton();
    const button = document.getElementById('theme-toggle');
    if (!button || button.dataset.ready) return;

    button.dataset.ready = 'true';
    button.addEventListener('click', function () {
      const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = nextTheme;
      localStorage.setItem('tech-notes-theme', nextTheme);
      syncThemeButton();
      syncGiscusTheme(nextTheme);
    });
  }

  function syncTopNavigation(route) {
    const routePath = normalizeRoutePath(route);
    document.querySelectorAll('.site-nav__link').forEach(function (link) {
      const isHome = link.getAttribute('href') === '#/';
      const isCurrent = isHome
        ? routePath === '' || routePath === 'README'
        : routePath === 'about';

      if (isCurrent) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function normalizeRoutePath(route) {
    if (!route) return '';

    let path = (route.file || route.path || '').replace(/^\/+/, '').split('?')[0];
    try {
      path = decodeURIComponent(path);
    } catch (error) {
      // 路由中没有需要解码的字符时继续使用原值。
    }

    return path.replace(/\.md$/i, '');
  }

  function createSpringPaginationLink(article, direction) {
    const link = document.createElement('a');
    link.className = `spring-pagination__link spring-pagination__link--${direction}`;
    link.href = `#/${encodeURI(article.path)}`;
    link.setAttribute('aria-label', `${direction === 'previous' ? '上一篇' : '下一篇'}：${article.title}`);

    const label = document.createElement('span');
    label.className = 'spring-pagination__label';
    label.textContent = direction === 'previous' ? '← 上一篇' : '下一篇 →';

    const title = document.createElement('strong');
    title.textContent = article.title;

    link.appendChild(label);
    link.appendChild(title);
    return link;
  }

  function createSpringPagination(route) {
    const currentPath = normalizeRoutePath(route);
    const currentIndex = SPRING_ARTICLES.findIndex(function (article) {
      return article.path === currentPath;
    });
    if (currentIndex < 0) return null;

    const navigation = document.createElement('nav');
    navigation.className = 'spring-pagination';
    navigation.setAttribute('aria-label', 'Spring 应用文章导航');

    if (currentIndex > 0) {
      navigation.appendChild(createSpringPaginationLink(SPRING_ARTICLES[currentIndex - 1], 'previous'));
    }

    if (currentIndex < SPRING_ARTICLES.length - 1) {
      navigation.appendChild(createSpringPaginationLink(SPRING_ARTICLES[currentIndex + 1], 'next'));
    }

    return navigation;
  }

  function createArticleToc(article, route) {
    const routePath = normalizeRoutePath(route);
    if (!routePath || routePath === 'README' || routePath === 'about' || routePath.endsWith('/README')) {
      return null;
    }

    const headings = Array.from(article.querySelectorAll('h2, h3'));
    if (headings.length === 0) return null;

    const toc = document.createElement('details');
    toc.className = 'article-toc';
    toc.open = !window.matchMedia('(max-width: 768px)').matches;

    const summary = document.createElement('summary');
    summary.textContent = '本文目录';
    toc.appendChild(summary);

    const navigation = document.createElement('nav');
    navigation.setAttribute('aria-label', '本文目录');

    const list = document.createElement('ol');
    list.className = 'article-toc__list';

    headings.forEach(function (heading) {
      const anchor = heading.querySelector('a.anchor');
      const href = anchor ? anchor.getAttribute('href') : `#${heading.id}`;
      if (!href) return;

      const item = document.createElement('li');
      item.className = `article-toc__item article-toc__item--level-${heading.tagName.toLowerCase()}`;

      const link = document.createElement('a');
      link.href = href;
      link.textContent = heading.textContent.trim();

      item.appendChild(link);
      list.appendChild(item);
    });

    navigation.appendChild(list);
    toc.appendChild(navigation);
    return toc;
  }

  function createEditLink(route) {
    if (!route || route.path === '/') return null;

    const config = window.BLOG_CONFIG;
    const file = route.file || route.path.replace(/^\//, '') + '.md';
    const cleanFile = file.replace(/^\//, '');
    const link = document.createElement('a');
    link.className = 'edit-on-github';
    link.href = `https://github.com/${config.repository}/edit/${config.branch}/docs/${cleanFile}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.innerHTML = [
      '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">',
      '<path fill="currentColor" d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.3-5.27-1.29-5.27-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.16 1.18a10.96 10.96 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.71 5.39-5.29 5.68.42.36.79 1.06.79 2.14v3.18c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z"/>',
      '</svg>',
      '<span>在 GitHub 上编辑本文</span>',
      '<span class="edit-on-github__arrow" aria-hidden="true">↗</span>'
    ].join('');
    return link;
  }

  function createComments(route) {
    const config = window.BLOG_CONFIG.comments;
    if (!config.repoId || !config.categoryId || !route || route.path === '/') return null;

    const container = document.createElement('section');
    container.className = 'comments';
    container.setAttribute('aria-label', '文章评论');

    const heading = document.createElement('h2');
    heading.textContent = '讨论与留言';
    container.appendChild(heading);

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', window.BLOG_CONFIG.repository);
    script.setAttribute('data-repo-id', config.repoId);
    script.setAttribute('data-category', config.category);
    script.setAttribute('data-category-id', config.categoryId);
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', `tech-notes:${route.path}`);
    script.setAttribute('data-strict', '1');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    script.setAttribute('data-lang', 'zh-CN');
    script.setAttribute('data-loading', 'lazy');
    script.crossOrigin = 'anonymous';
    script.async = true;
    container.appendChild(script);

    return container;
  }

  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function (hook, vm) {
    hook.mounted(installThemeToggle);

    hook.doneEach(function () {
      const article = document.querySelector('article.markdown-section');
      if (!article) return;

      const routePath = normalizeRoutePath(vm.route);
      syncTopNavigation(vm.route);
      article.classList.toggle('spring-article-index', routePath === `${SPRING_ARTICLE_BASE}README`);
      article.classList.toggle('spring-article', SPRING_ARTICLES.some(function (item) {
        return item.path === routePath;
      }));

      const oldFooter = article.querySelector('.article-footer');
      if (oldFooter) oldFooter.remove();

      const oldPagination = article.querySelector('.spring-pagination');
      if (oldPagination) oldPagination.remove();

      const oldToc = article.querySelector('.article-toc');
      if (oldToc) oldToc.remove();

      const oldComments = article.querySelector('.comments');
      if (oldComments) oldComments.remove();

      const toc = createArticleToc(article, vm.route);
      const articleTitle = article.querySelector('h1');
      if (toc && articleTitle) articleTitle.insertAdjacentElement('afterend', toc);

      const pagination = createSpringPagination(vm.route);
      if (pagination) article.appendChild(pagination);

      const editLink = createEditLink(vm.route);
      if (editLink) {
        const footer = document.createElement('footer');
        footer.className = 'article-footer';
        footer.appendChild(editLink);
        article.appendChild(footer);
      }

      const comments = createComments(vm.route);
      if (comments) article.appendChild(comments);
    });
  });

  document.addEventListener('DOMContentLoaded', installThemeToggle);
})();
