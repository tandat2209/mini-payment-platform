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
  delivered: true;
  deliveryTarget: string;
  externalEventId: string;
  mode: 'sandbox_live';
  postedAt: string;
  provider: string;
  providerReference: string | null;
  receiverDuplicate: boolean | null;
  receiverProcessingStatus: string | null;
  status: 'delivered';
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
