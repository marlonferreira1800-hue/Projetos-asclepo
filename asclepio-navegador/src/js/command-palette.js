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

    // Navegação por teclado (Setas Cima / Baixo e Enter)
    this.inputEl.addEventListener('keydown', (e) => {
      const items = Array.from(this.resultsEl.querySelectorAll('.palette-item'));
      let currentIndex = items.findIndex(it => it.classList.contains('selected'));

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (items.length === 0) return;
        if (currentIndex !== -1) items[currentIndex].classList.remove('selected');
        currentIndex = (currentIndex + 1) % items.length;
        items[currentIndex].classList.add('selected');
        items[currentIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (items.length === 0) return;
        if (currentIndex !== -1) items[currentIndex].classList.remove('selected');
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        items[currentIndex].classList.add('selected');
        items[currentIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = items[currentIndex];
        const query = this.inputEl.value.trim();

        if (selected && !query) {
          this.executeAction(selected.dataset.action);
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

  executeAction(action) {
    this.close();

    switch (action) {
      case 'ask-ai':
        if (window.asclepioAgent) {
          window.asclepioAgent.openPanel();
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
    this.inputEl.focus();
    this.isOpen = true;
  }

  close() {
    this.paletteEl.setAttribute('hidden', 'true');
    this.isOpen = false;
  }
}

window.commandPalette = new CommandPalette();
