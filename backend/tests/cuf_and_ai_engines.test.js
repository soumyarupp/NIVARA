import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateFinancialProgress,
  calculateProgressGap,
  calculateTimeOverrun,
  calculateCostOverrun
} from '../src/utils/calculations.js';
import { classifyDelayRuleBased } from '../src/services/delayClassifier.js';
import { detectProgressMismatch } from '../src/services/mismatchDetector.js';
import { calculateProjectRisk } from '../src/services/riskEngine.js';
import { parseChatbotIntent } from '../src/services/chatbot.service.js';

describe('🏛️ NIVARA Official Calculations & AI Engines Test Suite', () => {
  describe('1. Financial Progress Calculations', () => {
    it('should calculate accurate financial progress percentage', () => {
      // 4-Laning of NH-27 Demo: Exp 790, Cost 850 -> 92.94%
      const prog = calculateFinancialProgress(790, 850);
      assert.strictEqual(prog, 92.94);
    });

    it('should safely handle division by zero and negative values', () => {
      assert.strictEqual(calculateFinancialProgress(100, 0), 0);
      assert.strictEqual(calculateFinancialProgress(-50, 100), 0);
      assert.strictEqual(calculateFinancialProgress(0, 100), 0);
    });
  });

  describe('2. Progress Gap Calculations', () => {
    it('should compute physical progress gap correctly', () => {
      // Planned 70%, Actual 55% -> Gap 15%
      const gap = calculateProgressGap(70, 55);
      assert.strictEqual(gap, 15);
    });
  });

  describe('3. Fund vs Physical Progress Mismatch Detector', () => {
    it('should flag HIGH severity mismatch when difference > 30%', () => {
      // Fin 92.94%, Phy 55% -> Diff 37.94%
      const res = detectProgressMismatch(92.94, 55);
      assert.strictEqual(res.mismatch, true);
      assert.strictEqual(res.severity, 'HIGH');
      assert.strictEqual(res.difference, 37.94);
      assert.ok(res.message.includes('Significant fund-progress mismatch'));
    });

    it('should return NONE severity when financial and physical progress align', () => {
      const res = detectProgressMismatch(45, 42);
      assert.strictEqual(res.mismatch, false);
      assert.strictEqual(res.severity, 'NONE');
    });
  });

  describe('4. NLP Delay Reason Classifier', () => {
    it('should classify Forest Clearance remarks correctly', () => {
      const text = 'Forest clearance pending from state forest department.';
      const res = classifyDelayRuleBased(text);
      assert.strictEqual(res.category, 'FOREST_CLEARANCE');
      assert.ok(res.confidence > 0.7);
      assert.ok(res.matchedKeywords.includes('forest'));
    });

    it('should classify Land Acquisition delays correctly', () => {
      const text = 'Delay in land acquisition compensation and gazette possession.';
      const res = classifyDelayRuleBased(text);
      assert.strictEqual(res.category, 'LAND_ACQUISITION');
      assert.ok(res.matchedKeywords.includes('land acquisition'));
    });

    it('should classify Litigation & Court issues', () => {
      const text = 'High Court stay order issued on alignment section.';
      const res = classifyDelayRuleBased(text);
      assert.strictEqual(res.category, 'LITIGATION');
    });

    it('should classify Fund Shortage delays', () => {
      const text = 'Delay in central budget grant disbursement and funds allocation.';
      const res = classifyDelayRuleBased(text);
      assert.strictEqual(res.category, 'FUND_SHORTAGE');
    });
  });

  describe('5. Explainable Multi-Factor Risk Engine', () => {
    it('should compute HIGH risk for Flagship Demo Project (NH-27 Bihar)', () => {
      const mockProject = {
        projectName: '4-Laning of NH-27, Bihar',
        originalProjectCost: 850,
        originalCompletionDate: new Date('2028-03-31'),
        revisedCompletionDate: new Date('2028-12-31'),
        projectStatus: 'ONGOING'
      };

      const risk = calculateProjectRisk({
        project: mockProject,
        financialProgress: 92.94,
        physicalProgress: 55,
        plannedPhysicalProgress: 70,
        daysSinceLastReport: 15,
        pendingClearancesCount: 1, // Forest pending
        remainingLandPercentage: 18
      });

      assert.ok(risk.riskScore >= 60, `Risk score ${risk.riskScore} should be >= 60`);
      assert.strictEqual(risk.riskLevel, 'HIGH');
      assert.ok(Array.isArray(risk.factors));
      assert.strictEqual(risk.factors.length, 7);
    });

    it('should compute LOW risk for well-performing project', () => {
      const mockProject = {
        projectName: 'On Track Project',
        originalProjectCost: 500,
        originalCompletionDate: new Date('2029-01-01'),
        projectStatus: 'ONGOING'
      };

      const risk = calculateProjectRisk({
        project: mockProject,
        financialProgress: 50,
        physicalProgress: 50,
        plannedPhysicalProgress: 50,
        daysSinceLastReport: 5,
        pendingClearancesCount: 0,
        remainingLandPercentage: 0
      });

      assert.ok(risk.riskScore < 30, `Risk score ${risk.riskScore} should be < 30`);
      assert.strictEqual(risk.riskLevel, 'LOW');
    });
  });

  describe('6. MoSPI Time and Cost Overrun Formulas', () => {
    it('should compute time overrun for delayed ongoing project', () => {
      const project = {
        originalCompletionDate: new Date('2024-01-01'),
        revisedCompletionDate: new Date('2025-01-01'),
        projectStatus: 'ONGOING'
      };
      const timeRes = calculateTimeOverrun(project);
      assert.ok(timeRes.timeOverrunMonths > 10);
      assert.strictEqual(timeRes.isOverdue, true);
    });

    it('should compute cost overrun percentage relative to original sanction', () => {
      const project = {
        originalProjectCost: 1000,
        revisedProjectCost: 1250,
        expenditure: 1250
      };
      const costRes = calculateCostOverrun(project, 1250);
      assert.strictEqual(costRes.costOverrunOriginal, 250);
      assert.strictEqual(costRes.costOverrunPercentageOriginal, 25);
      assert.strictEqual(costRes.isCostOverrun, true);
    });
  });

  describe('7. Chatbot Natural Language Intent Parser', () => {
    it('should parse complex multi-filter search intent safely', () => {
      const query = 'Show all high risk road projects in Bihar above 500 crore';
      const parsed = parseChatbotIntent(query);

      assert.strictEqual(parsed.intent, 'SEARCH_PROJECTS');
      assert.strictEqual(parsed.filters.state, 'Bihar');
      assert.strictEqual(parsed.filters.sector, 'ROAD');
      assert.strictEqual(parsed.filters.riskLevel, 'HIGH');
      assert.strictEqual(parsed.filters.minCost, 500);
    });

    it('should parse dashboard summary and delay summary intents', () => {
      const d1 = parseChatbotIntent('Give me a national dashboard summary overview');
      assert.strictEqual(d1.intent, 'DASHBOARD_SUMMARY');

      const d2 = parseChatbotIntent('Show why projects are delayed across India delay reason summary');
      assert.strictEqual(d2.intent, 'DELAY_SUMMARY');
    });
  });
});
