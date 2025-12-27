'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TextInput } from '@/components/TextInput';
import { TranscriptViewer } from '@/components/TranscriptViewer';
import { CorrectedTranscriptViewer } from '@/components/CorrectedTranscriptViewer';
import { IssuesList } from '@/components/IssuesList';
import { IssueDetails } from '@/components/IssueDetails';
import { ExportButtons } from '@/components/ExportButtons';
import { PortalHeader } from '@/components/PortalHeader';
import { PortalStats } from '@/components/PortalStats';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import type { Issue } from '@/types/proofread';
import { getIssueId, applyFixesToTranscript } from '@/lib/applyFixes';

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
  const [originalTranscript, setOriginalTranscript] = useState(''); // Store original when proofreading starts
  const [correctedTranscript, setCorrectedTranscript] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [acceptedIssueIds, setAcceptedIssueIds] = useState<Set<string>>(new Set());
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
    setAcceptedIssueIds(new Set());
    setCorrectedTranscript('');
    setOriginalTranscript(transcript); // Store original transcript
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

  const handleAcceptFix = (issue: Issue) => {
    const newAccepted = new Set(acceptedIssueIds);
    newAccepted.add(getIssueId(issue));
    setAcceptedIssueIds(newAccepted);
    
    // Apply fix to corrected transcript (always use original transcript as base)
    const baseTranscript = originalTranscript || transcript;
    const corrected = applyFixesToTranscript(
      baseTranscript,
      issues,
      newAccepted
    );
    setCorrectedTranscript(corrected);
  };

  const handleRejectFix = (issue: Issue) => {
    const newAccepted = new Set(acceptedIssueIds);
    newAccepted.delete(getIssueId(issue));
    setAcceptedIssueIds(newAccepted);
    
    // Reapply remaining accepted fixes (always use original transcript as base)
    const baseTranscript = originalTranscript || transcript;
    if (newAccepted.size === 0) {
      setCorrectedTranscript('');
    } else {
      const corrected = applyFixesToTranscript(
        baseTranscript,
        issues,
        newAccepted
      );
      setCorrectedTranscript(corrected);
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

  const totalLines = transcript ? transcript.split('\n').length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <PortalHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Transcript Proofreading
              </h1>
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Upload your transcript for analysis. Our verbatim-safe tool detects issues without modifying your original text.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="border-2">
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

          {/* Input Section */}
          <div className="space-y-4">
            <TextInput
              value={transcript}
              onChange={setTranscript}
              disabled={loading}
            />

            <div className="flex justify-between items-center flex-wrap gap-4">
              <Button
                onClick={handleProofread}
                disabled={loading || !transcript.trim()}
                className="gap-2 h-11 px-6 text-base font-semibold"
                size="lg"
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                {loading ? 'Analyzing Transcript...' : 'Analyze Transcript'}
              </Button>
              {issues.length > 0 && <ExportButtons issues={issues} />}
            </div>
          </div>

          {/* Stats Dashboard */}
          {issues.length > 0 && transcript && (
            <PortalStats
              totalLines={totalLines}
              issues={issues}
              transcriptLength={transcript.length}
            />
          )}

          {/* Results Section */}
          {issues.length > 0 && (
            <div className="space-y-6">
              {/* Corrected Transcript View */}
              {acceptedIssueIds.size > 0 && correctedTranscript && (
                <CorrectedTranscriptViewer
                  originalTranscript={originalTranscript || transcript}
                  correctedTranscript={correctedTranscript}
                  acceptedCount={acceptedIssueIds.size}
                  issues={issues}
                  acceptedIssueIds={acceptedIssueIds}
                />
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <TranscriptViewer
                    transcript={originalTranscript || transcript}
                    issues={issues}
                    selectedLineNumber={selectedLineNumber}
                    onLineClick={handleLineClick}
                  />
                  <IssuesList
                    issues={issues}
                    selectedIssue={selectedIssue}
                    onIssueClick={handleIssueClick}
                    acceptedIssueIds={acceptedIssueIds}
                  />
                </div>
                <div className="lg:sticky lg:top-20 lg:h-fit">
                  <IssueDetails 
                    issue={selectedIssue} 
                    transcript={originalTranscript || transcript}
                    acceptedIssueIds={acceptedIssueIds}
                    onAccept={handleAcceptFix}
                    onReject={handleRejectFix}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && issues.length === 0 && transcript && !error && (
            <div className="text-center py-12 px-4 rounded-lg border-2 border-dashed bg-muted/30">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">
                Ready to analyze
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Click &quot;Analyze Transcript&quot; to detect issues in your transcript
              </p>
            </div>
          )}

          {/* Initial State */}
          {!transcript && !loading && (
            <div className="text-center py-16 px-4 rounded-lg border-2 border-dashed bg-muted/30">
              <Sparkles className="h-16 w-16 mx-auto mb-6 text-primary/50" />
              <h2 className="text-2xl font-semibold mb-2">Get Started</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Paste your transcript above to begin proofreading. Our AI will detect punctuation, capitalization, spelling, and formatting issues.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
