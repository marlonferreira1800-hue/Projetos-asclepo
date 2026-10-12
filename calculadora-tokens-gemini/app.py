"""
Servidor Local da Calculadora de Tokens Gemini Pro
Com suporte a Telemetria Turno-a-Turno em Tempo Real (Estilo Anthropic Console).
"""

import os
import glob
import json
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.parse
from datetime import datetime

PORT = 8765
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BRAIN_DIR = r"C:\Users\marlo\.gemini\antigravity-cli\brain"

# Tabela Oficial Google AI Developers (ai.google.dev/pricing)
PRECOS_OFICIAIS = {
    "gemini_2_5_pro": {
        "nome": "Gemini 2.5 Pro",
        "input": 1.25,
        "cache": 0.125,
        "output": 10.00
    },
    "gemini_3_1_pro": {
        "nome": "Gemini 3.1 Pro Preview",
        "input": 2.00,
        "cache": 0.20,
        "output": 12.00
    },
    "gemini_2_5_flash": {
        "nome": "Gemini 2.5 / 3.8 Flash",
        "input": 0.30,
        "cache": 0.03,
        "output": 2.50
    },
    "gemini_flash_lite": {
        "nome": "Gemini Flash-Lite",
        "input": 0.10,
        "cache": 0.01,
        "output": 0.40
    }
}

def coletar_metricas(dias_historico=2):
    arquivos = glob.glob(os.path.join(BRAIN_DIR, "*", ".system_generated", "logs", "transcript.jsonl"))
    if not arquivos:
        return {"sessao_atual": {}, "historico": {}, "tabela_precos": PRECOS_OFICIAIS}

    mais_recente = max(arquivos, key=os.path.getmtime)
    sessao_atual_id = os.path.basename(os.path.dirname(os.path.dirname(os.path.dirname(mais_recente))))
    
    timeline = []
    inp, out, cache, resps = 0, 0, 0, 0
    acumulado = 0
    custo_acumulado_usd = 0.0

    try:
        with open(mais_recente, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if not line.strip(): continue
                try:
                    d = json.loads(line)
                    if d.get("source") == "MODEL" and d.get("type") == "PLANNER_RESPONSE":
                        resps += 1
                        step_inp = d.get("input_tokens", 0)
                        step_out = d.get("output_tokens", 0)
                        step_cache = d.get("cache_read_tokens", 0)
                        step_tot = step_inp + step_out + step_cache
                        
                        inp += step_inp
                        out += step_out
                        cache += step_cache
                        acumulado += step_tot

                        # Custo do passo em Gemini Pro ($1.25 inp, $0.125 cache, $10.00 out)
                        step_cost_usd = (step_inp / 1e6 * 1.25) + (step_cache / 1e6 * 0.125) + (step_out / 1e6 * 10.00)
                        custo_acumulado_usd += step_cost_usd

                        hora = d.get("created_at", "")
                        hora_formatada = hora[11:19] if len(hora) >= 19 else f"T{resps}"

                        timeline.append({
                            "idx": resps,
                            "hora": hora_formatada,
                            "input": step_inp,
                            "cache": step_cache,
                            "output": step_out,
                            "total_passo": step_tot,
                            "acumulado": acumulado,
                            "custo_usd": round(step_cost_usd, 4),
                            "custo_acumulado_usd": round(custo_acumulado_usd, 4)
                        })
                except Exception:
                    pass
    except Exception:
        pass

    dados_atual = {
        "conv_id": sessao_atual_id,
        "respostas": resps,
        "input": inp,
        "output": out,
        "cache": cache,
        "total": inp + out + cache,
        "timeline": timeline,
        "janela_maxima": 1_000_000,
        "contexto_ativo_tokens": (timeline[-1]["input"] + timeline[-1]["cache"]) if timeline else 0
    }

    # Historico
    agora = datetime.now()
    hist = {"conversas": 0, "respostas": 0, "input": 0, "output": 0, "cache": 0, "total": 0}
    for arq in arquivos:
        mtime = datetime.fromtimestamp(os.path.getmtime(arq))
        if (agora - mtime).days <= dias_historico:
            try:
                with open(arq, "r", encoding="utf-8", errors="ignore") as f:
                    local_resps = 0
                    for line in f:
                        if not line.strip(): continue
                        try:
                            d = json.loads(line)
                            if d.get("source") == "MODEL" and d.get("type") == "PLANNER_RESPONSE":
                                local_resps += 1
                                hist["input"] += d.get("input_tokens", 0)
                                hist["output"] += d.get("output_tokens", 0)
                                hist["cache"] += d.get("cache_read_tokens", 0)
                        except Exception:
                            pass
                    if local_resps > 0:
                        hist["conversas"] += 1
                        hist["respostas"] += local_resps
            except Exception:
                pass

    hist["total"] = hist["input"] + hist["output"] + hist["cache"]

    return {
        "sessao_atual": dados_atual,
        "historico": hist,
        "tabela_precos": PRECOS_OFICIAIS,
        "atualizado_em": datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    }

class CustomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/metricas":
            metricas = coletar_metricas()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.end_headers()
            self.wfile.write(json.dumps(metricas).encode("utf-8"))
        else:
            super().do_GET()

def main():
    os.chdir(BASE_DIR)
    server = HTTPServer(("127.0.0.1", PORT), CustomHandler)
    url = f"http://127.0.0.1:{PORT}"
    print(f"Calculadora com Telemetria Ao Vivo (Estilo Anthropic) rodando em: {url}")
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")

if __name__ == "__main__":
    main()
