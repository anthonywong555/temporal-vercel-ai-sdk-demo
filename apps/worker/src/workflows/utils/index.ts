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