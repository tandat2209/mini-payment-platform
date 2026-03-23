import type { MoneyDto } from '../../api';

type DestinationType = 'account_number' | 'iban' | 'virtual_account';

export type AdminSimulationFormState = {
  amountMinor: string;
  currency: string;
  description: string;
  destinationIdentifier: string;
  destinationType: DestinationType;
  externalEventId: string;
  providerReference: string;
  senderAccountIdentifier: string;
  senderBankCode: string;
  senderBankName: string;
  senderName: string;
};

export type AdminSimulationResult = {
  createdLedgerTransactionId: string;
  createdTransactionId: string;
  externalEventId: string;
  mode: 'preview';
  postedAt: string;
  provider: string;
  providerReference: string | null;
  status: 'preview_booked';
};

export type AdminTransactionRecord = {
  amounts: {
    fee: MoneyDto;
    gross: MoneyDto;
    net: MoneyDto;
  };
  currency: string;
  customerExternalRef: string;
  customerName: string;
  description: string;
  direction: 'credit' | 'debit';
  id: string;
  occurredAt: string;
  postedAt: string;
  reference: string;
  source: 'preview' | 'seed';
  status: string;
  type: string;
};

export type AdminLedgerEntryRecord = {
  accountCode: string;
  accountName: string;
  amount: MoneyDto;
  description: string;
  direction: 'credit' | 'debit';
  id: string;
};

export type AdminLedgerTransactionRecord = {
  currency: string;
  description: string;
  entries: AdminLedgerEntryRecord[];
  id: string;
  postedAt: string;
  reference: string;
  source: 'preview' | 'seed';
  status: string;
  transactionType: string;
  userTransactionId: string | null;
};

export type AdminWalletSnapshot = {
  available: MoneyDto;
  customerName: string;
  lastMovementAt: string;
  pending: MoneyDto;
  status: string;
  walletId: string;
};

export type AdminBalanceSnapshot = {
  activeWallets: number;
  available: MoneyDto;
  currency: string;
  pending: MoneyDto;
  postedToday: number;
};

export const initialAdminSimulationFormState: AdminSimulationFormState = {
  amountMinor: '2500',
  currency: 'USD',
  description: 'Salary top up',
  destinationIdentifier: '1234567890',
  destinationType: 'account_number',
  externalEventId: 'evt_admin_preview_001',
  providerReference: 'bank-ref-preview-001',
  senderAccountIdentifier: '99887766',
  senderBankCode: 'VCB',
  senderBankName: 'Vietcombank',
  senderName: 'Alice Nguyen',
};

export const initialAdminTransactions: AdminTransactionRecord[] = [
  createTransactionRecord({
    amountMinor: '10000',
    currency: 'USD',
    customerExternalRef: 'user_demo_alice',
    customerName: 'Alice Nguyen',
    description: 'Funding received from simulator_psp: Initial top up',
    direction: 'credit',
    id: 'txn-admin-001',
    occurredAt: '2026-03-22T01:10:30.000Z',
    postedAt: '2026-03-22T01:10:30.000Z',
    reference: 'funding-001',
    source: 'seed',
    status: 'completed',
    type: 'funding',
  }),
  createTransactionRecord({
    amountMinor: '3200',
    currency: 'USD',
    customerExternalRef: 'user_demo_alice',
    customerName: 'Alice Nguyen',
    description: 'Payout to Vendor One',
    direction: 'debit',
    id: 'txn-admin-002',
    occurredAt: '2026-03-22T01:20:00.000Z',
    postedAt: '2026-03-22T01:21:20.000Z',
    reference: 'payout-001',
    source: 'seed',
    status: 'completed',
    type: 'payout',
  }),
  createTransactionRecord({
    amountMinor: '2500',
    currency: 'USD',
    customerExternalRef: 'user_demo_bob',
    customerName: 'Bob Tran',
    description: 'Funding received from simulator_psp: Test funding',
    direction: 'credit',
    id: 'txn-admin-003',
    occurredAt: '2026-03-23T02:12:00.000Z',
    postedAt: '2026-03-23T02:12:00.000Z',
    reference: 'funding-bob-001',
    source: 'seed',
    status: 'completed',
    type: 'funding',
  }),
];

