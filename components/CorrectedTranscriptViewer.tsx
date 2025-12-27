'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download } from 'lucide-react';
import { downloadFile } from '@/lib/export';

interface CorrectedTranscriptViewerProps {
  originalTranscript: string;
  correctedTranscript: string;
  acceptedCount: number;
}

export function CorrectedTranscriptViewer({
  originalTranscript,
  correctedTranscript,
  acceptedCount,
}: CorrectedTranscriptViewerProps) {
  if (acceptedCount === 0) return null;

  const originalLines = originalTranscript.split('\n');
  const correctedLines = correctedTranscript.split('\n');

  return (
    <Card className="border-2 shadow-lg border-green-500/20">
      <CardHeader className="bg-green-50 dark:bg-green-950/20 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle className="text-xl">Corrected Transcript</CardTitle>
          </div>
          <CardDescription className="text-sm font-medium">
            {acceptedCount} {acceptedCount === 1 ? 'fix applied' : 'fixes applied'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] w-full">
          <div className="font-mono text-sm p-6">
            {correctedLines.map((line, index) => {
              const isChanged = line !== originalLines[index];
              return (
                <div
                  key={index}
                  className={`
                    flex gap-4 px-4 py-2 border-l-4
                    ${isChanged 
                      ? 'border-l-green-500 bg-green-50 dark:bg-green-950/20' 
                      : 'border-l-transparent'
                    }
                  `}
                >
                  <span className="text-muted-foreground select-none w-12 text-right shrink-0">
                    {index + 1}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-words">
                    {line || '\u00A0'}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-end border-t bg-muted/30">
        <Button
          variant="outline"
          onClick={() => downloadFile(correctedTranscript, 'corrected-transcript.txt', 'text/plain')}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download Corrected Transcript
        </Button>
      </CardFooter>
    </Card>
  );
}

