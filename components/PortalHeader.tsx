'use client';

import { FileText, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PortalHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Proofreading Portal</h1>
            <p className="text-xs text-muted-foreground">Transcript Analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-muted-foreground">Verbatim-Safe</span>
        </div>
      </div>
    </header>
  );
}

