import { log } from '@temporalio/activity';

export async function testAdd(x: number, y: number):Promise<Number|Error> {
  log.info('👋 From Activity', {x, y});
  if(x === 0) {
    throw new Error('Error from Activity');
  } 

  return x + y;
}