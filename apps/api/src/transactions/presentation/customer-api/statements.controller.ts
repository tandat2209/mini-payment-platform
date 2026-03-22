import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';

import { CurrentCustomer } from '../../../access/customer/current-customer.decorator';
import { CurrentCustomerGuard } from '../../../access/customer/current-customer.guard';
import { type CurrentCustomer as CurrentCustomerView } from '../../../access/customer/current-customer.types';
import { toIsoTimestamp, toMoneyDto } from '../../../shared/api/api-primitives';
import { parseCurrency, parsePositiveInteger } from '../../../shared/api/cursor';
import { GetStatementsQuery } from '../../application/queries/get-statements.query';
import { type StatementLineItemView } from '../../domain/statement-query.repository';

type StatementLineItemResponse = {
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

type StatementDetailResponse = {
  closingBalance: ReturnType<typeof toMoneyDto>;
  currency: string;
  lineItems: StatementLineItemResponse[];
  month: number;
  openingBalance: ReturnType<typeof toMoneyDto>;
  totals: {
    credits: ReturnType<typeof toMoneyDto>;
    debits: ReturnType<typeof toMoneyDto>;
  };
  walletId: string;
  year: number;
};

@UseGuards(CurrentCustomerGuard)
@Controller('customers/me/statements')
export class StatementsController {
  constructor(private readonly getStatementsQuery: GetStatementsQuery) {}

  @Get()
  async listAvailablePeriods(
    @CurrentCustomer() customer: CurrentCustomerView,
  ): Promise<{
    items: NonNullable<Awaited<ReturnType<GetStatementsQuery['listAvailablePeriods']>>>;
  }> {
    const periods = await this.getStatementsQuery.listAvailablePeriods(customer);

    if (!periods) {
      throw new NotFoundException('Active wallet not found');
    }

    return {
      items: periods,
    };
  }

  @Get(':walletId/:currency/:year/:month')
  async getStatementDetail(
    @CurrentCustomer() customer: CurrentCustomerView,
    @Param('currency') rawCurrency: string,
    @Param('month') rawMonth: string,
    @Param('walletId') walletId: string,
    @Param('year') rawYear: string,
  ): Promise<StatementDetailResponse> {
    const currency = parseCurrency(rawCurrency);

    if (!currency) {
      throw new NotFoundException('Statement not found');
    }

    const year = parsePositiveInteger(rawYear, 'year');
    const month = parsePositiveInteger(rawMonth, 'month');
    const statement = await this.getStatementsQuery.getDetail(
      customer,
      walletId,
      currency,
      year,
      month,
    );

    if (!statement) {
      throw new NotFoundException('Statement not found');
    }

    return {
      closingBalance: toMoneyDto(statement.currency, statement.closingBalanceMinor),
      currency: statement.currency,
      lineItems: statement.lineItems.map((lineItem) => this.toLineItemResponse(lineItem)),
      month: statement.month,
      openingBalance: toMoneyDto(statement.currency, statement.openingBalanceMinor),
      totals: {
        credits: toMoneyDto(statement.currency, statement.totalCreditsMinor),
        debits: toMoneyDto(statement.currency, statement.totalDebitsMinor),
      },
      walletId: statement.walletId,
      year: statement.year,
    };
  }

  private toLineItemResponse(lineItem: StatementLineItemView): StatementLineItemResponse {
    return {
      amounts: {
        fee: toMoneyDto(lineItem.currency, lineItem.feeAmountMinor),
        gross: toMoneyDto(lineItem.currency, lineItem.grossAmountMinor),
        net: toMoneyDto(lineItem.currency, lineItem.netAmountMinor),
      },
      currency: lineItem.currency,
      description: lineItem.description,
      direction: lineItem.direction,
      id: lineItem.id,
      occurredAt: toIsoTimestamp(lineItem.occurredAt),
      postedAt: toIsoTimestamp(lineItem.postedAt),
      reference: lineItem.reference,
      status: lineItem.status,
      type: lineItem.type,
    };
  }
}
