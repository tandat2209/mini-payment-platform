import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';

import { toIsoTimestamp, toMoneyDto } from '../../../shared/api/api-primitives';
import { parseCurrency, parseLimit } from '../../../shared/api/cursor';
import { GetAdminLedgersQuery } from '../../application/get-admin-ledgers.query';
import {
  type AdminLedgerDetailView,
  type AdminLedgerListItemView,
} from '../../domain/admin-ledger-query.repository';
import { decodeAdminLedgerCursor } from '../../infrastructure/sql-admin-ledger-query.repository';

type AdminLedgerListItemResponse = {
  credits: ReturnType<typeof toMoneyDto>;
  currency: string;
  debits: ReturnType<typeof toMoneyDto>;
  description: string | null;
  entryCount: number;
  id: string;
  integrity: {
    delta: ReturnType<typeof toMoneyDto>;
    isBalanced: boolean;
  };
  postedAt: string | null;
  reference: string | null;
  status: string;
  transactionType: string;
  userTransactionId: string | null;
  webhookEventId: string | null;
};

type AdminLedgerDetailResponse = AdminLedgerListItemResponse & {
  entries: Array<{
    account: {
      code: string;
      id: string;
      name: string;
      ownerId: string | null;
      ownerType: string | null;
      type: string;
    };
    amount: ReturnType<typeof toMoneyDto>;
    description: string | null;
    direction: string;
    id: string;
  }>;
};

@Controller('admin/ledgers')
export class AdminLedgersController {
  constructor(private readonly getAdminLedgersQuery: GetAdminLedgersQuery) {}

  @Get()
  async listLedgerTransactions(
    @Query('cursor') rawCursor?: string,
    @Query('currency') rawCurrency?: string,
    @Query('limit') rawLimit?: string,
    @Query('query') rawQuery?: string,
    @Query('status') rawStatus?: string,
    @Query('transactionType') rawTransactionType?: string,
  ): Promise<{
    items: AdminLedgerListItemResponse[];
    page: { limit: number; nextCursor: string | null };
    summary: {
      accountGroupSummaries: Array<{
        accountCount: number;
        accountGroup: string;
        credits: ReturnType<typeof toMoneyDto>;
        currency: string;
        debits: ReturnType<typeof toMoneyDto>;
        description: string;
        net: ReturnType<typeof toMoneyDto>;
      }>;
      currencySummaries: Array<{
        credits: ReturnType<typeof toMoneyDto>;
        currency: string;
        debits: ReturnType<typeof toMoneyDto>;
        delta: ReturnType<typeof toMoneyDto>;
      }>;
      trialBalanceRows: Array<{
        accountCode: string;
        accountGroup: string;
        accountName: string;
        accountType: string;
        credits: ReturnType<typeof toMoneyDto>;
        currency: string;
        debits: ReturnType<typeof toMoneyDto>;
        net: ReturnType<typeof toMoneyDto>;
      }>;
      unbalancedTransactions: number;
    };
  }> {
    const limit = parseLimit(rawLimit);
    const result = await this.getAdminLedgersQuery.list({
      currency: parseCurrency(rawCurrency),
      cursor: decodeAdminLedgerCursor(rawCursor),
      limit,
      query: rawQuery?.trim() || null,
      status: rawStatus?.trim() || null,
      transactionType: rawTransactionType?.trim() || null,
    });

    return {
      items: result.items.map((item) => this.toLedgerTransactionResponse(item)),
      page: {
        limit,
        nextCursor: result.nextCursor,
      },
      summary: {
        accountGroupSummaries: result.summary.accountGroupSummaries.map((summary) => ({
          accountCount: summary.accountCount,
          accountGroup: summary.accountGroup,
          credits: toMoneyDto(summary.currency, summary.creditAmountMinor),
          currency: summary.currency,
          debits: toMoneyDto(summary.currency, summary.debitAmountMinor),
          description: summary.description,
          net: toMoneyDto(summary.currency, summary.netAmountMinor),
        })),
        currencySummaries: result.summary.currencySummaries.map((summary) => ({
          credits: toMoneyDto(summary.currency, summary.creditAmountMinor),
          currency: summary.currency,
          debits: toMoneyDto(summary.currency, summary.debitAmountMinor),
          delta: toMoneyDto(summary.currency, summary.deltaAmountMinor),
        })),
        trialBalanceRows: result.summary.trialBalanceRows.map((row) => ({
          accountCode: row.accountCode,
          accountGroup: row.accountGroup,
          accountName: row.accountName,
          accountType: row.accountType,
          credits: toMoneyDto(row.currency, row.creditAmountMinor),
          currency: row.currency,
          debits: toMoneyDto(row.currency, row.debitAmountMinor),
          net: toMoneyDto(row.currency, row.netAmountMinor),
        })),
        unbalancedTransactions: result.summary.unbalancedTransactions,
      },
    };
  }

  @Get(':ledgerTransactionId')
  async getLedgerTransactionDetail(
    @Param('ledgerTransactionId') ledgerTransactionId: string,
  ): Promise<AdminLedgerDetailResponse> {
    const ledgerTransaction = await this.getAdminLedgersQuery.getDetail(ledgerTransactionId);

    if (!ledgerTransaction) {
      throw new NotFoundException('Ledger transaction not found');
    }

    return {
      ...this.toLedgerTransactionResponse(ledgerTransaction),
      entries: ledgerTransaction.entries.map((entry) => ({
        account: {
          code: entry.accountCode,
          id: entry.accountId,
          name: entry.accountName,
          ownerId: entry.ownerId,
          ownerType: entry.ownerType,
          type: entry.accountType,
        },
        amount: toMoneyDto(entry.currency, entry.amountMinor),
        description: entry.description,
        direction: entry.direction,
        id: entry.id,
      })),
    };
  }

  private toLedgerTransactionResponse(
    transaction: AdminLedgerListItemView | AdminLedgerDetailView,
  ): AdminLedgerListItemResponse {
    const debitMinor = BigInt(transaction.debitAmountMinor);
    const creditMinor = BigInt(transaction.creditAmountMinor);
    const deltaMinor = debitMinor - creditMinor;

    return {
      credits: toMoneyDto(transaction.currency, transaction.creditAmountMinor),
      currency: transaction.currency,
      debits: toMoneyDto(transaction.currency, transaction.debitAmountMinor),
      description: transaction.description,
      entryCount: transaction.entryCount,
      id: transaction.id,
      integrity: {
        delta: toMoneyDto(transaction.currency, deltaMinor.toString()),
        isBalanced: deltaMinor === 0n,
      },
      postedAt: toIsoTimestamp(transaction.postedAt),
      reference: transaction.reference,
      status: transaction.status,
      transactionType: transaction.transactionType,
      userTransactionId: transaction.userTransactionId,
      webhookEventId: transaction.webhookEventId,
    };
  }
}
