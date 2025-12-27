'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Check } from 'lucide-react';
import type { Issue } from '@/types/proofread';
import { cn } from '@/lib/utils';
import { getIssueId } from '@/lib/applyFixes';

interface IssuesListProps {
  issues: Issue[];
  selectedIssue?: Issue;
  onIssueClick: (issue: Issue) => void;
  acceptedIssueIds?: Set<string>;
}

const severityOrder: Issue['severity'][] = ['blocking', 'review', 'info'];
const severityLabels: Record<Issue['severity'], string> = {
  blocking: 'Blocking',
  review: 'Review',
  info: 'Info',
};

const categoryLabels: Record<Issue['category'], string> = {
  punctuation: 'Punctuation',
  capitalization: 'Capitalization',
  spelling: 'Spelling',
  speaker_formatting: 'Speaker Formatting',
};

export function IssuesList({ 
  issues, 
  selectedIssue, 
  onIssueClick,
  acceptedIssueIds = new Set()
}: IssuesListProps) {
  // Sort issues by severity (blocking > review > info), then by line number
  const sortedIssues = [...issues].sort((a, b) => {
    const severityDiff = severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
    if (severityDiff !== 0) return severityDiff;
    return a.line_number - b.line_number;
  });

  // Group by category
  const issuesByCategory = sortedIssues.reduce((acc, issue) => {
    if (!acc[issue.category]) {
      acc[issue.category] = [];
    }
    acc[issue.category].push(issue);
    return acc;
  }, {} as Record<Issue['category'], Issue[]>);

  const categoryKeys = Object.keys(issuesByCategory) as Issue['category'][];
  const lastCategory = categoryKeys[categoryKeys.length - 1];

  const getSeverityVariant = (severity: Issue['severity']) => {
    switch (severity) {
      case 'blocking':
        return 'destructive';
      case 'review':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (issues.length === 0) {
    return (
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-xl">Detected Issues</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm font-medium">No issues found.</p>
            <p className="text-muted-foreground text-xs mt-1">Your transcript looks good!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-muted/30 border-b">
        <CardTitle className="text-xl">Detected Issues</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] w-full">
          <div className="space-y-6 p-6">
            {Object.entries(issuesByCategory).map(([category, categoryIssues]) => (
              <div key={category}>
                <h3 className="font-semibold text-base mb-3 px-2">
                  {categoryLabels[category as Issue['category']]} ({categoryIssues.length})
                </h3>
                <div className="space-y-2">
                  {categoryIssues.map((issue, index) => {
                    const isAccepted = acceptedIssueIds.has(getIssueId(issue));
                    return (
                      <div key={`${issue.line_number}-${issue.category}-${index}`}>
                        <div
                          className={cn(
                            'p-4 rounded-lg border-2 cursor-pointer transition-all shadow-sm',
                            selectedIssue === issue
                              ? 'bg-accent border-primary shadow-md'
                              : 'hover:bg-accent/50 border-border hover:shadow-md',
                            isAccepted && 'border-green-500/50 bg-green-50/50 dark:bg-green-950/10'
                          )}
                          onClick={() => onIssueClick(issue)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onIssueClick(issue);
                            }
                          }}
                          aria-label={`Issue on line ${issue.line_number}: ${issue.description}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">Line {issue.line_number}</span>
                              <Badge variant={getSeverityVariant(issue.severity)}>
                                {severityLabels[issue.severity]}
                              </Badge>
                              {isAccepted && (
                                <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">
                                  <Check className="h-3 w-3 mr-1" />
                                  Accepted
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {(issue.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {issue.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {category !== lastCategory && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
