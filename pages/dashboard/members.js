import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/Views/DashboardLayout';
import { Card, CardContent } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Label } from '@/components/UI/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/UI/Dialog';
import { Skeleton } from '@/components/UI/Skeleton';
import { useCompany } from '@/src/lib/CompanyContext';
import { withErrorBoundary } from '@/src/lib/withErrorBoundary';
import { Plus, Bot, User, Play } from 'lucide-react';

function MembersPage() {
  const { activeCompany } = useCompany();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [triggeringAgent, setTriggeringAgent] = useState(null);
  const [form, setForm] = useState({ name: '', role: '', type: 'human', adapterType: 'api-key', model: '', provider: 'anthropic', openclawUrl: '' });

  const fetchMembers = useCallback(async () => {
    if (!activeCompany) return;
    setIsLoading(true);
    const res = await fetch(`/api/board/members?companyId=${activeCompany._id}`);
    setMembers(await res.json());
    setIsLoading(false);
  }, [activeCompany]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!activeCompany || !form.name || !form.role) return;

    const payload = {
      companyId: activeCompany._id,
      name: form.name,
      role: form.role,
      type: form.type,
    };

    if (form.type === 'agent') {
      payload.adapterType = form.adapterType;
      if (form.adapterType === 'api-key') {
        payload.adapterConfig = {
          provider: form.provider || 'anthropic',
          model: form.model || 'claude-sonnet-4-20250514',
        };
      } else if (form.adapterType === 'claude-cli') {
        payload.adapterConfig = {
          model: form.model || 'claude-sonnet-4-20250514',
          maxTurns: 10,
        };
      } else if (form.adapterType === 'openclaw') {
        payload.adapterConfig = {
          url: form.openclawUrl || 'ws://127.0.0.1:18789',
          model: form.model || 'claude-sonnet-4-20250514',
        };
      }
    }

    await fetch('/api/board/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setForm({ name: '', role: '', type: 'human', adapterType: 'api-key', model: '', provider: 'anthropic', openclawUrl: '' });
    setCreateOpen(false);
    fetchMembers();
  }

  async function triggerHeartbeat(agentId) {
    setTriggeringAgent(agentId);
    await fetch(`/api/board/heartbeat/${agentId}`, { method: 'POST' });
    setTriggeringAgent(null);
    fetchMembers();
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Members — Crewbase</title>
      </Head>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Members</h1>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Member name"
                    required
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    placeholder="e.g. Engineer, Designer, QA Agent"
                    required
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="human">Human</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.type === 'agent' && (
                  <>
                    <div>
                      <Label>Adapter Type</Label>
                      <Select value={form.adapterType} onValueChange={(v) => setForm((f) => ({ ...f, adapterType: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="api-key">API Key (Vercel AI SDK)</SelectItem>
                          <SelectItem value="claude-cli">Claude CLI (Max subscription)</SelectItem>
                          <SelectItem value="openclaw">OpenClaw (WebSocket)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {form.adapterType === 'api-key' && (
                      <div>
                        <Label>Provider</Label>
                        <Select value={form.provider} onValueChange={(v) => setForm((f) => ({ ...f, provider: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="anthropic">Anthropic</SelectItem>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="google">Google</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label>Model</Label>
                      <Input
                        value={form.model}
                        onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                        placeholder="claude-sonnet-4-20250514"
                      />
                    </div>
                    {form.adapterType === 'openclaw' && (
                      <div>
                        <Label>OpenClaw URL</Label>
                        <Input
                          value={form.openclawUrl}
                          onChange={(e) => setForm((f) => ({ ...f, openclawUrl: e.target.value }))}
                          placeholder="ws://127.0.0.1:18789"
                        />
                      </div>
                    )}
                  </>
                )}
                <Button type="submit" className="w-full">Add Member</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {members.map((member) => (
            <Card key={member._id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                    {member.type === 'agent' ? (
                      <Bot className="h-4 w-4 text-indigo-400" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.type === 'agent' ? 'default' : 'secondary'}>
                    {member.type}
                  </Badge>
                  {member.type === 'agent' && (
                    <>
                      <Badge variant={member.status === 'running' ? 'default' : 'outline'}>
                        {member.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => triggerHeartbeat(member._id)}
                        disabled={triggeringAgent === member._id || member.status === 'running'}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        {triggeringAgent === member._id ? 'Running...' : 'Heartbeat'}
                      </Button>
                    </>
                  )}
                  {member.type === 'agent' && member.apiKey && (
                    <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {member.apiKey.slice(0, 12)}...
                    </code>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No members yet. Add your first team member.</p>
          )}
        </div>
      </div>
    </>
  );
}

const MembersWithErrorBoundary = withErrorBoundary(MembersPage);

MembersWithErrorBoundary.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default MembersWithErrorBoundary;
