// Agente Autônomo Asclepio (Clone Fiel do Polar + Conexão Antigravity + Microfone)
class AsclepioAgent {
  constructor() {
    this.panel = document.getElementById('agent-panel');
    this.btnToggle = document.getElementById('btn-ai-toggle');
    this.btnToggleRail = document.getElementById('btn-toggle-ai-rail');
    this.btnClose = document.getElementById('btn-close-panel');
    this.chatStream = document.getElementById('chat-stream');
    this.inputForm = document.getElementById('agent-input-form');
    this.promptInput = document.getElementById('agent-prompt-input');

    // Elementos de Microfone
    this.btnMic = document.getElementById('btn-mic');
    this.voiceStatusBar = document.getElementById('voice-status-bar');
    this.voiceStatusText = document.getElementById('voice-status-text');
    this.isRecording = false;
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.recognition = null;
    this.lastMentionedSong = null;

    this.initEventListeners();
    this.initSpeechRecognition();

    if (window.__asclepioHost && window.__asclepioHost.getAiModelInfo) {
      window.__asclepioHost.getAiModelInfo().then((info) => {
        if (info && info.badge) {
          const badgeEl = document.getElementById('ai-active-badge');
          if (badgeEl) badgeEl.textContent = info.badge;
        }
      }).catch(() => {});
    }

    this.appendSystemMessage(
      "Olá Marlon! Eu sou o **Asclepio AI**, seu navegador autônomo com **Gemini 2.5 Flash** e **Fallback Simultâneo de Tokens**.\n\n" +
      "Se a cota de algum modelo esgotar, eu alterno simultaneamente sem interromper a navegação! Você pode pedir para **abrir sites, pesquisar no YouTube ou Google** usando texto ou o **microfone** abaixo."
    );
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'pt-BR';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        this.promptInput.value = transcript;
      };

      this.recognition.onerror = (event) => {
        if (event.error !== 'no-speech') {
          this.stopRecording();
        }
      };

