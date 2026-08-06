
'use client';

import * as React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Post } from '@/lib/types';

const chartConfig = {
  visitors: {
    label: 'Visitors',
  },
  google: {
    label: 'Google',
    color: 'hsl(var(--chart-1))',
  },
  social: {
    label: 'Social',
    color: 'hsl(var(--chart-2))',
  },
  direct: {
    label: 'Direct',
    color: 'hsl(var(--chart-3))',
  },
  referral: {
    label: 'Referral',
    color: 'hsl(var(--chart-4))',
  },
  other: {
    label: 'Other',
    color: 'hsl(var(--chart-5))',
  },
} satisfies import('@/components/ui/chart').ChartConfig;


export default function TrafficChart({ posts }: { posts: Post[] }) {
    
  const chartData = React.useMemo(() => {
    if (!posts || posts.length === 0) {
      return [
        { source: "Google", visitors: 0, fill: "hsl(var(--chart-1))" },
        { source: "Social", visitors: 0, fill: "hsl(var(--chart-2))" },
        { source: "Direct", visitors: 0, fill: "hsl(var(--chart-3))" },
        { source: "Referral", visitors: 0, fill: "hsl(var(--chart-4))" },
        { source: "Other", visitors: 0, fill: "hsl(var(--chart-5))" },
      ];
    }
    
    // Simulate traffic sources based on post categories and views
    const trafficBySource: Record<string, number> = {
        Google: 0,
        Social: 0,
        Direct: 0,
        Referral: 0,
        Other: 0,
    };

    posts.forEach(post => {
        const views = post.views || 0;
        // Simple logic to distribute views among sources based on category
        switch (post.category.toLowerCase()) {
            case 'technology':
                trafficBySource['Google'] += views * 0.6;
                trafficBySource['Social'] += views * 0.2;
                trafficBySource['Referral'] += views * 0.1;
                trafficBySource['Direct'] += views * 0.1;
                break;
            case 'design':
                 trafficBySource['Social'] += views * 0.5;
                 trafficBySource['Direct'] += views * 0.3;
                 trafficBySource['Referral'] += views * 0.2;
                break;
            case 'business':
                 trafficBySource['Google'] += views * 0.4;
                 trafficBySource['Referral'] += views * 0.3;
                 trafficBySource['Direct'] += views * 0.3;
                break;
            default:
                 trafficBySource['Other'] += views;
                break;
        }
    });

    return [
      { source: "Google", visitors: Math.round(trafficBySource.Google), fill: "hsl(var(--chart-1))" },
      { source: "Social", visitors: Math.round(trafficBySource.Social), fill: "hsl(var(--chart-2))" },
      { source: "Direct", visitors: Math.round(trafficBySource.Direct), fill: "hsl(var(--chart-3))" },
      { source: "Referral", visitors: Math.round(trafficBySource.Referral), fill: "hsl(var(--chart-4))" },
      { source: "Other", visitors: Math.round(trafficBySource.Other), fill: "hsl(var(--chart-5))" },
    ];
  }, [posts]);


  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis
            dataKey="source"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
           <Tooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Bar dataKey="visitors" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
