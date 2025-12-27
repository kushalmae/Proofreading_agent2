'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Issue } from '@/types/proofread';
import { cn } from '@/lib/utils';

interface IssuesListProps {
  issues: Issue[];
  selectedIssue?: Issue;
  onIssueClick: (issue: Issue) => void;
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

export function IssuesList({ issues, selectedIssue, onIssueClick }: IssuesListProps) {
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
      <Card>
        <CardHeader>
          <CardTitle>Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No issues found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issues ({issues.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full">
          <div className="space-y-6">
            {Object.entries(issuesByCategory).map(([category, categoryIssues]) => (
              <div key={category}>
                <h3 className="font-semibold text-sm mb-2">
                  {categoryLabels[category as Issue['category']]} ({categoryIssues.length})
                </h3>
                <div className="space-y-2">
                  {categoryIssues.map((issue, index) => (
                    <div key={`${issue.line_number}-${issue.category}-${index}`}>
                      <div
                        className={cn(
                          'p-3 rounded-md border cursor-pointer transition-colors',
                          selectedIssue === issue
                            ? 'bg-accent border-primary'
                            : 'hover:bg-accent/50 border-border'
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
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Line {issue.line_number}</span>
                            <Badge variant={getSeverityVariant(issue.severity)}>
                              {severityLabels[issue.severity]}
                            </Badge>
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
                  ))}
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
