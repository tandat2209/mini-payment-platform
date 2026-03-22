import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const candidateEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'apps/api/.env'),
];

function parseEnvLine(line: string): { key: string; value: string } | null {
  const trimmedLine = line.trim();

  if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) {
    return null;
  }

  const separatorIndex = trimmedLine.indexOf('=');

  if (separatorIndex <= 0) {
    return null;
  }

  const key = trimmedLine.slice(0, separatorIndex).trim();
  const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
  const value =
    rawValue.startsWith('"') && rawValue.endsWith('"')
      ? rawValue.slice(1, -1)
      : rawValue.startsWith("'") && rawValue.endsWith("'")
        ? rawValue.slice(1, -1)
        : rawValue;

  return key.length > 0 ? { key, value } : null;
}

export function loadLocalEnv(): void {
  const envPath = candidateEnvPaths.find((candidatePath) => existsSync(candidatePath));

  if (!envPath) {
    return;
  }

  const fileContents = readFileSync(envPath, 'utf8');

  for (const line of fileContents.split(/\r?\n/u)) {
    const parsedLine = parseEnvLine(line);

    if (!parsedLine || process.env[parsedLine.key] !== undefined) {
      continue;
    }

    process.env[parsedLine.key] = parsedLine.value;
  }
}
