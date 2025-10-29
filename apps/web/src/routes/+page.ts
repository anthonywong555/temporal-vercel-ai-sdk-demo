import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params }) => {
  return {
    workflows: [
      {
        title: 'Hello World - Generate Text',
        description: 'This demostrate how to use LLM generate Text functionality. Basically one shot with no interation.',
        workflowType: 'prompt',
        prompt: "What's the deal with airline food?"
      },
      {
        title: 'Hello World - Stream Text',
        description: 'Similar as the one above, but now streaming.',
        workflowType: 'promptStreaming',
        prompt: "What's the deal with airline food?"
      },
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
      {
        title: 'Tool Calling - Streaming',
        description: 'Demostrate tooling calling, but with streaming.',
        workflowType: 'toolCallingStreaming',
        prompt: 'What is the weather in San Francisco and what should I do?'
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