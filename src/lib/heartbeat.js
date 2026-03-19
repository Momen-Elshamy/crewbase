import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import dbConnect from '@/src/DB/connection';
import Member from '@/src/DB/models/Member';
import Task from '@/src/DB/models/Task';
import Comment from '@/src/DB/models/Comment';
import Company from '@/src/DB/models/Company';
import Run from '@/src/DB/models/Run';
import { z } from 'zod';

function getProvider(providerName, modelId) {
  switch (providerName) {
    case 'openai': {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      return openai(modelId);
    }
    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
      return google(modelId);
    }
    case 'anthropic':
    default: {
      const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      return anthropic(modelId || 'claude-sonnet-4-20250514');
    }
  }
}

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

    const providerName = agent.adapterConfig?.provider || 'anthropic';
    const modelId = agent.adapterConfig?.model || 'claude-sonnet-4-20250514';
    const model = getProvider(providerName, modelId);

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

    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: 'Check your tasks and do your work. Use the tools available to you.',
      tools,
      maxSteps: 10,
    });

    const log = result.text || '';
    const estimatedCost = estimateCost(result);

    await Run.updateOne(
      { _id: run._id },
      {
        $set: {
          status: 'done',
          log,
          costCents: estimatedCost,
          finishedAt: new Date(),
        },
      }
    );

    // Find the first task the agent worked on for the run record
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

function estimateCost(result) {
  const inputTokens = result.usage?.promptTokens || 0;
  const outputTokens = result.usage?.completionTokens || 0;
  // Rough estimate: $3/1M input, $15/1M output for Sonnet
  const cost = (inputTokens * 3 + outputTokens * 15) / 1_000_000;
  return Math.round(cost * 100);
}
