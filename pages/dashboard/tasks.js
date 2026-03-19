import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/Views/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Textarea } from '@/components/UI/Textarea';
import { Label } from '@/components/UI/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/UI/Dialog';
import { ScrollArea } from '@/components/UI/ScrollArea';
import { Skeleton } from '@/components/UI/Skeleton';
import { useCompany } from '@/src/lib/CompanyContext';
import { withErrorBoundary } from '@/src/lib/withErrorBoundary';
import { Plus, MessageSquare } from 'lucide-react';

const COLUMNS = [
  { key: 'todo', label: 'Todo', color: 'bg-slate-500' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { key: 'blocked', label: 'Blocked', color: 'bg-red-500' },
  { key: 'in_review', label: 'In Review', color: 'bg-yellow-500' },
  { key: 'done', label: 'Done', color: 'bg-green-500' },
];

const PRIORITY_COLORS = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

function TasksPage() {
  const { activeCompany } = useCompany();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', priority: 'medium', assigneeId: '' });

  const fetchData = useCallback(async () => {
    if (!activeCompany) return;
    setIsLoading(true);
    const [t, m] = await Promise.all([
      fetch(`/api/board/tasks?companyId=${activeCompany._id}`).then((r) => r.json()),
      fetch(`/api/board/members?companyId=${activeCompany._id}`).then((r) => r.json()),
    ]);
    setTasks(t);
    setMembers(m);
    setIsLoading(false);
  }, [activeCompany]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreateTask(e) {
    e.preventDefault();
    if (!activeCompany || !createForm.title) return;
    await fetch('/api/board/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: activeCompany._id,
        title: createForm.title,
        description: createForm.description,
        priority: createForm.priority,
        assigneeId: createForm.assigneeId || null,
      }),
    });
    setCreateForm({ title: '', description: '', priority: 'medium', assigneeId: '' });
    setCreateOpen(false);
    fetchData();
  }

  async function handleStatusChange(taskId, newStatus) {
    await fetch('/api/board/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _method: 'PATCH' }),
    });
    // Direct update via agent API workaround — use board tasks PATCH
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)));
  }

  async function openTaskDetail(task) {
    setSelectedTask(task);
    const res = await fetch(`/api/board/comments?taskId=${task._id}`);
    if (res.ok) {
      setComments(await res.json());
    } else {
      setComments([]);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Tasks — Crewbase</title>
      </Head>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={createForm.title}
                    onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Task title"
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Task description (markdown)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Select value={createForm.priority} onValueChange={(v) => setCreateForm((f) => ({ ...f, priority: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Assignee</Label>
                    <Select value={createForm.assigneeId} onValueChange={(v) => setCreateForm((f) => ({ ...f, assigneeId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m._id} value={m._id}>{m.name} ({m.type})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full">Create Task</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-5 gap-4 min-h-[600px]">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="flex flex-col">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`h-2 w-2 rounded-full ${col.color}`} />
                  <span className="text-sm font-medium">{col.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{columnTasks.length}</span>
                </div>
                <ScrollArea className="flex-1 rounded-lg border border-border bg-card/50 p-2">
                  <div className="space-y-2">
                    {columnTasks.map((task) => (
                      <Card
                        key={task._id}
                        className="cursor-pointer hover:border-accent transition-colors"
                        onClick={() => openTaskDetail(task)}
                      >
                        <CardContent className="p-3">
                          <p className="text-sm font-medium mb-2">{task.title}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[task.priority]}`}>
                              {task.priority}
                            </span>
                            {task.assigneeId && (
                              <span className="text-[10px] text-muted-foreground truncate">
                                {task.assigneeId.name || 'Assigned'}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {columnTasks.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-8">No tasks</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>

        {/* Task Detail Dialog */}
        <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
          <DialogContent className="max-w-2xl">
            {selectedTask && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedTask.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedTask.status === 'done' ? 'default' : 'secondary'}>
                      {selectedTask.status}
                    </Badge>
                    <span className={`text-xs px-2 py-0.5 rounded border ${PRIORITY_COLORS[selectedTask.priority]}`}>
                      {selectedTask.priority}
                    </span>
                  </div>
                  {selectedTask.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedTask.description}</p>
                  )}

                  {/* Move task */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Move to</Label>
                    <div className="flex gap-1 mt-1">
                      {COLUMNS.map((col) => (
                        <Button
                          key={col.key}
                          size="sm"
                          variant={selectedTask.status === col.key ? 'default' : 'outline'}
                          className="text-xs"
                          onClick={() => {
                            handleStatusChange(selectedTask._id, col.key);
                            setSelectedTask((t) => ({ ...t, status: col.key }));
                          }}
                        >
                          {col.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Comments */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm font-medium">Comments</span>
                    </div>
                    <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                      {comments.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No comments yet.</p>
                      ) : (
                        comments.map((c) => (
                          <div key={c._id} className="border border-border rounded p-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px]">{c.authorType}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

const TasksWithErrorBoundary = withErrorBoundary(TasksPage);

TasksWithErrorBoundary.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default TasksWithErrorBoundary;
