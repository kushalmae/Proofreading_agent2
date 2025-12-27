'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Issue } from '@/types/proofread';
import { cn } from '@/lib/utils';

interface TranscriptViewerProps {
  transcript: string;
  issues: Issue[];
  selectedLineNumber?: number;
  onLineClick?: (lineNumber: number) => void;
}

export function TranscriptViewer({
  transcript,
  issues,
  selectedLineNumber,
  onLineClick,
}: TranscriptViewerProps) {
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const lines = transcript.split('\n');
  
  // Create a set of line numbers with issues for quick lookup
  const linesWithIssues = new Set(issues.map(issue => issue.line_number));
  
  // Get severity for a line (prioritize blocking > review > info)
  const getLineSeverity = (lineNumber: number): Issue['severity'] | null => {
    const lineIssues = issues.filter(issue => issue.line_number === lineNumber);
    if (lineIssues.length === 0) return null;
    
    if (lineIssues.some(issue => issue.severity === 'blocking')) return 'blocking';
    if (lineIssues.some(issue => issue.severity === 'review')) return 'review';
    return 'info';
  };

  // Scroll to selected line
  useEffect(() => {
    if (selectedLineNumber) {
      const element = lineRefs.current.get(selectedLineNumber);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedLineNumber]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcript Viewer</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full">
          <div className="font-mono text-sm">
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              const severity = getLineSeverity(lineNumber);
              const isSelected = selectedLineNumber === lineNumber;
              const hasIssues = linesWithIssues.has(lineNumber);

              return (
                <div
                  key={index}
                  ref={(el) => {
                    if (el) {
                      lineRefs.current.set(lineNumber, el);
                    }
                  }}
                  className={cn(
                    'flex gap-4 px-2 py-1 border-l-4 transition-colors',
                    isSelected && 'bg-accent',
                    severity === 'blocking' && 'border-l-red-500 bg-red-50 dark:bg-red-950/20',
                    severity === 'review' && !isSelected && 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
                    severity === 'info' && !isSelected && 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
                    !hasIssues && 'border-l-transparent'
                  )}
                  onClick={() => onLineClick?.(lineNumber)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onLineClick?.(lineNumber);
                    }
                  }}
                  aria-label={`Line ${lineNumber}${hasIssues ? ` - has issues` : ''}`}
                >
                  <span className="text-muted-foreground select-none w-12 text-right shrink-0">
                    {lineNumber}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-words">
                    {line || '\u00A0'} {/* Render non-breaking space for empty lines */}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
