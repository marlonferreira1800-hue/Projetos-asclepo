import { WebContents } from 'electron'

export interface InteractiveElement {
  id: string
  role: string
  name: string
  value?: string
  href?: string
  description?: string
  center: { x: number; y: number }
  bounds: { x: number; y: number; width: number; height: number }
}

export class CDPController {
  private webContents: WebContents | null = null
  private isAttached = false

  public setWebContents(contents: WebContents): void {
    if (this.webContents && this.isAttached) {
      try {
        if (!this.webContents.isDestroyed()) {
          this.webContents.debugger.detach()
        }
      } catch {
        // ignore detach error
      }
      this.isAttached = false
    }
    this.webContents = contents

    // Auto-limpeza quando a webview for destruída/desmontada
    contents.on('destroyed', () => {
      if (this.webContents === contents) {
        this.webContents = null
        this.isAttached = false
        console.log('[CDPController] WebContents destruído. Referência limpa com segurança.')
      }
    })

    this.attachDebugger()
  }

  private async attachDebugger(): Promise<void> {
    if (!this.webContents || this.webContents.isDestroyed()) return
    if (this.isAttached && this.webContents.debugger.isAttached()) return
    try {
      if (!this.webContents.debugger.isAttached()) {
        this.webContents.debugger.attach('1.3')
      }
      this.isAttached = true

      await Promise.all([
        this.webContents.debugger.sendCommand('Page.enable'),
        this.webContents.debugger.sendCommand('DOM.enable'),
        this.webContents.debugger.sendCommand('Accessibility.enable'),
        this.webContents.debugger.sendCommand('Runtime.enable')
      ])
      console.log('[CDPController] Debugger attached successfully to guest webview')
    } catch (err: any) {
      if (err?.message?.includes('already attached') || (this.webContents && this.webContents.debugger.isAttached())) {
        this.isAttached = true
      } else {
        console.error('[CDPController] Failed to attach debugger:', err)
        this.isAttached = false
      }
    }
  }

  public async ensureAttached(): Promise<void> {
    if (!this.webContents || this.webContents.isDestroyed()) {
      this.webContents = null
      this.isAttached = false
      throw new Error('Nenhuma página ativa ou janela foi destruída.')
    }
    if (!this.isAttached || !this.webContents.debugger.isAttached()) {
      await this.attachDebugger()
    }
  }

