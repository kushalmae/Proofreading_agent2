'use client';

import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TextInput({ value, onChange, disabled }: TextInputProps) {
  const lines = value.split('\n').length;
  const chars = value.length;
  const maxLines = 1000;
  const maxChars = 120000;

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-muted/30 border-b">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">Transcript Input</CardTitle>
        </div>
        <CardDescription className="text-base">
          Paste your transcript text here. Our tool preserves your original text verbatim.
        </CardDescription>
        <div className="flex gap-4 text-sm text-muted-foreground pt-2">
          <span>Lines: {lines.toLocaleString()} / {maxLines.toLocaleString()}</span>
          <span>Characters: {chars.toLocaleString()} / {maxChars.toLocaleString()}</span>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Paste your transcript here...&#10;&#10;Example:&#10;Q: Can you state your name?&#10;A: Yes, my name is John Smith.&#10;Q: Thank you."
          className="min-h-[400px] font-mono text-sm border-2 focus-visible:ring-2 focus-visible:ring-primary"
        />
      </CardContent>
    </Card>
  );
}
