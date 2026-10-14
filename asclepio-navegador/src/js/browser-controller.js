// Asclepio Browser Controller - Automação do DOM com Cursor Visual do Agente
class BrowserController {
  constructor() {
    this.isExecutingAction = false;
  }

  getWebview() {
    return window.asclepioBrowser ? window.asclepioBrowser.getActiveWebview() : null;
  }

  getWebviewOffsets() {
    const wv = this.getWebview();
    if (wv) {
      const rect = wv.getBoundingClientRect();
      return { top: rect.top, left: rect.left };
    }
    return { top: 80, left: 52 };
  }

  // ─── AURA LUMINOSA DE NAVEGAÇÃO DO AGENTE (Borda Azul Polar nas beiradas) ───
  startAgentAura(statusText = 'Asclepio AI navegando…') {
    const aura = document.getElementById('agent-viewport-aura');
    const textEl = document.getElementById('agent-aura-text');
    if (textEl && statusText) {
      textEl.textContent = statusText;
    }
    if (aura) {
      aura.classList.add('active');
    }
  }

  stopAgentAura() {
    const aura = document.getElementById('agent-viewport-aura');
    if (aura) {
      setTimeout(() => {
        aura.classList.remove('active');
      }, 500);
    }
  }

  // 1. Navegar para uma URL com o cursor se movendo até a omnibar
  async navigate(url) {
    const domain = url.replace(/https?:\/\//, '').split('/')[0];
    this.startAgentAura(`🌐 Acessando ${domain}…`);

    try {
      const omni = document.getElementById('omnibar-wrapper');
      if (omni && window.agentCursor) {
        const r = omni.getBoundingClientRect();
        await window.agentCursor.moveTo(r.left + 80, r.top + r.height / 2, 450, `🌐 ${domain}`);
        window.agentCursor.spawnRipple(r.left + 80, r.top + r.height / 2);
      }

      if (window.asclepioBrowser) {
        window.asclepioBrowser.navigateTo(url);
      }
      await this.wait(1800);
    } finally {
      if (window.agentCursor) {
        window.agentCursor.hide();
      }
      this.stopAgentAura();
    }
  }

  // 2. Digitar em um elemento com o cursor animado na tela
  async type(selectorOrHint, text, pressEnter = true) {
    const wv = this.getWebview();
    if (!wv) return false;

    this.startAgentAura(`⌨️ Digitando "${text.slice(0, 24)}"…`);
    const offset = this.getWebviewOffsets();

    // Detecta coordenadas reais do campo no webview
    let targetCoords = { x: 380, y: 35 };
    try {
      const coords = await wv.executeJavaScript(`
        (() => {
          const selectors = [
            'input#search',
            'input[name="search_query"]',
            'textarea.ytSearchboxComponentInput',
            'input.ytSearchboxComponentInput',
            'input[type="search"]',
            'input[name*="search"]',
            'input[name="q"]',
            'textarea[name="q"]',
            'input[type="text"]'
          ];
          for (const s of selectors) {
            const el = document.querySelector(s);
            if (el) {
              const r = el.getBoundingClientRect();
              if (r.width > 20 && r.height > 10) {
                return { x: r.left + r.width / 2, y: r.top + r.height / 2, found: true };
              }
            }
          }
          return { x: 380, y: 35, found: false };
        })();
      `);
      if (coords && coords.found) {
        targetCoords = coords;
      }
    } catch (e) {}

    const screenX = offset.left + targetCoords.x;
    const screenY = offset.top + targetCoords.y;

    // Move o cursor virtual e simula a digitação
    if (window.agentCursor) {
      await window.agentCursor.typeAt(screenX, screenY, text);
    }

    // Injeta os dados no DOM
    const script = `
      (() => {
        const textToType = ${JSON.stringify(text)};
        const selectors = [
          'input#search',
          'input[name="search_query"]',
          'textarea.ytSearchboxComponentInput',
          'input.ytSearchboxComponentInput',
          'input[type="search"]',
          'input[name*="search"]',
          'input[name="q"]',
          'textarea[name="q"]',
          'input[type="text"]'
        ];

        let input = null;
        for (const s of selectors) {
          const el = document.querySelector(s);
          if (el && el.offsetParent !== null) {
            input = el;
            break;
          }
        }

        if (!input) {
          input = document.querySelector('input:not([type="hidden"]), textarea');
        }

        if (!input) return { success: false };

        input.focus();
        const proto = (input instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype);
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) {
          setter.call(input, textToType);
        } else {
          input.value = textToType;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));


        if (${pressEnter}) {
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
          input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
          input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));

          if (input.form) {
            input.form.dispatchEvent(new Event('submit', { bubbles: true }));
          } else {
            const btn = document.querySelector('button[type="submit"], #search-icon-legacy, button.ytSearchboxComponentSearchButton, button[aria-label*="Search"]');
            if (btn) btn.click();
          }
        }

        return { success: true };
      })();
    `;

    try {
      const res = await wv.executeJavaScript(script);
      return res;
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      if (window.agentCursor) {
        window.agentCursor.hide();
      }
      this.stopAgentAura();
    }
  }

  // 3. Tocar o primeiro vídeo nos resultados
  async clickFirstVideo() {
    const wv = this.getWebview();
    if (!wv) return false;

    this.startAgentAura(`▶️ Selecionando o primeiro resultado…`);
    const offset = this.getWebviewOffsets();
    let targetCoords = { x: 380, y: 260 };

    try {
      const coords = await wv.executeJavaScript(`
        (() => {
          const videoSelectors = [
            'ytd-video-renderer #video-title',
            'ytd-video-renderer a#thumbnail',
            'a#video-title-link',
            '#contents ytd-video-renderer a#video-title',
            'ytd-item-section-renderer ytd-video-renderer a',
            'a#video-title'
          ];
          for (const sel of videoSelectors) {
            const el = document.querySelector(sel);
            if (el) {
              const r = el.getBoundingClientRect();
              if (r.width > 20 && r.height > 20 && r.top >= 0) {
                return { x: r.left + r.width / 2, y: r.top + r.height / 2, found: true };
              }
            }
          }
          return { x: 380, y: 260, found: false };
        })();
      `);
      if (coords && coords.found) {
        targetCoords = coords;
      }
    } catch (e) {}

    const screenX = offset.left + targetCoords.x;
    const screenY = offset.top + targetCoords.y;

    if (window.agentCursor) {
      await window.agentCursor.clickAt(screenX, screenY, "▶️ Tocar primeiro vídeo");
    }

    try {
      await wv.executeJavaScript(`
        (() => {
          const videoSelectors = [
            'ytd-video-renderer #video-title',
            'ytd-video-renderer a#thumbnail',
            'a#video-title-link',
            '#contents ytd-video-renderer a#video-title',
            'ytd-item-section-renderer ytd-video-renderer a',
            'a#video-title'
          ];
          for (const sel of videoSelectors) {
            const el = document.querySelector(sel);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              const link = el.closest('a') || (el.tagName.toLowerCase() === 'a' ? el : null);
              if (link && link.href) {
                link.click();
                setTimeout(() => {
                  if (!window.location.href.includes('/watch')) {
                    window.location.href = link.href;
                  }
                }, 300);
              } else {
                el.click();
              }
              return { success: true };
            }
          }
          return { success: false };
        })();
      `);
    } catch (e) {}

    if (window.agentCursor) {
      window.agentCursor.hide();
    }
    this.stopAgentAura();
  }

  // 4. Clicar em qualquer elemento
  async click(textOrSelector) {
    const wv = this.getWebview();
    if (!wv) return false;

    const offset = this.getWebviewOffsets();
    let targetCoords = { x: 320, y: 240 };

    try {
      const coords = await wv.executeJavaScript(`
        (() => {
          const query = ${JSON.stringify(textOrSelector.toLowerCase().trim())};
          const candidates = Array.from(document.querySelectorAll('a, button, [role="button"], #video-title, ytd-video-renderer a#thumbnail, h3'));
          
          let target = candidates.find(c => {
            const text = (c.innerText || c.textContent || c.getAttribute('title') || '').toLowerCase();
            return text.includes(query);
          });

          if (!target && (query.includes('primeiro') || query.includes('video'))) {
            target = document.querySelector('ytd-video-renderer #video-title, ytd-video-renderer a#thumbnail, a#video-title, #contents ytd-video-renderer a, .yuRUbf a, h3 a');
          }

          if (target) {
            const r = target.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2, found: true };
          }
          return { x: 320, y: 240, found: false };
        })();
      `);
      if (coords && coords.found) {
        targetCoords = coords;
      }
    } catch (e) {}

    const screenX = offset.left + targetCoords.x;
    const screenY = offset.top + targetCoords.y;

    if (window.agentCursor) {
      await window.agentCursor.clickAt(screenX, screenY, "🖱️ Clicando...");
    }

    const script = `
      (() => {
        const query = ${JSON.stringify(textOrSelector.toLowerCase().trim())};
        const candidates = Array.from(document.querySelectorAll('a, button, [role="button"], #video-title, ytd-video-renderer a#thumbnail, h3'));
        
        let target = candidates.find(c => {
          const text = (c.innerText || c.textContent || c.getAttribute('title') || '').toLowerCase();
          return text.includes(query);
        });

        if (!target && (query.includes('primeiro') || query.includes('video'))) {
          target = document.querySelector('ytd-video-renderer #video-title, ytd-video-renderer a#thumbnail, a#video-title, #contents ytd-video-renderer a, .yuRUbf a, h3 a');
        }

        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const link = target.closest('a') || (target.tagName.toLowerCase() === 'a' ? target : null);
          if (link && link.href) {
            link.click();
            setTimeout(() => {
              if (!window.location.href.includes('/watch')) {
                window.location.href = link.href;
              }
            }, 300);
          } else {
            target.click();
          }
          return { success: true };
        }

        return { success: false };
      })();
    `;

    try {
      const res = await wv.executeJavaScript(script);
      return res;
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      if (window.agentCursor) {
        window.agentCursor.hide();
      }
    }
  }

  // 5. Rolar a página
  async scroll(direction = 'down', amount = 600) {
    const wv = this.getWebview();
    if (!wv) return;
    const dy = direction === 'down' ? amount : -amount;

    if (window.agentCursor) {
      await window.agentCursor.moveTo(window.innerWidth / 3, window.innerHeight / 2, 400, "📜 Rolando tela...");
    }

    try {
      await wv.executeJavaScript(`window.scrollBy({ top: ${dy}, behavior: 'smooth' });`);
    } catch (e) {}

    if (window.agentCursor) {
      window.agentCursor.hide();
    }
  }

  // 6. Pular anúncio / propaganda no YouTube
  async skipAd() {
    const wv = this.getWebview();
    if (!wv) return { success: false, message: 'Nenhuma aba ativa.' };

    const offset = this.getWebviewOffsets();

    try {
      const result = await wv.executeJavaScript(`
        (() => {
          // 1. Procura botões conhecidos de pular anúncio
          const skipSelectors = [
            'button.ytp-skip-ad-button',
            'button.ytp-ad-skip-button',
            'button.ytp-ad-skip-button-modern',
            '.ytp-ad-skip-button-slot button',
            '.ytp-skip-ad-button__text',
            'button.ytp-ad-overlay-close-button',
            '.ytp-ad-text',
            '.ytp-ad-preview-container',
            '[id^="skip-button"] button'
          ];

          let skipBtn = null;
          for (const sel of skipSelectors) {
            const el = document.querySelector(sel);
            if (el && el.offsetParent !== null) {
              skipBtn = el;
              break;
            }
          }

          // 2. Se houver vídeo com anúncio rodando, avança para o final do anúncio
          const video = document.querySelector('video');
          const isAdShowing = document.querySelector('.ad-showing, .ytp-ad-player-overlay, .ytp-ad-module');

          let adFastForwarded = false;
          if (video && isAdShowing) {
            if (!isNaN(video.duration) && video.duration > 0) {
              video.currentTime = video.duration;
              adFastForwarded = true;
            }
          }

          if (skipBtn) {
            const r = skipBtn.getBoundingClientRect();
            skipBtn.click();
            return {
              success: true,
              type: 'button_clicked',
              x: r.left + r.width / 2,
              y: r.top + r.height / 2
            };
          }

          if (adFastForwarded) {
            return { success: true, type: 'fast_forwarded' };
          }

          // 3. Tenta fechar banners ou overlays de propaganda
          const closeOverlay = document.querySelector('.ytp-ad-overlay-close-button, .ytp-ad-overlay-close-container');
          if (closeOverlay) {
            closeOverlay.click();
            return { success: true, type: 'overlay_closed' };
          }

          return { success: false, reason: 'Nenhum anúncio pulável ativo detectado no momento.' };
        })();
      `);

      if (result && result.success) {
        if (result.x && result.y && window.agentCursor) {
          const screenX = offset.left + result.x;
          const screenY = offset.top + result.y;
          await window.agentCursor.clickAt(screenX, screenY, "🚫 Pular Anúncio");
          window.agentCursor.hide();
        }
        return { success: true, message: 'Anúncio pulado com sucesso!' };
      } else {
        return { success: false, message: result?.reason || 'Nenhum anúncio ativo no momento.' };
      }
    } catch (e) {
      return { success: false, message: `Erro ao tentar pular anúncio: ${e.message}` };
    }
  }

  // 7. Automação de pesquisa e reprodução (YouTube)
  async searchAndPlay(query) {
    this.startAgentAura(`🎬 Buscando e reproduzindo "${query}"…`);
    try {
      const wv = this.getWebview();
      let currentUrl = '';
      try {
        currentUrl = wv && typeof wv.getURL === 'function' ? wv.getURL() : (wv ? wv.src : '');
      } catch (e) {}

      // 1. Se não estiver no YouTube, vai para o YouTube
      if (!currentUrl || !currentUrl.includes('youtube.com')) {
        await this.navigate('https://www.youtube.com');
        await this.wait(1800);
      }

      // 2. Digita no campo de busca com o cursor do agente
      await this.type('input#search, textarea.ytSearchboxComponentInput, input[name="search_query"]', query, true);
      await this.wait(2200);

      // 3. Toca o primeiro vídeo resultante
      await this.clickFirstVideo();
    } finally {
      this.stopAgentAura();
    }
  }

  // ─── CLIQUE UNIVERSAL POR TEXTO, RÓTULO OU SELETOR (Qualquer Site: LinkedIn, Facebook, Excel) ───
  async smartClick(query) {
    const wv = this.getWebview();
    if (!wv) return { success: false, message: 'Nenhuma aba ativa.' };

    this.startAgentAura(`🖱️ Clicando em "${query}"…`);
    const offset = this.getWebviewOffsets();

    try {
      const q = query.toLowerCase().trim();
      const coords = await wv.executeJavaScript(`
        (() => {
          const q = ${JSON.stringify(q)};
          // Prioridade 1: Elementos interativos diretos (rápido e preciso)
          let elements = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"], [role="link"], [role="tab"], [role="menuitem"], .btn'));
          let matched = elements.find(el => {
            const t = (el.innerText || el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('value') || '').trim().toLowerCase();
            return t === q;
          }) || elements.find(el => {
            const t = (el.innerText || el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('value') || '').trim().toLowerCase();
            return t.length > 0 && (t.includes(q) || q.includes(t));
          });

          // Prioridade 2: Títulos e textos gerais se não encontrou em botões/links
          if (!matched) {
            const textContainers = Array.from(document.querySelectorAll('h1, h2, h3, h4, [role="heading"], label, span, p'));
            matched = textContainers.find(el => {
              const t = (el.innerText || el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().toLowerCase();
              return t === q;
            }) || textContainers.find(el => {
              const t = (el.innerText || el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().toLowerCase();
              return t.length > 0 && (t.includes(q) || q.includes(t));
            });
          }

          if (!matched) {
            try { matched = document.querySelector(q); } catch(e) {}
          }

          if (matched) {
            matched.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const r = matched.getBoundingClientRect();
            return {
              found: true,
              x: r.left + r.width / 2,
              y: r.top + r.height / 2,
              tag: matched.tagName.toLowerCase(),
              text: (matched.innerText || matched.textContent || '').trim().slice(0, 40)
            };
          }
          return { found: false };
        })();
      `);

      if (coords && coords.found) {
        const screenX = offset.left + coords.x;
        const screenY = offset.top + coords.y;
        if (window.agentCursor) {
          await window.agentCursor.clickAt(screenX, screenY, `🖱️ ${coords.text || query}`);
        }

        await wv.executeJavaScript(`
          (() => {
            const q = ${JSON.stringify(q)};
            let elements = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"], [role="link"], [role="tab"], [role="menuitem"], .btn'));
            let el = elements.find(e => {
              const t = (e.innerText || e.textContent || e.getAttribute('aria-label') || e.getAttribute('title') || '').trim().toLowerCase();
              return t === q || t.includes(q) || q.includes(t);
            });
            if (!el) {
              const textContainers = Array.from(document.querySelectorAll('h1, h2, h3, h4, label, span, p'));
              el = textContainers.find(e => {
                const t = (e.innerText || e.textContent || e.getAttribute('aria-label') || e.getAttribute('title') || '').trim().toLowerCase();
                return t === q || t.includes(q) || q.includes(t);
              });
            }
            if (!el) {
              try { el = document.querySelector(q); } catch(e) {}
            }
            if (el) {
              el.click();
              if (el.tagName.toLowerCase() === 'a' && el.href) {
                setTimeout(() => {
                  if (window.location.href !== el.href) window.location.href = el.href;
                }, 250);
              }
              return true;
            }
            return false;
          })();
        `);

        return { success: true, text: coords.text };
      } else {
        return { success: false, message: `Elemento "${query}" não encontrado na tela.` };
      }
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      if (window.agentCursor) window.agentCursor.hide();
      this.stopAgentAura();
    }
  }

  // ─── INSPEÇÃO DOS ELEMENTOS INTERATIVOS DA PÁGINA (Vision / Accessibility Tree) ───
  async inspectInteractiveElements() {
    const wv = this.getWebview();
    if (!wv) return [];

    try {
      const items = await wv.executeJavaScript(`
        (() => {
          const interactives = Array.from(document.querySelectorAll('button, a[href], input:not([type="hidden"]), textarea, select, [role="button"], [role="link"]'));
          const visible = [];
          for (const el of interactives) {
            // Otimização: pula elementos sem dimensão física antes de chamar getBoundingClientRect
            if (el.offsetWidth <= 0 || el.offsetHeight <= 0) continue;
            const r = el.getBoundingClientRect();
            if (r.width > 12 && r.height > 12 && r.top >= 0 && r.top <= window.innerHeight && r.left >= 0 && r.left <= window.innerWidth) {
              const text = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('title') || el.getAttribute('value') || '').trim().slice(0, 50);
              if (text) {
                visible.push({
                  type: el.tagName.toLowerCase(),
                  text: text,
                  href: el.href || null,
                  placeholder: el.placeholder || null
                });
              }
            }
            if (visible.length >= 25) break;
          }
          return visible;
        })();
      `);
      return items || [];
    } catch (e) {
      return [];
    }
  }

  // 8. Alternar Play/Pause
  async togglePlay() {
    const wv = this.getWebview();
    if (!wv) return { success: false };
    try {
      return await wv.executeJavaScript(`
        (() => {
          const v = document.querySelector('video');
          if (v) {
            if (v.paused) v.play();
            else v.pause();
            return { success: true, paused: v.paused };
          }
          return { success: false, reason: 'Nenhum vídeo encontrado.' };
        })();
      `);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 9. Definir Volume Específico (0 a 100%)
  async setVolume(percent) {
    const wv = this.getWebview();
    if (!wv) return { success: false, message: 'Nenhuma aba ativa.' };
    const p = Math.max(0, Math.min(100, parseInt(percent, 10) || 50));
    try {
      const res = await wv.executeJavaScript(`
        (() => {
          const video = document.querySelector('video');
          if (video) {
            video.muted = false;
            video.volume = ${p / 100};
            return { success: true, volume: ${p} };
          }
          return { success: false, reason: 'Nenhum elemento de vídeo/áudio encontrado.' };
        })();
      `);
      return res;
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  // 10. Aumentar ou Diminuir Volume Relativamente (+delta ou -delta)
  async changeVolume(delta) {
    const wv = this.getWebview();
    if (!wv) return { success: false };
    const d = parseInt(delta, 10) || 15;
    try {
      const res = await wv.executeJavaScript(`
        (() => {
          const video = document.querySelector('video');
          if (video) {
            video.muted = false;
            let current = Math.round(video.volume * 100);
            let next = Math.max(0, Math.min(100, current + (${d})));
            video.volume = next / 100;
            return { success: true, oldVolume: current, newVolume: next };
          }
          return { success: false, reason: 'Nenhum vídeo ativo.' };
        })();
      `);
      return res;
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  // 11. Alternar Mudo / Silenciar
  async toggleMute() {
    const wv = this.getWebview();
    if (!wv) return { success: false };
    try {
      return await wv.executeJavaScript(`
        (() => {
          const video = document.querySelector('video');
          if (video) {
            video.muted = !video.muted;
            return { success: true, muted: video.muted };
          }
          return { success: false };
        })();
      `);
    } catch (e) {
      return { success: false };
    }
  }

  // 12. Alternar Tela Cheia / Fullscreen
  async toggleFullscreen() {
    const wv = this.getWebview();
    if (!wv) return { success: false };
    try {
      return await wv.executeJavaScript(`
        (() => {
          const ytFs = document.querySelector('.ytp-fullscreen-button');
          if (ytFs) {
            ytFs.click();
            return { success: true };
          }
          const video = document.querySelector('video');
          if (video) {
            if (!document.fullscreenElement) {
              video.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
            return { success: true };
          }
          return { success: false };
        })();
      `);
    } catch (e) {
      return { success: false };
    }
  }

  // 13. Ajustar Velocidade de Reprodução (0.5x, 1x, 1.5x, 2x)
  async setPlaybackSpeed(speed) {
    const wv = this.getWebview();
    if (!wv) return { success: false };
    const s = parseFloat(speed) || 1.0;
    try {
      return await wv.executeJavaScript(`
        (() => {
          const video = document.querySelector('video');
          if (video) {
            video.playbackRate = ${s};
            return { success: true, speed: ${s} };
          }
          return { success: false };
        })();
      `);
    } catch (e) {
      return { success: false };
    }
  }

  // 14. Avançar ou Retroceder tempo no vídeo (segundos)
  async seek(seconds) {
    const wv = this.getWebview();
    if (!wv) return { success: false };
    const delta = parseFloat(seconds) || 10;
    try {
      return await wv.executeJavaScript(`
        (() => {
          const video = document.querySelector('video');
          if (video) {
            const nextTime = Math.max(0, Math.min(video.duration || Infinity, video.currentTime + (${delta})));
            video.currentTime = nextTime;
            return { success: true, currentTime: Math.round(video.currentTime) };
          }
          return { success: false };
        })();
      `);
    } catch (e) {
      return { success: false };
    }
  }

  // 15. Alternar Legendas
  async toggleCaptions() {
    const wv = this.getWebview();
    if (!wv) return { success: false };
    try {
      return await wv.executeJavaScript(`
        (() => {
          const btn = document.querySelector('.ytp-subtitles-button, button[aria-label*="legenda" i], button[aria-label*="caption" i]');
          if (btn) {
            btn.click();
            return { success: true };
          }
          return { success: false };
        })();
      `);
    } catch (e) {
      return { success: false };
    }
  }

  // 16. Gerenciamento de Abas e Navegador
  newTab(url = 'https://www.google.com') {
    if (window.asclepioBrowser) {
      window.asclepioBrowser.createTab(url, 'Nova Aba');
      return { success: true };
    }
    return { success: false };
  }

  closeActiveTab() {
    if (window.asclepioBrowser && window.asclepioBrowser.activeTabId) {
      window.asclepioBrowser.closeTab(window.asclepioBrowser.activeTabId);
      return { success: true };
    }
    return { success: false };
  }

  reload() {
    const wv = this.getWebview();
    if (wv && typeof wv.reload === 'function') {
      wv.reload();
      return { success: true };
    }
    return { success: false };
  }

  goBack() {
    const wv = this.getWebview();
    if (wv && typeof wv.canGoBack === 'function' && wv.canGoBack()) {
      wv.goBack();
      return { success: true };
    }
    return { success: false };
  }

  goForward() {
    const wv = this.getWebview();
    if (wv && typeof wv.canGoForward === 'function' && wv.canGoForward()) {
      wv.goForward();
      return { success: true };
    }
    return { success: false };
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚀 INOVAÇÕES DOS 4 GIGANTES OPEN SOURCE (Browser-Use, Stagehand, Open-Interpreter, AutoGen)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── PASSO 1: SET-OF-MARKS (SoM) DO BROWSER-USE ────────────────────────────
  async highlightElementsAndGetMap() {
    const wv = this.getWebview();
    if (!wv) return [];

    try {
      return await wv.executeJavaScript(`
        (() => {
          // Container de overlay fixo no viewport para crachás SoM sem drift
          let overlay = document.getElementById('asclepio-som-overlay');
          if (overlay) overlay.remove();
          overlay = document.createElement('div');
          overlay.id = 'asclepio-som-overlay';
          overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647;overflow:hidden;';
          document.body.appendChild(overlay);

          const interactables = Array.from(document.querySelectorAll(
            'button, a, input, select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [tabindex="0"]'
          )).filter(el => {
            // Otimização de Layout: descarta rapidamente elementos sem dimensões antes do getBoundingClientRect/getComputedStyle
            if (el.offsetWidth <= 0 || el.offsetHeight <= 0) return false;
            const rect = el.getBoundingClientRect();
            if (rect.width <= 8 || rect.height <= 8 || rect.top >= window.innerHeight || rect.bottom <= 0) return false;
            const style = window.getComputedStyle(el);
            return (
              style.visibility !== 'hidden' &&
              style.display !== 'none' &&
              style.opacity !== '0'
            );
          });

          const fragment = document.createDocumentFragment();
          const elementMap = [];
          interactables.slice(0, 60).forEach((el, index) => {
            const id = index + 1;
            el.setAttribute('data-asclepio-id', id);

            const badge = document.createElement('div');
            badge.className = 'asclepio-som-badge';
            badge.innerText = id;
            const rect = el.getBoundingClientRect();
            const top = Math.max(2, Math.round(rect.top - 2));
            const left = Math.max(2, Math.round(rect.left - 2));
            badge.style.cssText = 'position:fixed;background:#01BAEF;color:#FFF;font-size:11px;font-weight:700;font-family:monospace,sans-serif;padding:1px 5px;border-radius:4px;box-shadow:0 2px 8px rgba(1,186,239,0.45);z-index:2147483647;pointer-events:none;line-height:14px;top:' + top + 'px;left:' + left + 'px;';
            fragment.appendChild(badge);

            elementMap.push({
              id: id,
              tag: el.tagName.toLowerCase(),
              type: el.type || null,
              text: (el.innerText || el.placeholder || el.getAttribute('aria-label') || el.value || el.title || '').slice(0, 70).trim(),
              role: el.getAttribute('role') || null
            });
          });

          // Inserção atômica em lote no DOM via DocumentFragment (1 único reflow)
          overlay.appendChild(fragment);

          return elementMap;
        })();
      `);
    } catch (e) {
      console.error('[BrowserController] Erro ao indexar elementos SoM:', e);
      return [];
    }
  }

  async clearBadges() {
    const wv = this.getWebview();
    if (!wv) return;
    try {
      await wv.executeJavaScript(`
        (() => {
          const overlay = document.getElementById('asclepio-som-overlay');
          if (overlay) overlay.remove();
          document.querySelectorAll('.asclepio-som-badge').forEach(e => e.remove());
        })();
      `);
    } catch (e) {}
  }

  async clickElementById(id) {
    const wv = this.getWebview();
    if (!wv) return { success: false };

    this.startAgentAura(`🖱️ Clicando no elemento [${id}]…`);
    try {
      const res = await wv.executeJavaScript(`
        (() => {
          const el = document.querySelector('[data-asclepio-id="${id}"]');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();

            // Efeito visual ripple de clique
            const ripple = document.createElement('div');
            ripple.style.position = 'absolute';
            ripple.style.width = '30px';
            ripple.style.height = '30px';
            ripple.style.borderRadius = '50%';
            ripple.style.border = '2.5px solid #01BAEF';
            ripple.style.transform = 'translate(-50%, -50%) scale(0.5)';
            ripple.style.transition = 'all 0.5s ease-out';
            ripple.style.pointerEvents = 'none';
            ripple.style.zIndex = '2147483647';

            const r = el.getBoundingClientRect();
            ripple.style.left = (r.left + r.width / 2 + window.scrollX) + 'px';
            ripple.style.top = (r.top + r.height / 2 + window.scrollY) + 'px';
            document.body.appendChild(ripple);

            setTimeout(() => {
              ripple.style.transform = 'translate(-50%, -50%) scale(2.2)';
              ripple.style.opacity = '0';
              setTimeout(() => ripple.remove(), 550);
            }, 20);

            el.click();
            return {
              success: true,
              text: (el.innerText || el.getAttribute('aria-label') || el.value || '').trim()
            };
          }
          return { success: false };
        })();
      `);
      return res;
    } finally {
      this.stopAgentAura();
    }
  }

  async typeElementById(id, text) {
    const wv = this.getWebview();
    if (!wv) return { success: false };

    this.startAgentAura(`⌨️ Digitando "${text.slice(0, 20)}" em [${id}]…`);
    try {
      return await wv.executeJavaScript(`
        (() => {
          const el = document.querySelector('[data-asclepio-id="${id}"]');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
            // BUG FIX 2: Setter do protótipo para disparar eventos sintéticos no React 16+
            const proto = (el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype);
            const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
            if (setter) {
              setter.call(el, ${JSON.stringify(text)});
            } else {
              el.value = ${JSON.stringify(text)};
            }
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return { success: true };
          }
          return { success: false };
        })();
      `);
    } finally {
      this.stopAgentAura();
    }
  }

  // ── PASSO 3: GROUNDING VISUAL MULTIMODAL (OPEN-INTERPRETER VISION) ────────
  async visualClick(targetDescription) {
    const wv = this.getWebview();
    if (!wv || !window.__asclepioHost || !window.__asclepioHost.captureActiveView) {
      return { success: false, reason: 'Ambiente ou host indisponível' };
    }

    this.startAgentAura(`👁️ Localizando "${targetDescription}" via Visão Computacional…`);
    try {
      // BUG FIX 1: Passa o retângulo exato do webview para a captura de tela ser recortada perfeitamente
      const wvRect = wv.getBoundingClientRect();
      const base64 = await window.__asclepioHost.captureActiveView({
        x: wvRect.left,
        y: wvRect.top,
        width: wvRect.width,
        height: wvRect.height
      });
      if (!base64) {
        return { success: false, reason: 'Falha ao capturar tela' };
      }

      const visionResult = await window.__asclepioHost.locateVisualCoordinates({
        imageBase64: base64,
        targetDescription
      });

      if (visionResult && visionResult.found && visionResult.xPercent && visionResult.yPercent) {
        const targetX = Math.round((visionResult.xPercent / 100) * wvRect.width);
        const targetY = Math.round((visionResult.yPercent / 100) * wvRect.height);


        // Move cursor virtual para o ponto de visão
        if (window.agentCursor) {
          const screenX = wvRect.left + targetX;
          const screenY = wvRect.top + targetY;
          await window.agentCursor.moveTo(screenX, screenY, 400, `👁️ Clicando em ${targetDescription}`);
          window.agentCursor.spawnRipple(screenX, screenY);
        }

        // Envia clique nativo para o webview
        wv.sendInputEvent({ type: 'mouseDown', x: targetX, y: targetY, button: 'left', clickCount: 1 });
        await this.wait(60);
        wv.sendInputEvent({ type: 'mouseUp', x: targetX, y: targetY, button: 'left', clickCount: 1 });

        return { success: true, targetX, targetY, confidence: visionResult.confidence };
      }

      return { success: false, reason: 'Elemento não localizado pela visão' };
    } catch (e) {
      console.error('[BrowserController] Erro no visualClick:', e);
      return { success: false, reason: e.message };
    } finally {
      this.stopAgentAura();
    }
  }

  // ── PASSO 2: AS 3 PRIMITIVAS DECLARATIVAS (STAGEHAND) ─────────────────────
  // 2.1 act(instruction) - Executa ações declarativas com SoM + Fallback Vision
  async act(instruction) {
    this.startAgentAura(`⚡ Asclepio processando: "${instruction}"…`);
    try {
      // 1. Tenta via Set-of-Marks do Browser-Use
      const elementMap = await this.highlightElementsAndGetMap();
      if (elementMap && elementMap.length > 0 && window.__asclepioHost?.chooseElementAction) {
        const decision = await window.__asclepioHost.chooseElementAction({
          instruction,
          elementMap
        });

        if (decision && decision.id) {
          let execResult;
          if (decision.action === 'type' && decision.value) {
            execResult = await this.typeElementById(decision.id, decision.value);
          } else {
            execResult = await this.clickElementById(decision.id);
          }

          setTimeout(() => this.clearBadges(), 1500);
          if (execResult && execResult.success) {
            return {
              success: true,
              method: 'set-of-marks',
              reason: decision.reason,
              elementId: decision.id
            };
          }
        }
      }

      // 2. Fallback: Se SoM não achou ou falhou, tenta Grounding Visual por Coordenadas
      const visionResult = await this.visualClick(instruction);
      if (visionResult && visionResult.success) {
        setTimeout(() => this.clearBadges(), 1200);
        return {
          success: true,
          method: 'multimodal-vision',
          details: visionResult
        };
      }

      // 3. Fallback: Tenta busca textual simples via smartClick
      const smartResult = await this.smartClick(instruction);
      setTimeout(() => this.clearBadges(), 1200);
      return smartResult;
    } catch (err) {
      setTimeout(() => this.clearBadges(), 1000);
      return { success: false, error: err.message };
    } finally {
      this.stopAgentAura();
    }
  }

  // 2.2 extract(instruction) - Extração declarativa de dados estruturados
  async extract(instruction = 'Extrair tópicos principais e dados') {
    this.startAgentAura(`📊 Extraindo dados da página…`);
    try {
      const inspect = await this.inspectInteractiveElements();
      const pageText = inspect ? (inspect.headings.join('\n') + '\n' + inspect.paragraphs.slice(0, 15).join('\n')) : '';

      if (window.__asclepioHost?.extractData) {
        return await window.__asclepioHost.extractData({
          instruction,
          pageText
        });
      }
      return { success: false, text: 'Host de extração indisponível.' };
    } finally {
      this.stopAgentAura();
    }
  }

  // 2.3 observe() - Responde em tempo real o que é possível fazer nesta página
  async observe() {
    this.startAgentAura(`🔍 Observando possíveis ações na página…`);
    try {
      const elementMap = await this.highlightElementsAndGetMap();
      const wv = this.getWebview();
      const pageTitle = wv ? wv.getTitle() : 'Página Ativa';
      const pageUrl = wv ? wv.getURL() : '';

      setTimeout(() => this.clearBadges(), 3500);

      if (window.__asclepioHost?.observeActions) {
        return await window.__asclepioHost.observeActions({
          pageTitle,
          pageUrl,
          elementMap
        });
      }
      return { success: false, text: 'Host de observação indisponível.' };
    } finally {
      this.stopAgentAura();
    }
  }

  // ── PASSO 4: LOOP DE VERIFICAÇÃO DO CRÍTICO (AUTOGEN) ──────────────────────
  async executeWithVerification(actionFn, checkConditionFn, maxRetries = 2) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      await actionFn();
      await this.wait(1200); // Aguarda renderização da página

      if (typeof checkConditionFn === 'function') {
        const success = await checkConditionFn();
        if (success) {
          return { status: 'success', attempt };
        }
        console.warn(`[BrowserController] Tentativa ${attempt} falhou na verificação. Retentando…`);
      } else {
        return { status: 'success', attempt };
      }
    }
    return { status: 'failed' };
  }
}

window.browserController = new BrowserController();

