/**
 * DECIFRANDO DADOS - REDAÇÃO VIRTUAL 2D
 * Motor de Jogo Canvas HTML5 com Gráficos Pixel Art, Interpolação e WebSockets.
 * 
 * Marlon Ferreira - Newsletter Decifrando Dados ("The BRIEF")
 */

(function () {
  'use strict';

  // ==========================================================================
  // CONFIGURAÇÕES GERAIS E CONSTANTES
  // ==========================================================================
  const CANVAS_WIDTH = 960;
  const CANVAS_HEIGHT = 580;

  // Cores do Tema Retrô
  const PALETTE = {
    floorWood: '#2c1e18',
    floorWoodAlt: '#36251e',
    floorLine: '#201611',
    carpetNavy: '#131e32',
    carpetBorder: '#23385d',
    kitchenTile1: '#1f2937',
    kitchenTile2: '#111827',
    wallTop: '#0f172a',
    wallBase: '#1e293b',
    woodTrim: '#451a03',
    deskWood: '#78350f',
    deskTop: '#92400e',
    screenBezel: '#18181b',
    screenGlow: '#38bdf8',
    screenCode: '#4ade80',
    whiteboard: '#f8fafc',
    whiteboardBorder: '#64748b',
    chairFabric: '#334155',
    coffeeCounter: '#475569',
    sofaLeather: '#991b1b',
    plantPot: '#b45309',
    plantLeaf: '#16a34a'
  };

  // Coordenadas Fixas de Navegação e Estações de Trabalho
  const WORKSTATIONS = [
    { id: 0, x: 140, y: 190, chairX: 140, chairY: 235, label: "Pautas & Efemérides", prop: "newspaper" },
    { id: 1, x: 310, y: 190, chairX: 310, chairY: 235, label: "Redação The BRIEF", prop: "typewriter" },
    { id: 2, x: 480, y: 190, chairX: 480, chairY: 235, label: "Fact-Check & SQL", prop: "chart" },
    { id: 3, x: 650, y: 190, chairX: 650, chairY: 235, label: "Diagramação PDF", prop: "palette" },
    { id: 4, x: 820, y: 190, chairX: 820, chairY: 235, label: "LinkedIn & SEO", prop: "megaphone" }
  ];

  // Pontos de Interesse da Área de Café e Descompressão
  const LOUNGE_POINTS = [
    { x: 90, y: 440, label: "Cafeteira Espresso", type: "coffee" },
    { x: 150, y: 440, label: "Bebedouro de Água", type: "water" },
    { x: 100, y: 520, label: "Sofá Retrô Esquerda", type: "sofa" },
    { x: 170, y: 520, label: "Sofá Retrô Direita", type: "sofa" }
  ];

  // Mesa Redonda de Alinhamento (Centro / Inferior)
  const MEETING_POINTS = [
    { x: 460, y: 470, label: "Reunião Pauta 1" },
    { x: 540, y: 470, label: "Reunião Pauta 2" },
    { x: 500, y: 420, label: "Reunião Pauta 3" },
    { x: 500, y: 520, label: "Reunião Pauta 4" }
  ];

  // Grafo de Corredores e Waypoints para Navegação Suave (Evita Colisão)
  const WAYPOINTS = {
    // Corredor Principal Superior (frente às mesas)
    hall_desk_0: { x: 140, y: 290, neighbors: ['hall_desk_1', 'desk_0_chair'] },
    hall_desk_1: { x: 310, y: 290, neighbors: ['hall_desk_0', 'hall_desk_2', 'desk_1_chair', 'main_cross_1'] },
    hall_desk_2: { x: 480, y: 290, neighbors: ['hall_desk_1', 'hall_desk_3', 'desk_2_chair', 'main_cross_2'] },
    hall_desk_3: { x: 650, y: 290, neighbors: ['hall_desk_2', 'hall_desk_4', 'desk_3_chair', 'main_cross_3'] },
    hall_desk_4: { x: 820, y: 290, neighbors: ['hall_desk_3', 'desk_4_chair'] },

    // Acessos às Cadeiras
    desk_0_chair: { x: 140, y: 235, neighbors: ['hall_desk_0'] },
    desk_1_chair: { x: 310, y: 235, neighbors: ['hall_desk_1'] },
    desk_2_chair: { x: 480, y: 235, neighbors: ['hall_desk_2'] },
    desk_3_chair: { x: 650, y: 235, neighbors: ['hall_desk_3'] },
    desk_4_chair: { x: 820, y: 235, neighbors: ['hall_desk_4'] },

    // Corredor Central Médio
    main_cross_1: { x: 310, y: 360, neighbors: ['hall_desk_1', 'main_cross_2', 'lounge_entry'] },
    main_cross_2: { x: 500, y: 360, neighbors: ['hall_desk_2', 'main_cross_1', 'main_cross_3', 'meeting_top'] },
    main_cross_3: { x: 720, y: 360, neighbors: ['hall_desk_3', 'main_cross_2', 'east_hall'] },
    east_hall: { x: 720, y: 480, neighbors: ['main_cross_3', 'meeting_right'] },

    // Área do Lounge / Café
    lounge_entry: { x: 230, y: 360, neighbors: ['main_cross_1', 'lounge_center'] },
    lounge_center: { x: 130, y: 380, neighbors: ['lounge_entry', 'coffee_node', 'water_node', 'sofa_node'] },
    coffee_node: { x: 90, y: 440, neighbors: ['lounge_center'] },
    water_node: { x: 150, y: 440, neighbors: ['lounge_center'] },
    sofa_node: { x: 135, y: 515, neighbors: ['lounge_center'] },

    // Mesa de Reunião
    meeting_top: { x: 500, y: 420, neighbors: ['main_cross_2', 'meeting_center'] },
    meeting_center: { x: 500, y: 470, neighbors: ['meeting_top', 'meeting_left', 'meeting_right', 'meeting_bottom'] },
    meeting_left: { x: 450, y: 470, neighbors: ['meeting_center'] },
    meeting_right: { x: 550, y: 470, neighbors: ['meeting_center', 'east_hall'] },
    meeting_bottom: { x: 500, y: 520, neighbors: ['meeting_center'] }
  };

  // ==========================================================================
  // SINTETIZADOR DE ÁUDIO RETRÔ (WEB AUDIO API - ZERO ARQUIVOS EXTERNOS)
  // ==========================================================================
  class RetroAudioSynthesizer {
    constructor() {
      this.ctx = null;
      this.enabled = false;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTone(freq, type, duration, gainLevel = 0.05) {
      if (!this.enabled || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type; // 'sine', 'square', 'triangle'
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Ignora silenciosamente
      }
    }

    soundWorking() {
      // Pequeno bip de digitação
      this.playTone(600 + Math.random() * 200, 'triangle', 0.06, 0.03);
    }

    soundIdle() {
      // Som suave de descompressão/café
      this.playTone(330, 'sine', 0.15, 0.04);
      setTimeout(() => this.playTone(440, 'sine', 0.15, 0.04), 100);
    }

    soundWaiting() {
      // Som de interrogação/alerta sutil
      this.playTone(520, 'square', 0.08, 0.03);
      setTimeout(() => this.playTone(680, 'square', 0.12, 0.04), 70);
    }
  }

  const audioSynth = new RetroAudioSynthesizer();

  // ==========================================================================
  // CLASSE AGENTE (ENTIDADE DO JOGO)
  // ==========================================================================
  class AgentEntity {
    constructor(data) {
      this.id = data.id;
      this.nome = data.nome || "Agente IA";
      this.role = data.role || "Redator";
      this.status = data.status || "idle"; // "working", "idle", "waiting"
      this.activity = data.activity || "Inicializando...";
      this.deskId = data.desk_id !== undefined ? data.desk_id : 0;
      this.color = data.color || "#38bdf8";
      this.avatar = data.avatar || "curador";

      // Posição no Canvas
      const initialDesk = WORKSTATIONS[this.deskId] || WORKSTATIONS[0];
      this.x = initialDesk.chairX;
      this.y = initialDesk.chairY;
      this.targetX = this.x;
      this.targetY = this.y;

      // Movimentação & Interpolação
      this.speed = 130; // pixels por segundo
      this.facing = "up"; // "up", "down", "left", "right"
      this.isMoving = false;
      this.path = []; // Lista de nós waypoints para percorrer
      this.currentWaypoint = null;

      // Animações
      this.walkTimer = 0;
      this.walkFrame = 0;
      this.bubbleBob = Math.random() * Math.PI * 2;
      this.typeTimer = 0;
      this.codeParticles = []; // Partículas de código flutuante

      // Ajusta destino inicial com base no status
      this.updateDestinationByStatus();
    }

    updateData(data) {
      const oldStatus = this.status;
      this.nome = data.nome || this.nome;
      this.role = data.role || this.role;
      this.activity = data.activity || this.activity;
      this.color = data.color || this.color;
      this.deskId = data.desk_id !== undefined ? data.desk_id : this.deskId;

      if (data.status && data.status !== oldStatus) {
        this.status = data.status;
        this.onStatusChanged(oldStatus, this.status);
      }
    }

    onStatusChanged(oldStatus, newStatus) {
      this.updateDestinationByStatus();

      // Dispara efeito sonoro sutil
      if (newStatus === "working") audioSynth.soundWorking();
      else if (newStatus === "idle") audioSynth.soundIdle();
      else if (newStatus === "waiting") audioSynth.soundWaiting();
    }

    updateDestinationByStatus() {
      if (this.status === "working") {
        // Caminha até a sua mesa de trabalho
        const desk = WORKSTATIONS[this.deskId] || WORKSTATIONS[0];
        this.navigateTo(desk.chairX, desk.chairY, `desk_${this.deskId}_chair`);
      } else if (this.status === "idle") {
        // Escolhe ponto de café, sofá ou passeio
        const pick = Math.random();
        if (pick < 0.4) {
          // Cafeteira
          this.navigateTo(90, 440, 'coffee_node');
        } else if (pick < 0.7) {
          // Sofá
          this.navigateTo(135, 515, 'sofa_node');
        } else {
          // Passeio até a mesa de reuniões
          this.navigateTo(500, 470, 'meeting_center');
        }
      } else if (this.status === "waiting") {
        // Permanece onde está ou senta na mesa com balão de dúvida
        if (this.isAtDesk()) {
          this.facing = "down"; // Vira para frente da tela reflexivo
        }
      }
    }

    isAtDesk() {
      const desk = WORKSTATIONS[this.deskId];
      if (!desk) return false;
      const d = Math.hypot(this.x - desk.chairX, this.y - desk.chairY);
      return d < 8;
    }

    // Navegação simples com Waypoints
    navigateTo(destX, destY, targetNodeName = null) {
      // Encontra nó mais próximo da posição atual do agente
      const startNode = this.findClosestNode(this.x, this.y);
      const endNode = targetNodeName || this.findClosestNode(destX, destY);

      if (startNode && endNode && startNode !== endNode) {
        const route = this.findPath(startNode, endNode);
        if (route.length > 0) {
          this.path = route.map(nodeName => ({
            x: WAYPOINTS[nodeName].x,
            y: WAYPOINTS[nodeName].y
          }));
          // Adiciona destino final exato
          this.path.push({ x: destX, y: destY });
          return;
        }
      }

      // Fallback: rota direta se já estiver muito perto
      this.path = [{ x: destX, y: destY }];
    }

    findClosestNode(px, py) {
      let closest = null;
      let minDist = Infinity;
      for (const [name, pt] of Object.entries(WAYPOINTS)) {
        const dist = Math.hypot(px - pt.x, py - pt.y);
        if (dist < minDist) {
          minDist = dist;
          closest = name;
        }
      }
      return closest;
    }

    // Busca de caminho BFS simples no grafo de waypoints
    findPath(start, end) {
      const queue = [[start]];
      const visited = new Set([start]);

      while (queue.length > 0) {
        const path = queue.shift();
        const current = path[path.length - 1];

        if (current === end) {
          return path;
        }

        const neighbors = (WAYPOINTS[current] && WAYPOINTS[current].neighbors) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && WAYPOINTS[neighbor]) {
            visited.add(neighbor);
            queue.push([...path, neighbor]);
          }
        }
      }
      return [end];
    }

    // Atualização física e animações (chamado a cada frame)
    update(dt) {
      this.bubbleBob += dt * 3.5;

      // Gerencia partículas de código flutuantes quando trabalhando
      if (this.status === "working" && this.isAtDesk()) {
        this.typeTimer += dt;
        if (this.typeTimer > 0.35) {
          this.typeTimer = 0;
          const tokens = ['01', '</>', 'py', 'sql', '💡', 'dt', 'AI'];
          this.codeParticles.push({
            x: this.x + (Math.random() * 20 - 10),
            y: this.y - 25,
            text: tokens[Math.floor(Math.random() * tokens.length)],
            alpha: 1.0,
            vy: -25 - Math.random() * 15
          });
        }
      }

      // Atualiza partículas
      for (let i = this.codeParticles.length - 1; i >= 0; i--) {
        const p = this.codeParticles[i];
        p.y += p.vy * dt;
        p.alpha -= dt * 1.2;
        if (p.alpha <= 0) {
          this.codeParticles.splice(i, 1);
        }
      }

      // Movimento ao longo do caminho planejado com interpolação suave
      if (this.path.length > 0) {
        const target = this.path[0];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);

        // Atualiza direção de olhar
        if (Math.abs(dx) > Math.abs(dy)) {
          this.facing = dx > 0 ? "right" : "left";
        } else if (Math.abs(dy) > 2) {
          this.facing = dy > 0 ? "down" : "up";
        }

        const step = this.speed * dt;

        if (dist <= step) {
          // Chegou ao waypoint atual
          this.x = target.x;
          this.y = target.y;
          this.path.shift();
          if (this.path.length === 0) {
            this.isMoving = false;
            // Ao chegar na mesa, vira para a mesa
            if (this.isAtDesk() && this.status === "working") {
              this.facing = "up";
            }
          }
        } else {
          // Interpolação suave em direção ao ponto
          this.isMoving = true;
          this.x += (dx / dist) * step;
          this.y += (dy / dist) * step;
          this.walkTimer += dt * 10;
          this.walkFrame = Math.floor(this.walkTimer) % 4;
        }
      } else {
        this.isMoving = false;
      }
    }

    // Renderização do Agente no Canvas
    draw(ctx, isHovered = false, isSelected = false) {
      ctx.save();

      // Sombra projetada no chão
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 12, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Círculo de seleção / hover
      if (isHovered || isSelected) {
        ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 4, 16, 14, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Desenha corpo pixel art do agente
      this.drawPixelCharacter(ctx);

      // Partículas de código flutuante
      this.drawParticles(ctx);

      // Balão de Status sobre a cabeça
      this.drawStatusBubble(ctx);

      // Tag de Identificação / Nome
      this.drawNameTag(ctx);

      ctx.restore();
    }

    drawPixelCharacter(ctx) {
      const cx = Math.round(this.x);
      let cy = Math.round(this.y);

      // Leve bobbing ao caminhar
      if (this.isMoving) {
        cy += (this.walkFrame % 2 === 0) ? -1 : 1;
      }

      // 1. Pernas / Pés
      ctx.fillStyle = '#1e293b'; // Calça escura
      if (this.isMoving) {
        if (this.walkFrame === 1) {
          ctx.fillRect(cx - 5, cy + 6, 4, 6);
          ctx.fillRect(cx + 1, cy + 4, 4, 5);
        } else if (this.walkFrame === 3) {
          ctx.fillRect(cx - 5, cy + 4, 4, 5);
          ctx.fillRect(cx + 1, cy + 6, 4, 6);
        } else {
          ctx.fillRect(cx - 5, cy + 5, 4, 6);
          ctx.fillRect(cx + 1, cy + 5, 4, 6);
        }
      } else {
        ctx.fillRect(cx - 5, cy + 5, 4, 6);
        ctx.fillRect(cx + 1, cy + 5, 4, 6);
      }

      // Sapatos
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 6, cy + 10, 5, 3);
      ctx.fillRect(cx + 1, cy + 10, 5, 3);

      // 2. Tronco / Roupa com cor única
      ctx.fillStyle = this.color;
      ctx.fillRect(cx - 6, cy - 4, 12, 10);

      // Gola / Detalhe da roupa
      ctx.fillStyle = '#ffffff';
      if (this.facing === "down") {
        ctx.fillRect(cx - 2, cy - 4, 4, 3);
      }

      // 3. Cabeça / Rosto
      ctx.fillStyle = '#fed7aa'; // Tom de pele clássico RPG
      ctx.fillRect(cx - 5, cy - 14, 10, 10);

      // Cabelo / Acessório com base no avatar
      this.drawHairAndAccessories(ctx, cx, cy);

      // Olhos (com base na direção)
      if (this.facing !== "up") {
        ctx.fillStyle = '#0f172a';
        if (this.facing === "down") {
          ctx.fillRect(cx - 3, cy - 10, 2, 2);
          ctx.fillRect(cx + 1, cy - 10, 2, 2);
        } else if (this.facing === "left") {
          ctx.fillRect(cx - 4, cy - 10, 2, 2);
        } else if (this.facing === "right") {
          ctx.fillRect(cx + 2, cy - 10, 2, 2);
        }
      }
    }

    drawHairAndAccessories(ctx, cx, cy) {
      if (this.avatar === "curador") {
        // Cabelo moderno castanho + fones azuis
        ctx.fillStyle = '#451a03';
        ctx.fillRect(cx - 6, cy - 17, 12, 4);
        ctx.fillRect(cx - 6, cy - 14, 2, 4);
        // Headphone azul
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(cx - 7, cy - 12, 2, 5);
        ctx.fillRect(cx + 5, cy - 12, 2, 5);
        ctx.fillRect(cx - 5, cy - 17, 10, 2);
      } else if (this.avatar === "redator") {
        // Cabelo preto com topete estiloso
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - 6, cy - 18, 12, 5);
        ctx.fillRect(cx - 2, cy - 20, 6, 3);
        // Óculos finos verdes
        if (this.facing !== "up") {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(cx - 4, cy - 11, 8, 1);
        }
      } else if (this.avatar === "dados") {
        // Cabelo ruivo/cobre + óculos redondos
        ctx.fillStyle = '#b45309';
        ctx.fillRect(cx - 6, cy - 17, 12, 4);
        ctx.fillRect(cx - 6, cy - 14, 2, 5);
        ctx.fillRect(cx + 4, cy - 14, 2, 5);
        if (this.facing !== "up") {
          ctx.fillStyle = '#f59e0b';
          ctx.strokeRect(cx - 4, cy - 12, 3, 3);
          ctx.strokeRect(cx + 1, cy - 12, 3, 3);
        }
      } else if (this.avatar === "diagramador") {
        // Boina / Gorro rosa magenta retrô
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(cx - 7, cy - 19, 14, 6);
        ctx.fillRect(cx - 4, cy - 21, 8, 3);
        // Mecha loira
        ctx.fillStyle = '#fde047';
        ctx.fillRect(cx - 5, cy - 13, 2, 4);
      } else { // publisher
        // Penteado roxo tech
        ctx.fillStyle = '#6b21a8';
        ctx.fillRect(cx - 6, cy - 18, 12, 4);
        ctx.fillRect(cx - 6, cy - 14, 3, 5);
        ctx.fillRect(cx + 3, cy - 14, 3, 5);
      }
    }

    drawParticles(ctx) {
      ctx.font = '9px monospace';
      ctx.fillStyle = '#4ade80';
      for (const p of this.codeParticles) {
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillText(p.text, p.x, p.y);
      }
      ctx.globalAlpha = 1.0;
    }

    drawStatusBubble(ctx) {
      const bob = Math.sin(this.bubbleBob) * 2;
      const bx = Math.round(this.x);
      const by = Math.round(this.y - 30 + bob);

      if (this.status === "working") {
        // Balão de Digitação / Código (⌨️)
        this.renderSpeechBubble(ctx, bx, by, '#10b981', '⌨️');
      } else if (this.status === "waiting") {
        // Balão com Ponto de Interrogação Pulsante (❓)
        this.renderSpeechBubble(ctx, bx, by, '#f59e0b', '❓');
      } else if (this.status === "idle") {
        // Balão de Café ou Música (☕)
        this.renderSpeechBubble(ctx, bx, by, '#38bdf8', '☕');
      }
    }

    renderSpeechBubble(ctx, x, y, borderColor, iconText) {
      const w = 24;
      const h = 20;

      // Fundo Branco do Balão de RPG
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;

      // Balão com biquinho apontando para baixo
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h / 2, w, h, 5);
      ctx.fill();
      ctx.stroke();

      // Triângulo do rabicho do balão
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x - 3, y + h / 2);
      ctx.lineTo(x + 3, y + h / 2);
      ctx.lineTo(x, y + h / 2 + 4);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      ctx.moveTo(x - 3, y + h / 2);
      ctx.lineTo(x, y + h / 2 + 4);
      ctx.lineTo(x + 3, y + h / 2);
      ctx.stroke();

      // Emoji/Ícone centralizado
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(iconText, x, y);
    }

    drawNameTag(ctx) {
      const ny = Math.round(this.y + 18);
      const shortName = this.role.split(' ')[0];

      ctx.font = 'bold 9px -apple-system, sans-serif';
      const textWidth = ctx.measureText(shortName).width;
      const padX = 6;
      const h = 14;

      // Fundo Pill
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.roundRect(this.x - (textWidth + padX * 2) / 2, ny, textWidth + padX * 2, h, 4);
      ctx.fill();
      ctx.stroke();

      // Texto
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(shortName, this.x, ny + h / 2);
    }
  }

  // ==========================================================================
  // MOTOR DE RENDERIZAÇÃO DO CENÁRIO (OFFICE WORLD RENDERER)
  // ==========================================================================
  class OfficeSceneRenderer {
    constructor(ctx) {
      this.ctx = ctx;
      this.time = 0;
      this.steamParticles = [];
      this.waterBubbles = [];
    }

    update(dt) {
      this.time += dt;

      // Animação de fumacinha saindo da cafeteira
      if (Math.random() < 0.25) {
        this.steamParticles.push({
          x: 92 + (Math.random() * 8 - 4),
          y: 435,
          alpha: 0.7,
          radius: 2 + Math.random() * 2,
          vy: -15 - Math.random() * 10
        });
      }

      for (let i = this.steamParticles.length - 1; i >= 0; i--) {
        const p = this.steamParticles[i];
        p.y += p.vy * dt;
        p.alpha -= dt * 0.45;
        p.radius += dt * 1.5;
        if (p.alpha <= 0) {
          this.steamParticles.splice(i, 1);
        }
      }

      // Animação de bolhas no galão de água
      if (Math.random() < 0.15) {
        this.waterBubbles.push({
          x: 148 + Math.random() * 8,
          y: 436,
          radius: 1.5,
          vy: -18
        });
      }

      for (let i = this.waterBubbles.length - 1; i >= 0; i--) {
        const b = this.waterBubbles[i];
        b.y += b.vy * dt;
        if (b.y < 418) {
          this.waterBubbles.splice(i, 1);
        }
      }
    }

    draw(agentsList) {
      const ctx = this.ctx;

      // 1. Chão Geral (Piso de Madeira / Parquet Pixelado)
      this.drawWoodenFloor(ctx);

      // 2. Área do Lounge (Carpete Azul Petróleo com Borda)
      this.drawLoungeCarpet(ctx);

      // 3. Paredes Superiores e Janelas Panorâmicas
      this.drawWallsAndWindows(ctx);

      // 4. Lousa Branca Editorial da Newsletter Decifrando Dados
      this.drawEditorialWhiteboard(ctx);

      // 5. Estante de Livros de Tecnologia
      this.drawBookshelf(ctx);

      // 6. Área de Café e Descompressão (Cafeteira, Água, Sofá)
      this.drawCoffeeCorner(ctx);

      // 7. Mesa Redonda de Alinhamento
      this.drawMeetingTable(ctx);

      // 8. 5 Estações de Trabalho (Mesas, Computadores e Cadeiras)
      this.drawWorkstations(ctx, agentsList);

      // 9. Plantas Ornamentais
      this.drawOfficePlants(ctx);

      // 10. Relógio de Parede
      this.drawWallClock(ctx);
    }

    drawWoodenFloor(ctx) {
      const tileSize = 32;
      for (let y = 0; y < CANVAS_HEIGHT; y += tileSize) {
        for (let x = 0; x < CANVAS_WIDTH; x += tileSize) {
          const isAlt = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
          ctx.fillStyle = isAlt ? PALETTE.floorWood : PALETTE.floorWoodAlt;
          ctx.fillRect(x, y, tileSize, tileSize);

          // Linha de tabua de madeira
          ctx.strokeStyle = PALETTE.floorLine;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, tileSize, tileSize);
        }
      }
    }

    drawLoungeCarpet(ctx) {
      const lx = 40;
      const ly = 340;
      const lw = 200;
      const lh = 220;

      // Carpete elegante
      ctx.fillStyle = PALETTE.carpetNavy;
      ctx.fillRect(lx, ly, lw, lh);

      ctx.strokeStyle = PALETTE.carpetBorder;
      ctx.lineWidth = 3;
      ctx.strokeRect(lx, ly, lw, lh);

      // Detalhe de franjas no carpete
      ctx.fillStyle = '#fde047';
      for (let i = lx + 4; i < lx + lw; i += 8) {
        ctx.fillRect(i, ly - 2, 4, 2);
        ctx.fillRect(i, ly + lh, 4, 2);
      }
    }

    drawWallsAndWindows(ctx) {
      // Parede superior
      ctx.fillStyle = PALETTE.wallTop;
      ctx.fillRect(0, 0, CANVAS_WIDTH, 120);

      // Rodapé de madeira nobre
      ctx.fillStyle = PALETTE.woodTrim;
      ctx.fillRect(0, 116, CANVAS_WIDTH, 8);

      // Janela Panorâmica com Céu Noturno / Skyline da Cidade
      const wx = 380;
      const wy = 15;
      const ww = 200;
      const wh = 75;

      // Moldura da janela
      ctx.fillStyle = '#334155';
      ctx.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);

      // Céu crepúsculo
      const skyGrad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(wx, wy, ww, wh);

      // Estrelas piscantes pixeladas
      ctx.fillStyle = '#ffffff';
      const starOffset = Math.sin(this.time) * 2;
      ctx.fillRect(wx + 20, wy + 15, 2, 2);
      ctx.fillRect(wx + 65, wy + 25, 1, 1);
      ctx.fillRect(wx + 110, wy + 12, 2, 2);
      ctx.fillRect(wx + 170, wy + 20, 1, 1);

      // Edifícios no horizonte (pixel skyscrapers)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(wx + 10, wy + 35, 25, 40);
      ctx.fillRect(wx + 40, wy + 25, 35, 50);
      ctx.fillRect(wx + 80, wy + 40, 28, 35);
      ctx.fillRect(wx + 115, wy + 20, 30, 55);
      ctx.fillRect(wx + 150, wy + 32, 40, 43);

      // Luzes acesas nos prédios
      ctx.fillStyle = '#fde047';
      ctx.fillRect(wx + 45, wy + 32, 3, 3);
      ctx.fillRect(wx + 55, wy + 45, 3, 3);
      ctx.fillRect(wx + 122, wy + 28, 3, 3);
      ctx.fillRect(wx + 132, wy + 42, 3, 3);

      // Vidro da janela (reflexos brancos em diagonal)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wx + 30, wy);
      ctx.lineTo(wx, wy + 30);
      ctx.moveTo(wx + 120, wy);
      ctx.lineTo(wx + 50, wy + 70);
      ctx.stroke();

      // Divisórias da janela
      ctx.fillStyle = '#334155';
      ctx.fillRect(wx + ww / 2 - 2, wy, 4, wh);
    }

    drawEditorialWhiteboard(ctx) {
      const bx = 620;
      const by = 15;
      const bw = 280;
      const bh = 80;

      // Moldura de alumínio
      ctx.fillStyle = PALETTE.whiteboardBorder;
      ctx.fillRect(bx - 3, by - 3, bw + 6, bh + 6);

      // Superfície da lousa
      ctx.fillStyle = PALETTE.whiteboard;
      ctx.fillRect(bx, by, bw, bh);

      // Título da Newsletter na Lousa
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.fillText("DECIFRANDO DADOS", bx + 12, by + 18);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 8px -apple-system, sans-serif';
      ctx.fillText("STATUS DA PRODUÇÃO: EDIÇÃO #02", bx + 12, by + 30);

      // Gráfico de linha / progresso pixelado na lousa
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx + 12, by + 65);
      ctx.lineTo(bx + 40, by + 50);
      ctx.lineTo(bx + 70, by + 55);
      ctx.lineTo(bx + 100, by + 40);
      ctx.lineTo(bx + 130, by + 36);
      ctx.stroke();

      // Post-its coloridos pregados na lousa
      // Post-it Amarelo (The BRIEF)
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(bx + 155, by + 35, 30, 30);
      ctx.fillStyle = '#854d0e';
      ctx.font = '6px monospace';
      ctx.fillText("THE BRIEF", bx + 157, by + 44);
      ctx.fillText("Smart ppl", bx + 157, by + 52);

      // Post-it Rosa (Métricas)
      ctx.fillStyle = '#fbcfe8';
      ctx.fillRect(bx + 195, by + 35, 32, 30);
      ctx.fillStyle = '#9d174d';
      ctx.fillText("> 💡 78%", bx + 197, by + 46);
      ctx.fillText("benchmark", bx + 197, by + 54);

      // Post-it Azul (LinkedIn)
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(bx + 235, by + 35, 32, 30);
      ctx.fillStyle = '#0369a1';
      ctx.fillText("LinkedIn", bx + 237, by + 46);
      ctx.fillText("#dados", bx + 237, by + 54);
    }

    drawBookshelf(ctx) {
      const sx = 60;
      const sy = 20;
      const sw = 140;
      const sh = 75;

      // Madeira da estante
      ctx.fillStyle = '#451a03';
      ctx.fillRect(sx, sy, sw, sh);

      // Prateleiras
      ctx.fillStyle = '#78350f';
      ctx.fillRect(sx, sy + 35, sw, 6);
      ctx.fillRect(sx, sy + sh - 4, sw, 4);

      // Livros coloridos alinhados
      const bookColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
      let bx = sx + 8;
      for (let i = 0; i < 11; i++) {
        const c = bookColors[i % bookColors.length];
        const h = 20 + (i % 3) * 4;
        ctx.fillStyle = c;
        ctx.fillRect(bx, sy + 35 - h, 9, h);
        ctx.fillStyle = '#000000';
        ctx.fillRect(bx + 7, sy + 35 - h, 2, h); // Sombra lateral do livro
        bx += 11;
      }
    }

    drawCoffeeCorner(ctx) {
      // 1. Balcão de Granito
      const cx = 60;
      const cy = 410;
      const cw = 140;
      const ch = 45;

      ctx.fillStyle = PALETTE.coffeeCounter;
      ctx.fillRect(cx, cy, cw, ch);
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx, cy + ch - 4, cw, 4);

      // 2. Cafeteira Italiana Espresso
      ctx.fillStyle = '#dc2626'; // Vermelha Ferrari
      ctx.fillRect(80, 385, 24, 25);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(80, 395, 24, 4);

      // Bico da cafeteira & xícara de café
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(88, 404, 8, 4);
      ctx.fillStyle = '#ffffff'; // Xícara
      ctx.fillRect(90, 408, 7, 5);

      // Partículas de fumaça da cafeteira
      ctx.fillStyle = '#ffffff';
      for (const p of this.steamParticles) {
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 3. Bebedouro com Galão de Água Azul
      const wx = 145;
      const wy = 380;
      // Base branca do bebedouro
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(wx, wy + 20, 16, 20);
      ctx.fillStyle = '#3b82f6'; // Torneirinha
      ctx.fillRect(wx + 6, wy + 28, 4, 3);

      // Galão azul translúcido
      ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.beginPath();
      ctx.roundRect(wx + 2, wy, 12, 20, [4, 4, 1, 1]);
      ctx.fill();

      // Tampa azul
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(wx + 4, wy + 19, 8, 3);

      // Bolhas no galão
      ctx.fillStyle = '#ffffff';
      for (const b of this.waterBubbles) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Sofá Retrô de Couro Vermelho
      const sx = 80;
      const sy = 485;
      const sw = 110;
      const sh = 45;

      ctx.fillStyle = PALETTE.sofaLeather;
      // Encosto
      ctx.fillRect(sx, sy, sw, 16);
      // Assento
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(sx + 5, sy + 16, sw - 10, 24);
      // Braços do sofá
      ctx.fillStyle = PALETTE.sofaLeather;
      ctx.fillRect(sx, sy + 10, 8, 30);
      ctx.fillRect(sx + sw - 8, sy + 10, 8, 30);
      // Almofadas decorativas
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(sx + 15, sy + 18, 12, 12);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(sx + sw - 27, sy + 18, 12, 12);
    }

    drawMeetingTable(ctx) {
      const mx = 500;
      const my = 470;
      const radiusX = 65;
      const radiusY = 40;

      // Sombra da mesa
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(mx, my + 6, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tampo da mesa oval de madeira
      ctx.fillStyle = PALETTE.deskTop;
      ctx.beginPath();
      ctx.ellipse(mx, my, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = PALETTE.woodTrim;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Laptop aberto no centro da mesa
      ctx.fillStyle = '#64748b';
      ctx.fillRect(mx - 12, my - 8, 24, 16);
      ctx.fillStyle = '#38bdf8'; // Tela brilhando
      ctx.fillRect(mx - 10, my - 6, 20, 12);

      // Garrafa térmica de café na mesa
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(mx + 20, my - 8, 8, 14);
      ctx.fillStyle = '#ef4444'; // Tampa
      ctx.fillRect(mx + 21, my - 11, 6, 3);
    }

    drawWorkstations(ctx, agentsList) {
      for (const ws of WORKSTATIONS) {
        // Encontra o agente atribuído a esta mesa
        const agent = agentsList.find(a => a.deskId === ws.id);
        const isOccupiedAndWorking = agent && agent.status === "working" && agent.isAtDesk();

        // 1. Sombra da mesa
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(ws.x - 42, ws.y + 4, 84, 46);

        // 2. Tampo da Mesa de Escritório
        ctx.fillStyle = PALETTE.deskWood;
        ctx.fillRect(ws.x - 40, ws.y, 80, 42);
        ctx.fillStyle = PALETTE.deskTop;
        ctx.fillRect(ws.x - 38, ws.y + 2, 76, 38);

        // 3. Monitor de Computador
        const monW = 32;
        const monH = 22;
        const monX = ws.x - monW / 2;
        const monY = ws.y + 4;

        // Base/Pé do monitor
        ctx.fillStyle = '#64748b';
        ctx.fillRect(ws.x - 6, monY + monH, 12, 4);

        // Moldura do monitor
        ctx.fillStyle = PALETTE.screenBezel;
        ctx.fillRect(monX, monY, monW, monH);

        // Tela do Monitor
        if (isOccupiedAndWorking) {
          // Monitor Ativo: Brilho forte com linhas de código/dados
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(monX + 2, monY + 2, monW - 4, monH - 4);

          // Linhas de código animadas verdes/azuis
          const t = this.time * 6;
          ctx.fillStyle = PALETTE.screenCode;
          for (let i = 0; i < 4; i++) {
            const lw = 8 + Math.sin(t + i) * 8 + (i * 3);
            ctx.fillRect(monX + 4, monY + 4 + i * 4, Math.min(24, Math.max(4, lw)), 2);
          }
        } else {
          // Monitor em Standby / Screensaver sutil
          ctx.fillStyle = '#020617';
          ctx.fillRect(monX + 2, monY + 2, monW - 4, monH - 4);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.fillRect(ws.x - 2, monY + 9, 4, 4);
        }

        // Teclado e Mouse
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(ws.x - 14, ws.y + 30, 22, 6);
        ctx.fillStyle = '#64748b'; // Mouse
        ctx.fillRect(ws.x + 12, ws.y + 31, 5, 5);

        // Item Personalizado da Baia
        this.drawDeskProp(ctx, ws.prop, ws.x - 28, ws.y + 12);

        // Cadeira de Escritório (se o agente não estiver nela, desenha a cadeira vazia)
        if (!isOccupiedAndWorking) {
          this.drawEmptyChair(ctx, ws.chairX, ws.chairY);
        }
      }
    }

    drawDeskProp(ctx, prop, px, py) {
      if (prop === "newspaper") {
        // Pilha de jornais / pautas
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(px, py, 14, 10);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px + 2, py + 2, 10, 2);
        ctx.fillRect(px + 2, py + 5, 10, 2);
      } else if (prop === "typewriter") {
        // Caneca de café do redator
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 2, py + 2, 8, 8);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(px + 4, py + 4, 4, 4);
      } else if (prop === "chart") {
        // Monitor secundário pequeno / gráfico
        ctx.fillStyle = '#18181b';
        ctx.fillRect(px, py, 14, 12);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px + 2, py + 2, 10, 8);
      } else if (prop === "palette") {
        // Bloco de amostras de cores Pantone / CSS
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(px, py, 12, 10);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + 3, py + 2, 6, 6);
      } else if (prop === "megaphone") {
        // Mini troféu / badge do LinkedIn
        ctx.fillStyle = '#0a66c2'; // Azul oficial LinkedIn
        ctx.fillRect(px, py, 12, 10);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 7px monospace';
        ctx.fillText("in", px + 2, py + 8);
      }
    }

    drawEmptyChair(ctx, cx, cy) {
      // Sombra da cadeira
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 8, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Assento da Cadeira
      ctx.fillStyle = PALETTE.chairFabric;
      ctx.fillRect(cx - 8, cy - 4, 16, 12);

      // Encosto
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - 9, cy - 10, 18, 7);

      // Rodinhas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 7, cy + 7, 4, 3);
      ctx.fillRect(cx + 3, cy + 7, 4, 3);
    }

    drawOfficePlants(ctx) {
      const plantPositions = [
        { x: 30, y: 130 },
        { x: 920, y: 130 },
        { x: 260, y: 350 },
        { x: 920, y: 530 }
      ];

      for (const pos of plantPositions) {
        // Vaso de cerâmica terracota
        ctx.fillStyle = PALETTE.plantPot;
        ctx.fillRect(pos.x - 7, pos.y + 4, 14, 12);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(pos.x - 9, pos.y + 2, 18, 3);

        // Folhas da planta (Samambaia / Monstera pixelada)
        ctx.fillStyle = PALETTE.plantLeaf;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - 2, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#22c55e'; // Destaque de luz na folha
        ctx.beginPath();
        ctx.arc(pos.x - 3, pos.y - 5, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawWallClock(ctx) {
      const cx = 330;
      const cy = 40;
      const r = 14;

      // Moldura do relógio
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ponteiros do relógio (girando com o tempo)
      const secAngle = this.time * 0.5;
      const minAngle = this.time * 0.05;

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(secAngle) * 9, cy + Math.sin(secAngle) * 9);
      ctx.stroke();

      ctx.strokeStyle = '#dc2626'; // Ponteiro vermelho
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(minAngle) * 6, cy + Math.sin(minAngle) * 6);
      ctx.stroke();
    }
  }

  // ==========================================================================
  // DADOS PADRÃO DA REDAÇÃO (GARANTIA DE RENDERIZAÇÃO INSTANTÂNEA)
  // ==========================================================================
  const DEFAULT_AGENTS = [
    {
      id: "agente_01",
      nome: "Agente Curador (Pautas & The BRIEF)",
      role: "Curador & Hunter",
      status: "working",
      desk_id: 0,
      color: "#3B82F6",
      avatar: "curador",
      activity: "Minerando efemérides históricas e tendências de IA..."
    },
    {
      id: "agente_02",
      nome: "Agente Redator (Pop-Tech & Copy)",
      role: "Redator Pop-Tech",
      status: "working",
      desk_id: 1,
      color: "#10B981",
      avatar: "redator",
      activity: "Escrevendo Matéria de Capa: 'Smart people are cooler'..."
    },
    {
      id: "agente_03",
      nome: "Agente Dados & Fact-Checker",
      role: "Métricas & Validação",
      status: "waiting",
      desk_id: 2,
      color: "#F59E0B",
      avatar: "dados",
      activity: "Aguardando validação de dataset estatístico..."
    },
    {
      id: "agente_04",
      nome: "Agente Diagramador (PDF Studio)",
      role: "Design & Diagramação",
      status: "idle",
      desk_id: 3,
      color: "#EC4899",
      avatar: "diagramador",
      activity: "Tomando cappuccino na máquina italiana..."
    },
    {
      id: "agente_05",
      nome: "Agente Publisher (LinkedIn & SEO)",
      role: "SEO & Redes Sociais",
      status: "working",
      desk_id: 4,
      color: "#8B5CF6",
      avatar: "publisher",
      activity: "Formatando metadados de SEO e post de divulgação..."
    }
  ];

  // ==========================================================================
  // ETAPAS OFICIAIS DA RECEITA DE BOLO (NEWSLETTER DECIFRANDO DADOS)
  // ==========================================================================
  const RECEITA_STEPS = [
    { num: 1, title: "🥣 1. Ingredientes & Pauta", desc: "Mineração de fato e curiosidade histórica", foco: "agente_01" },
    { num: 2, title: "💡 2. Fact-Checking & Métricas", desc: "Validação SQL e callout > 💡", foco: "agente_03" },
    { num: 3, title: "✍️ 3. Redação The BRIEF", desc: "Matéria de Capa e filtro anticlichê", foco: "agente_02" },
    { num: 4, title: "🎯 4. Revisão Editorial Marlon", desc: "Aprovação final do editor Marlon", foco: "agente_02" },
    { num: 5, title: "⚙️ 5. Metadados de SEO & Post", desc: "SEO e post 'Conte para sua rede...'", foco: "agente_05" },
    { num: 6, title: "♨️ 6. O Forno (Compilação)", desc: "Build do PDF e toolbar de 1 clique", foco: "agente_04" },
    { num: 7, title: "🍽️ 7. Servir no LinkedIn", desc: "Publicação concluída com sucesso!", foco: "agente_05" }
  ];

  // Polyfill de segurança para roundRect em navegadores que não suportam nativamente
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
      if (!radii) radii = 0;
      if (typeof radii === 'number') radii = [radii, radii, radii, radii];
      const r = radii[0] || 0;
      this.beginPath();
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }

  // ==========================================================================
  // APLICAÇÃO PRINCIPAL DO CLIENTE (GAME CONTROLLER & WEBSOCKET)
  // ==========================================================================
  class VirtualOfficeApp {
    constructor() {
      this.canvas = document.getElementById('officeCanvas');
      this.ctx = this.canvas.getContext('2d');

      this.sceneRenderer = new OfficeSceneRenderer(this.ctx);
      this.agents = new Map(); // id -> AgentEntity
      this.selectedAgentId = null;
      this.hoveredAgentId = null;

      this.lastTime = performance.now();
      this.ws = null;
      this.wsConnected = false;
      this.crtEnabled = false;
      this.simulationActive = true;

      this.receitaInfo = {
        etapa_num: 1,
        total_etapas: 7,
        fase: "🥣 1. Ingredientes & Pauta Central",
        subtitulo: "Mineração de fato central e curiosidade histórica",
        progresso_pct: 14
      };

      // Popula imediatamente com agentes da equipe editorial para renderizar sem demora
      this.syncAgentsData(DEFAULT_AGENTS);
      this.addLogLine("🚀 Redação Virtual Decifrando Dados inicializada.");

      this.initUI();
      this.initEvents();
      this.connectWebSocket();
      this.startClientSimulationLoop();

      // Inicia Game Loop
      requestAnimationFrame(this.gameLoop.bind(this));
    }

    initUI() {
      // Controles da Receita de Bolo
      const btnNext = document.getElementById('btnReceitaNext');
      if (btnNext) {
        btnNext.addEventListener('click', () => this.nextReceitaStep());
      }
      const btnReset = document.getElementById('btnReceitaReset');
      if (btnReset) {
        btnReset.addEventListener('click', () => this.resetReceita());
      }
      this.renderReceitaSteps();
      this.updateReceitaUI();

      // Painel de Produção Real
      const btnProduzir = document.getElementById('btnProduzirReal');
      const inputTema = document.getElementById('inputTemaEdicao');
      if (btnProduzir) {
        btnProduzir.addEventListener('click', () => this.startRealProduction());
      }

      document.querySelectorAll('.badge-tag').forEach(tag => {
        tag.addEventListener('click', () => {
          if (inputTema) inputTema.value = tag.dataset.tema;
        });
      });

      // Modal de Entrega
      const btnFecharModal = document.getElementById('btnFecharModal');
      const backdrop = document.getElementById('deliveryModalBackdrop');
      if (btnFecharModal && backdrop) {
        btnFecharModal.addEventListener('click', () => backdrop.classList.remove('active'));
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) backdrop.classList.remove('active');
        });
      }

      const btnCopiarArtigo = document.getElementById('btnCopiarArtigo');
      if (btnCopiarArtigo) {
        btnCopiarArtigo.addEventListener('click', () => {
          if (this.lastEdition && this.lastEdition.artigo_text) {
            navigator.clipboard.writeText(this.lastEdition.artigo_text);
            alert("📋 Artigo do LinkedIn copiado para a Área de Transferência (Ctrl+V pronto)!");
          }
        });
      }

      const btnCopiarPost = document.getElementById('btnCopiarPost');
      if (btnCopiarPost) {
        btnCopiarPost.addEventListener('click', () => {
          if (this.lastEdition && this.lastEdition.artigo_text) {
            // Extrai post de divulgação
            const m = this.lastEdition.artigo_text.match(/📢 Post de Divulgação.*?\n={10,}\n([\s\S]*?)(\n={10,}|\n#dados)/);
            const post = m ? m[1].trim() + "\n\n#dados #analytics #carreira #ia #sql" : this.lastEdition.artigo_text;
            navigator.clipboard.writeText(post);
            alert("📢 Post de Divulgação copiado para o Clipboard!");
          }
        });
      }

      // Toggle CRT
      const btnCrt = document.getElementById('btnToggleCrt');
      const crtOverlay = document.getElementById('crtOverlay');
      if (btnCrt && crtOverlay) {
        btnCrt.addEventListener('click', () => {
          this.crtEnabled = !this.crtEnabled;
          crtOverlay.classList.toggle('enabled', this.crtEnabled);
          btnCrt.classList.toggle('active', this.crtEnabled);
        });
      }

      // Toggle Áudio Retrô
      const btnAudio = document.getElementById('btnToggleAudio');
      if (btnAudio) {
        btnAudio.addEventListener('click', () => {
          audioSynth.init();
          audioSynth.enabled = !audioSynth.enabled;
          btnAudio.classList.toggle('active', audioSynth.enabled);
          btnAudio.textContent = audioSynth.enabled ? '🔊 Som 8-bit' : '🔇 Mudo';
        });
      }

      // Botão Pausa/Play Simulação
      const btnSim = document.getElementById('btnToggleSim');
      if (btnSim) {
        btnSim.addEventListener('click', () => {
          this.toggleSimulation();
        });
      }

      // Botões de Cenários Rápidos
      document.querySelectorAll('.btn-scenario').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const scenario = e.currentTarget.dataset.scenario;
          this.triggerScenario(scenario);
        });
      });
    }

    initEvents() {
      // Detecção de Hover e Clique no Canvas
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        let found = null;
        for (const [id, agent] of this.agents.entries()) {
          const dist = Math.hypot(mouseX - agent.x, mouseY - agent.y);
          if (dist < 22) {
            found = id;
            break;
          }
        }
        this.hoveredAgentId = found;
        this.canvas.style.cursor = found ? 'pointer' : 'default';
      });

      this.canvas.addEventListener('click', (e) => {
        if (this.hoveredAgentId) {
          this.selectAgent(this.hoveredAgentId);
        }
      });
    }

    // ========================================================================
    // CONEXÃO WEBSOCKET EM TEMPO REAL COM FALLBACK DE POLLING E OFFLINE
    // ========================================================================
    connectWebSocket() {
      const statusIndicator = document.getElementById('statusIndicator');
      const statusText = document.getElementById('statusText');

      if (window.location.protocol === 'file:') {
        if (statusIndicator) statusIndicator.className = 'status-indicator online';
        if (statusText) statusText.textContent = 'Modo Local (Offline)';
        this.addLogLine("🎮 Executando em modo local autônomo.");
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host || 'localhost:8080';
      const wsUrl = `${protocol}//${host}/ws`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.wsConnected = true;
          if (statusIndicator) statusIndicator.className = 'status-indicator online';
          if (statusText) statusText.textContent = 'WS Online';
          this.addLogLine("🔌 Conexão WebSocket estabelecida com sucesso.");
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            this.handleServerMessage(msg);
          } catch (e) {
            console.error("Erro ao analisar mensagem WebSocket:", e);
          }
        };

        this.ws.onclose = () => {
          this.wsConnected = false;
          if (statusIndicator) statusIndicator.className = 'status-indicator';
          if (statusText) statusText.textContent = 'Reconectando...';
          setTimeout(() => this.connectWebSocket(), 3000);
        };

        this.ws.onerror = (err) => {
          console.warn("WebSocket erro, operando em simulação local...", err);
          this.pollAgentsFallback();
        };

      } catch (err) {
        console.error("Erro ao instanciar WebSocket:", err);
        this.pollAgentsFallback();
      }
    }

    handleServerMessage(msg) {
      if (msg.type === "init_state" || msg.type === "agents_update") {
        this.syncAgentsData(msg.data);
        if (msg.receita) {
          this.receitaInfo = msg.receita;
          this.updateReceitaUI();
        }
        if (msg.latest_log) {
          this.addLogLine(`[${msg.latest_log.time}] ${msg.latest_log.message}`);
        }
        if (msg.logs && Array.isArray(msg.logs)) {
          msg.logs.forEach(l => this.addLogLine(`[${l.time}] ${l.message}`));
        }
        if (msg.last_edition) {
          this.lastEdition = msg.last_edition;
        }
      } else if (msg.type === "edition_completed") {
        this.showEditionCompletedModal(msg.edition);
      } else if (msg.type === "simulation_state") {
        this.updateSimButton(msg.active);
        if (msg.receita) {
          this.receitaInfo = msg.receita;
          this.updateReceitaUI();
        }
        if (msg.latest_log) {
          this.addLogLine(`[${msg.latest_log.time}] ${msg.latest_log.message}`);
        }
      }
    }

    syncAgentsData(agentsArray) {
      if (!Array.isArray(agentsArray)) return;

      for (const data of agentsArray) {
        if (this.agents.has(data.id)) {
          this.agents.get(data.id).updateData(data);
        } else {
          this.agents.set(data.id, new AgentEntity(data));
        }
      }

      this.updateSidebarUI();
      this.updateTopbarStats();
      this.updateJsonViewer();
    }

    // Fallback de requisição HTTP REST
    async pollAgentsFallback() {
      try {
        const res = await fetch('/api/agents');
        if (res.ok) {
          const data = await res.json();
          this.syncAgentsData(data);
        }
      } catch (e) {
        // Ignora silenciosamente no fallback
      }
    }

    // Métodos de Controle da Receita de Bolo
    renderReceitaSteps() {
      const container = document.getElementById('receitaStepsList');
      if (!container) return;
      container.innerHTML = '';
      const currentStep = this.receitaInfo ? this.receitaInfo.etapa_num : 1;

      RECEITA_STEPS.forEach(step => {
        const item = document.createElement('div');
        const isActive = step.num === currentStep;
        const isCompleted = step.num < currentStep;

        item.className = `receita-step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
        item.innerHTML = `
          <span>${isCompleted ? '✅' : (isActive ? '👉' : '⏳')}</span>
          <div style="flex: 1;">
            <div>${step.title}</div>
            <div style="font-size: 9px; opacity: 0.8;">${step.desc}</div>
          </div>
        `;
        container.appendChild(item);
      });
    }

    updateReceitaUI() {
      if (!this.receitaInfo) return;
      const elTitle = document.getElementById('receitaFaseTitulo');
      const elSub = document.getElementById('receitaFaseSub');
      const elBar = document.getElementById('receitaProgressBar');
      const elLabel = document.getElementById('receitaProgressLabel');

      if (elTitle) elTitle.textContent = this.receitaInfo.fase;
      if (elSub) elSub.textContent = this.receitaInfo.subtitulo || '';
      if (elBar) elBar.style.width = `${this.receitaInfo.progresso_pct}%`;
      if (elLabel) elLabel.textContent = `Etapa ${this.receitaInfo.etapa_num} de ${this.receitaInfo.total_etapas} (${this.receitaInfo.progresso_pct}%)`;

      this.renderReceitaSteps();
    }

    async nextReceitaStep() {
      if (this.ws && this.wsConnected) {
        this.ws.send(JSON.stringify({ type: "receita_next" }));
      } else {
        await fetch('/api/receita/next', { method: 'POST' }).catch(() => {});
        if (this.receitaInfo) {
          const next = (this.receitaInfo.etapa_num % 7) + 1;
          const stepObj = RECEITA_STEPS[next - 1];
          this.receitaInfo = {
            etapa_num: next,
            total_etapas: 7,
            fase: stepObj.title,
            subtitulo: stepObj.desc,
            progresso_pct: Math.round((next / 7) * 100)
          };
          this.updateReceitaUI();
        }
      }
    }

    async resetReceita() {
      if (this.ws && this.wsConnected) {
        this.ws.send(JSON.stringify({ type: "receita_reset" }));
      } else {
        await fetch('/api/receita/reset', { method: 'POST' }).catch(() => {});
        this.receitaInfo = {
          etapa_num: 1,
          total_etapas: 7,
          fase: RECEITA_STEPS[0].title,
          subtitulo: RECEITA_STEPS[0].desc,
          progresso_pct: 14
        };
        this.updateReceitaUI();
      }
    }

    // Pipeline de Produção Real
    async startRealProduction() {
      const input = document.getElementById('inputTemaEdicao');
      const inputFonte = document.getElementById('inputFonteUrl');
      const btn = document.getElementById('btnProduzirReal');
      const tema = (input && input.value.trim()) || "DuckDB vs Spark: O fim dos clusters gigantes em 2026?";
      const fonteUrl = (inputFonte && inputFonte.value.trim()) || "";

      if (btn) {
        btn.disabled = true;
        btn.textContent = "⚡ Redação em Ação no Canvas...";
      }

      this.addLogLine(`🚀 [PRODUÇÃO REAL] Acionando a equipe para o tema: "${tema}"`);
      if (fonteUrl) {
        this.addLogLine(`🌐 [FONTE WEB] Agente Curador acessando URL ao vivo: ${fonteUrl}`);
      }

      if (this.ws && this.wsConnected) {
        this.ws.send(JSON.stringify({
          type: "produce_edition",
          tema: tema,
          fonte_url: fonteUrl
        }));
      } else {
        await fetch('/api/produce_edition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tema: tema, fonte_url: fonteUrl })
        }).catch(() => {});
      }
    }

    showEditionCompletedModal(edition) {
      this.lastEdition = edition;
      const btn = document.getElementById('btnProduzirReal');
      if (btn) {
        btn.disabled = false;
        btn.textContent = "⚡ Acionar Agentes e Gerar Edição Real";
      }

      const backdrop = document.getElementById('deliveryModalBackdrop');
      const elTitulo = document.getElementById('modalEdicaoTitulo');
      const elTema = document.getElementById('modalTemaTexto');
      const elDetalhes = document.getElementById('modalDetalhesTexto');
      const btnPdf = document.getElementById('btnAbrirPdf');
      const btnHtml = document.getElementById('btnAbrirHtml');

      const auditMotor = document.getElementById('auditMotor');
      const auditTempo = document.getElementById('auditTempo');
      const auditFonte = document.getElementById('auditFonte');
      const auditCompilador = document.getElementById('auditCompilador');

      if (elTitulo) elTitulo.textContent = `🎉 EDIÇÃO #${edition.edicao} GERADA COM SUCESSO!`;
      if (elTema) elTema.textContent = `Tema: ${edition.tema}`;
      if (elDetalhes) elDetalhes.textContent = `Compilado via Edge Headless em ${edition.timestamp} | Salvo em decifrando-dados/edicoes/edicao-${edition.edicao}.md`;
      if (btnPdf) btnPdf.href = edition.pdf_url;
      if (btnHtml) btnHtml.href = edition.html_file;

      if (auditMotor) auditMotor.textContent = edition.model_used || "NVIDIA Nemotron-3 Ultra 550B";
      if (auditTempo) auditTempo.textContent = `${edition.calc_seconds || 65}s (Inferência Real)`;
      if (auditFonte) auditFonte.textContent = edition.source_url ? (edition.source_url.length > 28 ? edition.source_url.slice(0, 25) + '...' : edition.source_url) : "Pauta Factual";
      if (auditCompilador) auditCompilador.textContent = "Edge Headless (Alta Resolução)";

      if (backdrop) backdrop.classList.add('active');

      audioSynth.soundIdle();
      this.addLogLine(`🎉 SUCESSO: Edição #${edition.edicao} pronta para publicação!`);
    }

    // Loop de simulação no cliente caso o servidor esteja desconectado ou em modo offline
    startClientSimulationLoop() {
      setInterval(() => {
        if (!this.simulationActive) return;
        // Se WebSocket estiver conectado, o backend já comanda as transições da receita
        if (this.wsConnected) return;

        // Avança automaticamente nas etapas da receita em modo offline
        this.nextReceitaStep();
      }, 7500);
    }

    // ========================================================================
    // AÇÕES DE CONTROLE (REST / WS)
    // ========================================================================
    async changeAgentStatus(agentId, newStatus) {
      // Atualização imediata no cliente para resposta instantânea
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.updateData({ status: newStatus });
        this.updateSidebarUI();
        this.updateTopbarStats();
        this.updateJsonViewer();
        this.addLogLine(`⚡ [${agent.nome}] alterado para '${newStatus}'.`);
      }

      if (this.ws && this.wsConnected) {
        this.ws.send(JSON.stringify({
          type: "update_agent",
          id: agentId,
          status: newStatus
        }));
      } else {
        fetch(`/api/agents/${agentId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }).catch(() => {});
      }
    }

    async toggleSimulation() {
      this.simulationActive = !this.simulationActive;
      this.updateSimButton(this.simulationActive);
      this.addLogLine(`⚙️ Simulação alternada para: ${this.simulationActive ? 'Ativa' : 'Pausada'}`);

      if (this.ws && this.wsConnected) {
        this.ws.send(JSON.stringify({ type: "toggle_simulation" }));
      } else {
        fetch('/api/simulation/toggle', { method: 'POST' }).catch(() => {});
      }
    }

    async triggerScenario(scenarioName) {
      // Executa o cenário imediatamente no cliente
      if (scenarioName === "sprint") {
        for (const ag of this.agents.values()) {
          ag.updateData({ status: "working", activity: "⚡ Sprint de Fechamento da Edição #02!" });
        }
        this.addLogLine("🔥 SPRINT TOTAL: Todos os agentes produzindo a todo vapor!");
      } else if (scenarioName === "coffee_break") {
        for (const ag of this.agents.values()) {
          ag.updateData({ status: "idle", activity: "☕ Pausa para café e debate de ideias!" });
        }
        this.addLogLine("☕ COFFEE BREAK: Equipe inteira na área de café e descompressão!");
      } else if (scenarioName === "editor_approval") {
        for (const id of ["agente_01", "agente_02", "agente_03"]) {
          const ag = this.agents.get(id);
          if (ag) ag.updateData({ status: "waiting", activity: "❓ Aguardando revisão final do editor Marlon Ferreira..." });
        }
        this.addLogLine("🎯 REVISÃO EDITORIAL: Agentes aguardando aprovação do editor!");
      }

      this.updateSidebarUI();
      this.updateTopbarStats();
      this.updateJsonViewer();

      if (this.ws && this.wsConnected) {
        this.ws.send(JSON.stringify({ type: "scenario", scenario: scenarioName }));
      } else {
        fetch('/api/simulation/scenario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario: scenarioName })
        }).catch(() => {});
      }
    }

    // ========================================================================
    // ATUALIZAÇÃO DE INTERFACE / DOM
    // ========================================================================
    updateTopbarStats() {
      let countWorking = 0;
      let countIdle = 0;
      let countWaiting = 0;

      for (const ag of this.agents.values()) {
        if (ag.status === "working") countWorking++;
        else if (ag.status === "idle") countIdle++;
        else if (ag.status === "waiting") countWaiting++;
      }

      const elWorking = document.getElementById('countWorking');
      const elIdle = document.getElementById('countIdle');
      const elWaiting = document.getElementById('countWaiting');

      if (elWorking) elWorking.textContent = `${countWorking} Produzindo`;
      if (elIdle) elIdle.textContent = `${countIdle} No Café`;
      if (elWaiting) elWaiting.textContent = `${countWaiting} Aguardando`;
    }

    updateSimButton(isActive) {
      const btn = document.getElementById('btnToggleSim');
      if (btn) {
        btn.textContent = isActive ? '⏸ Pausar Simulação' : '▶ Retomar Simulação';
        btn.classList.toggle('active', isActive);
      }
    }

    updateSidebarUI() {
      const container = document.getElementById('agentsList');
      if (!container) return;

      container.innerHTML = '';

      for (const [id, ag] of this.agents.entries()) {
        const isSelected = this.selectedAgentId === id;
        const card = document.createElement('div');
        card.className = `agent-card ${isSelected ? 'selected' : ''}`;
        card.dataset.id = id;

        card.innerHTML = `
          <div class="agent-card-header">
            <div class="agent-name-group">
              <span class="agent-avatar-pip" style="background-color: ${ag.color}"></span>
              <div>
                <div class="agent-card-name">${ag.nome}</div>
                <div class="agent-card-role">${ag.role}</div>
              </div>
            </div>
            <span class="status-badge ${ag.status}">${ag.status}</span>
          </div>
          <div class="agent-card-activity">"${ag.activity}"</div>
          <div class="agent-card-actions">
            <button class="btn-state-action ${ag.status === 'working' ? 'active-working' : ''}" data-status="working">⚡ Produzir</button>
            <button class="btn-state-action ${ag.status === 'idle' ? 'active-idle' : ''}" data-status="idle">☕ Café</button>
            <button class="btn-state-action ${ag.status === 'waiting' ? 'active-waiting' : ''}" data-status="waiting">❓ Revisar</button>
          </div>
        `;

        // Eventos dos botões do card
        card.querySelectorAll('.btn-state-action').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetStatus = btn.dataset.status;
            this.changeAgentStatus(id, targetStatus);
          });
        });

        card.addEventListener('click', () => {
          this.selectAgent(id);
        });

        container.appendChild(card);
      }
    }

    selectAgent(agentId) {
      this.selectedAgentId = agentId;
      document.querySelectorAll('.agent-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.id === agentId);
      });
    }

    addLogLine(text) {
      const terminal = document.getElementById('terminalLogs');
      if (!terminal) return;

      const line = document.createElement('div');
      line.className = 'terminal-line';
      line.textContent = text;
      terminal.appendChild(line);

      // Auto-scroll para o final
      terminal.scrollTop = terminal.scrollHeight;
    }

    updateJsonViewer() {
      const viewer = document.getElementById('jsonViewer');
      if (!viewer) return;

      const currentList = Array.from(this.agents.values()).map(ag => ({
        id: ag.id,
        nome: ag.nome,
        status: ag.status
      }));

      viewer.textContent = JSON.stringify(currentList, null, 2);
    }

    // ========================================================================
    // LOOP PRINCIPAL DO JOGO (60 FPS)
    // ========================================================================
    gameLoop(now) {
      const dt = Math.min((now - this.lastTime) / 1000, 0.1); // Trava delta time máximo
      this.lastTime = now;

      // 1. Atualização do Cenário e Partículas
      this.sceneRenderer.update(dt);

      // 2. Atualização Física dos Agentes
      for (const agent of this.agents.values()) {
        agent.update(dt);
      }

      // 3. Renderização do Cenário Estático e Objetos
      const agentsList = Array.from(this.agents.values());
      this.sceneRenderer.draw(agentsList);

      // 4. Renderização dos Agentes com Ordenação em Profundidade (Y-Sorting)
      const sortedAgents = [...agentsList].sort((a, b) => a.y - b.y);
      for (const agent of sortedAgents) {
        const isHovered = this.hoveredAgentId === agent.id;
        const isSelected = this.selectedAgentId === agent.id;
        agent.draw(this.ctx, isHovered, isSelected);
      }

      requestAnimationFrame(this.gameLoop.bind(this));
    }
  }

  // Inicializa quando o DOM estiver pronto
  window.addEventListener('DOMContentLoaded', () => {
    window.virtualOfficeApp = new VirtualOfficeApp();
  });

})();
