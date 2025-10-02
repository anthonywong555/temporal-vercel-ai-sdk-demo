import { bundleWorkflowCode } from '@temporalio/worker';
import { writeFile } from 'fs/promises';
import path from 'path';

async function bundle() {
  const { code } = await bundleWorkflowCode({
      workflowsPath: require.resolve('../workflows/index'),
      // IMPORTANT: When prebundling Workflow code (i.e. using `bundleWorkflowCode(...)`), you MUST
      //            provide the following `workflowModules` property to `bundleWorkflowCode()`;
      //            Workflow code tracing won't work if you don't.
      //
      workflowInterceptorModules: [require.resolve('../workflows/index')]
  });

  const codePath = path.join(__dirname, '../../dist/workflow-bundle.js');

  await writeFile(codePath, code);
  console.log(`Bundle written to ${codePath}`);
}

bundle().catch((err) => {
  console.error(err);
  process.exit(1);
});