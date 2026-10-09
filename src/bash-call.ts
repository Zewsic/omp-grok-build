/**
 * Grok often fills omp's optional bash fields the way the official CLI does:
 * a label in `name`, plus `timeout` / `async`. A nonblank `name` is service
 * mode, and omp rejects `timeout` and `async` there. One-shot commands should
 * run in the foreground instead.
 */

function serviceName(input: Record<string, unknown>): string {
	return typeof input.name === "string" ? input.name.trim() : "";
}

function hasReadiness(input: Record<string, unknown>): boolean {
	const ready = input.ready;
	if (!ready || typeof ready !== "object") return false;
	const record = ready as Record<string, unknown>;
	const log = typeof record.log === "string" ? record.log.trim() : "";
	return log.length > 0 || typeof record.port === "number";
}

export function rewriteGrokBashInput(
	input: Record<string, unknown>,
): Record<string, unknown> | undefined {
	const name = serviceName(input);
	const ready = hasReadiness(input);
	const hasTimeout = input.timeout !== undefined && input.timeout !== null;
	const hasAsync = input.async === true;
	if (!name && !hasAsync) return undefined;

	const next = { ...input };
	if (name && ready) {
		if (!hasTimeout && !hasAsync) return undefined;
		delete next.timeout;
		delete next.async;
		return next;
	}

	delete next.name;
	delete next.ready;
	delete next.async;
	return next;
}
