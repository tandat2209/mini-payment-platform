type StructuredLogValue =
  | boolean
  | null
  | number
  | string
  | StructuredLogValue[]
  | { [key: string]: StructuredLogValue };

export function toStructuredLog(payload: Record<string, StructuredLogValue | undefined>): string {
  return JSON.stringify(
    Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)),
  );
}
