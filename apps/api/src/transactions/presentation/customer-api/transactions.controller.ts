import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';

import { CurrentCustomer } from '../../../access/customer/current-customer.decorator';
import { CurrentCustomerGuard } from '../../../access/customer/current-customer.guard';
import { type CurrentCustomer as CurrentCustomerView } from '../../../access/customer/current-customer.types';
import { toIsoTimestamp, toMoneyDto } from '../../../shared/api/api-primitives';
import {
  decodeTransactionCursor,
  parseCurrency,
  parseLimit,
  parseOptionalDate,
} from '../../../shared/api/cursor';
import { GetTransactionsQuery } from '../../application/queries/get-transactions.query';
import {
  type TransactionDetailView,
  type TransactionListItemView,
} from '../../domain/transaction-query.repository';

type TransactionResponse = {
  amounts: {
    fee: ReturnType<typeof toMoneyDto>;
    gross: ReturnType<typeof toMoneyDto>;
    net: ReturnType<typeof toMoneyDto>;
  };
  currency: string;
  description: string;
  direction: string;
  id: string;
  occurredAt: string | null;
  postedAt: string | null;
  reference: string | null;
  status: string;
  type: string;
};

type TransactionDetailResponse = TransactionResponse & {
  payout: {
    completedAt: string | null;
    failedAt: string | null;
    payoutId: string;
    payoutReference: string | null;
    recipientId: string | null;
    recipientName: string | null;
    status: string;
    submittedAt: string | null;
  } | null;
};

@UseGuards(CurrentCustomerGuard)
@Controller('customers/me/transactions')
export class TransactionsController {
  constructor(private readonly getTransactionsQuery: GetTransactionsQuery) {}

  @Get()
  async listTransactions(
    @CurrentCustomer() customer: CurrentCustomerView,
    @Query('cursor') rawCursor?: string,
    @Query('currency') rawCurrency?: string,
    @Query('dateFrom') rawDateFrom?: string,
    @Query('dateTo') rawDateTo?: string,
    @Query('limit') rawLimit?: string,
    @Query('status') rawStatus?: string,
    @Query('type') rawType?: string,
  ): Promise<{ items: TransactionResponse[]; page: { limit: number; nextCursor: string | null } }> {
    const limit = parseLimit(rawLimit);
    const result = await this.getTransactionsQuery.list(customer, {
      currency: parseCurrency(rawCurrency),
      cursor: decodeTransactionCursor(rawCursor),
      dateFrom: parseOptionalDate(rawDateFrom, 'dateFrom'),
      dateTo: parseOptionalDate(rawDateTo, 'dateTo'),
      limit,
      status: rawStatus?.trim() || null,
      type: rawType?.trim() || null,
    });

    return {
      items: result.items.map((item) => this.toTransactionResponse(item)),
      page: {
        limit,
        nextCursor: result.nextCursor,
      },
    };
  }

  @Get(':transactionId')
  async getTransactionDetail(
    @CurrentCustomer() customer: CurrentCustomerView,
    @Param('transactionId') transactionId: string,
  ): Promise<TransactionDetailResponse> {
    const transaction = await this.getTransactionsQuery.getDetail(customer, transactionId);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      ...this.toTransactionResponse(transaction),
      payout: transaction.payoutContext
        ? {
            completedAt: toIsoTimestamp(transaction.payoutContext.completedAt),
            failedAt: toIsoTimestamp(transaction.payoutContext.failedAt),
            payoutId: transaction.payoutContext.payoutId,
            payoutReference: transaction.payoutContext.payoutReference,
            recipientId: transaction.payoutContext.recipientId,
            recipientName: transaction.payoutContext.recipientName,
            status: transaction.payoutContext.status,
            submittedAt: toIsoTimestamp(transaction.payoutContext.submittedAt),
          }
        : null,
    };
  }

  private toTransactionResponse(
    transaction: TransactionListItemView | TransactionDetailView,
  ): TransactionResponse {
    return {
      amounts: {
        fee: toMoneyDto(transaction.currency, transaction.feeAmountMinor),
        gross: toMoneyDto(transaction.currency, transaction.grossAmountMinor),
        net: toMoneyDto(transaction.currency, transaction.netAmountMinor),
      },
      currency: transaction.currency,
      description: transaction.description,
      direction: transaction.direction,
      id: transaction.id,
      occurredAt: toIsoTimestamp(transaction.occurredAt),
      postedAt: toIsoTimestamp(transaction.postedAt),
      reference: transaction.reference,
      status: transaction.status,
      type: transaction.type,
    };
  }
}
