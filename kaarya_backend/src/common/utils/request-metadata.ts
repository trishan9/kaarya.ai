export type RequestMetadata = {
  ip: string;
  userAgent?: string;
};

const asHeaderValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .find((entry) => typeof entry === 'string' && entry.trim())
      ?.trim();
  }
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const firstForwardedIp = (value: string | undefined) => {
  if (!value) return undefined;
  return value
    .split(',')
    .map((entry) => entry.trim())
    .find((entry) => entry.length > 0);
};

const isLoopbackIp = (ip: string) =>
  ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';

const isAxiosUserAgent = (userAgent: string) =>
  userAgent.toLowerCase().startsWith('axios/');

export const getRequestMetadata = (
  request: Record<string, unknown> | undefined,
): RequestMetadata => {
  const headers = (request?.['headers'] ?? {}) as Record<string, unknown>;
  const ipCandidates = [
    firstForwardedIp(asHeaderValue(headers['x-client-ip'])),
    firstForwardedIp(asHeaderValue(headers['x-forwarded-for'])),
    asHeaderValue(headers['x-real-ip']),
    asHeaderValue(headers['cf-connecting-ip']),
    asHeaderValue(request?.['ip']),
    asHeaderValue(
      (request?.['connection'] as { remoteAddress?: string } | undefined)
        ?.remoteAddress,
    ),
  ].filter((entry): entry is string => Boolean(entry));

  const ip =
    ipCandidates.find((entry) => !isLoopbackIp(entry)) ??
    ipCandidates[0] ??
    'unknown';

  const userAgentCandidates = [
    asHeaderValue(headers['x-client-user-agent']),
    asHeaderValue(headers['user-agent']),
  ].filter((entry): entry is string => Boolean(entry));
  const userAgent =
    userAgentCandidates.find((entry) => !isAxiosUserAgent(entry)) ??
    userAgentCandidates[0];

  return { ip, userAgent };
};
