import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  runLucasTests,
  runSofiaTests,
  runCarlosTests,
  runBeatrizTests,
  runDanielTests,
  runHelenaTests,
  runMarcosTests,
  runRenataTests,
  runTiagoTests,
  runLarissaTests,
  runEduardoTests,
  runCamilaTests
} from './personas.ts';
import type { BugReport, PersonaResult, UserArmySuiteResult } from './types.ts';

// Carrega o store dinamicamente compilado ou mock de ambiente
async function loadStore(projectRoot: string) {
  // Configura globais mínimos caso não existam no ambiente Node
  if (typeof globalThis.window === 'undefined') {
    (globalThis as any).window = {
      api: {
        runGoal: () => Promise.resolve({ status: 'started' }),
        stopAgent: () => Promise.resolve({ status: 'stopped' }),
        onUrlChanged: () => () => {},
        onTitleChanged: () => () => {},
        onAgentLog: () => () => {},
        minimizeWindow: () => {},
        maximizeWindow: () => {},
        closeWindow: () => {}
      }
    };
  }

  const storePath = path.join(projectRoot, 'src', 'renderer', 'src', 'store.ts');
  const { pathToFileURL } = await import('url');
  return await import(pathToFileURL(storePath).href);
}

export async function executeUserArmySuite(projectRoot: string): Promise<UserArmySuiteResult> {
  console.log('\n' + '='.repeat(75));
  console.log('🎖️   GRANDE EXÉRCITO DE TESTADORES SINTÉTICOS — ASCLEPIO BROWSER   🎖️');
  console.log('         [12 Agentes Autônomos de Homologação, Stress e QA]');
  console.log('='.repeat(75) + '\n');

  const storeModule = await loadStore(projectRoot);

  const personas: PersonaResult[] = [];

  console.log('⚡ [01/12] Lucas Speed (Power User & Concorrência Extrema)...');
  const lucasRes = await runLucasTests(storeModule);
  personas.push(lucasRes);
  console.log(`   ➔ ${lucasRes.scenariosPassed}/${lucasRes.scenariosRun} cenários passaram (${lucasRes.bugsFound.length} bugs)`);

  console.log('📑 [02/12] Sofia Tab-Hoarder (Multi-Abas & Persistência de Dados)...');
  const sofiaRes = await runSofiaTests(storeModule);
  personas.push(sofiaRes);
  console.log(`   ➔ ${sofiaRes.scenariosPassed}/${sofiaRes.scenariosRun} cenários passaram (${sofiaRes.bugsFound.length} bugs)`);

  console.log('💥 [03/12] Carlos Fuzzer (Engenharia do Caos, Emojis & Boundary Cases)...');
  const carlosRes = await runCarlosTests(storeModule);
  personas.push(carlosRes);
  console.log(`   ➔ ${carlosRes.scenariosPassed}/${carlosRes.scenariosRun} cenários passaram (${carlosRes.bugsFound.length} bugs)`);

  console.log('♿ [04/12] Beatriz A11y (Usabilidade, Drag Region & Atalhos de Janela)...');
  const beatrizRes = await runBeatrizTests(storeModule, projectRoot);
  personas.push(beatrizRes);
  console.log(`   ➔ ${beatrizRes.scenariosPassed}/${beatrizRes.scenariosRun} cenários passaram (${beatrizRes.bugsFound.length} bugs)`);

  console.log('🧠 [05/12] Daniel AI (Anti-Loop Guard, CoT Parsing & Circuit Breaker)...');
  const danielRes = await runDanielTests(projectRoot);
  personas.push(danielRes);
  console.log(`   ➔ ${danielRes.scenariosPassed}/${danielRes.scenariosRun} cenários passaram (${danielRes.bugsFound.length} bugs)`);

  console.log('🌐 [06/12] Helena SPA Master (Shadow DOM, Polymer & Virtual DOM Setters)...');
  const helenaRes = await runHelenaTests(projectRoot);
  personas.push(helenaRes);
  console.log(`   ➔ ${helenaRes.scenariosPassed}/${helenaRes.scenariosRun} cenários passaram (${helenaRes.bugsFound.length} bugs)`);

  console.log('⚡ [07/12] Marcos Network (Timeouts, AbortController & Pool Fallbacks)...');
  const marcosRes = await runMarcosTests(projectRoot);
  personas.push(marcosRes);
  console.log(`   ➔ ${marcosRes.scenariosPassed}/${marcosRes.scenariosRun} cenários passaram (${marcosRes.bugsFound.length} bugs)`);

  console.log('🛡️ [08/12] Renata Security (Supressão de Popups, Sandbox & Sanitização)...');
  const renataRes = await runRenataTests(projectRoot);
  personas.push(renataRes);
  console.log(`   ➔ ${renataRes.scenariosPassed}/${renataRes.scenariosRun} cenários passaram (${renataRes.bugsFound.length} bugs)`);

  console.log('🔄 [09/12] Tiago State Sync (Sincronização Bidirecional IPC, URL & Title)...');
  const tiagoRes = await runTiagoTests(projectRoot);
  personas.push(tiagoRes);
  console.log(`   ➔ ${tiagoRes.scenariosPassed}/${tiagoRes.scenariosRun} cenários passaram (${tiagoRes.bugsFound.length} bugs)`);

  console.log('🎯 [10/12] Larissa Ghost Cursor (Protocolo Físico 4 Fases & Tooltip UX)...');
  const larissaRes = await runLarissaTests(projectRoot);
  personas.push(larissaRes);
  console.log(`   ➔ ${larissaRes.scenariosPassed}/${larissaRes.scenariosRun} cenários passaram (${larissaRes.bugsFound.length} bugs)`);

  console.log('🚑 [11/12] Eduardo Crash Recovery (Prevenção de Crash em WebContents Destruídos)...');
  const eduardoRes = await runEduardoTests(projectRoot);
  personas.push(eduardoRes);
  console.log(`   ➔ ${eduardoRes.scenariosPassed}/${eduardoRes.scenariosRun} cenários passaram (${eduardoRes.bugsFound.length} bugs)`);

  console.log('🧹 [12/12] Camila Memory Auditor (Cleanup de Listeners & Otimização de Imagens)...');
  const camilaRes = await runCamilaTests(projectRoot);
  personas.push(camilaRes);
  console.log(`   ➔ ${camilaRes.scenariosPassed}/${camilaRes.scenariosRun} cenários passaram (${camilaRes.bugsFound.length} bugs)`);

  const allBugs: BugReport[] = personas.flatMap((p) => p.bugsFound);
  const totalScenarios = personas.reduce((acc, p) => acc + p.scenariosRun, 0);
  const passedScenarios = personas.reduce((acc, p) => acc + p.scenariosPassed, 0);
  const failedScenarios = personas.reduce((acc, p) => acc + p.scenariosFailed, 0);

  console.log('\n' + '='.repeat(75));
  console.log(`📊 RELATÓRIO DO GRANDE EXÉRCITO DE USUÁRIOS — TOTAL DE BUGS: ${allBugs.length}`);
  console.log(`🎯 Cenários Executados: ${totalScenarios} | Aprovados: ${passedScenarios} | Falhas: ${failedScenarios}`);
  console.log('='.repeat(75));

  if (allBugs.length > 0) {
    console.log('\n🚨 BUGS IDENTIFICADOS PELO EXÉRCITO DE USUÁRIOS:\n');
    allBugs.forEach((bug, idx) => {
      console.log(`[Bug #${idx + 1}] [${bug.severity}] ${bug.id}: ${bug.title}`);
      console.log(`  Persona: ${bug.personaName} | Categoria: ${bug.category}`);
      console.log(`  Descrição: ${bug.description}`);
      console.log(`  Esperado:  ${bug.expected}`);
      console.log(`  Obtido:    ${bug.actual}`);
      console.log(`  Passos:    ${bug.reproductionSteps.join(' -> ')}\n`);
    });
  } else {
    console.log('\n✨ NENHUM BUG ENCONTRADO! Todos os 12 agentes do Exército aprovaram o sistema.\n');
  }

  const result: UserArmySuiteResult = {
    totalPersonas: personas.length,
    totalScenarios,
    passedScenarios,
    failedScenarios,
    bugs: allBugs,
    timestamp: new Date().toISOString()
  };

  try {
    const reportPath = path.join(projectRoot, 'user-army-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf-8');
  } catch {}

  return result;
}

// Execução direta via CLI
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '..', '..');

executeUserArmySuite(projectRoot).then((res) => {
  if (res.bugs.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}).catch((err) => {
  console.error('Fatal crash no Exército de Usuários:', err);
  process.exit(2);
});
