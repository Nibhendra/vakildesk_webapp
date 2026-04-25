import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'vakildesk-mcp',
  version: '1.0.0',
});

server.tool('get_app_status', 'Returns basic VakilDesk integration status for MCP clients.', {}, async () => {
  const configured = Boolean(process.env.V0_API_KEY);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            app: 'VakilDesk Web',
            status: 'ready',
            v0Configured: configured,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        ),
      },
    ],
  };
});

server.tool(
  'draft_case_summary',
  'Builds a concise case summary from structured case metadata.',
  {
    title: z.string().min(1),
    caseNumber: z.string().min(1),
    court: z.string().min(1),
    nextHearingDate: z.string().min(1),
    totalFees: z.number().nonnegative(),
    feesPaid: z.number().nonnegative(),
  },
  async ({ title, caseNumber, court, nextHearingDate, totalFees, feesPaid }) => {
    const outstanding = Math.max(totalFees - feesPaid, 0);
    const summary = [
      `Case: ${title}`,
      `Case Number: ${caseNumber}`,
      `Court: ${court}`,
      `Next Hearing: ${nextHearingDate}`,
      `Financials: Total \u20b9${totalFees.toLocaleString('en-IN')} | Paid \u20b9${feesPaid.toLocaleString('en-IN')} | Due \u20b9${outstanding.toLocaleString('en-IN')}`,
    ].join('\n');

    return {
      content: [
        {
          type: 'text',
          text: summary,
        },
      ],
    };
  }
);

server.tool(
  'create_v0_ui_prompt',
  'Creates a richer prompt for v0 to generate legal dashboard UI blocks.',
  {
    goal: z.string().min(5),
    screen: z.string().default('dashboard'),
  },
  async ({ goal, screen }) => {
    const prompt = [
      'Build a React + Tailwind UI component for VakilDesk.',
      `Screen: ${screen}`,
      `Goal: ${goal}`,
      'Constraints: legal-tech aesthetic, responsive layout, clear hierarchy, accessible labels, and realistic placeholder content for Indian legal practice.',
    ].join('\n');

    return {
      content: [{ type: 'text', text: prompt }],
    };
  }
);

async function start() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

start().catch((error) => {
  console.error('[vakildesk-mcp] failed to start', error);
  process.exit(1);
});
