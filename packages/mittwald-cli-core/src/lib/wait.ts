import { Flags } from "@oclif/core";
import Duration from "./units/Duration.js";
import { InferredFlags } from "@oclif/core/interfaces";
import { poll } from "./poll.js";

export const waitFlags = {
  wait: Flags.boolean({
    char: "w",
    description: "wait for the resource to be ready.",
  }),
  "wait-timeout": Duration.relativeFlag({
    description:
      "the duration to wait for the resource to be ready (common units like 'ms', 's', 'm' are accepted).",
    default: Duration.fromSeconds(600),
  }),
};

export type WaitFlags = InferredFlags<typeof waitFlags>;

const WAIT_UNTIL_POLL_INTERVAL_MS = 1000;

/**
 * Polls `tester` on a fixed ~1s cadence (a thin, CLI-flag-friendly wrapper around the generic
 * `poll` helper in `./poll.js`) until it returns a truthy value, or throws once `timeout` has
 * elapsed. Used by CLI commands that offer a `--wait` flag (see `waitFlags` above).
 */
export async function waitUntil<T>(
  tester: () => Promise<T | null>,
  timeout = Duration.fromSeconds(600),
): Promise<T> {
  const maxAttempts = Math.max(1, Math.ceil(timeout.milliseconds / WAIT_UNTIL_POLL_INTERVAL_MS) + 1);

  const result = await poll<T | null>(tester, (value) => Boolean(value), {
    maxAttempts,
    initialDelayMs: WAIT_UNTIL_POLL_INTERVAL_MS,
    backoffFactor: 1,
    maxDelayMs: WAIT_UNTIL_POLL_INTERVAL_MS,
    retryOnError: false,
  });

  if (!result) {
    throw new Error(
      `expected condition was not reached after ${timeout.toString()}`,
    );
  }

  return result;
}
