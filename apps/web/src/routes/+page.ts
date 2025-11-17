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
        prompt: 'Why is Jolteon is consider the best Pokémon of all time?'
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
      },
      {
        title: 'Agent to Agent',
        description: 'Demostration on how you do agent to agent',
        workflowType: 'agentToAgent',
        prompt: ''
      },
      {
        title: 'Cancellable Chat Stream',
        description: 'Demostrate how to cancel an LLM Chat Stream.',
        workflowType: 'cancellation',
        prompt: 'Give me a long long written answer on why Typescript is the best language of all time. First explain then make a poem. I want 10,000 words of saying how good it is.'
      }
    ]
  }
}