  /**
   * Extrai a Árvore de Acessibilidade e DOM semântico com suporte profundo a Shadow DOM (Polymer / YouTube / WebComponents)
   * Filtrando apenas botões, links, inputs e elementos interativos visíveis (<2k tokens)
   */
  public async getSemanticSnapshot(): Promise<{ title: string; url: string; elements: InteractiveElement[] }> {
    await this.ensureAttached()
    const title = this.webContents!.getTitle()
    const url = this.webContents!.getURL()

    try {
      // Avalia no DOM e Shadow DOM recursivamente para obter coordenadas exatas
      const domRectsScript = `
        (() => {
          const interactiveSelectors = 'button, a, input, textarea, select, [role="button"], [role="link"], [role="textbox"], [role="checkbox"], [role="searchbox"], [role="combobox"], [tabindex="0"], ytd-searchbox, #search, #search-icon-legacy, input#search, input[name="search_query"], ytd-video-renderer a#video-title, #video-title, a#video-title-link, ytd-rich-grid-media a#video-title, ytd-lockup-metadata-view-model a, a[href*="/watch?v="], #contents ytd-video-renderer';
          
          // Função recursiva robusta que perfura Shadow DOMs de componentes Web (Polymer, YouTube, Lit, etc.)
          function queryAllDeep(root, selector) {
            let nodes = [];
            try {
              if (root.querySelectorAll) {
                nodes = Array.from(root.querySelectorAll(selector));
              }
            } catch (e) {}

            try {
              const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
              let current = walker.nextNode();
              while (current) {
                if (current.shadowRoot) {
                  nodes = nodes.concat(queryAllDeep(current.shadowRoot, selector));
                }
                current = walker.nextNode();
              }
            } catch (e) {}

            // Procura inputs críticos específicos do YouTube que possam estar em sub-niveis
            try {
              const ytInputs = document.querySelectorAll('ytd-searchbox input, #search-input input, input#search');
              for (const inp of ytInputs) {
                nodes.push(inp);
              }
            } catch (e) {}

            return Array.from(new Set(nodes));
          }

          const items = queryAllDeep(document, interactiveSelectors);

          return items.map((el, idx) => {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            const isVisible = rect.width > 2 && rect.height > 2 && style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
            
            // Extrai href se for link direto ou estiver contido em <a>
            let href = '';
            try {
              if (el.href) href = el.href;
              else if (el.closest) {
                const a = el.closest('a');
                if (a && a.href) href = a.href;
              }
              if (!href && el.getAttribute) {
                href = el.getAttribute('href') || '';
              }
            } catch (e) {}

            // Texto legível extraído de innerText, aria-label, placeholder, title, name ou id
            const text = (
              el.getAttribute('aria-label') ||
              el.placeholder ||
              el.innerText ||
              el.value ||
              el.title ||
              el.getAttribute('name') ||
              el.id ||
              ''
            ).trim().replace(/\s+/g, ' ').slice(0, 90);

            return {
              domIndex: idx,
              tagName: el.tagName.toLowerCase(),
              role: el.getAttribute('role') || el.tagName.toLowerCase(),
              text,
              value: el.value || '',
              href: href || undefined,
              rect: {
                x: Math.round(rect.left),
                y: Math.round(rect.top),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              },
              isVisible
            };
          }).filter(item => item.isVisible && item.rect.y >= -40 && item.rect.y < (window.innerHeight + 300));
        })()
      `

      let domEval = (await this.webContents!.debugger.sendCommand('Runtime.evaluate', {
        expression: domRectsScript,
        returnByValue: true
      })) as { result: { value: any[] } }

      let rawElements = domEval?.result?.value || []

      // Se detectou poucos elementos (ex: página SPA hidratando como YouTube), aguarda 800ms e tenta mais uma vez
      if (rawElements.length <= 3 && url && (url.includes('youtube.com') || url.includes('google.com'))) {
        await new Promise((r) => setTimeout(r, 800))
        domEval = (await this.webContents!.debugger.sendCommand('Runtime.evaluate', {
          expression: domRectsScript,
          returnByValue: true
        })) as { result: { value: any[] } }
        rawElements = domEval?.result?.value || rawElements
      }

      const elements: InteractiveElement[] = rawElements.map((el, index) => {
        const cx = Math.round(el.rect.x + el.rect.width / 2)
        const cy = Math.round(el.rect.y + el.rect.height / 2)
        return {
          id: `elem_${index + 1}`,
          role: el.role || el.tagName,
          name: el.text || `[${el.role}]`,
          value: el.value,
          href: el.href || undefined,
          bounds: el.rect,
          center: { x: cx, y: cy }
        }
      })

      return { title, url, elements }
    } catch (error) {
      console.warn('[CDPController] Fallback na extração semântica:', error)
      return { title, url, elements: [] }
    }
  }

  /**
   * Protocolo Físico Anti-Ghost Click (Mouse move -> delay -> press -> delay -> release)
   */
  public async clickPhysical(x: number, y: number): Promise<void> {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      console.warn(`[CDPController] Coordenadas inválidas para clique: (${x}, ${y})`)
      return
    }
    await this.ensureAttached()
    const dbg = this.webContents!.debugger

