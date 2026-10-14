// Cursor Visual Autônomo do Asclepio Agent (Simulador de Mouse na Tela)
class AgentCursor {
  constructor() {
    this.cursorEl = document.getElementById('agent-cursor');
    this.labelEl = document.getElementById('cursor-label');
    this.x = window.innerWidth / 2;
    this.y = window.innerHeight / 2;
    this.init();
  }

  init() {
    if (!this.cursorEl) return;
    this.cursorEl.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
  }

  show(text = "Asclepio AI") {
    if (!this.cursorEl) return;
    this.cursorEl.classList.add('visible');
    if (this.labelEl) this.labelEl.textContent = text;
  }

  hide() {
    if (!this.cursorEl) return;
    setTimeout(() => {
      this.cursorEl.classList.remove('visible');
    }, 1000);
  }

  async moveTo(x, y, duration = 600, label = "Asclepio AI") {
    if (!this.cursorEl) return;
    this.show(label);

    // Limites de tela seguros (respeita se o painel do agente está aberto ou fechado)
    const panel = document.getElementById('agent-panel');
    const panelOffset = (panel && !panel.classList.contains('hidden')) ? (panel.offsetWidth || 360) : 20;
    const targetX = Math.max(10, Math.min(window.innerWidth - panelOffset - 10, x));
    const targetY = Math.max(60, Math.min(window.innerHeight - 30, y));


    this.cursorEl.style.transition = `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    this.cursorEl.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
    this.x = targetX;
    this.y = targetY;

    await new Promise(r => setTimeout(r, duration + 40));
  }

  async clickAt(x, y, label = "Clicando...") {
    await this.moveTo(x, y, 550, label);

    // Efeito físico de clique
    if (this.cursorEl) {
      this.cursorEl.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) scale(0.85)`;
      this.spawnRipple(this.x, this.y);
      await new Promise(r => setTimeout(r, 160));
      this.cursorEl.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) scale(1)`;
      await new Promise(r => setTimeout(r, 120));
    }
  }

  spawnRipple(x, y) {
    const rip = document.createElement('div');
    rip.className = 'agent-ripple';
    rip.style.left = `${x}px`;
    rip.style.top = `${y}px`;
    document.body.appendChild(rip);
    setTimeout(() => rip.remove(), 600);
  }

  async typeAt(x, y, text) {
    await this.moveTo(x, y, 500, "Digitando...");
    this.show(`⌨️ "${text.slice(0, 24)}${text.length > 24 ? '…' : ''}"`);
    this.spawnRipple(this.x, this.y);
    await new Promise(r => setTimeout(r, 500));
  }
}

window.agentCursor = new AgentCursor();
