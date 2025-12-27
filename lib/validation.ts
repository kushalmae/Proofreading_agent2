import type { Issue } from '@/types/proofread';
import { MAX_LINES, MAX_CHARS } from './schemas';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  lines?: number;
  chars?: number;
}

/**
 * Validate input transcript against size limits
 */
export function validateInput(text: string): ValidationResult {
  const lines = text.split('\n').length;
  const chars = text.length;

  if (lines > MAX_LINES) {
    return {
      valid: false,
      error: `Transcript exceeds maximum line limit of ${MAX_LINES}. Current: ${lines} lines.`,
      lines,
      chars,
    };
  }

  if (chars > MAX_CHARS) {
    return {
      valid: false,
      error: `Transcript exceeds maximum character limit of ${MAX_CHARS}. Current: ${chars} characters.`,
      lines,
      chars,
    };
  }

  return {
    valid: true,
    lines,
    chars,
  };
}

/**
 * Deduplicate issues by (line_number, category, description)
 */
export function deduplicateIssues(issues: Issue[]): Issue[] {
  const seen = new Set<string>();
  const unique: Issue[] = [];

  for (const issue of issues) {
    const key = `${issue.line_number}:${issue.category}:${issue.description}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(issue);
    }
  }

  return unique;
}

/**
 * Validate line numbers and filter out invalid issues
 */
export function validateLineNumbers(issues: Issue[], totalLines: number): Issue[] {
  return issues.filter(issue => 
    issue.line_number >= 1 && issue.line_number <= totalLines
  );
}

/**
 * Enforce fix constraints: ensure ≤1 sentence and minimal instructions
 */
export function enforceFixConstraints(fix: string): string {
  // Remove extra sentences (keep only first sentence)
  const sentences = fix.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 0) {
    let firstSentence = sentences[0].trim();
    // Add period if it was removed
    if (!firstSentence.match(/[.!?]$/)) {
      firstSentence += '.';
    }
    return firstSentence;
  }
  return fix.trim();
}
