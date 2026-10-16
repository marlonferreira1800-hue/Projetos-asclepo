export interface BugReport {
  id: string;
  personaName: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'STATE_DESYNC' | 'DATA_LOSS' | 'UI_FREEZE' | 'CRASH_RISK' | 'AI_LOGIC' | 'USABILITY' | 'SECURITY' | 'PERFORMANCE' | 'MEMORY_LEAK';
  description: string;
  reproductionSteps: string[];
  expected: string;
  actual: string;
  fixed: boolean;
}

export interface PersonaResult {
  personaName: string;
  role: string;
  icon?: string;
  scenariosRun: number;
  scenariosPassed: number;
  scenariosFailed: number;
  bugsFound: BugReport[];
  durationMs: number;
}

export interface UserArmySuiteResult {
  totalPersonas: number;
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  bugs: BugReport[];
  timestamp: string;
}
