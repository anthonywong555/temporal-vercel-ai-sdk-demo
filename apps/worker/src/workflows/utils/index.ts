import { condition } from "@temporalio/workflow";

import type { AssistantModelMessage, ToolApprovalResponse, ToolModelMessage, ToolResultPart  } from 'ai';

export type ResponseMessage = AssistantModelMessage | ToolModelMessage;
export type ToolContent = Array<ToolResultPart | ToolApprovalResponse>;

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

// Generate by ChatGPT 5.0
type MarkerMode = "own" | "omit" | "prev" | "next";

interface SplitOnOptions {
  /**
   * - "own": marker becomes its own group (default)
   * - "omit": marker not included
   * - "prev": marker appended to previous group
   * - "next": marker starts the next group
   */
  markerMode?: MarkerMode;
}

/**
 * Returns a *new array of new arrays*, split based on the given predicate.
 * The input array is never mutated.
 */
export function splitOn<T>(
  arr: readonly T[],
  predicate: (item: T, index: number, array: readonly T[]) => boolean,
  options: SplitOnOptions = {}
): T[][] {
  const mode: MarkerMode = options.markerMode ?? "own";

  const result: T[][] = [];
  let bucket: T[] = [];

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];

    if (!predicate(item, i, arr)) {
      // Normal element → add to the current bucket
      bucket = [...bucket, item];
      continue;
    }

    // Marker hit → decide how to handle it
    switch (mode) {
      case "own": {
        if (bucket.length > 0) {
          result.push([...bucket]);
          bucket = [];
        }
        result.push([item]);
        break;
      }

      case "omit": {
        if (bucket.length > 0) {
          result.push([...bucket]);
          bucket = [];
        }
        break; // marker omitted
      }

      case "prev": {
        if (bucket.length === 0) {
          result.push([item]);
        } else {
          result.push([...bucket, item]);
          bucket = [];
        }
        break;
      }

      case "next": {
        if (bucket.length > 0) {
          result.push([...bucket]);
        }
        bucket = [item];
        break;
      }
    }
  }

  if (bucket.length > 0) result.push([...bucket]);
  return result;
}