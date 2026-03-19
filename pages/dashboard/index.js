import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/Views/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Skeleton } from '@/components/UI/Skeleton';
import { useCompany } from '@/src/lib/CompanyContext';
import { withErrorBoundary } from '@/src/lib/withErrorBoundary';
import { CheckSquare, Users, Activity, AlertCircle } from 'lucide-react';

function DashboardPage() {
  const { activeCompany, isLoading: companyLoading } = useCompany();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [runs, setRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeCompany) return;
    Promise.all([
      fetch(`/api/board/tasks?companyId=${activeCompany._id}`).then((r) => r.json()),
      fetch(`/api/board/members?companyId=${activeCompany._id}`).then((r) => r.json()),
      fetch('/api/board/runs?limit=10').then((r) => r.json()),
    ])
      .then(([t, m, r]) => {
        setTasks(t);
        setMembers(m);
        setRuns(r);
      })
      .finally(() => setIsLoading(false));
  }, [activeCompany]);

  if (companyLoading || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No company found. Create one to get started.</p>
      </div>
    );
  }

  const statusCounts = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  const agentMembers = members.filter((m) => m.type === 'agent');
  const activeAgents = agentMembers.filter((m) => m.status === 'running');

  return (
    <>
      <Head>
        <title>Dashboard — Crewbase</title>
      </Head>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <p className="text-xs text-muted-foreground">{statusCounts.in_progress} in progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Blocked</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.blocked}</div>
              <p className="text-xs text-muted-foreground">needs attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
              <p className="text-xs text-muted-foreground">{agentMembers.length} agents</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAgents.length}</div>
              <p className="text-xs text-muted-foreground">of {agentMembers.length} total</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Runs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Runs</CardTitle>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No heartbeat runs yet.</p>
            ) : (
              <div className="space-y-2">
                {runs.map((run) => (
                  <div key={run._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <Badge variant={run.status === 'done' ? 'default' : run.status === 'failed' ? 'destructive' : 'secondary'}>
                        {run.status}
                      </Badge>
                      <span className="text-sm">{run.agentId?.name || 'Unknown Agent'}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {run.costCents > 0 && `$${(run.costCents / 100).toFixed(2)} · `}
                      {new Date(run.startedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

const DashboardWithErrorBoundary = withErrorBoundary(DashboardPage);

DashboardWithErrorBoundary.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default DashboardWithErrorBoundary;
