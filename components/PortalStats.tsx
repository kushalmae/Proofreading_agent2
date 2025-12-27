'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FileText, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { Issue } from '@/types/proofread';

interface PortalStatsProps {
  totalLines: number;
  issues: Issue[];
  transcriptLength: number;
}

export function PortalStats({ totalLines, issues, transcriptLength }: PortalStatsProps) {
  const blockingCount = issues.filter(i => i.severity === 'blocking').length;
  const reviewCount = issues.filter(i => i.severity === 'review').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  const stats = [
    {
      label: 'Total Lines',
      value: totalLines.toLocaleString(),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      label: 'Blocking Issues',
      value: blockingCount.toString(),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
    },
    {
      label: 'Review Items',
      value: reviewCount.toString(),
      icon: CheckCircle2,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    },
    {
      label: 'Info Items',
      value: infoCount.toString(),
      icon: Info,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
  ];

  if (totalLines === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={stat.bgColor + ' p-2 rounded-lg'}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