export const initialAdminLedgerTransactions: AdminLedgerTransactionRecord[] = [
  {
    currency: 'USD',
    description: 'Inbound funding recognized from provider webhook (bank-ref-001)',
    entries: [
      createLedgerEntry({
        accountCode: 'platform_cash_usd',
        accountName: 'Platform Cash USD',
        amountMinor: '10000',
        currency: 'USD',
        description: 'Provider cash received',
        direction: 'debit',
        id: 'le-admin-001',
      }),
      createLedgerEntry({
        accountCode: 'wallet_alice_usd',
        accountName: 'Alice Wallet USD',
        amountMinor: '10000',
        currency: 'USD',
        description: 'Wallet liability increased',
        direction: 'credit',
        id: 'le-admin-002',
      }),
    ],
    id: 'lt-admin-001',
    postedAt: '2026-03-22T01:10:30.000Z',
    reference: 'funding-001',
    source: 'seed',
    status: 'posted',
    transactionType: 'funding',
    userTransactionId: 'txn-admin-001',
  },
  {
    currency: 'USD',
    description: 'Deduct wallet and allocate fee plus payable',
    entries: [
      createLedgerEntry({
        accountCode: 'wallet_alice_usd',
        accountName: 'Alice Wallet USD',
        amountMinor: '3200',
        currency: 'USD',
        description: 'Wallet debited for payout',
        direction: 'debit',
        id: 'le-admin-003',
      }),
      createLedgerEntry({
        accountCode: 'platform_revenue_usd',
        accountName: 'Platform Revenue USD',
        amountMinor: '3000',
        currency: 'USD',
        description: 'Platform revenue booked',
        direction: 'credit',
        id: 'le-admin-004',
      }),
      createLedgerEntry({
        accountCode: 'recipient_payable_usd',
        accountName: 'Recipient Payable USD',
        amountMinor: '200',
        currency: 'USD',
        description: 'Recipient payable booked',
        direction: 'credit',
        id: 'le-admin-005',
      }),
    ],
    id: 'lt-admin-002',
    postedAt: '2026-03-22T01:20:00.000Z',
    reference: 'payout-001',
    source: 'seed',
    status: 'posted',
    transactionType: 'payout',
    userTransactionId: 'txn-admin-002',
  },
];

export const adminWalletSnapshots: AdminWalletSnapshot[] = [
  {
    available: { amountMinor: '930000', currency: 'USD' },
    customerName: 'Alice Nguyen',
    lastMovementAt: '2026-03-23T04:38:00.000Z',
    pending: { amountMinor: '0', currency: 'USD' },
    status: 'active',
    walletId: 'wal_usd_alice',
  },
  {
    available: { amountMinor: '275000', currency: 'EUR' },
    customerName: 'Bob Tran',
    lastMovementAt: '2026-03-23T03:12:00.000Z',
    pending: { amountMinor: '12500', currency: 'EUR' },
    status: 'active',
    walletId: 'wal_eur_bob',
  },
  {
    available: { amountMinor: '1180000', currency: 'USD' },
    customerName: 'Ops Reserve Wallet',
    lastMovementAt: '2026-03-22T23:40:00.000Z',
    pending: { amountMinor: '0', currency: 'USD' },
    status: 'review',
    walletId: 'wal_usd_ops',
  },
];

export const adminBalanceSnapshots: AdminBalanceSnapshot[] = [
  {
    activeWallets: 18,
    available: { amountMinor: '2415000', currency: 'USD' },
    currency: 'USD',
    pending: { amountMinor: '60000', currency: 'USD' },
    postedToday: 47,
  },
  {
    activeWallets: 7,
    available: { amountMinor: '884000', currency: 'EUR' },
    currency: 'EUR',
    pending: { amountMinor: '31000', currency: 'EUR' },
    postedToday: 19,
  },
  {
    activeWallets: 4,
    available: { amountMinor: '1290000', currency: 'VND' },
    currency: 'VND',
    pending: { amountMinor: '145000', currency: 'VND' },
    postedToday: 13,
  },
];

