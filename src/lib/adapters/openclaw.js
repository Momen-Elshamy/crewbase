import WebSocket from 'ws';

function buildToolDefinitions(tools) {
  const defs = [];
  for (const [name, tool] of Object.entries(tools)) {
    defs.push({
      name,
      description: tool.description,
      input_schema: tool.parameters?._def
        ? { type: 'object', properties: tool.parameters._def }
        : { type: 'object', properties: {} },
    });
  }
  return defs;
}

function connectWebSocket(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.on('open', () => resolve(ws));
    ws.on('error', (err) => reject(err));
    setTimeout(() => reject(new Error('WebSocket connection timeout')), 30_000);
  });
}

function sendMessage(ws, message) {
  return new Promise((resolve, reject) => {
    ws.send(JSON.stringify(message), (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function run(agent, systemPrompt, tools) {
  const wsUrl = agent.adapterConfig?.url;
  if (!wsUrl) {
    throw new Error('OpenClaw adapter requires url in adapterConfig');
  }

  const model = agent.adapterConfig?.model || 'claude-sonnet-4-20250514';
  const toolDefs = buildToolDefinitions(tools);
  const ws = await connectWebSocket(wsUrl);

  try {
    // Send the initial prompt
    await sendMessage(ws, {
      type: 'prompt',
      model,
      system: systemPrompt,
      messages: [
        { role: 'user', content: 'Check your tasks and do your work. Use the tools available to you.' },
      ],
      tools: toolDefs,
    });

    // Process responses in a loop
    let finalResponse = '';

    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('OpenClaw response timeout'));
      }, 300_000); // 5 minute timeout

      ws.on('message', async (data) => {
        try {
          const msg = JSON.parse(data.toString());

          switch (msg.type) {
            case 'text':
              finalResponse += msg.content || '';
              break;

            case 'tool_use': {
              // Execute the tool locally and send results back
              const tool = tools[msg.name];
              if (!tool) {
                await sendMessage(ws, {
                  type: 'tool_result',
                  tool_use_id: msg.tool_use_id,
                  content: JSON.stringify({ error: `Unknown tool: ${msg.name}` }),
                });
                break;
              }
              try {
                const toolResult = await tool.execute(msg.input || {});
                await sendMessage(ws, {
                  type: 'tool_result',
                  tool_use_id: msg.tool_use_id,
                  content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
                });
              } catch (toolErr) {
                await sendMessage(ws, {
                  type: 'tool_result',
                  tool_use_id: msg.tool_use_id,
                  content: JSON.stringify({ error: toolErr.message }),
                });
              }
              break;
            }

            case 'done':
              clearTimeout(timeout);
              resolve(finalResponse);
              break;

            case 'error':
              clearTimeout(timeout);
              reject(new Error(msg.message || 'OpenClaw error'));
              break;

            default:
              // Ignore unknown message types
              break;
          }
        } catch (parseErr) {
          // Non-JSON message, ignore
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      ws.on('close', () => {
        clearTimeout(timeout);
        resolve(finalResponse);
      });
    });

    return {
      response: result || finalResponse,
      costCents: 0, // Cost tracking handled by OpenClaw gateway
    };
  } finally {
    ws.close();
  }
}