    // 1. Move o cursor para o elemento
    await dbg.sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x,
      y
    })
    await new Promise((r) => setTimeout(r, 60))

    // 2. Pressiona o botão esquerdo
    await dbg.sendCommand('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x,
      y,
      button: 'left',
      clickCount: 1
    })
    await new Promise((r) => setTimeout(r, 40))

    // 3. Solta o botão esquerdo
    await dbg.sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x,
      y,
      button: 'left',
      clickCount: 1
    })

    // 4. Reforço DOM: garante que o elemento sob as coordenadas (ou âncora <a>) execute o evento click mesmo com Shadow DOM ou overlays
    try {
      await dbg.sendCommand('Runtime.evaluate', {
        expression: `
          (() => {
            let el = document.elementFromPoint(${x}, ${y});
            while (el && el.shadowRoot) {
              const inner = el.shadowRoot.elementFromPoint(${x}, ${y});
              if (!inner || inner === el) break;
              el = inner;
            }
            if (el) {
              const link = el.tagName === 'A' ? el : (el.closest ? el.closest('a') : null);
              if (link && link.href) {
                try { link.click(); } catch(e) {}
                return { clicked: true, isLink: true, href: link.href };
              }
              try { el.click(); } catch(e) {}
              return { clicked: true };
            }
            return { clicked: false };
          })()
        `,
        returnByValue: true
      })
    } catch {}

    console.log(`[CDPController] Clique físico executado em (${x}, ${y})`)
  }

  /**
   * Digitação robusta compatível com React / Vue (dispara eventos sintéticos com bubbles: true)
   */
  public async fillInput(x: number, y: number, text: string): Promise<void> {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      console.warn(`[CDPController] Coordenadas inválidas para preenchimento: (${x}, ${y})`)
      return
    }
    await this.ensureAttached()
    // Primeiro clica para focar o input
    await this.clickPhysical(x, y)
    await new Promise((r) => setTimeout(r, 80))

    // Dispara via Runtime.evaluate garantindo dispatchEvent com bubbles: true
    const fillScript = `
      (() => {
        let rawEl = document.elementFromPoint(${x}, ${y});
        while (rawEl && rawEl.shadowRoot) {
          const inner = rawEl.shadowRoot.elementFromPoint(${x}, ${y});
          if (!inner || inner === rawEl) break;
          rawEl = inner;
        }
        if (!rawEl) return;
        const el = rawEl.matches('input, textarea, [contenteditable="true"]')
          ? rawEl
          : (rawEl.querySelector('input, textarea, [contenteditable="true"]') || rawEl.closest('input, textarea, [contenteditable="true"]') || rawEl);

        if (el) {
          el.focus();
          if ('value' in el) {
            // Suporte para React/Vue Virtual DOM listeners
            const prototype = Object.getPrototypeOf(el);
            const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
            if (prototypeValueSetter) {
              prototypeValueSetter.call(el, ${JSON.stringify(text)});
            } else {
              el.value = ${JSON.stringify(text)};
            }
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          } else if (el.isContentEditable) {
            el.innerText = ${JSON.stringify(text)};
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      })()
    `

    await this.webContents!.debugger.sendCommand('Runtime.evaluate', {
      expression: fillScript
    })

    console.log(`[CDPController] Preenchido campo em (${x}, ${y}) com "${text}"`)
  }

  /**
   * Pressiona tecla especial (ex: 'Enter')
   */
  public async pressKey(key: string): Promise<void> {
    await this.ensureAttached()
    const dbg = this.webContents!.debugger

    if (key === 'Enter') {
      await dbg.sendCommand('Input.dispatchKeyEvent', {
        type: 'rawKeyDown',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
        unmodifiedText: '\r',
        text: '\r'
      })
      await dbg.sendCommand('Input.dispatchKeyEvent', {
        type: 'char',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
        unmodifiedText: '\r',
        text: '\r'
      })
      await new Promise((r) => setTimeout(r, 60))
      await dbg.sendCommand('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
        unmodifiedText: '\r',
        text: '\r'
      })
      console.log('[CDPController] Pressionou tecla Enter (com eventos completos)')
    }
  }

  /**
   * Navega para uma URL com Page.navigate (CDP) de alta velocidade,
   * imune a travamentos por redirecionamento provisorio (ERR_ABORTED -3) do Google/Chromium.
   */
  public async navigate(url: string): Promise<void> {
    await this.ensureAttached()
    let target = url.trim()
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target
    }
    console.log(`[CDPController] Navegando para ${target}`)

    try {
      if (this.webContents && !this.webContents.isDestroyed() && this.webContents.debugger.isAttached()) {
        // Page.navigate via CDP: Instantâneo (~10ms) e lida nativamente com redirecionamentos 301/302 sem rejeitar Promise
        await this.webContents.debugger.sendCommand('Page.navigate', { url: target })
      } else if (this.webContents && !this.webContents.isDestroyed()) {
        await this.webContents.loadURL(target)
      }
    } catch (err: any) {
      // ERR_ABORTED (-3) é esperado no Chromium quando há redirecionamento provisório (ex: google.com -> google.com/)
      const msg = String(err?.message || err)
      if (err?.code === 'ERR_ABORTED' || err?.errno === -3 || msg.includes('ERR_ABORTED')) {
        console.log(`[CDPController] Redirecionamento provisório absorvido com sucesso: ${target}`)
        return
      }
      // Fallback gracioso
      try {
        if (this.webContents && !this.webContents.isDestroyed()) {
          await this.webContents.loadURL(target)
        }
      } catch (fallbackErr: any) {
        if (!String(fallbackErr?.message || fallbackErr).includes('ERR_ABORTED')) {
          console.warn('[CDPController] Aviso na navegação secundária:', fallbackErr)
        }
      }
    }
  }

  /**
   * Clica e navega diretamente para o primeiro vídeo de uma página de resultados do YouTube
   */
  public async playFirstYouTubeVideo(): Promise<{ success: boolean; url?: string; title?: string }> {
    await this.ensureAttached()
    try {
      const clickScript = `
        (() => {
          const sel = [
            'ytd-video-renderer a#video-title',
            '#contents ytd-video-renderer a#video-title',
            'ytd-video-renderer a#thumbnail',
            '#contents ytd-video-renderer a[href*="watch"]',
            'ytd-lockup-metadata-view-model a',
            'a#video-title',
            'a[href*="/watch?v="]'
          ];
          for (const s of sel) {
            const el = document.querySelector(s);
            if (el && el.href && el.href.includes('/watch')) {
              try { el.click(); } catch(e) {}
              return { success: true, url: el.href, title: (el.innerText || el.title || '').trim() };
            }
          }
          const allLinks = Array.from(document.querySelectorAll('a[href*="/watch?v="]'));
          if (allLinks.length > 0) {
            const first = allLinks[0];
            try { first.click(); } catch(e) {}
            return { success: true, url: first.href, title: (first.innerText || first.title || '').trim() };
          }
          return { success: false };
        })()
      `
      const evalRes = (await this.webContents!.debugger.sendCommand('Runtime.evaluate', {
        expression: clickScript,
        returnByValue: true
      })) as { result: { value: any } }

      const res = evalRes?.result?.value
      if (res && res.success && res.url) {
        // Se após 400ms ainda não estiver em /watch, força navegação direta via CDP
        await new Promise((r) => setTimeout(r, 400))
        const currentUrl = this.webContents!.getURL()
        if (!currentUrl.includes('/watch')) {
          await this.navigate(res.url)
        }
        return res
      }
      return { success: false }
    } catch {
      return { success: false }
    }
  }

  /**
   * Rola a página
   */
  public async scroll(deltaY: number): Promise<void> {
    await this.ensureAttached()
    await this.webContents!.debugger.sendCommand('Runtime.evaluate', {
      expression: `window.scrollBy({ top: ${deltaY}, behavior: 'smooth' });`
    })
  }

  /**
   * Captura screenshot otimizada em base64 (JPEG)
   */
  public async captureScreenshot(): Promise<string> {
    await this.ensureAttached()
    const result = (await this.webContents!.debugger.sendCommand('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 70
    })) as { data: string }
    return result.data
  }
}

export const cdpController = new CDPController()
