import dbConnect from '@/src/DB/connection';
import Member from '@/src/DB/models/Member';
import Task from '@/src/DB/models/Task';
import Comment from '@/src/DB/models/Comment';
import Company from '@/src/DB/models/Company';
import Run from '@/src/DB/models/Run';
import { getAdapter } from '@/src/lib/adapters';
import { z } from 'zod';

export async function runHeartbeat(agent) {
  await dbConnect();

  await Member.updateOne({ _id: agent._id }, { $set: { status: 'running' } });

  const run = await Run.create({
    agentId: agent._id,
    status: 'running',
    startedAt: new Date(),
  });

  try {
    const company = await Company.findById(agent.companyId);
    const tasks = await Task.find({
      assigneeId: agent._id,
      isDeleted: false,
      status: { $in: ['todo', 'in_progress', 'blocked'] },
    });

    const systemPrompt = buildSystemPrompt(company, agent, tasks);

    const tools = {
      get_my_tasks: {
        description: 'Get all tasks assigned to you',
        parameters: z.object({}),
        execute: async () => {
          const myTasks = await Task.find({
            assigneeId: agent._id,
            isDeleted: false,
          }).lean();
          return JSON.stringify(myTasks);
        },
      },
      update_task: {
        description: 'Update a task status and optionally add a comment',
        parameters: z.object({
          taskId: z.string().describe('The task ID'),
          status: z.enum(['todo', 'in_progress', 'blocked', 'in_review', 'done', 'cancelled']).optional(),
          comment: z.string().optional(),
        }),
        execute: async ({ taskId, status, comment }) => {
          const update = {};
          if (status) {
            update.status = status;
            if (status === 'in_progress') update.startedAt = new Date();
            if (status === 'done') update.completedAt = new Date();
          }
          const task = await Task.findByIdAndUpdate(taskId, { $set: update }, { new: true });
          if (comment && task) {
            await Comment.create({
              taskId: task._id,
              authorId: agent._id,
              authorType: 'agent',
              body: comment,
            });
          }
          return JSON.stringify(task);
        },
      },
      create_task: {
        description: 'Create a new subtask (delegation)',
        parameters: z.object({
          title: z.string(),
          description: z.string().optional(),
          parentId: z.string().optional(),
          priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
        }),
        execute: async ({ title, description, parentId, priority }) => {
          const task = await Task.create({
            companyId: agent.companyId,
            title,
            description: description || '',
            assigneeId: agent._id,
            parentId: parentId || null,
            priority: priority || 'medium',
          });
          return JSON.stringify(task);
        },
      },
      post_comment: {
        description: 'Post a comment on a task',
        parameters: z.object({
          taskId: z.string().describe('The task ID'),
          body: z.string().describe('The comment body'),
        }),
        execute: async ({ taskId, body }) => {
          const comment = await Comment.create({
            taskId,
            authorId: agent._id,
            authorType: 'agent',
            body,
          });
          return JSON.stringify(comment);
        },
      },
    };

    // Use the adapter registry to run the appropriate adapter
    const adapterRun = getAdapter(agent.adapterType);
    const { response, costCents } = await adapterRun(agent, systemPrompt, tools);

    await Run.updateOne(
      { _id: run._id },
      {
        $set: {
          status: 'done',
          log: response,
          costCents,
          finishedAt: new Date(),
        },
      }
    );

    if (tasks.length > 0) {
      await Run.updateOne({ _id: run._id }, { $set: { taskId: tasks[0]._id } });
    }
  } catch (error) {
    await Run.updateOne(
      { _id: run._id },
      {
        $set: {
          status: 'failed',
          log: error.message || 'Unknown error',
          finishedAt: new Date(),
        },
      }
    );
  } finally {
    await Member.updateOne({ _id: agent._id }, { $set: { status: 'idle' } });
  }

  return Run.findById(run._id).lean();
}

function buildSystemPrompt(company, agent, tasks) {
  const taskList = tasks
    .map((t) => `- [${t.status}] ${t.title} (ID: ${t._id}, Priority: ${t.priority})`)
    .join('\n');

  return `You are ${agent.name}, a ${agent.role} at ${company?.name || 'the company'}.
Company mission: ${company?.mission || 'N/A'}

Your skills: ${agent.skills?.join(', ') || 'general'}
Your rules: ${agent.rules?.join(', ') || 'none'}

Current assigned tasks:
${taskList || 'No tasks assigned.'}

Instructions:
1. Review your assigned tasks
2. Work on in_progress tasks first, then todo tasks
3. Update task status as you work
4. Post comments to communicate progress
5. If blocked, update the task status to blocked with a comment explaining why`;
}
