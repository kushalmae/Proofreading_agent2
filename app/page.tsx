'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TextInput } from '@/components/TextInput';
import { TranscriptViewer } from '@/components/TranscriptViewer';
import { IssuesList } from '@/components/IssuesList';
import { IssueDetails } from '@/components/IssueDetails';
import { ExportButtons } from '@/components/ExportButtons';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Issue } from '@/types/proofread';

interface ProofreadResponse {
  issues: Issue[];
  totalLines: number;
}

interface ErrorResponse {
  error: string;
  max_lines?: number;
  max_chars?: number;
  current_lines?: number;
  current_chars?: number;
}

export default function Home() {
  const [transcript, setTranscript] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | undefined>();
  const [selectedLineNumber, setSelectedLineNumber] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProofread = async () => {
    if (!transcript.trim()) {
      setError('Please enter a transcript to proofread');
      return;
    }

    setLoading(true);
    setError(null);
    setIssues([]);
    setSelectedIssue(undefined);
    setSelectedLineNumber(undefined);

    try {
      const response = await fetch('/api/proofread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        setError(errorData.error || 'An error occurred during proofreading');
        return;
      }

      const data: ProofreadResponse = await response.json();
      setIssues(data.issues);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setSelectedLineNumber(issue.line_number);
  };

  const handleLineClick = (lineNumber: number) => {
    // Find the first issue on this line
    const lineIssue = issues.find((issue) => issue.line_number === lineNumber);
    if (lineIssue) {
      setSelectedIssue(lineIssue);
      setSelectedLineNumber(lineNumber);
    } else {
      setSelectedIssue(undefined);
      setSelectedLineNumber(lineNumber);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleProofread();
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Transcript Proofreading Agent</h1>
          <p className="text-muted-foreground">
            Verbatim-safe transcript proofreading tool. This tool never rewrites your transcript.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <TextInput
          value={transcript}
          onChange={setTranscript}
          disabled={loading}
        />

        <div className="flex justify-between items-center">
          <Button
            onClick={handleProofread}
            disabled={loading || !transcript.trim()}
            className="gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Proofreading...' : 'Proofread Transcript'}
          </Button>
          <ExportButtons issues={issues} />
        </div>

        {issues.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <TranscriptViewer
                transcript={transcript}
                issues={issues}
                selectedLineNumber={selectedLineNumber}
                onLineClick={handleLineClick}
              />
              <IssuesList
                issues={issues}
                selectedIssue={selectedIssue}
                onIssueClick={handleIssueClick}
              />
            </div>
            <div>
              <IssueDetails issue={selectedIssue} transcript={transcript} />
            </div>
          </div>
        )}

        {!loading && issues.length === 0 && transcript && !error && (
          <div className="text-center py-8 text-muted-foreground">
            Click &quot;Proofread Transcript&quot; to analyze your transcript
          </div>
        )}
      </div>
    </main>
  );
}
