import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Injectable()
export class TimelineService {
  private readonly logger = new Logger(TimelineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an immutable activity event for a client.
   */
  async createActivityEvent(
    tenantId: string,
    clientId: string,
    userId: string,
    type: string,
    description: string,
    metadata?: Record<string, unknown>,
    policyId?: string,
  ) {
    const event = await this.prisma.tenantClient.activityEvent.create({
      data: {
        clientId,
        userId,
        type: type as any,
        description,
        metadata: metadata ?? undefined,
        policyId: policyId ?? undefined,
      } as any,
    });

    this.logger.debug(
      `Activity event created: ${type} for client ${clientId}`,
    );

    return event;
  }

  /**
   * Get the timeline for a client: activity events and notes merged,
   * sorted by createdAt descending with pagination.
   */
  async getTimeline(
    tenantId: string,
    clientId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const userSelect = { firstName: true, lastName: true };

    // Fetch events and notes in parallel
    const [events, notes, eventCount, noteCount] = await Promise.all([
      this.prisma.tenantClient.activityEvent.findMany({
        where: { clientId },
        include: { user: { select: userSelect } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenantClient.note.findMany({
        where: { clientId },
        include: { user: { select: userSelect } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activityEvent.count({
        where: { clientId, tenantId },
      }),
      this.prisma.note.count({
        where: { clientId, tenantId },
      }),
    ]);

    // Merge and sort by createdAt descending
    const merged = [
      ...events.map((e: any) => ({ ...e, kind: 'event' as const })),
      ...notes.map((n: any) => ({ ...n, kind: 'note' as const })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Apply pagination to merged list
    const total = eventCount + noteCount;
    const start = (page - 1) * limit;
    const data = merged.slice(start, start + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create an immutable note for a client, and log a timeline event.
   */
  async createNote(
    tenantId: string,
    clientId: string,
    userId: string,
    content: string,
  ) {
    const note = await this.prisma.tenantClient.note.create({
      data: {
        clientId,
        userId,
        content,
      } as any,
    });

    // Log activity event for the note
    await this.createActivityEvent(
      tenantId,
      clientId,
      userId,
      'note_added',
      'Added a note',
    );

    return note;
  }
}
