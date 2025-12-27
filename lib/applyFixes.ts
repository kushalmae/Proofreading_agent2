import type { Issue } from '@/types/proofread';

/**
 * Extract word pairs (original -> corrected) from issue description and fix
 * Returns [originalWord, correctedWord] or null if not found
 */
function extractWordPair(issue: Issue): [string, string] | null {
  const desc = issue.description;
  const fix = issue.suggested_fix;
  
  // Strategy 1: Look for quoted pairs in description
  // Pattern: "'dr.' should be 'Dr.'" or "'todays' should be 'today's'"
  const quotedPairMatch = desc.match(/["']([^"']+)["']\s+should\s+be\s+(?:capitalized\s+as\s+)?["']([^"']+)["']/i);
  if (quotedPairMatch) {
    const pair = [quotedPairMatch[1].trim(), quotedPairMatch[2].trim()] as [string, string];
    console.log('[extractWordPair] Strategy 1 (quoted pair in description):', pair);
    return pair;
  }
  
  // Strategy 2: Look for quoted pairs in fix
  const fixQuotedPairMatch = fix.match(/["']([^"']+)["']\s+should\s+be\s+["']([^"']+)["']/i);
  if (fixQuotedPairMatch) {
    const pair = [fixQuotedPairMatch[1].trim(), fixQuotedPairMatch[2].trim()] as [string, string];
    console.log('[extractWordPair] Strategy 2 (quoted pair in fix):', pair);
    return pair;
  }
  
  // Strategy 3: Handle "to make it" pattern - most reliable for apostrophe fixes
  // Pattern: "Add apostrophe to 'todays' to make it 'today's'"
  // We need to extract both words, handling apostrophes in the second word
  // Use indexOf to find "to make it" and then extract the quoted word after it
  const makeItIndex = fix.toLowerCase().indexOf('to make it');
  if (makeItIndex !== -1) {
    const afterMakeIt = fix.substring(makeItIndex + 'to make it'.length).trim();
    // Find the quoted word after "to make it" - handle apostrophes inside quotes
    const quoteMatch = afterMakeIt.match(/^(["'])(.*?)\1/);
    if (quoteMatch) {
      const secondWord = quoteMatch[2]?.trim() || '';
      // Now find the first quoted word before "to make it"
      const beforeMakeIt = fix.substring(0, makeItIndex);
      const firstQuoteMatch = beforeMakeIt.match(/(["'])([^'"]*?)\1(?=[^'"]*to make it)/i);
      if (firstQuoteMatch) {
        const firstWord = firstQuoteMatch[2]?.trim() || '';
        if (firstWord && secondWord && firstWord !== secondWord) {
          const pair = [firstWord, secondWord] as [string, string];
          console.log('[extractWordPair] Strategy 3a (make it pattern with indexOf):', pair);
          return pair;
        }
      }
      // Fallback: try to find any quoted word before "to make it"
      const allBeforeQuotes = beforeMakeIt.match(/(["'])([^'"]*?)\1/g);
      if (allBeforeQuotes && allBeforeQuotes.length > 0) {
        const firstWord = allBeforeQuotes[allBeforeQuotes.length - 1]?.replace(/["']/g, '').trim() || '';
        if (firstWord && secondWord && firstWord !== secondWord) {
          const pair = [firstWord, secondWord] as [string, string];
          console.log('[extractWordPair] Strategy 3b (make it pattern fallback):', pair);
          return pair;
        }
      }
    }
  }
  
  // Strategy 3c: Extract quoted strings (fallback - may not handle apostrophes inside quotes well)
  const descQuoted = desc.match(/["']([^"']+)["']/g) || [];
  const fixQuoted = fix.match(/["']([^"']+)["']/g) || [];
  const allQuoted = Array.from(new Set([...descQuoted, ...fixQuoted]));
  
  if (allQuoted.length >= 2) {
    
    // Fallback: use first and last (but prefer from fix if available)
    let first: string;
    let last: string;
    
    if (fixQuoted.length >= 2) {
      // Use pairs from fix if available (more reliable)
      first = fixQuoted[0]?.replace(/["']/g, '').trim() || '';
      last = fixQuoted[fixQuoted.length - 1]?.replace(/["']/g, '').trim() || '';
    } else if (allQuoted.length >= 2) {
      // Otherwise use from combined list
      first = allQuoted[0]?.replace(/["']/g, '').trim() || '';
      last = allQuoted[allQuoted.length - 1]?.replace(/["']/g, '').trim() || '';
    } else {
      first = '';
      last = '';
    }
    
    if (first && last && first.toLowerCase() !== last.toLowerCase()) {
      const pair = [first, last] as [string, string];
      console.log('[extractWordPair] Strategy 3b (first/last quoted):', pair, 'from', allQuoted);
      return pair;
    }
  }
  
  // Strategy 4: For capitalization, extract single quoted word and capitalize it
  if (issue.category === 'capitalization') {
    const descQuoted = desc.match(/["']([^"']+)["']/g) || [];
    const fixQuoted = fix.match(/["']([^"']+)["']/g) || [];
    const singleQuoted = [...descQuoted, ...fixQuoted];
    
    if (singleQuoted.length === 1) {
      const word = singleQuoted[0]?.replace(/["']/g, '').trim();
      if (word && word.length > 0 && word[0] === word[0].toLowerCase()) {
        const pair = [word, word.charAt(0).toUpperCase() + word.slice(1)] as [string, string];
        console.log('[extractWordPair] Strategy 4 (single quote capitalization):', pair);
        return pair;
      }
    }
  }
  
  console.log('[extractWordPair] No pair found. Description:', desc, 'Fix:', fix, 'Category:', issue.category);
  return null;
}

/**
 * Apply word replacement (handles case preservation)
 */
function replaceWord(text: string, originalWord: string, correctedWord: string): string {
  console.log('[replaceWord] Attempting to replace:', { originalWord, correctedWord, inText: text });
  
  // Escape special regex characters
  const escaped = originalWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Try word boundary match first (for words without punctuation)
  let regex = new RegExp(`\\b${escaped}\\b`, 'gi');
  let result = text;
  let changed = false;
  
  result = result.replace(regex, (match) => {
    changed = true;
    console.log('[replaceWord] Word boundary match found:', match);
    // Preserve case of first letter
    if (match[0] === match[0].toUpperCase()) {
      const replacement = correctedWord.charAt(0).toUpperCase() + correctedWord.slice(1);
      console.log('[replaceWord] Replacing with (capitalized):', replacement);
      return replacement;
    }
    console.log('[replaceWord] Replacing with (lowercase):', correctedWord);
    return correctedWord;
  });
  
  // If word boundary didn't work (e.g., for "dr." with punctuation), try without boundaries
  if (!changed) {
    console.log('[replaceWord] Word boundary match failed, trying without boundaries');
    // Escape period specially for regex
    const escapedForRegex = escaped.replace(/\./g, '\\.');
    regex = new RegExp(escapedForRegex, 'gi');
    
    result = text.replace(regex, (match) => {
      console.log('[replaceWord] Non-boundary match found:', match);
      // Preserve case of first letter
      if (match[0] === match[0].toUpperCase()) {
        const replacement = correctedWord.charAt(0).toUpperCase() + correctedWord.slice(1);
        console.log('[replaceWord] Replacing with (capitalized):', replacement);
        return replacement;
      }
      console.log('[replaceWord] Replacing with (lowercase):', correctedWord);
      return correctedWord;
    });
  }
  
  const wasChanged = result !== text;
  console.log('[replaceWord] Result:', { wasChanged, original: text, result });
  return result;
}

/**
 * Apply punctuation fix (period, comma, question mark, apostrophe)
 */
function applyPunctuationFix(text: string, issue: Issue): string {
  const fix = issue.suggested_fix.toLowerCase();
  
  // Apostrophe fixes - use word pair extraction
  if (fix.includes('apostrophe') || fix.includes("'") || fix.includes('make it')) {
    const wordPair = extractWordPair(issue);
    if (wordPair) {
      const [original, corrected] = wordPair;
      return replaceWord(text, original, corrected);
    }
  }
  
  // Add period at end
  if (fix.includes('add period') && (fix.includes('end') || fix.includes('at end'))) {
    if (text && !text.match(/[.!?]$/)) {
      return text + '.';
    }
  }
  
  // Add comma
  if (fix.includes('add comma')) {
    if (fix.includes('before')) {
      const beforeMatch = issue.suggested_fix.match(/before\s+["']?(\w+)/i);
      if (beforeMatch) {
        const beforeText = beforeMatch[1].toLowerCase();
        const index = text.toLowerCase().indexOf(beforeText);
        if (index > 0 && text[index - 1] !== ',') {
          return text.slice(0, index).trim() + ', ' + text.slice(index);
        }
      }
    } else {
      // Generic: add before common conjunctions
      const conjunctions = ['and', 'but', 'or', 'so'];
      for (const conj of conjunctions) {
        const index = text.toLowerCase().indexOf(' ' + conj + ' ');
        if (index > 0 && text[index] !== ',') {
          return text.slice(0, index + 1) + ', ' + text.slice(index + 1);
        }
      }
    }
  }
  
  // Add question mark
  if (fix.includes('add question mark') || fix.includes('add ?') || fix.includes('add question')) {
    if (text && !text.match(/[?]$/)) {
      return text.replace(/[.!]$/, '') + '?';
    }
  }
  
  // Remove punctuation
  if (fix.includes('remove')) {
    if (fix.includes('period') || fix.includes('.')) {
      return text.replace(/\.$/, '');
    }
    if (fix.includes('comma') || fix.includes(',')) {
      return fix.includes('all') ? text.replace(/,/g, '') : text.replace(/,/, '');
    }
  }
  
  return text;
}

/**
 * Apply capitalization fix
 */
function applyCapitalizationFix(text: string, issue: Issue): string {
  // Try to extract word pair first
  const wordPair = extractWordPair(issue);
  if (wordPair) {
    const [original, corrected] = wordPair;
    return replaceWord(text, original, corrected);
  }
  
  // Fallback: capitalize first letter of line
  const fix = issue.suggested_fix.toLowerCase();
  if (fix.includes('capitalize') && text.length > 0 && text[0] === text[0].toLowerCase()) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  
  return text;
}

/**
 * Apply spelling fix
 */
function applySpellingFix(text: string, issue: Issue): string {
  const wordPair = extractWordPair(issue);
  if (wordPair) {
    const [original, corrected] = wordPair;
    return replaceWord(text, original, corrected);
  }
  
  // Try pattern matching: "X should be Y" or "Change X to Y"
  const desc = issue.description.toLowerCase();
  const fix = issue.suggested_fix.toLowerCase();
  
  const patternMatch = desc.match(/(\w+)\s+should\s+be\s+(\w+)/i) ||
                      fix.match(/change\s+(\w+)\s+to\s+(\w+)/i) ||
                      fix.match(/(\w+)\s+should\s+be\s+(\w+)/i);
  
  if (patternMatch) {
    return replaceWord(text, patternMatch[1], patternMatch[2]);
  }
  
  return text;
}

/**
 * Use AI agent to apply a fix (async)
 */
export async function applyFixToLineWithAI(lineText: string, issue: Issue): Promise<string> {
  try {
    const response = await fetch('/api/apply-fix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lineText, issue }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to apply fix with AI');
    }

    const data = await response.json();
    return data.correctedLine;
  } catch (error) {
    console.error('[applyFixToLineWithAI] Error:', error);
    // Fallback to rule-based approach on error
    return applyFixToLine(lineText, issue);
  }
}

/**
 * Attempts to apply a suggested fix to a line of text (rule-based approach)
 * Since suggested_fix is an instruction, we need to interpret it
 */
export function applyFixToLine(lineText: string, issue: Issue): string {
  // Preserve original whitespace
  const leadingWhitespace = lineText.match(/^\s*/)?.[0] || '';
  const trailingWhitespace = lineText.match(/\s*$/)?.[0] || '';
  let result = lineText.trim();
  const originalResult = result;

  // Apply fix based on category
  switch (issue.category) {
    case 'capitalization':
      result = applyCapitalizationFix(result, issue);
      break;
    
    case 'punctuation':
      result = applyPunctuationFix(result, issue);
      break;
    
    case 'spelling':
      result = applySpellingFix(result, issue);
      break;
    
    case 'speaker_formatting':
      // Can't auto-apply formatting fixes
      break;
    
    default:
      // Unknown category - try generic word pair extraction
      const wordPair = extractWordPair(issue);
      if (wordPair) {
        result = replaceWord(result, wordPair[0], wordPair[1]);
      }
  }

  // If nothing changed, try generic fallback
  if (result === originalResult) {
    const wordPair = extractWordPair(issue);
    if (wordPair && wordPair[0].toLowerCase() !== wordPair[1].toLowerCase()) {
      result = replaceWord(result, wordPair[0], wordPair[1]);
    }
  }

  // Restore whitespace
  return leadingWhitespace + result + trailingWhitespace;
}

/**
 * Apply accepted fixes to transcript using AI agent
 * Returns a corrected version with accepted fixes applied
 * Multiple fixes on the same line are applied sequentially
 */
export async function applyFixesToTranscriptWithAI(
  transcript: string,
  issues: Issue[],
  acceptedIssueIds: Set<string>
): Promise<string> {
  if (!transcript || acceptedIssueIds.size === 0) {
    return transcript;
  }

  const lines = transcript.split('\n');
  const correctedLines = [...lines];

  // Filter and sort accepted issues
  const acceptedIssues = issues
    .filter(issue => acceptedIssueIds.has(getIssueId(issue)))
    .sort((a, b) => a.line_number - b.line_number);

  if (acceptedIssues.length === 0) {
    return transcript;
  }

  // Group by line number
  const issuesByLine = acceptedIssues.reduce((acc, issue) => {
    const lineNum = issue.line_number;
    if (!acc[lineNum]) {
      acc[lineNum] = [];
    }
    acc[lineNum].push(issue);
    return acc;
  }, {} as Record<number, Issue[]>);

  // Apply fixes line by line, sequentially using AI
  for (const [lineNumStr, lineIssues] of Object.entries(issuesByLine)) {
    const lineIndex = parseInt(lineNumStr) - 1;
    if (lineIndex >= 0 && lineIndex < correctedLines.length) {
      let currentLine = correctedLines[lineIndex];
      
      // Apply each fix sequentially to the same line
      for (const issue of lineIssues) {
        const beforeFix = currentLine;
        console.log(`[applyFixesToTranscriptWithAI] Applying fix to line ${lineIndex + 1}:`, {
          category: issue.category,
          fix: issue.suggested_fix,
          description: issue.description,
          lineBefore: beforeFix
        });
        
        // Use AI agent to apply the fix
        currentLine = await applyFixToLineWithAI(currentLine, issue);
        
        const wasApplied = beforeFix !== currentLine;
        if (wasApplied) {
          console.log(`[applyFixesToTranscriptWithAI] ✅ Fix applied successfully:`, {
            lineBefore: beforeFix,
            lineAfter: currentLine
          });
        } else {
          console.warn(`[applyFixesToTranscriptWithAI] ⚠️ No change detected for line ${lineIndex + 1}`);
        }
      }
      
      correctedLines[lineIndex] = currentLine;
    }
  }

  return correctedLines.join('\n');
}

/**
 * Apply accepted fixes to transcript (rule-based approach, synchronous)
 * Returns a corrected version with accepted fixes applied
 * Multiple fixes on the same line are applied sequentially
 */
export function applyFixesToTranscript(
  transcript: string,
  issues: Issue[],
  acceptedIssueIds: Set<string>
): string {
  if (!transcript || acceptedIssueIds.size === 0) {
    return transcript;
  }

  const lines = transcript.split('\n');
  const correctedLines = [...lines];

  // Filter and sort accepted issues
  const acceptedIssues = issues
    .filter(issue => acceptedIssueIds.has(getIssueId(issue)))
    .sort((a, b) => a.line_number - b.line_number);

  if (acceptedIssues.length === 0) {
    return transcript;
  }

  // Group by line number
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
      for (const issue of lineIssues) {
        const beforeFix = currentLine;
        console.log(`[applyFixesToTranscript] Applying fix to line ${lineIndex + 1}:`, {
          category: issue.category,
          fix: issue.suggested_fix,
          description: issue.description,
          lineBefore: beforeFix
        });
        
        currentLine = applyFixToLine(currentLine, issue);
        
        const wasApplied = beforeFix !== currentLine;
        if (wasApplied) {
          console.log(`[applyFixesToTranscript] ✅ Fix applied successfully:`, {
            lineBefore: beforeFix,
            lineAfter: currentLine
          });
        } else {
          console.warn(`[applyFixesToTranscript] ❌ Fix NOT applied for line ${lineIndex + 1}:`, {
            category: issue.category,
            fix: issue.suggested_fix,
            description: issue.description,
            originalLine: beforeFix
          });
        }
      }
      
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
