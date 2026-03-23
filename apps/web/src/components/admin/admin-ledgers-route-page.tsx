import type { JSX } from 'react';

import { useAdminStore } from '../../store/admin-store';
import { AdminLedgerPanel } from './admin-ledger-panel';

export function AdminLedgersRoutePage(): JSX.Element {
  const ledgerTransactions = useAdminStore((state) => state.ledgerTransactions);
  const selectedLedgerTransactionId = useAdminStore((state) => state.selectedLedgerTransactionId);
  const setSelectedLedgerTransactionId = useAdminStore(
    (state) => state.setSelectedLedgerTransactionId,
  );
  const selectedLedgerTransaction =
    ledgerTransactions.find((transaction) => transaction.id === selectedLedgerTransactionId) ??
    null;

  return (
    <AdminLedgerPanel
      ledgerTransactions={ledgerTransactions}
      onClose={() => {
        setSelectedLedgerTransactionId(null);
      }}
      onSelect={(transactionId) => {
        setSelectedLedgerTransactionId(
          selectedLedgerTransactionId === transactionId ? null : transactionId,
        );
      }}
      selectedLedgerTransaction={selectedLedgerTransaction}
      selectedLedgerTransactionId={selectedLedgerTransactionId}
    />
  );
}
