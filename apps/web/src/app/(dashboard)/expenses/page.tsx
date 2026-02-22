import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Receipt } from 'lucide-react';

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground">
          Track and manage agency expenses
        </p>
      </div>

      <Card className="max-w-lg mx-auto text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
            <Receipt className="size-6 text-muted-foreground" />
          </div>
          <CardTitle>Expense Tracking Coming Soon</CardTitle>
          <CardDescription>
            Expense management will be available in a future update. You will be
            able to log, categorize, and report on agency expenses here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Phase 5 feature -- check back soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
