import type { Issue } from '@/types/proofread';

/**
 * Attempts to apply a suggested fix to a line of text
 * Since suggested_fix is an instruction, we need to interpret it
 */
export function applyFixToLine(lineText: string, issue: Issue): string {
  const fix = issue.suggested_fix.toLowerCase();
  const description = issue.description.toLowerCase();
  // Preserve original whitespace - we'll restore it at the end
  const leadingWhitespace = lineText.match(/^\s*/)?.[0] || '';
  const trailingWhitespace = lineText.match(/\s*$/)?.[0] || '';
  let result = lineText.trim();
  const originalResult = result; // Keep track to see if we actually made changes

  // Capitalization fixes
  if (issue.category === 'capitalization') {
    // Try to extract the word that needs to be capitalized from description or fix
    const description = issue.description.toLowerCase();
    const fixLower = fix.toLowerCase();
    
    // Pattern 1: Look for quoted word (e.g., "smith" should be "Smith")
    let wordMatch = description.match(/["']([a-z]+)["']/i) || fixLower.match(/["']([a-z]+)["']/i);
    
    // Pattern 2: Look for word after "capitalize" (e.g., "capitalize smith")
    if (!wordMatch) {
      wordMatch = description.match(/capitalize\s+(["']?)([a-z]+)\1/i) || 
                  fixLower.match(/capitalize\s+(["']?)([a-z]+)\1/i);
      if (wordMatch) {
        wordMatch = [wordMatch[0], wordMatch[2]]; // Extract just the word
      }
    }
    
    // Pattern 3: Look for "X should be Y" pattern
    if (!wordMatch) {
      const shouldBeMatch = description.match(/([a-z]+)\s+should\s+be/i);
      if (shouldBeMatch) {
        wordMatch = [shouldBeMatch[0], shouldBeMatch[1]];
      }
    }
    
    // Pattern 4: Extract any lowercase word that appears in both description and the line
    if (!wordMatch) {
      const wordsInLine = result.toLowerCase().match(/\b[a-z]+\b/g) || [];
      for (const word of wordsInLine) {
        if (description.includes(word) && word.length > 2) {
          // Check if this word is lowercase in the line but should be capitalized
          const regex = new RegExp(`\\b${word}\\b`, 'i');
          if (regex.test(result) && result.match(regex)?.[0] === result.match(regex)?.[0].toLowerCase()) {
            wordMatch = [word, word];
            break;
          }
        }
      }
    }
    
    // If we found a word to fix, capitalize it
    if (wordMatch) {
      const wordToFix = wordMatch[1].toLowerCase();
      const capitalizedWord = wordToFix.charAt(0).toUpperCase() + wordToFix.slice(1);
      
      // Replace the word (case-insensitive, whole word match)
      const regex = new RegExp(`\\b${wordToFix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      result = result.replace(regex, (match) => {
        // Preserve the case pattern but capitalize first letter
        return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
      });
    }
    // If no specific word found, capitalize first letter of line
    else if (fix.includes('capitalize') || fix.includes('should be capitalized')) {
      if (result.length > 0) {
        result = result.charAt(0).toUpperCase() + result.slice(1);
      }
    }
    // Lowercase fixes
    else if (fix.includes('lowercase') || fix.includes('should be lowercase')) {
      // Look for capitalized word to lowercase
      const upperWordMatch = description.match(/["']([A-Z][a-z]+)["']/i) || 
                            fixLower.match(/["']([A-Z][a-z]+)["']/i) ||
                            description.match(/lowercase\s+(["']?)([A-Z][a-z]+)\1/i);
      if (upperWordMatch) {
        const wordToFix = upperWordMatch[1] || upperWordMatch[2];
        const lowercasedWord = wordToFix.toLowerCase();
        const regex = new RegExp(`\\b${wordToFix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        result = result.replace(regex, lowercasedWord);
      } else if (result.length > 0) {
        result = result.charAt(0).toLowerCase() + result.slice(1);
      }
    }
  }

  // Punctuation fixes
  if (issue.category === 'punctuation') {
    // Add apostrophe or handle word replacements (e.g., "Add apostrophe to 'todays' to make it 'today's'")
    if (fix.includes('apostrophe') || fix.includes('make it')) {
      // Extract all quoted strings from the fix - use the full suggested_fix, not lowercased
      const quotedMatches = issue.suggested_fix.match(/["']([^"']+)["']/g);
      if (quotedMatches && quotedMatches.length >= 2) {
        // Usually: first quote is original word, last quote is corrected word
        // Pattern: "Add apostrophe to 'todays' to make it 'today's'"
        const originalWord = quotedMatches[0].replace(/["']/g, '').trim();
        const correctedWord = quotedMatches[quotedMatches.length - 1].replace(/["']/g, '').trim();
        
        // Only proceed if words are actually different
        if (originalWord.toLowerCase() !== correctedWord.toLowerCase()) {
          // Escape special regex characters in the original word
          const escapedOriginal = originalWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          // Use word boundary, but be flexible about what comes before/after
          const regex = new RegExp(`\\b${escapedOriginal}\\b`, 'gi');
          
          const beforeReplace = result;
          result = result.replace(regex, (match) => {
            // Preserve the case of the first letter, but use the corrected word structure
            if (match[0] === match[0].toUpperCase()) {
              return correctedWord.charAt(0).toUpperCase() + correctedWord.slice(1);
            }
            return correctedWord;
          });
          
          // If replacement didn't work, try without word boundaries as fallback
          if (result === beforeReplace && result.toLowerCase().includes(originalWord.toLowerCase())) {
            const indexRegex = new RegExp(escapedOriginal, 'gi');
            result = result.replace(indexRegex, (match) => {
              if (match[0] === match[0].toUpperCase()) {
                return correctedWord.charAt(0).toUpperCase() + correctedWord.slice(1);
              }
              return correctedWord;
            });
          }
        }
      } else if (quotedMatches && quotedMatches.length === 1) {
        // Only one quoted word - try to extract both from context
        // Look for "make it 'X'" pattern
        const makeItMatch = issue.suggested_fix.match(/make\s+it\s+["']([^"']+)["']/i);
        if (makeItMatch) {
          const correctedWord = makeItMatch[1];
          const originalWord = quotedMatches[0].replace(/["']/g, '');
          
          const regex = new RegExp(`\\b${originalWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          result = result.replace(regex, (match) => {
            if (match[0] === match[0].toUpperCase()) {
              return correctedWord.charAt(0).toUpperCase() + correctedWord.slice(1);
            }
            return correctedWord;
          });
        } else {
          // Try to find the word in the line that matches the pattern
          // e.g., if fix says "add apostrophe to 'todays'", find "todays" and add apostrophe
          const wordInQuote = quotedMatches[0].replace(/["']/g, '');
          const wordRegex = new RegExp(`\\b${wordInQuote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          if (wordRegex.test(result)) {
            // Try common apostrophe patterns
            // "todays" -> "today's", "its" -> "it's", etc.
            result = result.replace(wordRegex, (match) => {
              // For words ending in 's', add apostrophe before 's'
              if (wordInQuote.toLowerCase().endsWith('s')) {
                const base = wordInQuote.slice(0, -1);
                const fixed = base + "'s";
                return match[0] === match[0].toUpperCase() 
                  ? fixed.charAt(0).toUpperCase() + fixed.slice(1)
                  : fixed;
              }
              return match;
            });
          }
        }
      }
    }
    // Add period at end
    else if (fix.includes('add period') && (fix.includes('end') || fix.includes('at end'))) {
      if (result && !result.match(/[.!?]$/)) {
        result = result + '.';
      }
    }
    // Add comma
    else if (fix.includes('add comma')) {
      // Try to find where to add comma (simplified - just before common conjunctions)
      if (fix.includes('before')) {
        const beforeText = fix.match(/before ["']?(\w+)/i)?.[1]?.toLowerCase();
        if (beforeText && result.toLowerCase().includes(beforeText)) {
          const index = result.toLowerCase().indexOf(beforeText);
          if (index > 0 && result[index - 1] !== ',') {
            result = result.slice(0, index).trim() + ', ' + result.slice(index);
          }
        }
      } else {
        // Generic "add comma" - try to add before common conjunctions
        const conjunctions = ['and', 'but', 'or', 'so'];
        for (const conj of conjunctions) {
          const index = result.toLowerCase().indexOf(' ' + conj + ' ');
          if (index > 0 && result[index] !== ',') {
            result = result.slice(0, index + 1) + ', ' + result.slice(index + 1);
            break;
          }
        }
      }
    }
    // Add question mark
    else if (fix.includes('add question mark') || fix.includes('add ?') || fix.includes('add question')) {
      // Replace existing punctuation at end with question mark, or add if none
      if (result && !result.match(/[?]$/)) {
        result = result.replace(/[.!]$/, '') + '?';
      }
    }
    // Remove period/comma
    else if (fix.includes('remove')) {
      if (fix.includes('period') || fix.includes('.')) {
        result = result.replace(/\.$/, '');
      } else if (fix.includes('comma') || fix.includes(',')) {
        // Remove the first comma or all commas if specified
        if (fix.includes('all')) {
          result = result.replace(/,/g, '');
        } else {
          result = result.replace(/,/, '');
        }
      }
    }
  }

  // Spelling fixes - try to extract word replacement from description/fix
  if (issue.category === 'spelling') {
    // Try to find word replacement patterns in the description
    // Pattern: "X should be Y" or "Change X to Y"
    const replacementMatch = description.match(/(\w+)\s+should\s+be\s+(\w+)/i) ||
                            issue.suggested_fix.match(/change\s+(\w+)\s+to\s+(\w+)/i) ||
                            issue.suggested_fix.match(/(\w+)\s+should\s+be\s+(\w+)/i);
    if (replacementMatch) {
      const originalWord = replacementMatch[1];
      const correctedWord = replacementMatch[2];
      const regex = new RegExp(`\\b${originalWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      result = result.replace(regex, (match) => {
        if (match[0] === match[0].toUpperCase()) {
          return correctedWord.charAt(0).toUpperCase() + correctedWord.slice(1);
        }
        return correctedWord;
      });
    }
    // If no replacement found, return original
    return leadingWhitespace + result + trailingWhitespace;
  }

  // Speaker formatting (typically involves label consistency)
  if (issue.category === 'speaker_formatting') {
    // For formatting, suggestions are usually about consistency
    // We can't easily auto-apply without more context
    // Return original line with preserved whitespace
    return leadingWhitespace + result + trailingWhitespace;
  }

  // Fallback: If no changes were made and we have quoted strings in the fix, try word replacement
  if (result === originalResult) {
    // Try to extract word replacements from quoted strings in the fix
    const quotedMatches = issue.suggested_fix.match(/["']([^"']+)["']/g);
    if (quotedMatches && quotedMatches.length >= 2) {
      // Try using the first and last quoted strings as original and corrected
      const originalWord = quotedMatches[0].replace(/["']/g, '');
      const correctedWord = quotedMatches[quotedMatches.length - 1].replace(/["']/g, '');
      
      // Only replace if they're different (to avoid unnecessary replacements)
      if (originalWord.toLowerCase() !== correctedWord.toLowerCase()) {
        const regex = new RegExp(`\\b${originalWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const newResult = result.replace(regex, (match) => {
          if (match[0] === match[0].toUpperCase()) {
            return correctedWord.charAt(0).toUpperCase() + correctedWord.slice(1);
          }
          return correctedWord;
        });
        // Only use the replacement if it actually changed something
        if (newResult !== result) {
          result = newResult;
        }
      }
    }
  }

  // Restore original whitespace
  return leadingWhitespace + result + trailingWhitespace;
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

