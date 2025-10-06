import { Z } from "zero-svelte";
import { type Schema } from "@temporal-vercel-demo/local-first";
import { getContext } from "svelte";

export function get_z() {
	return getContext('z') as Z<Schema>;
}