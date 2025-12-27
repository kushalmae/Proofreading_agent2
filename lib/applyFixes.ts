import type { Issue } from '@/types/proofread';

/**
 * Attempts to apply a suggested fix to a line of text
 * Since suggested_fix is an instruction, we need to interpret it
 */
export function applyFixToLine(lineText: string, issue: Issue): string {
  const fix = issue.suggested_fix.toLowerCase();
  let result = lineText;

  // Capitalization fixes
  if (issue.category === 'capitalization') {
    if (fix.includes('capitalize') || fix.includes('should be capitalized')) {
      // Capitalize first letter
      if (result.length > 0) {
        result = result.charAt(0).toUpperCase() + result.slice(1);
      }
    } else if (fix.includes('lowercase') || fix.includes('should be lowercase')) {
      // Lowercase first letter
      if (result.length > 0) {
        result = result.charAt(0).toLowerCase() + result.slice(1);
      }
    }
  }

  // Punctuation fixes
  if (issue.category === 'punctuation') {
    // Add period at end
    if (fix.includes('add period') && fix.includes('end')) {
      const trimmed = result.trim();
      if (trimmed && !trimmed.match(/[.!?]$/)) {
        result = trimmed + '.';
      }
    }
    // Add comma
    else if (fix.includes('add comma')) {
      // Try to find where to add comma (simplified - just before common conjunctions)
      if (fix.includes('before')) {
        const beforeText = fix.match(/before ["']?(\w+)/i)?.[1]?.toLowerCase();
        if (beforeText && result.includes(beforeText)) {
          const index = result.toLowerCase().indexOf(beforeText);
          if (index > 0 && result[index - 1] !== ',') {
            result = result.slice(0, index).trim() + ', ' + result.slice(index);
          }
        }
      }
    }
    // Add question mark
    else if (fix.includes('add question mark') || fix.includes('add ?')) {
      const trimmed = result.trim();
      if (trimmed && !trimmed.match(/[?!]$/)) {
        result = trimmed.slice(0, -1) + '?';
      }
    }
    // Remove period/comma
    else if (fix.includes('remove')) {
      if (fix.includes('period')) {
        result = result.replace(/\.$/, '');
      } else if (fix.includes('comma')) {
        result = result.replace(/,/g, '');
      }
    }
  }

  // Spelling fixes (we can't fix without knowing the word, so return original)
  if (issue.category === 'spelling') {
    // For spelling, we'd need the actual word replacement
    // This would require the AI to provide the corrected word in the description
    // For now, return original
    return result;
  }

  // Speaker formatting (typically involves label consistency)
  if (issue.category === 'speaker_formatting') {
    // For formatting, suggestions are usually about consistency
    // We can't easily auto-apply without more context
    return result;
  }

  return result.trim();
}

/**
 * Apply accepted fixes to transcript
 * Returns a corrected version with accepted fixes applied
 * Multiple fixes on the same line are applied sequentially
 */
export function applyFixesToTranscript(
  transcript: string,
  issues: Issue[],
  acceptedIssueIds: Set<string>
): string {
  const lines = transcript.split('\n');
  const correctedLines = [...lines];

  // Group accepted issues by line number
  const acceptedIssues = issues.filter(issue => 
    acceptedIssueIds.has(getIssueId(issue))
  ).sort((a, b) => a.line_number - b.line_number);

  // Group by line number and apply fixes sequentially for each line
  const issuesByLine = acceptedIssues.reduce((acc, issue) => {
    const lineNum = issue.line_number;
    if (!acc[lineNum]) {
      acc[lineNum] = [];
    }
    acc[lineNum].push(issue);
    return acc;
  }, {} as Record<number, Issue[]>);

  // Apply fixes line by line, sequentially
  Object.entries(issuesByLine).forEach(([lineNumStr, lineIssues]) => {
    const lineIndex = parseInt(lineNumStr) - 1;
    if (lineIndex >= 0 && lineIndex < correctedLines.length) {
      let currentLine = correctedLines[lineIndex];
      // Apply each fix sequentially to the same line
      lineIssues.forEach(issue => {
        currentLine = applyFixToLine(currentLine, issue);
      });
      correctedLines[lineIndex] = currentLine;
    }
  });

  return correctedLines.join('\n');
}

/**
 * Generate a unique ID for an issue
 */
export function getIssueId(issue: Issue): string {
  return `${issue.line_number}:${issue.category}:${issue.description}`;
}

