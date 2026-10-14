// Gerenciador de Abas e Navegação do Asclepio Browser (Clone Fiel do Polar)
const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";

class AsclepioBrowser {
  constructor() {
    this.tabs = [];
    this.activeTabId = null;
    this.tabCounter = 0;

    this.tabsContainer = document.getElementById('tabs-container');
    this.webviewsContainer = document.getElementById('webviews-container');
    this.urlInput = document.getElementById('url-input');

    this.btnBack = document.getElementById('btn-back');
    this.btnForward = document.getElementById('btn-forward');
    this.btnReload = document.getElementById('btn-reload');
    this.btnNewTab = document.getElementById('btn-new-tab');
    this.btnNewTabRail = document.getElementById('btn-new-tab-rail');

    this.loadingBar = document.getElementById('page-loading-bar');
    this.loadingFill = document.getElementById('page-loading-fill');

    this.initEventListeners();
    // Inicia com Google ou página inicial
    this.createTab('https://www.google.com', 'Google');
  }

  initEventListeners() {
    // Alternar Tema Claro / Escuro (Padrão: Light Mode Polar)
    this.btnThemeToggle = document.getElementById('btn-theme-toggle');
    const savedTheme = localStorage.getItem('asclepio-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (this.btnThemeToggle) {
      this.btnThemeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('asclepio-theme', next);
      });
    }

    // Nova aba
    if (this.btnNewTab) {
      this.btnNewTab.addEventListener('click', () => {
        this.createTab('https://www.google.com', 'Nova Aba');
      });
    }

    if (this.btnNewTabRail) {
      this.btnNewTabRail.addEventListener('click', () => {
        this.createTab('https://www.google.com', 'Nova Aba');
      });
    }

    // Voltar / Avançar / Recarregar
    if (this.btnBack) {
      this.btnBack.addEventListener('click', () => {
        const wv = this.getActiveWebview();
        if (wv && typeof wv.canGoBack === 'function' && wv.canGoBack()) {
          wv.goBack();
        }
      });
    }

    if (this.btnForward) {
      this.btnForward.addEventListener('click', () => {
        const wv = this.getActiveWebview();
        if (wv && typeof wv.canGoForward === 'function' && wv.canGoForward()) {
          wv.goForward();
        }
      });
    }

    if (this.btnReload) {
      this.btnReload.addEventListener('click', () => {
        const wv = this.getActiveWebview();
        if (wv && typeof wv.reload === 'function') {
          wv.reload();
        }
      });
    }

    // Atalhos de teclado no navegador
    window.addEventListener('keydown', (e) => {
      // Ctrl+T: Nova Aba
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        this.createTab('https://www.google.com', 'Nova Aba');
      }
      // Ctrl+W: Fechar Aba atual
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (this.activeTabId) {
          this.closeTab(this.activeTabId);
        }
      }
      // Ctrl+R ou F5: Recarregar
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') || e.key === 'F5') {
        e.preventDefault();
        const wv = this.getActiveWebview();
        if (wv && typeof wv.reload === 'function') wv.reload();
      }
      // Alt+Left: Voltar
      if (e.altKey && e.key === 'ArrowLeft') {
        const wv = this.getActiveWebview();
        if (wv && typeof wv.canGoBack === 'function' && wv.canGoBack()) wv.goBack();
      }
      // Alt+Right: Avançar
      if (e.altKey && e.key === 'ArrowRight') {
        const wv = this.getActiveWebview();
        if (wv && typeof wv.canGoForward === 'function' && wv.canGoForward()) wv.goForward();
      }
    });

    // Omnibar submit
    this.urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        let input = this.urlInput.value.trim();
        if (!input) return;

        if (!input.includes('.') && !input.startsWith('http://') && !input.startsWith('https://')) {
          input = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
        } else if (!input.startsWith('http://') && !input.startsWith('https://')) {
          input = `https://${input}`;
        }

        this.navigateTo(input);
      }
    });

    // Escuta novas abas solicitadas pelo processo principal
    if (window.__asclepioHost && window.__asclepioHost.onNewTabRequested) {
      window.__asclepioHost.onNewTabRequested((url) => {
        this.createTab(url || 'https://www.google.com');
      });
    }
  }

  showLoadingProgress(progress) {
    if (!this.loadingBar || !this.loadingFill) return;
    this.loadingBar.classList.add('active');
    this.loadingFill.style.width = `${Math.min(100, Math.max(10, progress))}%`;
    if (progress >= 100) {
      setTimeout(() => {
        this.loadingBar.classList.remove('active');
        this.loadingFill.style.width = '0%';
      }, 350);
    }
  }

  updateNavControls() {
    const wv = this.getActiveWebview();
    if (!wv) return;

    try {
      if (typeof wv.canGoBack === 'function') {
        if (wv.canGoBack()) {
          this.btnBack.removeAttribute('disabled');
        } else {
          this.btnBack.setAttribute('disabled', 'true');
        }
      }
      if (typeof wv.canGoForward === 'function') {
        if (wv.canGoForward()) {
          this.btnForward.removeAttribute('disabled');
        } else {
          this.btnForward.setAttribute('disabled', 'true');
        }
      }
    } catch (e) {}
  }

  createTab(url = 'https://www.google.com', title = 'Carregando...') {
    const tabId = `tab-${++this.tabCounter}`;

    const tabEl = document.createElement('div');
    tabEl.className = 'tab';
    tabEl.id = `header-${tabId}`;
    tabEl.innerHTML = `
      <img class="tab-favicon" src="https://www.google.com/s2/favicons?domain=google.com&sz=32" alt="" />
      <span class="tab-title">${title}</span>
      <span class="tab-close" title="Fechar aba">&times;</span>
    `;

    // Cria o webview com User-Agent real do Chrome e partição persistente
    const webviewEl = document.createElement('webview');
    webviewEl.id = `wv-${tabId}`;
    webviewEl.setAttribute('src', url);
    webviewEl.setAttribute('partition', 'persist:asclepio');
    webviewEl.setAttribute('useragent', CHROME_UA);
    webviewEl.setAttribute('allowpopups', 'true');
    webviewEl.setAttribute('webpreferences', 'nativeWindowOpen=yes');

    // Extrai favicon e título
    webviewEl.addEventListener('page-title-updated', (e) => {
      const titleSpan = tabEl.querySelector('.tab-title');
      if (titleSpan) titleSpan.textContent = e.title;
    });

    webviewEl.addEventListener('page-favicon-updated', (e) => {
      if (e.favicons && e.favicons.length > 0) {
        const favImg = tabEl.querySelector('.tab-favicon');
        if (favImg) favImg.src = e.favicons[0];
      }
    });

    webviewEl.addEventListener('did-start-loading', () => {
      this.showLoadingProgress(45);
      if (this.activeTabId === tabId) {
        let currentUrl = null;
        try {
          if (typeof webviewEl.getURL === 'function') {
            currentUrl = webviewEl.getURL();
          }
        } catch (e) {}
        currentUrl = currentUrl || webviewEl.getAttribute('src') || url;
        if (currentUrl) this.urlInput.value = currentUrl;
      }
      this.updateNavControls();
    });

    webviewEl.addEventListener('did-stop-loading', () => {
      this.showLoadingProgress(100);
      this.updateNavControls();
    });

    webviewEl.addEventListener('dom-ready', () => {
      try {
        if (typeof webviewEl.getURL === 'function') {
          const currentUrl = webviewEl.getURL();
          if (currentUrl && this.activeTabId === tabId) {
            this.urlInput.value = currentUrl;
          }
        }
      } catch (e) {}
      this.updateNavControls();
    });

    webviewEl.addEventListener('did-navigate', (e) => {
      if (this.activeTabId === tabId) {
        this.urlInput.value = e.url;
      }
      // Atualiza favicon com base no domínio
      try {
        const u = new URL(e.url);
        const favImg = tabEl.querySelector('.tab-favicon');
        if (favImg) favImg.src = `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
      } catch(err) {}
      this.updateNavControls();
    });

    webviewEl.addEventListener('did-navigate-in-page', (e) => {
      if (this.activeTabId === tabId) {
        this.urlInput.value = e.url;
      }
      this.updateNavControls();
    });

    webviewEl.addEventListener('did-fail-load', (e) => {
      this.showLoadingProgress(100);
      console.warn(`[Webview] Falha ao carregar ${e.validatedURL}: ${e.errorDescription} (${e.errorCode})`);
    });

    tabEl.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close')) {
        this.activateTab(tabId);
      }
    });

    tabEl.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(tabId);
    });

    this.tabsContainer.appendChild(tabEl);
    this.webviewsContainer.appendChild(webviewEl);

    this.tabs.push({ id: tabId, tabEl, webviewEl });
    this.activateTab(tabId);
  }

  activateTab(tabId) {
    this.tabs.forEach((t) => {
      if (t.id === tabId) {
        t.tabEl.classList.add('active');
        t.webviewEl.classList.add('active');
        let u = null;
        try {
          if (typeof t.webviewEl.getURL === 'function') {
            u = t.webviewEl.getURL();
          }
        } catch (e) {}
        u = u || t.webviewEl.getAttribute('src') || '';
        if (u) this.urlInput.value = u;
      } else {
        t.tabEl.classList.remove('active');
        t.webviewEl.classList.remove('active');
      }
    });
    this.activeTabId = tabId;
    this.updateNavControls();
  }

  closeTab(tabId) {
    const index = this.tabs.findIndex((t) => t.id === tabId);
    if (index === -1) return;

    const tab = this.tabs[index];
    tab.tabEl.remove();
    tab.webviewEl.remove();
    this.tabs.splice(index, 1);

    if (this.tabs.length === 0) {
      this.createTab();
    } else if (this.activeTabId === tabId) {
      const nextTab = this.tabs[Math.max(0, index - 1)];
      this.activateTab(nextTab.id);
    }
  }

  navigateTo(url) {
    let target = url.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }

    console.log('[Asclepio] Navegando para:', target);
    this.urlInput.value = target;

    const wv = this.getActiveWebview();
    if (wv) {
      const tab = this.tabs.find((t) => t.id === this.activeTabId);
      if (tab) {
        tab.tabEl.querySelector('.tab-title').textContent = 'Carregando...';
      }

      try {
        if (typeof wv.loadURL === 'function') {
          wv.loadURL(target);
        } else {
          wv.setAttribute('src', target);
        }
      } catch (err) {
        console.warn('[Asclepio] Erro em loadURL, aplicando src:', err);
        wv.setAttribute('src', target);
      }
    }
  }

  getActiveWebview() {
    const tab = this.tabs.find((t) => t.id === this.activeTabId);
    return tab ? tab.webviewEl : null;
  }
}

window.asclepioBrowser = new AsclepioBrowser();
