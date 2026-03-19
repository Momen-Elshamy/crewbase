import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

function buildToolFlags(tools) {
  const flags = [];
  for (const [name, tool] of Object.entries(tools)) {
    // Build a JSON tool definition for the --tool flag
    // Format: name:description:json_schema
    const schema = tool.parameters?._def
      ? JSON.stringify(tool.parameters._def)
      : '{}';
    flags.push('--tool', `${name}: ${tool.description}`);
  }
  return flags;
}

function buildAllowedTools(tools) {
  return Object.keys(tools).join(',');
}

export async function run(agent, systemPrompt, tools) {
  const model = agent.adapterConfig?.model || 'claude-sonnet-4-20250514';
  const maxTurns = agent.adapterConfig?.maxTurns || 10;

  const prompt = `${systemPrompt}\n\nCheck your tasks and do your work. Use the tools available to you.`;

  const args = [
    '--print',
    '--model', model,
    '--max-turns', String(maxTurns),
  ];

  // Add allowed tools if defined
  const allowedTools = buildAllowedTools(tools);
  if (allowedTools) {
    args.push('--allowedTools', allowedTools);
  }

  const { stdout, stderr } = await execFileAsync('claude', args, {
    input: prompt,
    timeout: 300_000, // 5 minute timeout
    maxBuffer: 10 * 1024 * 1024, // 10MB
    env: {
      ...process.env,
      // Pass through any env vars the CLI might need
    },
  });

  if (stderr) {
    console.warn('[claude-cli adapter] stderr:', stderr);
  }

  return {
    response: stdout || '',
    costCents: 0, // Subscription-based, no per-call cost
  };
}
