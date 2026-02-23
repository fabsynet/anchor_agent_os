import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { TimelineService } from '../timeline/timeline.service.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';
import { SearchClientsDto } from './dto/search-clients.dto.js';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly timelineService: TimelineService,
  ) {}

  /**
   * Create a new client or lead.
   */
  async create(tenantId: string, userId: string, dto: CreateClientDto) {
    const client = await this.prisma.tenantClient.client.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        status: dto.status,
        address: dto.address ?? null,
        city: dto.city ?? null,
        province: dto.province ?? null,
        postalCode: dto.postalCode ?? null,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        createdById: userId,
      } as any,
    });

    this.logger.log(
      `Client created: ${client.id} (${dto.status}) by user ${userId}`,
    );

    // Log activity event
    await this.timelineService.createActivityEvent(
      tenantId,
      client.id,
      userId,
      'client_created',
      `Created ${dto.status}: ${dto.firstName} ${dto.lastName}`,
    );

    return client;
  }

  /**
   * List clients with search, status filter, and pagination.
   */
  async findAll(tenantId: string, query: SearchClientsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Record<string, unknown> = {};

    // Status filter
    if (query.status) {
      where.status = query.status;
    }

    // Text search across name, email, and phone
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [clients, total] = await Promise.all([
      (this.prisma.tenantClient as any).client.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: {
          _count: { select: { policies: true, documents: true } },
          policies: {
            select: { endDate: true, status: true },
          },
        },
      }),
      this.prisma.client.count({ where: { ...where, tenantId } }),
    ]);

    // Map results to include policyCount and nextRenewalDate
    const data = clients.map((client: any) => {
      const policyCount = client._count?.policies ?? 0;
      const documentCount = client._count?.documents ?? 0;

      // Find the nearest future endDate among active or pending_renewal policies
      const now = new Date();
      const renewalDates = (client.policies ?? [])
        .filter(
          (p: any) =>
            p.endDate &&
            (p.status === 'active' || p.status === 'pending_renewal') &&
            new Date(p.endDate) >= now,
        )
        .map((p: any) => new Date(p.endDate))
        .sort((a: Date, b: Date) => a.getTime() - b.getTime());

      const nextRenewalDate =
        renewalDates.length > 0 ? renewalDates[0].toISOString() : null;

      // Remove internal fields from response
      const { _count, policies, ...rest } = client;
      return { ...rest, policyCount, documentCount, nextRenewalDate };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single client by ID with related data.
   */
  async findOne(tenantId: string, id: string) {
    const client = await this.prisma.tenantClient.client.findFirst({
      where: { id },
      include: {
        policies: true,
        _count: {
          select: {
            policies: true,
            notes: true,
            activityEvents: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }

    return client;
  }

  /**
   * Update a client.
   */
  async update(
    tenantId: string,
    id: string,
    userId: string,
    dto: UpdateClientDto,
  ) {
    const existing = await this.prisma.tenantClient.client.findFirst({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Client ${id} not found`);
    }

    // Build update data, only including provided fields
    const updateData: Record<string, unknown> = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.province !== undefined) updateData.province = dto.province;
    if (dto.postalCode !== undefined) updateData.postalCode = dto.postalCode;
    if (dto.dateOfBirth !== undefined) {
      updateData.dateOfBirth = dto.dateOfBirth
        ? new Date(dto.dateOfBirth)
        : null;
    }

    const updated = await this.prisma.tenantClient.client.update({
      where: { id },
      data: updateData as any,
    });

    // Log activity event with changed fields
    await this.timelineService.createActivityEvent(
      tenantId,
      id,
      userId,
      'client_updated',
      `Updated client: ${existing.firstName} ${existing.lastName}`,
      { changedFields: Object.keys(updateData) },
    );

    return updated;
  }

  /**
   * Delete a client and cascade to policies, activity events, notes.
   */
  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.tenantClient.client.findFirst({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Client ${id} not found`);
    }

    await this.prisma.tenantClient.client.delete({
      where: { id },
    });

    return { deleted: true, id };
  }

  /**
   * Toggle client status between 'lead' and 'client'.
   * Converting to 'client' requires all contact fields to be present.
   */
  async convert(tenantId: string, userId: string, id: string) {
    const client = await this.prisma.tenantClient.client.findFirst({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }

    const currentStatus = client.status;
    const newStatus = currentStatus === 'lead' ? 'client' : 'lead';

    // Validate required fields when converting to 'client'
    if (newStatus === 'client') {
      const missingFields: string[] = [];
      if (!client.email) missingFields.push('email');
      if (!client.phone) missingFields.push('phone');
      if (!client.address) missingFields.push('address');
      if (!client.city) missingFields.push('city');
      if (!client.province) missingFields.push('province');
      if (!client.postalCode) missingFields.push('postalCode');

      if (missingFields.length > 0) {
        throw new BadRequestException(
          `Cannot convert to client. Missing required fields: ${missingFields.join(', ')}`,
        );
      }
    }

    const updated = await this.prisma.tenantClient.client.update({
      where: { id },
      data: { status: newStatus },
    });

    this.logger.log(
      `Client ${id} status changed from ${currentStatus} to ${newStatus} by user ${userId}`,
    );

    // Log activity event
    await this.timelineService.createActivityEvent(
      tenantId,
      id,
      userId,
      'client_status_changed',
      `Status changed from ${currentStatus} to ${newStatus}`,
      { from: currentStatus, to: newStatus },
    );

    return updated;
  }
}
