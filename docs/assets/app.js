(function () {
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
    link.textContent = '在 GitHub 上编辑本文 ↗';
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

      const oldFooter = article.querySelector('.article-footer');
      if (oldFooter) oldFooter.remove();

      const oldComments = article.querySelector('.comments');
      if (oldComments) oldComments.remove();

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

