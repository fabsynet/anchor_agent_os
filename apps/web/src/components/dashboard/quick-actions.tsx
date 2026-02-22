'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  UserPlus,
  ListPlus,
  ShieldPlus,
  Receipt,
} from 'lucide-react';

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: 'Add Client',
      icon: UserPlus,
      onClick: () => router.push('/clients?action=create'),
    },
    {
      label: 'Add Task',
      icon: ListPlus,
      onClick: () => router.push('/tasks?action=create'),
    },
    {
      label: 'Add Policy',
      icon: ShieldPlus,
      onClick: () => router.push('/policies?action=create'),
    },
    {
      label: 'Add Expense',
      icon: Receipt,
      onClick: () => router.push('/expenses'),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          className="h-auto py-3 flex flex-col gap-1.5 items-center justify-center"
          onClick={action.onClick}
        >
          <action.icon className="size-5" />
          <span className="text-sm">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}
