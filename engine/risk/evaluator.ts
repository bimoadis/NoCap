import { UAIMDocument, UAIMRiskCode } from '../../models/uaim/types.js';

export interface RuleCondition {
  field: string;
  operator: '==' | '>=' | '<=' | 'devBadHistory' | 'sameBlockRatio';
  value: any;
}

export interface RiskRule {
  code: string;
  severity: 'low' | 'medium' | 'high';
  condition: RuleCondition;
  message: string;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => (acc !== undefined && acc !== null) ? acc[part] : undefined, obj);
}

export function evaluateCondition(uaim: UAIMDocument, condition: RuleCondition): boolean {
  const fieldValue = getNestedValue(uaim, condition.field);

  switch (condition.operator) {
    case '==':
      return fieldValue == condition.value;
    case '>=':
      return fieldValue !== undefined && fieldValue >= condition.value;
    case '<=':
      return fieldValue !== undefined && fieldValue <= condition.value;
    case 'devBadHistory': {
      const launches = uaim.creator.priorLaunches;
      if (launches === 0) return false;
      const deadRatio = uaim.creator.priorOutcomes.died / launches;
      return deadRatio >= condition.value;
    }
    case 'sameBlockRatio': {
      const trades = uaim.trading.windowStats.trades;
      if (trades === 0) return false;
      const sameBlock = uaim.trading.earlyWindowProfile.sameBlockCount ?? 0;
      return (sameBlock / trades) >= condition.value;
    }
    default:
      return false;
  }
}

export function runRiskRules(uaim: UAIMDocument, rules: RiskRule[]): UAIMRiskCode[] {
  const detectedRisks: UAIMRiskCode[] = [];

  for (const rule of rules) {
    if (evaluateCondition(uaim, rule.condition)) {
      detectedRisks.push({
        code: rule.code,
        severity: rule.severity,
        confidence: 1.0,
        evidence: `Condition met: ${rule.condition.field} ${rule.condition.operator} ${rule.condition.value}`
      });
    }
  }

  return detectedRisks;
}
