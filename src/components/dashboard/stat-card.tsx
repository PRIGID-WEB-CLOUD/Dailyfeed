
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { StatCard as StatCardType } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function StatCard({
  title,
  value,
  change,
  changeType,
  icon,
}: StatCardType) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p
          className={cn(
            'text-xs text-muted-foreground',
            changeType === 'increase'
              ? 'text-success'
              : 'text-destructive'
          )}
        >
          {change}
        </p>
      </CardContent>
    </Card>
  );
}
