'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { api } from '@/lib/api';

interface AgencyUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  deactivatedAt: string | null;
  createdAt: string;
}

interface AgencyDetailData {
  id: string;
  name: string;
  province: string | null;
  isSuspended: boolean;
  suspendedAt: string | null;
  userCap: number;
  storageCap: number;
  createdAt: string;
  updatedAt: string;
  users: AgencyUser[];
  _count: {
    clients: number;
    policies: number;
    tasks: number;
    documents: number;
    expenses: number;
  };
}

interface PolicySummary {
  byStatus: { status: string; count: number }[];
  byType: { type: string; count: number }[];
}

interface ActivityEvent {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  client: { firstName: string; lastName: string } | null;
}

interface ActivityResponse {
  events: ActivityEvent[];
  total: number;
  page: number;
  limit: number;
}

interface AgencyDetailTabsProps {
  agency: AgencyDetailData;
}

type Tab = 'overview' | 'users' | 'policies' | 'activity';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'policies', label: 'Policies Summary' },
  { id: 'activity', label: 'Activity Log' },
];

export function AgencyDetailTabs({ agency }: AgencyDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="mt-6">
      {/* Tab Headers */}
      <div className="flex gap-1 border-b border-[#334155]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'border-b-2 border-[#2563eb] text-white'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'overview' && <OverviewTab agency={agency} />}
        {activeTab === 'users' && <UsersTab users={agency.users} />}
        {activeTab === 'policies' && <PoliciesTab agencyId={agency.id} />}
        {activeTab === 'activity' && <ActivityTab agencyId={agency.id} />}
      </div>
    </div>
  );
}

// --- Overview Tab ---
function OverviewTab({ agency }: { agency: AgencyDetailData }) {
  const stats = [
    { label: 'Clients', value: agency._count.clients },
    { label: 'Policies', value: agency._count.policies },
    { label: 'Tasks', value: agency._count.tasks },
    { label: 'Documents', value: agency._count.documents },
    { label: 'Expenses', value: agency._count.expenses },
    { label: 'Users', value: agency.users.length },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-[#334155] bg-[#1e293b] p-4"
          >
            <p className="text-sm text-[#94a3b8]">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Agency Info */}
      <div className="rounded-lg border border-[#334155] bg-[#1e293b] p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#94a3b8]">
          Agency Information
        </h3>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-[#64748b]">Name</dt>
            <dd className="mt-1 text-sm text-white">{agency.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#64748b]">Province</dt>
            <dd className="mt-1 text-sm text-white">
              {agency.province ?? '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[#64748b]">User Cap</dt>
            <dd className="mt-1 text-sm text-white">{agency.userCap}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#64748b]">Storage Cap</dt>
            <dd className="mt-1 text-sm text-white">
              {agency.storageCap} MB
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[#64748b]">Created</dt>
            <dd className="mt-1 text-sm text-white">
              {format(new Date(agency.createdAt), 'PPP')}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[#64748b]">Last Updated</dt>
            <dd className="mt-1 text-sm text-white">
              {format(new Date(agency.updatedAt), 'PPP')}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

// --- Users Tab ---
function UsersTab({ users }: { users: AgencyUser[] }) {
  return (
    <div className="rounded-lg border border-[#334155] bg-[#1e293b]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#334155]">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
              Joined
            </th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-8 text-center text-[#94a3b8]"
              >
                No users found.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-[#334155] last:border-b-0"
              >
                <td className="px-4 py-3 text-white">
                  {user.firstName ?? ''} {user.lastName ?? ''}
                  {!user.firstName && !user.lastName && (
                    <span className="text-[#64748b]">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[#e2e8f0]">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-[#2563eb]/20 px-2.5 py-0.5 text-xs font-medium text-[#60a5fa]">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.isActive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#e2e8f0]">
                  {format(new Date(user.createdAt), 'MMM d, yyyy')}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// --- Policies Summary Tab ---
function PoliciesTab({ agencyId }: { agencyId: string }) {
  const [data, setData] = useState<PolicySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.get<PolicySummary>(
          `/admin/agencies/${agencyId}/policies-summary`,
        );
        setData(res);
      } catch (err) {
        console.error('Failed to fetch policies summary:', err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [agencyId]);

  if (loading) {
    return <p className="py-8 text-center text-[#94a3b8]">Loading...</p>;
  }

  if (!data) {
    return (
      <p className="py-8 text-center text-[#94a3b8]">
        Failed to load policies summary.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* By Status */}
      <div className="rounded-lg border border-[#334155] bg-[#1e293b] p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#94a3b8]">
          By Status
        </h3>
        {data.byStatus.length === 0 ? (
          <p className="text-sm text-[#64748b]">No policies found.</p>
        ) : (
          <div className="space-y-3">
            {data.byStatus.map((item) => (
              <div
                key={item.status}
                className="flex items-center justify-between"
              >
                <span className="text-sm capitalize text-[#e2e8f0]">
                  {item.status.toLowerCase().replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-semibold text-white">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* By Type */}
      <div className="rounded-lg border border-[#334155] bg-[#1e293b] p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#94a3b8]">
          By Type
        </h3>
        {data.byType.length === 0 ? (
          <p className="text-sm text-[#64748b]">No policies found.</p>
        ) : (
          <div className="space-y-3">
            {data.byType.map((item) => (
              <div
                key={item.type}
                className="flex items-center justify-between"
              >
                <span className="text-sm capitalize text-[#e2e8f0]">
                  {item.type.toLowerCase().replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-semibold text-white">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Activity Log Tab ---
function ActivityTab({ agencyId }: { agencyId: string }) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ActivityResponse>(
        `/admin/agencies/${agencyId}/activity?page=${page}&limit=${limit}`,
      );
      setEvents(res.events);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to fetch activity:', err);
    } finally {
      setLoading(false);
    }
  }, [agencyId, page]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const totalPages = Math.ceil(total / limit);

  if (loading && events.length === 0) {
    return <p className="py-8 text-center text-[#94a3b8]">Loading...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#334155] bg-[#1e293b]">
        {events.length === 0 ? (
          <p className="px-4 py-8 text-center text-[#94a3b8]">
            No activity events found.
          </p>
        ) : (
          <div className="divide-y divide-[#334155]">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-4 px-4 py-3">
                <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#2563eb]" />
                <div className="flex-1">
                  <p className="text-sm text-[#e2e8f0]">
                    {event.description}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[#64748b]">
                    <span>{format(new Date(event.createdAt), 'PPp')}</span>
                    {event.client && (
                      <>
                        <span>-</span>
                        <span>
                          {event.client.firstName} {event.client.lastName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className="flex-shrink-0 rounded bg-[#334155] px-2 py-0.5 text-xs text-[#94a3b8]">
                  {event.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#94a3b8]">
            Showing {(page - 1) * limit + 1} to{' '}
            {Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1 || loading}
              className="rounded-md border border-[#334155] px-3 py-1.5 text-sm text-[#e2e8f0] hover:bg-[#334155] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages || loading}
              className="rounded-md border border-[#334155] px-3 py-1.5 text-sm text-[#e2e8f0] hover:bg-[#334155] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
