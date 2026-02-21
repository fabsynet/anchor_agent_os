"use client";

import { Card, CardContent } from "@/components/ui/card";

interface ClientTimelineTabProps {
  clientId: string;
}

export function ClientTimelineTab({ clientId }: ClientTimelineTabProps) {
  return (
    <Card>
      <CardContent className="py-10 text-center text-muted-foreground">
        Timeline loading...
      </CardContent>
    </Card>
  );
}
