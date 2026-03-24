function maskValue(value: string): string {
  if (value.length <= 4) {
    return value;
  }

  return `${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

export function maskRecipientRailDetails(details: Record<string, unknown>): Record<string, string> {
  const masked: Record<string, string> = {};

  if (typeof details.bankName === 'string') {
    masked.bankName = details.bankName;
  }

  if (typeof details.accountHolderName === 'string') {
    masked.accountHolderName = details.accountHolderName;
  }

  if (typeof details.accountNumber === 'string') {
    masked.accountNumber = maskValue(details.accountNumber);
  }

  if (typeof details.routingNumber === 'string') {
    masked.routingNumber = maskValue(details.routingNumber);
  }

  if (typeof details.iban === 'string') {
    masked.iban = maskValue(details.iban);
  }

  if (typeof details.swiftCode === 'string') {
    masked.swiftCode = maskValue(details.swiftCode);
  }

  return masked;
}
