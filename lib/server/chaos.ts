import { AppError } from './errors';

/** Mock-network behaviour. Configurable via env so E2E tests can turn the failures off. */
function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export interface ChaosConfig {
  latencyMin: number;
  latencyMax: number;
  failureRate: number;
}

export const getChaosConfig = (): ChaosConfig => ({
  latencyMin: readNumber('MOCK_LATENCY_MIN', 300),
  latencyMax: readNumber('MOCK_LATENCY_MAX', 1200),
  failureRate: readNumber('MOCK_FAILURE_RATE', 0.1),
});

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });

/**
 * Simulates a flaky network: random latency, then (sometimes) a 500/503.
 * Failures are raised *before* the handler runs, so a failed POST never half-applies and a
 * manual retry is always safe.
 */
export async function simulateNetwork(
  signal?: AbortSignal,
  config: ChaosConfig = getChaosConfig(),
  random: () => number = Math.random,
): Promise<void> {
  const { latencyMin, latencyMax, failureRate } = config;
  const delay = latencyMin + random() * Math.max(0, latencyMax - latencyMin);
  await sleep(delay, signal);

  if (random() < failureRate) {
    throw random() < 0.5
      ? new AppError(500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.')
      : new AppError(503, 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable.');
  }
}
