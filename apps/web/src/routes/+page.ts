import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params }) => {
  return {
    workflows: [
      /*
      {
        title: 'Hello World - Generate Text',
        description: 'This demostrate how to use LLM generate Text functionality. Basically one shot with no interation.',
        workflowType: 'prompt',
        prompt: "What's the deal with airline food?"
      },
      */
      {
        title: 'Hello World',
        description: 'This demostrate how to use LLM generate Text functionality. Basically one shot with no interation.',
        workflowType: 'promptStreaming',
        prompt: "What's the deal with airline food?"
      },
      /*
      {
        title: 'Tool Calling - Simple',
        description: '',
        workflowType: 'toolCalling',
        prompt: 'What is the weather in San Francisco and what should I do?'
      },
      {
        title: 'Tool Calling - Parallel',
        description: '',
        workflowType: 'parallelToolCalling',
        prompt: 'What is the weather in Paris and New York?'
      },
      */
      {
        title: 'Tool Calling - Simple',
        description: 'Demostrate tooling calling, but with streaming.',
        workflowType: 'toolCallingStreaming',
        prompt: 'What is the weather in San Francisco and what should I do?'
      },
      {
        title: 'Tool Calling - MCP Stido',
        description: 'Demostrate tooling calling with MCP',
        workflowType: 'stdio',
        prompt: 'Which Pokemon could best defeat Feebas? Choose one and share details about it.'
      },
      {
        title: 'Tool Calling - MCP HTTP',
        description: 'Demostrate tooling calling with MCP HTTP',
        workflowType: 'http',
        prompt: 'Look up information about user with the ID foo_123'
      },
      {
        title: 'Saga - Trip Booking',
        description: 'Demostrate a saga pattern.',
        workflowType: 'saga',
        prompt: 'I would like to book a trip to Paris.'
      }
    ]
  }
}