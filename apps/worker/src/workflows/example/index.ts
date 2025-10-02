import { proxyActivities, log, ApplicationFailure, workflowInfo } from '@temporalio/workflow';
import * as toolActivities from '../../sharable-activities/tools';

const { testAdd } = proxyActivities<typeof toolActivities>({
  startToCloseTimeout: '5 minute',
  retry: {
    maximumAttempts: 1,
  }
});


export async function exampleWorkflow() {
  try {
    log.info('Start of the workflow', {workflowId: workflowInfo().workflowId});
    const result = await testAdd(2, 3);
    log.info('Result', { result});
  } catch(e) {
    return new ApplicationFailure('Failed');
  }
}