      this.recognition.onend = () => {
        if (this.isRecording) {
          this.stopRecording();
        }
      };
    }
  }

  initEventListeners() {
    // Abrir/Fechar painel do agente
    if (this.btnToggle) {
      this.btnToggle.addEventListener('click', () => this.togglePanel());
    }
    if (this.btnToggleRail) {
      this.btnToggleRail.addEventListener('click', () => this.togglePanel());
    }
    if (this.btnClose) {
      this.btnClose.addEventListener('click', () => this.closePanel());
    }

    // Atalhos globais
    window.addEventListener('keydown', (e) => {
      // Ctrl+/ : Toggle painel do agente
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        this.togglePanel();
      }
      // Ctrl+M : Ativar microfone
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (this.isRecording) {
          this.stopRecording();
        } else {
          this.startRecording();
        }
      }
    });

    // Submissão do formulário
    this.inputForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.isRecording) {
        this.stopRecording();
      }

      const prompt = this.promptInput.value.trim();
      if (!prompt) return;

      this.promptInput.value = '';
      await this.handleUserPrompt(prompt);
    });

    this.promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (typeof this.inputForm.requestSubmit === 'function') {
          this.inputForm.requestSubmit();
        } else {
          this.inputForm.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      }
    });

    // Botão de Microfone
    this.btnMic.addEventListener('click', () => {
      if (this.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    });

    // Ações Rápidas (Chips estilo Polar)
    document.querySelectorAll('.action-chip').forEach((chip) => {
      chip.addEventListener('click', async () => {
        const action = chip.dataset.action;
        await this.handleQuickAction(action);
      });
    });
  }

  togglePanel() {
    this.panel.classList.toggle('hidden');
    if (!this.panel.classList.contains('hidden')) {
      this.promptInput.focus();
    }
  }

  openPanel() {
    this.panel.classList.remove('hidden');
    this.promptInput.focus();
  }

  closePanel() {
    this.panel.classList.add('hidden');
  }

  async startRecording() {
    try {
      this.isRecording = true;
      this.btnMic.classList.add('recording');
      this.btnMic.setAttribute('aria-pressed', 'true');
      this.voiceStatusBar.classList.add('active');
      this.voiceStatusText.textContent = "Ouvindo você… Fale seu comando";

      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
      this.mediaRecorder.start();

      if (this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {}
      }
    } catch (err) {
      this.voiceStatusText.textContent = "Microfone indisponível.";
      setTimeout(() => this.stopRecording(), 2000);
    }
  }

  stopRecording() {
    this.isRecording = false;
    this.btnMic.classList.remove('recording');
    this.btnMic.setAttribute('aria-pressed', 'false');
    this.voiceStatusBar.classList.remove('active');

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }

    if (this.promptInput.value.trim()) {
      this.promptInput.focus();
    }
  }

  async getActivePageContext() {
    const wv = window.asclepioBrowser ? window.asclepioBrowser.getActiveWebview() : null;
    if (!wv) return { title: 'Nenhuma aba', url: '', text: '' };

    try {
      const pageInfo = await wv.executeJavaScript(`
        ({
          title: (document.title || '').trim(),
          url: window.location.href,
          text: document.body ? document.body.innerText.replace(/\\s+/g, ' ').trim().slice(0, 3200) : ''
        })
      `);
      return pageInfo;
    } catch (err) {
      return {
        title: (wv.getTitle && wv.getTitle()) || 'Página Web',
        url: (wv.getURL && wv.getURL()) || '',
        text: ''
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOTOR AUTÔNOMO: ANALISADOR DE INTENÇÃO E CONTROLE DO NAVEGADOR
  // ═══════════════════════════════════════════════════════════════════════════
  async executePlayYouTube(query, existingMsgId = null) {
    if (!query) return;
    this.lastMentionedSong = query;
    const msgId = existingMsgId || this.appendLoadingMessage();
    this.updateStepMessage(msgId, `🌐 [Passo 1/2] Buscando **"${query}"** no YouTube…`);

    if (window.browserController) {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      await window.browserController.navigate(searchUrl);
      this.updateStepMessage(msgId, `▶️ [Passo 2/2] Selecionando e reproduzindo o vídeo…`);
      await window.browserController.wait(1800);
      await window.browserController.clickFirstVideo();
      this.replaceLoadingMessage(msgId, `🎬 **Vídeo iniciado no YouTube!**\n\n• Pesquisa: *${query}*\n• O vídeo já está em reprodução na sua tela.`);
    } else {
      this.replaceLoadingMessage(msgId, `Erro: Controlador do navegador não encontrado.`);
    }
  }

  async handleUserPrompt(prompt) {
    this.appendUserMessage(prompt);
    const lower = prompt.toLowerCase().trim();

    // 1. Pular Anúncio / Tirar Propaganda no YouTube
    if (/tira(r)?\s+(a\s+)?(propaganda|an[uú]ncio)|pula(r)?\s+(o\s+)?(an[uú]ncio|propaganda)|skip\s*ad|sem\s+an[uú]ncio/i.test(lower)) {
      if (window.browserController) {
        const res = await window.browserController.skipAd();
        if (res && res.success) {
          this.appendSystemMessage(`🚫 **Anúncio pulado com sucesso!** O vídeo continuará normalmente.`);
        } else {
          this.appendSystemMessage(`ℹ️ ${res?.message || 'Nenhum anúncio pulável ativo detectado no momento.'}`);
        }
      }
      return;
    }

    // 2. Play / Pause de Vídeo
    if (/^(pausa(r)?|pause|despausa(r)?|continua(r)?|play)$/i.test(lower)) {
      if (window.browserController) {
        await window.browserController.togglePlay();
        this.appendSystemMessage(`⏯️ **Play/Pause alternado no vídeo.**`);
      }
      return;
    }

    // 3. Controle de Volume e Áudio
    // 3.1 Volume Específico (ex: "aumente o volume pra 100", "volume em 80%", "bota o volume no 50")
    const volValMatch = lower.match(/(?:volume|som)\s+(?:pra|para|em|no|a|de)?\s*(\d{1,3})%?/i);
    if (volValMatch && window.browserController) {
      const val = parseInt(volValMatch[1], 10);
      const res = await window.browserController.setVolume(val);
      if (res && res.success) {
        this.appendSystemMessage(`🔊 **Volume ajustado para ${val}%!**`);
      } else {
        this.appendSystemMessage(`ℹ️ Não foi possível ajustar o volume: nenhum player ativo detectado.`);
      }
      return;
    }

    // 3.2 Volume Máximo ou Mínimo
    if (/(?:volume|som)\s+(?:no\s+)?m[aá]ximo/i.test(lower) && window.browserController) {
      await window.browserController.setVolume(100);
      this.appendSystemMessage(`🔊 **Volume ajustado para o máximo (100%)!**`);
      return;
    }
    if (/(?:volume|som)\s+(?:no\s+)?m[ií]nimo/i.test(lower) && window.browserController) {
      await window.browserController.setVolume(10);
      this.appendSystemMessage(`🔉 **Volume ajustado para o mínimo (10%)!**`);
      return;
    }

    // 3.3 Aumentar volume relativo
    if (/(?:aumenta(?:r)?|sobe|subir|mais)\s+(?:o\s+)?(?:volume|som)/i.test(lower) && window.browserController) {
      const res = await window.browserController.changeVolume(20);
      this.appendSystemMessage(`🔊 **Volume aumentado para ${res.newVolume !== undefined ? res.newVolume + '%' : 'nível mais alto'}!**`);
      return;
    }

    // 3.4 Baixar volume relativo
    if (/(?:baixa(?:r)?|diminui(?:r)?|desce|menos)\s+(?:o\s+)?(?:volume|som)/i.test(lower) && window.browserController) {
      const res = await window.browserController.changeVolume(-20);
      this.appendSystemMessage(`🔉 **Volume diminuído para ${res.newVolume !== undefined ? res.newVolume + '%' : 'nível mais baixo'}!**`);
      return;
    }

    // 3.5 Mudo / Silenciar / Desmutar
    if (/^(?:mudo|muta(?:r)?|silencia(?:r)?|tira(?:r)?\s+(?:o\s+)?som|desmuta(?:r)?)$/i.test(lower) && window.browserController) {
      const res = await window.browserController.toggleMute();
      this.appendSystemMessage(res.muted ? `🔇 **Áudio silenciado (Mudo).**` : `🔊 **Áudio reativado.**`);
      return;
    }

    // 4. Tela Cheia / Fullscreen
    if (/(?:tela\s+cheia|fullscreen|maximiza(?:r)?\s+(?:o\s+)?v[ií]deo)/i.test(lower) && window.browserController) {
      await window.browserController.toggleFullscreen();
      this.appendSystemMessage(`🖥️ **Tela cheia alternada no player.**`);
      return;
    }

    // 5. Velocidade de Reprodução
    const speedMatch = lower.match(/(?:velocidade|speed)\s+(?:em\s+|de\s+|pra\s+)?([0-2](?:\.[0-9]+)?x?)/i);
    if (speedMatch && window.browserController) {
      const spd = parseFloat(speedMatch[1].replace('x', ''));
      await window.browserController.setPlaybackSpeed(spd);
      this.appendSystemMessage(`⚡ **Velocidade de reprodução alterada para ${spd}x.**`);
      return;
    }

    // 6. Avançar / Retroceder Vídeo
    const seekFwd = lower.match(/(?:avan[çc]a(?:r)?|pula(?:r)?)\s+(\d+)\s*(?:segundos?|s)/i);
    if (seekFwd && window.browserController) {
      const sec = parseInt(seekFwd[1], 10);
      await window.browserController.seek(sec);
      this.appendSystemMessage(`⏩ **Vídeo avançado em ${sec} segundos.**`);
      return;
    }
    const seekBwd = lower.match(/(?:volta(?:r)?|retrocede(?:r)?)\s+(\d+)\s*(?:segundos?|s)/i);
    if (seekBwd && window.browserController) {
      const sec = parseInt(seekBwd[1], 10);
      await window.browserController.seek(-sec);
      this.appendSystemMessage(`⏪ **Vídeo retrocedido em ${sec} segundos.**`);
      return;
    }

    // 7. Legendas
    if (/(?:legenda|captions?|subtitles?)/i.test(lower) && window.browserController) {
      await window.browserController.toggleCaptions();
      this.appendSystemMessage(`💬 **Legendas alternadas.**`);
      return;
    }

    // 8. Gerenciamento de Abas e Navegador
    if (/^(?:nova\s+aba|cria(?:r)?\s+(?:uma\s+)?aba|abre\s+(?:uma\s+)?aba)$/i.test(lower) && window.browserController) {
      window.browserController.newTab();
      this.appendSystemMessage(`📑 **Nova aba aberta.**`);
      return;
    }
    if (/^(?:fecha(?:r)?\s+(?:a\s+)?aba|fechar\s+aba)$/i.test(lower) && window.browserController) {
      window.browserController.closeActiveTab();
      this.appendSystemMessage(`❌ **Aba fechada.**`);
      return;
    }
    if (/^(?:recarrega(?:r)?|atualiza(?:r)?|refresh|f5)(?:\s+(?:a\s+)?p[aá]gina)?$/i.test(lower) && window.browserController) {
      window.browserController.reload();
      this.appendSystemMessage(`🔄 **Página recarregada.**`);
      return;
    }
    if (/^(?:volta(?:r)?|p[aá]gina\s+anterior)$/i.test(lower) && window.browserController) {
      window.browserController.goBack();
      this.appendSystemMessage(`⬅️ **Voltando para a página anterior.**`);
      return;
    }
    if (/^(?:avan[çc]a(?:r)?|pr[oó]xima\s+p[aá]gina)$/i.test(lower) && window.browserController) {
      window.browserController.goForward();
      this.appendSystemMessage(`➡️ **Avançando no histórico.**`);
      return;
    }

    // 9. Rolagem de Página
    if (lower.includes('desce') || lower.includes('rola para baixo') || lower.includes('scroll down')) {
      await window.browserController.scroll('down', 600);
      this.appendSystemMessage("📜 Rolando a página para baixo…");
      return;
    }
    if (lower.includes('sobe') || lower.includes('rola para cima') || lower.includes('scroll up')) {
      await window.browserController.scroll('up', 600);
      this.appendSystemMessage("📜 Rolando a página para cima…");
      return;
    }

    // 10. PRIMITIVA OBSERVE (STAGEHAND): "observe", "o que posso fazer aqui?", "quais ações?"
    if (/^(?:observe|observar|o que posso fazer( aqui)?|quais (as )?a[çc][oõ]es|analise a tela|o que tem (nessa|nesta) p[aá]gina)$/i.test(lower)) {
      if (window.browserController) {
        const loadingId = this.appendLoadingMessage();
        this.updateStepMessage(loadingId, '🔍 Analisando elementos interativos da página…');
        const res = await window.browserController.observe();
        const text = typeof res === 'object' && res.text ? res.text : String(res || 'Não foi possível observar a página.');
        this.replaceLoadingMessage(loadingId, `🧭 **Ações observadas na página:**\n\n${text}`);
      }
      return;
    }

    // 11. PRIMITIVA EXTRACT (STAGEHAND): "extrair dados", "extraia tabela", "extraia preços", etc.
    const extractIntent = lower.match(/(?:extrai(?:r)?|raspa(?:r)?|coleta(?:r)?)\s+(?:os\s+)?(?:dados|informa[çc][oõ]es|tabela|pre[çc]os?|vagas?|valores?)(?:\s+(?:de|da|do|desta|sobre)\s+(.+))?/i);
    if (extractIntent && window.browserController) {
      const loadingId = this.appendLoadingMessage();
      this.updateStepMessage(loadingId, '📊 Sintetizando e extraindo dados da página…');
      const res = await window.browserController.extract(prompt);
      const text = typeof res === 'object' && res.text ? res.text : String(res || 'Extração concluída.');
      this.replaceLoadingMessage(loadingId, text);
      return;
    }

    // 12. PRIMITIVA ACT (STAGEHAND + BROWSER-USE SoM + VISION GROUNDING):
    // Clica ou aciona elementos usando crachás numerados SoM ou visão computacional
    const clickIntent = lower.match(/(?:clica(?:r)?|aperta(?:r)?|pressiona(?:r)?|seleciona(?:r)?)\s+(?:no\s+|na\s+|em\s+|o\s+|a\s+)?(?:bot[aã]o\s+|link\s+)?["']?(.+?)["']?$/i);
    if (clickIntent && window.browserController && !lower.includes('primeiro') && !lower.includes('vídeo') && !lower.includes('video')) {
      const targetText = clickIntent[1].trim();
      const res = await window.browserController.act(prompt);
      if (res && res.success) {
        const methodBadge = res.method === 'set-of-marks' ? '🏷️ [Set-of-Marks]' : res.method === 'multimodal-vision' ? '👁️ [Visão Computacional]' : '🖱️ [SmartClick]';
        this.appendSystemMessage(`✅ **Ação executada com sucesso!** ${methodBadge}\n• Alvo: "${targetText}"${res.reason ? `\n• Raciocínio: ${res.reason}` : ''}`);
      } else {
        this.appendSystemMessage(`ℹ️ Não consegui acionar "${targetText}" nesta página.`);
      }
      return;
    }

    // 13. Digitação Direta em Campos da Página (ex: "digita Marlon no campo de pesquisa")
    const typeIntent = lower.match(/(?:digita(?:r)?|escreve(?:r)?|preenche(?:r)?)\s+["']?(.+?)["']?\s+(?:no\s+|na\s+|em\s+)(.+)/i);
    if (typeIntent && window.browserController) {
      const textToType = typeIntent[1].trim();
      const fieldHint = typeIntent[2].trim();
      await window.browserController.type(fieldHint, textToType, false);
      this.appendSystemMessage(`✍️ **"${textToType}" digitado no campo.**`);
      return;
    }


    // 4. Intenção Direta de Tocar Música / Vídeo (mesmo sem falar "YouTube" ou com erros como "pequsia")
    // Exemplos: "coloque a musica justir bibeber beber", "pequsia a musica em teus braços", "toca a musica em teus braços", "toca justin", "quero ouvir em teus braços"
    const musicPlayMatch = lower.match(/(?:toca(?:r)?|coloque|coloca(?:r)?|bota(?:r)?|quero\s+ouvir|ouvir|reproduz(?:ir)?|play|pe[sq][qu]uis[ae]?(?:r)?|procur[ae](?:r)?|busc[ae](?:r)?)\s+(?:a\s+)?(?:m[uú]sica\s+)?(?:do\s+|da\s+|de\s+)?(.+)/i);
    if (musicPlayMatch && !lower.includes('google') && !lower.includes('chatgpt')) {
      let songQuery = musicPlayMatch[1]
        .replace(/\s+no\s+(youtube|youtebe|yt)$/i, '')
        .replace(/\s+e\s+(toca|tocar|assiste|assistir|reproduz|clica|clicar|abre|abrir).*$/i, '')
        .replace(/^(um|uma|o|a|no|na)\s+/i, '')
        .replace(/\s+(aqui|awui|ai|pra mim|por mim)$/i, '')
        .trim();

      // Correção de erros fonéticos comuns de digitação ou transcrição por voz
      if (/justi(r|n)\s+bi?be?ber(\s+beber)?/i.test(songQuery)) {
        songQuery = "Justin Bieber";
      }

      if (songQuery) {
        await this.executePlayYouTube(songQuery);
        return;
      }
    }

    // 5. Continuação ou Confirmação de Ação ("sim", "faça por mim", "faz por mim", "tocar", "e toca", "toca", "prossiga")
    if (/^(sim|pode ser|claro|fa[çc]a por mim|faz por mim|tocar|toca|e toca|pode tocar|executa|prossiga|prosseguir|vai)$/i.test(lower)) {
      if (this.lastMentionedSong) {
        await this.executePlayYouTube(this.lastMentionedSong);
        return;
      }
    }

    // 6. Nome direto de artista ou música digitado isoladamente
    if (/justi(r|n)\s+bi?be?ber(\s+beber)?/i.test(lower)) {
      await this.executePlayYouTube("Justin Bieber");
      return;
    }
    if (lower.includes('em teus bra') || lower.includes('em teus bracos')) {
      await this.executePlayYouTube("Em Teus Braços Lauriete");
      return;
    }

    // 7. Comando explícito com YOUTUBE
    if (/yout(e|ub|ube|b|ebe)?|\byt\b/i.test(lower)) {
      let query = null;
      const searchMatch = lower.match(/(?:pesquisa(?:r)?|procura(?:r)?|busca(?:r)?|toca(?:r)?|ouvir|ver|coloca(?:r)?)\s+(?:por\s+)?(?:sobre\s+)?["']?(.+?)["']?$/i);
      if (searchMatch) {
        query = searchMatch[1]
          .replace(/\s+no\s+(youtube|youtebe|yt)$/i, '')
          .replace(/\s+e\s+(toca|tocar|assiste|assistir|reproduz|clica|clicar|abre|abrir).*$/i, '')
          .replace(/^(um|uma|o|a|no|na)\s+/i, '')
          .replace(/\s+(aqui|awui|ai|pra mim|por mim)$/i, '')
          .trim();
      }

      const wantsPlayFirst = /primeiro|toca|tocar|assistir|assiste|reproduz|reproduzir|clica|clicar|play/i.test(lower);

      if (query && query !== 'youtube') {
        if (wantsPlayFirst) {
          await this.executePlayYouTube(query);
        } else {
          const msgId = this.appendLoadingMessage();
          this.updateStepMessage(msgId, `🌐 Acessando YouTube…`);
          await window.browserController.navigate('https://www.youtube.com');
          this.updateStepMessage(msgId, `⌨️ Pesquisando **"${query}"**…`);
          await window.browserController.wait(1800);
          await window.browserController.type('input#search, textarea.ytSearchboxComponentInput, input[name="search_query"]', query, true);
          this.replaceLoadingMessage(msgId, `✅ **Resultados abertos no YouTube!**\n\nMostrando vídeos para: *${query}*`);
        }
        return;
      } else {
        this.appendSystemMessage(`🚀 **Abrindo o YouTube na sua tela!**\n\nNavegando para: \`https://www.youtube.com\``);
        await window.browserController.navigate('https://www.youtube.com');
        return;
      }
    }

    // 8. GOOGLE
    if (/googl(e)?|\bgugle\b/i.test(lower)) {
      let query = null;
      const searchMatch = lower.match(/(?:pesquisa(?:r)?|procura(?:r)?|busca(?:r)?)\s+(?:por\s+)?(?:sobre\s+)?["']?(.+?)["']?$/i);
      if (searchMatch) {
        query = searchMatch[1]
          .replace(/\s+no\s+google$/i, '')
          .replace(/^(um|uma|o|a)\s+/i, '')
          .trim();
      }

      if (query && query !== 'google') {
        const msgId = this.appendLoadingMessage();
        this.updateStepMessage(msgId, `🔍 Pesquisando no Google por **"${query}"**…`);
        await window.browserController.navigate(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
        this.replaceLoadingMessage(msgId, `✅ **Resultados do Google carregados!**\n\nExibindo pesquisa sobre: *${query}*`);
        return;
      } else {
        this.appendSystemMessage(`🌐 Abrindo o Google…`);
        await window.browserController.navigate('https://www.google.com');
        return;
      }
    }

    // 9. OUTROS SITES E APLICATIVOS WEB POPULARES (Acesso Instantâneo)
    const otherSites = [
      { name: 'LinkedIn', regex: /linked\s*in/i, url: 'https://www.linkedin.com' },
      { name: 'Facebook', regex: /face(book)?/i, url: 'https://www.facebook.com' },
      { name: 'Excel Web', regex: /excel|planilha(s)?\s+(do\s+)?excel/i, url: 'https://excel.new' },
      { name: 'Google Planilhas (Sheets)', regex: /sheets|google\s+planilha(s)?/i, url: 'https://sheets.new' },
      { name: 'Google Docs', regex: /docs|google\s+docs/i, url: 'https://docs.new' },
      { name: 'Gmail', regex: /gmail|e-?mail/i, url: 'https://mail.google.com' },
      { name: 'Notion', regex: /notion/i, url: 'https://www.notion.so' },
      { name: 'Canva', regex: /canva/i, url: 'https://www.canva.com' },
      { name: 'GitHub', regex: /gith(ub)?/i, url: 'https://www.github.com' },
      { name: 'ChatGPT', regex: /chatgpt|openai/i, url: 'https://chatgpt.com' },
      { name: 'Claude', regex: /claude(\.ai)?/i, url: 'https://claude.ai' },
      { name: 'DeepSeek', regex: /deepseek/i, url: 'https://chat.deepseek.com' },
      { name: 'G1 Notícias', regex: /\bg1\b|globo/i, url: 'https://g1.globo.com' },
      { name: 'WhatsApp Web', regex: /whatsa(pp)?|zap/i, url: 'https://web.whatsapp.com' },
      { name: 'Wikipedia', regex: /wikip(edia)?/i, url: 'https://www.wikipedia.org' },
      { name: 'X (Twitter)', regex: /twitt(er)?|\bx\b/i, url: 'https://x.com' },
      { name: 'Instagram', regex: /instagr(am)?|\binsta\b/i, url: 'https://www.instagram.com' },
      { name: 'Spotify Web', regex: /spotify/i, url: 'https://open.spotify.com' },
      { name: 'Netflix', regex: /netflix/i, url: 'https://www.netflix.com' },
      { name: 'Mercado Livre', regex: /mercado\s*livre/i, url: 'https://www.mercadolivre.com.br' },
      { name: 'Amazon', regex: /amazon/i, url: 'https://www.amazon.com.br' },
      { name: 'Reddit', regex: /reddit/i, url: 'https://www.reddit.com' }
    ];

    for (const site of otherSites) {
      if (site.regex.test(lower) && (lower.includes('entra') || lower.includes('abre') || lower.includes('vai') || lower.includes('acessa') || lower.includes('inicia') || lower.includes('carrega'))) {
        this.appendSystemMessage(`🚀 **Abrindo ${site.name}…**\n\nNavegando para: \`${site.url}\``);
        await window.browserController.navigate(site.url);
        return;
      }
    }

    // 10. Domínio Direto digitado
    const directDomain = lower.match(/([a-zA-Z0-9-]+\.(com|org|net|io|ai|br|gov|edu)[a-zA-Z0-9_\-\.\/]*)/i);
    if (directDomain && (lower.includes('entra') || lower.includes('abre') || lower.includes('vai') || lower.includes('acessa'))) {
      const url = `https://${directDomain[1]}`;
      this.appendSystemMessage(`🌐 Acessando **${url}**…`);
      await window.browserController.navigate(url);
      return;
    }

    // 11. Se for pergunta, análise de texto ou raciocínio: Envia ao motor com Cascade Fallback
    const ctx = await this.getActivePageContext();
    await this.queryAntigravity(prompt, ctx);
  }

  async handleQuickAction(action) {
    this.openPanel();
    const ctx = await this.getActivePageContext();

    if (action === 'summarize') {
      const prompt = `Resuma os pontos principais desta página web de forma clara e estruturada.`;
      this.appendUserMessage(`📝 Resumir a página atual (${ctx.title || 'Página Web'})`);
      await this.queryAntigravity(prompt, ctx);
    } else if (action === 'observe') {
      this.appendUserMessage(`🧭 Observar possíveis ações nesta página`);
      if (window.browserController) {
        const loadingId = this.appendLoadingMessage();
        this.updateStepMessage(loadingId, '🔍 Mapeando elementos e ações disponíveis…');
        const res = await window.browserController.observe();
        const text = typeof res === 'object' && res.text ? res.text : String(res || 'Não foi possível observar a página.');
        this.replaceLoadingMessage(loadingId, `🧭 **Ações sugeridas pelo Stagehand Observe:**\n\n${text}`);
      }
    } else if (action === 'extract') {
      this.appendUserMessage(`📊 Extrair dados principais da página`);
      if (window.browserController) {
        const loadingId = this.appendLoadingMessage();
        this.updateStepMessage(loadingId, '📊 Sintetizando dados e tabelas da página…');
        const res = await window.browserController.extract('Extraia os dados, números, valores e tabelas mais relevantes desta página');
        const text = typeof res === 'object' && res.text ? res.text : String(res || 'Extração concluída.');
        this.replaceLoadingMessage(loadingId, text);
      }
    } else if (action === 'explain') {
      const prompt = `Explique do que se trata esta página e seus principais conceitos.`;
      this.appendUserMessage(`💡 Explicar o conteúdo de ${ctx.title || 'Página Web'}`);
      await this.queryAntigravity(prompt, ctx);
    }
  }


  async queryAntigravity(prompt, context) {
    const loadingId = this.appendLoadingMessage();

    try {
      if (window.__asclepioHost && (window.__asclepioHost.askAi || window.__asclepioHost.askAntigravity)) {
        const askFn = window.__asclepioHost.askAi || window.__asclepioHost.askAntigravity;
        const result = await askFn({ prompt, context });
        let response = typeof result === 'object' && result !== null ? result.text : result;
        const activeBadge = typeof result === 'object' && result !== null ? result.badge : null;

        // Atualiza a badge do modelo no topo do painel dinamicamente em tempo real
        if (activeBadge) {
          const badgeEl = document.getElementById('ai-active-badge');
          if (badgeEl) badgeEl.textContent = activeBadge;
        }

        // ─── EXECUÇÃO AUTÔNOMA DE AÇÕES RETORNADAS PELO MODELO ───

        // 1. [ACTION:SET_VOLUME "valor"]
        const setVolMatch = response ? response.match(/\[ACTION:SET_VOLUME\s+"([^"]+)"\]/i) : null;
        if (setVolMatch) {
          const val = parseInt(setVolMatch[1], 10);
          response = response.replace(/\[ACTION:SET_VOLUME\s+"[^"]+"\]/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `🔊 Ajustando volume para ${val}%…`);
          if (window.browserController) {
            await window.browserController.setVolume(val);
          }
          return;
        }

        // 2. [ACTION:VOLUME_UP]
        if (response && /\[ACTION:VOLUME_UP\]/i.test(response)) {
          response = response.replace(/\[ACTION:VOLUME_UP\]/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `🔊 Aumentando o volume…`);
          if (window.browserController) {
            await window.browserController.changeVolume(20);
          }
          return;
        }

        // 3. [ACTION:VOLUME_DOWN]
        if (response && /\[ACTION:VOLUME_DOWN\]/i.test(response)) {
          response = response.replace(/\[ACTION:VOLUME_DOWN\]/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `🔉 Diminuindo o volume…`);
          if (window.browserController) {
            await window.browserController.changeVolume(-20);
          }
          return;
        }

        // 4. [ACTION:MUTE]
        if (response && /\[ACTION:MUTE\]/i.test(response)) {
          response = response.replace(/\[ACTION:MUTE\]/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `🔇 Alternando mudo…`);
          if (window.browserController) {
            await window.browserController.toggleMute();
          }
          return;
        }

        // 5. [ACTION:FULLSCREEN]
        if (response && /\[ACTION:FULLSCREEN\]/i.test(response)) {
          response = response.replace(/\[ACTION:FULLSCREEN\]/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `🖥️ Alternando tela cheia…`);
          if (window.browserController) {
            await window.browserController.toggleFullscreen();
          }
          return;
        }

        // 6. [ACTION:SPEED "valor"]
        const speedActionMatch = response ? response.match(/\[ACTION:SPEED\s+"([^"]+)"\]/i) : null;
        if (speedActionMatch) {
          const spd = speedActionMatch[1];
          response = response.replace(/\[ACTION:SPEED\s+"[^"]+"\]/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `⚡ Alterando velocidade para ${spd}x…`);
          if (window.browserController) {
            await window.browserController.setPlaybackSpeed(spd);
          }
          return;
        }

        // 7. [ACTION:SEEK "segundos"]
        const seekActionMatch = response ? response.match(/\[ACTION:SEEK\s+"([^"]+)"\]/i) : null;
        if (seekActionMatch) {
          const sec = parseFloat(seekActionMatch[1]);
          response = response.replace(/\[ACTION:SEEK\s+"[^"]+"\]/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `⏩ Ajustando posição do vídeo…`);
          if (window.browserController) {
            await window.browserController.seek(sec);
          }
          return;
        }

        // 8. [ACTION:CAPTIONS]
        if (response && /\[ACTION:CAPTIONS\]/i.test(response)) {
          response = response.replace(/\[ACTION:CAPTIONS\]/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `💬 Alternando legendas…`);
          if (window.browserController) {
            await window.browserController.toggleCaptions();
          }
          return;
        }

        // 9. [ACTION:PLAY_PAUSE]
        if (response && /\[ACTION:PLAY_PAUSE\]/i.test(response)) {
          response = response.replace(/\[ACTION:PLAY_PAUSE\]/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `⏯️ Alternando play/pause…`);
          if (window.browserController) {
            await window.browserController.togglePlay();
          }
          return;
        }

        // 10. [ACTION:NEW_TAB "url"]
        const newTabMatch = response ? response.match(/\[ACTION:NEW_TAB(?:\s+"([^"]+)")?\]/i) : null;
        if (newTabMatch) {
          const url = newTabMatch[1] || 'https://www.google.com';
          response = response.replace(/\[ACTION:NEW_TAB(?:\s+"[^"]+")?\]/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `📑 Abrindo nova aba…`);
          if (window.browserController) {
            window.browserController.newTab(url);
          }
          return;
        }

        // 11. [ACTION:CLOSE_TAB]
        if (response && /\[ACTION:CLOSE_TAB\]/i.test(response)) {
          response = response.replace(/\[ACTION:CLOSE_TAB\]/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `❌ Fechando aba…`);
          if (window.browserController) {
            window.browserController.closeActiveTab();
          }
          return;
        }

        // 12. [ACTION:RELOAD]
        if (response && /\[ACTION:RELOAD\]/i.test(response)) {
          response = response.replace(/\[ACTION:RELOAD\]/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `🔄 Recarregando página…`);
          if (window.browserController) {
            window.browserController.reload();
          }
          return;
        }

        // 13. [ACTION:GO_BACK]
        if (response && /\[ACTION:GO_BACK\]/i.test(response)) {
          response = response.replace(/\[ACTION:GO_BACK\]/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `⬅️ Voltando…`);
          if (window.browserController) {
            window.browserController.goBack();
          }
          return;
        }

        // 14. [ACTION:GO_FORWARD]
        if (response && /\[ACTION:GO_FORWARD\]/i.test(response)) {
          response = response.replace(/\[ACTION:GO_FORWARD\]/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `➡️ Avançando…`);
          if (window.browserController) {
            window.browserController.goForward();
          }
          return;
        }

        // 15. [ACTION:PLAY_YOUTUBE "termo"]
        const playMatch = response ? response.match(/\[ACTION:PLAY_YOUTUBE\s+"([^"]+)"\]/i) : null;
        if (playMatch) {
          const songTerm = playMatch[1];
          response = response.replace(/\[ACTION:PLAY_YOUTUBE\s+"[^"]+"\]/i, '').trim();
          if (response) {
            this.appendSystemMessage(response);
          }
          await this.executePlayYouTube(songTerm, loadingId);
          return;
        }

        // 16. [ACTION:SKIP_AD]
        if (response && /\[ACTION:SKIP_AD\]/i.test(response)) {
          response = response.replace(/\[ACTION:SKIP_AD\]/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `🚫 Pulando anúncio do vídeo…`);
          if (window.browserController) {
            const res = await window.browserController.skipAd();
            if (res && res.success) {
              this.appendSystemMessage(`✅ Anúncio removido com sucesso!`);
            }
          }
          return;
        }

        // 17. [ACTION:SEARCH_GOOGLE "termo"]
        const searchGoogleMatch = response ? response.match(/\[ACTION:SEARCH_GOOGLE\s+"([^"]+)"\]/i) : null;
        if (searchGoogleMatch) {
          const query = searchGoogleMatch[1];
          response = response.replace(/\[ACTION:SEARCH_GOOGLE\s+"[^"]+"\]/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `🔍 Pesquisando "${query}" no Google…`);
          if (window.browserController) {
            await window.browserController.navigate(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
          }
          return;
        }

        // 18. [ACTION:NAVIGATE "url"] ou [NAV: url]
        const navMatch = response ? response.match(/(?:\[ACTION:NAVIGATE\s+"([^"]+)"\]|\[NAV:\s*(https?:\/\/[^\s\]]+)\])/i) : null;
        if (navMatch) {
          const navUrl = navMatch[1] || navMatch[2];
          response = response.replace(/(?:\[ACTION:NAVIGATE\s+"[^"]+"\]|\[NAV:\s*https?:\/\/[^\s\]]+\])/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `🌐 Acessando ${navUrl}…`);
          if (window.browserController) {
            await window.browserController.navigate(navUrl);
          } else if (window.asclepioBrowser) {
            window.asclepioBrowser.navigateTo(navUrl);
          }
          return;
        }

        // 19. [ACTION:SCROLL "down"|"up"]
        const scrollMatch = response ? response.match(/\[ACTION:SCROLL\s+"(down|up)"\]/i) : null;
        if (scrollMatch) {
          const direction = scrollMatch[1].toLowerCase();
          response = response.replace(/\[ACTION:SCROLL\s+"(?:down|up)"\]/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `📜 Rolando página…`);
          if (window.browserController) {
            await window.browserController.scroll(direction, 600);
          }
          return;
        }

        // 20. [ACTION:CLICK "texto"]
        const clickMatch = response ? response.match(/\[ACTION:CLICK\s+"([^"]+)"\]/i) : null;
        if (clickMatch) {
          const target = clickMatch[1];
          response = response.replace(/\[ACTION:CLICK\s+"[^"]+"\]/i, '').trim();
          this.replaceLoadingMessage(loadingId, response || `🖱️ Acionando "${target}"…`);
          if (window.browserController) {
            await window.browserController.act(target);
          }
          return;
        }


        this.replaceLoadingMessage(loadingId, response || 'Sem resposta.');
      } else {
        this.replaceLoadingMessage(loadingId, "Ponte com o motor de IA indisponível no momento.");
      }
    } catch (err) {
      this.replaceLoadingMessage(loadingId, `Erro ao consultar o serviço de IA: ${err.message}`);
    }
  }

  appendUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'message user';
    msg.innerHTML = `<div class="msg-bubble">${this.escapeHtml(text)}</div>`;
    this.chatStream.appendChild(msg);
    this.chatStream.scrollTop = this.chatStream.scrollHeight;
  }

  appendSystemMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'message agent';
    msg.innerHTML = `
      <div class="msg-label">Asclepio AI</div>
      <div class="msg-bubble">${this.formatMarkdown(text)}</div>
    `;
    this.chatStream.appendChild(msg);
    this.chatStream.scrollTop = this.chatStream.scrollHeight;
  }

  appendLoadingMessage() {
    const id = `loading-${Date.now()}`;
    const msg = document.createElement('div');
    msg.id = id;
    msg.className = 'message agent loading';
    msg.innerHTML = `
      <div class="msg-label">Asclepio AI</div>
      <div class="msg-bubble"><span class="loading-dots">Processando</span></div>
    `;
    this.chatStream.appendChild(msg);
    this.chatStream.scrollTop = this.chatStream.scrollHeight;
    return id;
  }

  updateStepMessage(id, text) {
    const el = document.getElementById(id);
    if (el) {
      const bubble = el.querySelector('.msg-bubble');
      if (bubble) bubble.innerHTML = `<em>${this.formatMarkdown(text)}</em>`;
      this.chatStream.scrollTop = this.chatStream.scrollHeight;
    }
  }

  replaceLoadingMessage(id, text) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('loading');
      el.innerHTML = `
        <div class="msg-label">Asclepio AI</div>
        <div class="msg-bubble">${this.formatMarkdown(text)}</div>
      `;
      this.chatStream.scrollTop = this.chatStream.scrollHeight;
    } else {
      this.appendSystemMessage(text);
    }
  }

  async handleQuickAction(action) {
    this.openPanel();
    switch (action) {
      case 'summarize': {
        const ctx = await this.getActivePageContext();
        await this.handleUserPrompt(`Por favor, faça um resumo executivo claro, estruturado e em tópicos da página atual: "${ctx.title}" (${ctx.url})`);
        break;
      }
      case 'observe': {
        const loadingId = this.appendLoadingMessage();
        this.updateStepMessage(loadingId, '🧭 Observando a página e mapeando elementos interativos…');
        if (window.browserController) {
          const res = await window.browserController.observe();
          this.replaceLoadingMessage(loadingId, res?.text || 'Observação concluída.');
        } else {
          this.replaceLoadingMessage(loadingId, 'Controlador do navegador indisponível.');
        }
        break;
      }
      case 'extract': {
        const loadingId = this.appendLoadingMessage();
        this.updateStepMessage(loadingId, '📊 Extraindo dados e informações estruturadas da página…');
        if (window.browserController) {
          const res = await window.browserController.extract('Extrair os principais dados, tabelas, tópicos e valores');
          this.replaceLoadingMessage(loadingId, res?.text || 'Extração de dados concluída.');
        } else {
          this.replaceLoadingMessage(loadingId, 'Controlador do navegador indisponível.');
        }
        break;
      }
      default:
        await this.handleUserPrompt(action);
        break;
    }
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  formatMarkdown(text) {
    if (!text) return '';
    let formatted = this.escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
    return formatted;
  }
}

window.asclepioAgent = new AsclepioAgent();
