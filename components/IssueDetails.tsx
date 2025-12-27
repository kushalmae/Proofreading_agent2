'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import type { Issue } from '@/types/proofread';
import { getIssueId } from '@/lib/applyFixes';

interface IssueDetailsProps {
  issue?: Issue;
  transcript: string;
  acceptedIssueIds?: Set<string>;
  onAccept?: (issue: Issue) => void;
  onReject?: (issue: Issue) => void;
  disabled?: boolean;
}

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

export function IssueDetails({ 
  issue, 
  transcript, 
  acceptedIssueIds = new Set(),
  onAccept,
  onReject,
  disabled = false
}: IssueDetailsProps) {
  if (!issue) {
    return (
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-xl">Issue Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm font-medium">
              Select an issue to view details
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Click on any issue from the list to see more information
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const lines = transcript.split('\n');
  const lineText = lines[issue.line_number - 1] || '';

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

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-muted/30 border-b">
        <CardTitle className="text-xl">Issue Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Line {issue.line_number}</span>
          <Badge variant={getSeverityVariant(issue.severity)}>
            {severityLabels[issue.severity]}
          </Badge>
          <Badge variant="outline">{categoryLabels[issue.category]}</Badge>
          <Badge variant="outline">{(issue.confidence * 100).toFixed(0)}% confidence</Badge>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-semibold mb-2">Description</h4>
          <p className="text-sm text-foreground">{issue.description}</p>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-semibold mb-2">Original Line</h4>
          <div className="p-3 bg-muted rounded-md font-mono text-sm">
            {lineText || '\u00A0'}
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-semibold mb-2">Suggested Fix</h4>
          <p className="text-sm text-foreground">{issue.suggested_fix}</p>
        </div>

        {acceptedIssueIds.has(getIssueId(issue)) && (
          <>
            <Separator />
            <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">Fix accepted</span>
            </div>
          </>
        )}
      </CardContent>
      {(onAccept || onReject) && !acceptedIssueIds.has(getIssueId(issue)) && (
        <CardFooter className="flex gap-2 pt-4 border-t">
          {onAccept && (
            <Button
              onClick={() => onAccept(issue)}
              className="flex-1 gap-2"
              size="sm"
              disabled={disabled}
            >
              <Check className="h-4 w-4" />
              {disabled ? 'Applying...' : 'Accept Fix'}
            </Button>
          )}
          {onReject && (
            <Button
              onClick={() => onReject(issue)}
              variant="outline"
              className="flex-1 gap-2"
              size="sm"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
              {disabled ? 'Applying...' : 'Dismiss'}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
