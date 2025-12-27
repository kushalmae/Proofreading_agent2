import type { Issue } from '@/types/proofread';
import { applyFixToLine, getIssueId } from './applyFixes';

/**
 * Generate markdown export with corrections marked in bold
 */
export function exportToMarkdown(
  originalTranscript: string,
  correctedTranscript: string,
  issues: Issue[],
  acceptedIssueIds: Set<string>
): string {
  const originalLines = originalTranscript.split('\n');
  const correctedLines = correctedTranscript.split('\n');
  
  // Group accepted issues by line number
  const acceptedIssues = issues.filter(issue => 
    acceptedIssueIds.has(getIssueId(issue))
  );
  
  const issuesByLine = acceptedIssues.reduce((acc, issue) => {
    const lineNum = issue.line_number;
    if (!acc[lineNum]) {
      acc[lineNum] = [];
    }
    acc[lineNum].push(issue);
    return acc;
  }, {} as Record<number, Issue[]>);

  // Build markdown content
  const lines: string[] = [];
  lines.push('# Corrected Transcript');
  lines.push('');
  lines.push(`*This document shows the corrected transcript with changes marked in **bold**.*`);
  lines.push('');
  lines.push(`**Total corrections applied:** ${acceptedIssueIds.size}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Process each line
  originalLines.forEach((originalLine, index) => {
    const lineNumber = index + 1;
    const correctedLine = correctedLines[index] || originalLine;
    const lineIssues = issuesByLine[lineNumber] || [];

    if (lineIssues.length > 0 && originalLine !== correctedLine) {
      // Line has corrections - mark changes in bold
      const markedLine = markChangesInBold(originalLine, correctedLine, lineIssues);
      lines.push(`${lineNumber}. ${markedLine}`);
      lines.push('');
      
      // Add notes about what was corrected
      lines.push(`   *Corrections:*`);
      lineIssues.forEach(issue => {
        lines.push(`   - ${issue.category}: ${issue.suggested_fix}`);
      });
      lines.push('');
    } else {
      // No changes - just add the line as-is
      lines.push(`${lineNumber}. ${originalLine}`);
      lines.push('');
    }
  });

  return lines.join('\n');
}

/**
 * Mark changed portions of text in bold
 * Compares original and corrected text to identify changes
 */
function markChangesInBold(
  original: string,
  corrected: string,
  issues: Issue[]
): string {
  if (original === corrected) {
    return original;
  }

  const origTrimmed = original.trim();
  const corrTrimmed = corrected.trim();
  
  // For capitalization fixes, find the word that changed case
  const capitalizationIssues = issues.filter(i => i.category === 'capitalization');
  if (capitalizationIssues.length > 0) {
    // Split into words preserving whitespace
    const origParts = origTrimmed.split(/(\s+)/);
    const corrParts = corrTrimmed.split(/(\s+)/);
    
    if (origParts.length === corrParts.length) {
      const markedParts = origParts.map((origPart, i) => {
        const corrPart = corrParts[i];
        // If it's whitespace, keep as-is
        if (origPart.match(/^\s+$/)) {
          return origPart;
        }
        // If words match case-insensitively but differ in case, mark in bold
        if (origPart.toLowerCase() === corrPart.toLowerCase() && origPart !== corrPart) {
          return `**${corrPart}**`;
        }
        // If words are different, check if it's a capitalization fix
        if (origPart.toLowerCase() === corrPart.toLowerCase()) {
          return `**${corrPart}**`;
        }
        return corrPart;
      });
      return markedParts.join('');
    }
  }

  // For punctuation fixes, identify what was added
  const punctuationIssues = issues.filter(i => i.category === 'punctuation');
  if (punctuationIssues.length > 0) {
    // Check if punctuation was added at the end
    if (corrTrimmed.length > origTrimmed.length && 
        corrTrimmed.toLowerCase().startsWith(origTrimmed.toLowerCase())) {
      const addedText = corrTrimmed.slice(origTrimmed.length);
      return origTrimmed + `**${addedText}**`;
    }
    
    // Try character-by-character comparison to find differences
    let diffStart = -1;
    for (let i = 0; i < Math.min(origTrimmed.length, corrTrimmed.length); i++) {
      if (origTrimmed[i] !== corrTrimmed[i]) {
        diffStart = i;
        break;
      }
    }
    
    if (diffStart === -1 && corrTrimmed.length > origTrimmed.length) {
      // Difference is at the end
      const before = corrTrimmed.slice(0, origTrimmed.length);
      const added = corrTrimmed.slice(origTrimmed.length);
      return before + `**${added}**`;
    } else if (diffStart !== -1) {
      // Find where the difference ends
      let diffEnd = Math.max(origTrimmed.length, corrTrimmed.length);
      for (let i = diffStart; i < Math.min(origTrimmed.length, corrTrimmed.length); i++) {
        if (origTrimmed[i] === corrTrimmed[i]) {
          diffEnd = i;
          break;
        }
      }
      const before = corrTrimmed.slice(0, diffStart);
      const changed = corrTrimmed.slice(diffStart, diffEnd);
      const after = corrTrimmed.slice(diffEnd);
      return before + `**${changed}**` + after;
    }
  }

  // Fallback: mark the entire corrected line in bold if we can't identify specific changes
  return `**${corrected}**`;
}

