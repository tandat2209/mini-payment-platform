import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { CurrentCustomer } from '../../../access/customer/current-customer.decorator';
import { CurrentCustomerGuard } from '../../../access/customer/current-customer.guard';
import { type CurrentCustomer as CurrentCustomerView } from '../../../access/customer/current-customer.types';
import { toMoneyDto } from '../../../shared/api/api-primitives';
import { ExecutePayoutService } from '../../application/execute-payout.service';
import {
  PayoutRecipientRailCurrencyMismatchError,
  PayoutRecipientRailNotFoundError,
  PayoutRecipientRailNotReadyError,
  ProviderManagedRecipientRailMissingReferenceError,
} from '../../domain/payout-preparation.types';
import {
  InsufficientWalletBalanceError,
  PayoutSourceWalletNotFoundError,
} from '../../domain/payout-write.types';
import { CreatePayoutDto } from './create-payout.dto';

type CreatePayoutResponse = {
  amounts: {
    fee: ReturnType<typeof toMoneyDto>;
    gross: ReturnType<typeof toMoneyDto>;
    net: ReturnType<typeof toMoneyDto>;
  };
  createdAt: string;
  payout: {
    id: string;
    reference: string;
    status: string;
  };
  recipient: {
    id: string;
    name: string;
    rail: string;
    railId: string;
  };
  transaction: {
    id: string;
  };
  wallet: {
    id: string;
  };
};

@UseGuards(CurrentCustomerGuard)
@Controller('customers/me/payouts')
export class PayoutsController {
  constructor(private readonly executePayoutService: ExecutePayoutService) {}

  @Post()
  @UsePipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  )
  async createPayout(
    @CurrentCustomer() customer: CurrentCustomerView,
    @Body() body: CreatePayoutDto,
  ): Promise<CreatePayoutResponse> {
    try {
      const result = await this.executePayoutService.execute({
        amountMinor: body.amountMinor,
        customerId: customer.id,
        recipientRailId: body.recipientRailId,
        ...(body.reference === undefined ? {} : { reference: body.reference }),
        sourceCurrency: body.sourceCurrency,
        sourceWalletId: body.sourceWalletId,
      });

      return {
        amounts: {
          fee: toMoneyDto(result.currency, result.amounts.feeAmountMinor),
          gross: toMoneyDto(result.currency, result.amounts.grossAmountMinor),
          net: toMoneyDto(result.currency, result.amounts.netAmountMinor),
        },
        createdAt: result.createdAt,
        payout: {
          id: result.payoutId,
          reference: result.reference,
          status: result.status,
        },
        recipient: result.recipient,
        transaction: {
          id: result.transactionId,
        },
        wallet: {
          id: result.walletId,
        },
      };
    } catch (error) {
      throw mapPayoutError(error);
    }
  }
}

function mapPayoutError(error: unknown): BadRequestException | NotFoundException | Error {
  if (
    error instanceof PayoutRecipientRailNotFoundError ||
    error instanceof PayoutSourceWalletNotFoundError
  ) {
    return new NotFoundException(error.message);
  }

  if (
    error instanceof PayoutRecipientRailNotReadyError ||
    error instanceof PayoutRecipientRailCurrencyMismatchError ||
    error instanceof ProviderManagedRecipientRailMissingReferenceError ||
    error instanceof InsufficientWalletBalanceError
  ) {
    return new BadRequestException(error.message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new BadRequestException('Payout request could not be processed');
}
