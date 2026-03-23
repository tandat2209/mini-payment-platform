export function getLedgerAccountGroup(accountCode: string): string {
  if (accountCode.startsWith('wallet_')) {
    return 'Wallet liabilities';
  }

  if (accountCode.startsWith('platform_cash_')) {
    return 'Platform cash';
  }

  if (accountCode.startsWith('platform_revenue_')) {
    return 'Platform revenue';
  }

  if (accountCode.startsWith('recipient_payable_')) {
    return 'Recipient payables';
  }

  return 'Other accounts';
}

export function getLedgerAccountGroupDescription(accountGroup: string): string {
  switch (accountGroup) {
    case 'Wallet liabilities':
      return 'Customer wallet obligation accounts, usually the largest account family.';
    case 'Platform cash':
      return 'Settlement and safeguarding cash positions held by the platform.';
    case 'Platform revenue':
      return 'Fee and revenue recognition accounts.';
    case 'Recipient payables':
      return 'Amounts owed onward to payout beneficiaries.';
    default:
      return 'Accounts outside the main operational groupings.';
  }
}
