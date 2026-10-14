// Command Palette (Omnibar Flutuante estilo Polar / Arc — Ctrl+K)
class CommandPalette {
  constructor() {
    this.paletteEl = document.getElementById('command-palette');
    this.inputEl = document.getElementById('palette-input');
    this.resultsEl = document.getElementById('palette-results');
    this.isOpen = false;

    this.initEventListeners();
  }

  initEventListeners() {
    // Atalho global Ctrl+K
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Clique no backdrop fecha
    if (this.paletteEl) {
      this.paletteEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('palette-backdrop')) {
          this.close();
        }
      });
    }

    // Clique nos itens
    if (this.resultsEl) {
      this.resultsEl.addEventListener('click', (e) => {
        const item = e.target.closest('.palette-item');
        if (item) {
          const action = item.dataset.action;
          this.executeAction(action);
        }
      });
    }

    // Filtro dinâmico de busca ao digitar
    this.inputEl.addEventListener('input', () => {
      this.filterItems();
    });

    // Navegação por teclado (Setas Cima / Baixo e Enter)
    this.inputEl.addEventListener('keydown', (e) => {
      const visibleItems = Array.from(this.resultsEl.querySelectorAll('.palette-item'))
        .filter(it => it.style.display !== 'none');
      let currentIndex = visibleItems.findIndex(it => it.classList.contains('selected'));

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (visibleItems.length === 0) return;
        if (currentIndex !== -1) visibleItems[currentIndex].classList.remove('selected');
        currentIndex = (currentIndex + 1) % visibleItems.length;
        visibleItems[currentIndex].classList.add('selected');
        visibleItems[currentIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (visibleItems.length === 0) return;
        if (currentIndex !== -1) visibleItems[currentIndex].classList.remove('selected');
        currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
        visibleItems[currentIndex].classList.add('selected');
        visibleItems[currentIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = visibleItems[currentIndex];
        const query = this.inputEl.value.trim();

        // Se há um item selecionado que não é o genérico 'ask-ai', ou se o query está vazio
        if (selected && (!query || selected.dataset.action !== 'ask-ai')) {
          this.executeAction(selected.dataset.action, query);
        } else if (query) {
          // Se começou com barra ou pergunta pro agente
          if (query.startsWith('/') || query.toLowerCase().startsWith('como') || query.toLowerCase().startsWith('o que')) {
            if (window.asclepioAgent) {
              window.asclepioAgent.openPanel();
              window.asclepioAgent.handleUserPrompt(query.replace(/^\//, ''));
            }
          } else {
            // URL ou busca no Google
            const url = query.includes('.') && !query.includes(' ')
              ? (query.startsWith('http') ? query : `https://${query}`)
              : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            if (window.asclepioBrowser) {
              window.asclepioBrowser.createTab(url);
            }
          }
          this.close();
        }
      }
    });
  }

  filterItems() {
    const query = this.inputEl.value.trim().toLowerCase();
    const items = Array.from(this.resultsEl.querySelectorAll('.palette-item'));
    let firstVisible = null;
    let hasSelectedVisible = false;

    items.forEach(item => {
      const text = (item.textContent || '').toLowerCase();
      const action = (item.dataset.action || '').toLowerCase();
      const matches = !query || text.includes(query) || action.includes(query);
      if (matches) {
        item.style.display = '';
        if (!firstVisible) firstVisible = item;
        if (item.classList.contains('selected')) hasSelectedVisible = true;
      } else {
        item.style.display = 'none';
        item.classList.remove('selected');
      }
    });

    if (!hasSelectedVisible) {
      items.forEach(it => it.classList.remove('selected'));
      if (firstVisible) {
        firstVisible.classList.add('selected');
      }
    }
  }

  executeAction(action, query = '') {
    this.close();

    switch (action) {
      case 'ask-ai':
        if (window.asclepioAgent) {
          window.asclepioAgent.openPanel();
          if (query) {
            window.asclepioAgent.handleUserPrompt(query);
          }
        }
        break;

      case 'new-tab':
        if (window.asclepioBrowser) {
          window.asclepioBrowser.createTab('https://www.google.com', 'Nova Aba');
        }
        break;

      case 'youtube':
        if (window.asclepioBrowser) {
          window.asclepioBrowser.createTab('https://www.youtube.com', 'YouTube');
        }
        break;

      case 'summarize':
        if (window.asclepioAgent) {
          window.asclepioAgent.handleQuickAction('summarize');
        }
        break;
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.paletteEl.removeAttribute('hidden');
    this.inputEl.value = '';
    // Restaura visibilidade de todos os itens e reseta seleção
    const items = Array.from(this.resultsEl.querySelectorAll('.palette-item'));
    items.forEach((it, idx) => {
      it.style.display = '';
      if (idx === 0) it.classList.add('selected');
      else it.classList.remove('selected');
    });
    this.inputEl.focus();
    this.isOpen = true;
  }

  close() {
    this.paletteEl.setAttribute('hidden', 'true');
    this.isOpen = false;
  }
}

window.commandPalette = new CommandPalette();
