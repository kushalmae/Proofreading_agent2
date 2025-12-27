'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Issue } from '@/types/proofread';

interface IssueDetailsProps {
  issue?: Issue;
  transcript: string;
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

export function IssueDetails({ issue, transcript }: IssueDetailsProps) {
  if (!issue) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Issue Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Select an issue to view details
          </p>
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
    <Card>
      <CardHeader>
        <CardTitle>Issue Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
}