export function buildPreviewFundingActivity(form: AdminSimulationFormState): {
  ledgerTransaction: AdminLedgerTransactionRecord;
  result: AdminSimulationResult;
  transaction: AdminTransactionRecord;
} {
  const postedAt = new Date().toISOString();
  const externalEventId =
    form.externalEventId.trim().length > 0
      ? form.externalEventId.trim()
      : `evt_admin_preview_${postedAt.slice(11, 19).replace(/:/g, '')}`;
  const transactionId = `txn-preview-${postedAt.slice(11, 19).replace(/:/g, '')}`;
  const ledgerTransactionId = `lt-preview-${postedAt.slice(11, 19).replace(/:/g, '')}`;
  const reference = `funding-${externalEventId}`;
  const description =
    form.senderName.trim().length > 0 && form.description.trim().length > 0
      ? `Funding received from ${form.senderName.trim()}: ${form.description.trim()}`
      : form.description.trim().length > 0
        ? `Funding received: ${form.description.trim()}`
        : 'Funding received';

  return {
    ledgerTransaction: {
      currency: form.currency,
      description:
        form.providerReference.trim().length > 0
          ? `Inbound funding recognized from provider webhook (${form.providerReference.trim()})`
          : 'Inbound funding recognized from provider webhook',
      entries: [
        createLedgerEntry({
          accountCode: `platform_cash_${form.currency.toLowerCase()}`,
          accountName: `Platform Cash ${form.currency}`,
          amountMinor: form.amountMinor,
          currency: form.currency,
          description: 'Provider cash received',
          direction: 'debit',
          id: `${ledgerTransactionId}-debit`,
        }),
        createLedgerEntry({
          accountCode: `wallet_preview_${form.currency.toLowerCase()}`,
          accountName: `Preview Wallet ${form.currency}`,
          amountMinor: form.amountMinor,
          currency: form.currency,
          description: 'Wallet liability increased',
          direction: 'credit',
          id: `${ledgerTransactionId}-credit`,
        }),
      ],
      id: ledgerTransactionId,
      postedAt,
      reference,
      source: 'preview',
      status: 'preview_booked',
      transactionType: 'funding',
      userTransactionId: transactionId,
    },
    result: {
      createdLedgerTransactionId: ledgerTransactionId,
      createdTransactionId: transactionId,
      externalEventId,
      mode: 'preview',
      postedAt,
      provider: 'simulator_psp',
      providerReference: form.providerReference.trim() || null,
      status: 'preview_booked',
    },
    transaction: createTransactionRecord({
      amountMinor: form.amountMinor,
      currency: form.currency,
      customerExternalRef: 'preview_admin_trigger',
      customerName: 'Preview booking',
      description,
      direction: 'credit',
      id: transactionId,
      occurredAt: postedAt,
      postedAt,
      reference,
      source: 'preview',
      status: 'preview_booked',
      type: 'funding',
    }),
  };
}

function createMoneyDto(currency: string, amountMinor: string): MoneyDto {
  return {
    amountMinor,
    currency,
  };
}

function createTransactionRecord(input: {
  amountMinor: string;
  currency: string;
  customerExternalRef: string;
  customerName: string;
  description: string;
  direction: 'credit' | 'debit';
  id: string;
  occurredAt: string;
  postedAt: string;
  reference: string;
  source: 'preview' | 'seed';
  status: string;
  type: string;
}): AdminTransactionRecord {
  return {
    amounts: {
      fee: createMoneyDto(input.currency, '0'),
      gross: createMoneyDto(input.currency, input.amountMinor),
      net: createMoneyDto(input.currency, input.amountMinor),
    },
    currency: input.currency,
    customerExternalRef: input.customerExternalRef,
    customerName: input.customerName,
    description: input.description,
    direction: input.direction,
    id: input.id,
    occurredAt: input.occurredAt,
    postedAt: input.postedAt,
    reference: input.reference,
    source: input.source,
    status: input.status,
    type: input.type,
  };
}

function createLedgerEntry(input: {
  accountCode: string;
  accountName: string;
  amountMinor: string;
  currency: string;
  description: string;
  direction: 'credit' | 'debit';
  id: string;
}): AdminLedgerEntryRecord {
  return {
    accountCode: input.accountCode,
    accountName: input.accountName,
    amount: createMoneyDto(input.currency, input.amountMinor),
    description: input.description,
    direction: input.direction,
    id: input.id,
  };
}
