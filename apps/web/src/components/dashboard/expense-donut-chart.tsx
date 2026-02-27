'use client';

import { PieChart, Pie, Cell, Label, ResponsiveContainer, Tooltip } from 'recharts';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface ChartDataItem {
  name: string;
  value: number;
}

interface ExpenseDonutChartProps {
  data: ChartDataItem[];
  total: number;
}

function CustomTooltipContent({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
        <p className="font-medium capitalize">
          {item.name.replace(/_/g, ' ')}
        </p>
        <p className="text-muted-foreground">
          {currencyFormatter.format(item.value)}
        </p>
      </div>
    );
  }
  return null;
}

export function ExpenseDonutChart({ data, total }: ExpenseDonutChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No expense data this month
        </p>
      </div>
    );
  }

  // Format category names for display
  const chartData = data.map((item) => ({
    ...item,
    name: item.name.replace(/_/g, ' '),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              stroke="transparent"
            />
          ))}
          <Label
            content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) - 6}
                      className="fill-foreground text-lg font-bold"
                    >
                      {currencyFormatter.format(total)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 14}
                      className="fill-muted-foreground text-xs"
                    >
                      Total Spent
                    </tspan>
                  </text>
                );
              }
              return null;
            }}
          />
        </Pie>
        <Tooltip content={<CustomTooltipContent />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
