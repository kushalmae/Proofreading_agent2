'use client';

import { Button } from '@/components/ui/button';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { exportToJSON, exportToCSV, downloadFile } from '@/lib/export';
import type { Issue } from '@/types/proofread';

interface ExportButtonsProps {
  issues: Issue[];
}

export function ExportButtons({ issues }: ExportButtonsProps) {
  const handleExportJSON = () => {
    const json = exportToJSON(issues);
    downloadFile(json, 'proofreading-issues.json', 'application/json');
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(issues);
    downloadFile(csv, 'proofreading-issues.csv', 'text/csv');
  };

  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleExportJSON}
        className="gap-2"
      >
        <FileJson className="h-4 w-4" />
        Export JSON
      </Button>
      <Button
        variant="outline"
        onClick={handleExportCSV}
        className="gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Export CSV
      </Button>
    </div>
  );
}
