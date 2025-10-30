import { condition } from "@temporalio/workflow";

// Generate by ChatGPT 5.0
type Activity<T> = () => Promise<T>;

interface ChainActivitiesParams<T> {
  activities: Activity<T>[];
}

export async function chainActivities<T>({
  activities,
}: ChainActivitiesParams<T>): Promise<T> {
  for (const activity of activities) {
    if (typeof activity !== "function") {
      throw new TypeError(
        "chainActivities expects functions (() => Promise). You passed a Promise, which runs immediately and breaks sequential execution."
      );
    }
    try {
      const result = await activity(); // runs only now
      return result;                   // first success wins
    } catch {
      // try next
    }
  }
  throw new Error("All activities failed");
}

// Generate by ChatGPT 5.0
export function chunkArray<T>(arr: T[], size: number): T[][] {
  if (size <= 0) throw new Error("Chunk size must be greater than 0");

  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// Source: https://github.com/temporalio/samples-typescript/blob/main/timer-examples/src/updatable-timer.ts
export class UpdatableTimer implements PromiseLike<void> {
  deadlineUpdated = false;
  #deadline: number;
  readonly promise: Promise<void>;

  constructor(deadline: number) {
    this.#deadline = deadline;
    this.promise = this.run();
    this.promise.catch(() => {
      // avoid unhandled rejection
    });
  }

  private async run(): Promise<void> {
    /* eslint-disable no-constant-condition */
    while (true) {
      this.deadlineUpdated = false;
      if (!(await condition(() => this.deadlineUpdated, this.#deadline - Date.now()))) {
        break;
      }
    }
  }

  then<TResult1 = void, TResult2 = never>(
    onfulfilled?: (value: void) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
  ): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  set deadline(value: number) {
    this.#deadline = value;
    this.deadlineUpdated = true;
  }

  get deadline(): number {
    return this.#deadline;
  }
}