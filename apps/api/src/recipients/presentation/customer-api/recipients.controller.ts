import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { CurrentCustomer } from '../../../access/customer/current-customer.decorator';
import { CurrentCustomerGuard } from '../../../access/customer/current-customer.guard';
import { type CurrentCustomer as CurrentCustomerView } from '../../../access/customer/current-customer.types';
import { toIsoTimestamp } from '../../../shared/api/api-primitives';
import { GetRecipientsQuery } from '../../application/queries/get-recipients.query';
import { RecipientOnboardingService } from '../../application/recipient-onboarding.service';
import {
  RecipientNotFoundError,
  RecipientRailValidationError,
  UnsupportedRecipientRailConfigurationError,
} from '../../domain/recipient-onboarding.types';
import {
  type RecipientDetailView,
  type RecipientListItemView,
} from '../../domain/recipient-query.repository';
import {
  CreateRecipientDto,
  CreateRecipientRailDto,
  RecipientRequirementsQueryDto,
} from './recipient-onboarding.dto';

type RecipientListResponse = {
  createdAt: string | null;
  id: string;
  name: string;
  rails: Array<{
    countryCode: string;
    currency: string | null;
    id: string;
    isDefault: boolean;
    payoutReady: boolean;
    providerRegistrationError: string | null;
    providerRegistrationStrategy: string;
    rail: string;
    readinessStatus: string;
  }>;
  status: string;
};

type RecipientDetailResponse = RecipientListResponse & {
  rails: Array<{
    countryCode: string;
    currency: string | null;
    details: Record<string, string>;
    id: string;
    isDefault: boolean;
    payoutReady: boolean;
    providerRegistrationError: string | null;
    providerRegistrationStrategy: string;
    rail: string;
    readinessStatus: string;
  }>;
};

type RecipientCreateResponse = RecipientListResponse;

type RecipientRequirementResponse = {
  countryCode: string;
  currency: string;
  fields: Array<{
    key: string;
    kind: string;
    label: string;
    required: boolean;
  }>;
  initialReadinessStatus: string;
  providerRegistrationStrategy: string;
  rail: string;
};

@UseGuards(CurrentCustomerGuard)
@Controller('customers/me/recipients')
export class RecipientsController {
  constructor(
    private readonly getRecipientsQuery: GetRecipientsQuery,
    private readonly recipientOnboardingService: RecipientOnboardingService,
  ) {}

  @Get('requirements')
  @UsePipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  )
  getRecipientRequirements(
    @Query() query: RecipientRequirementsQueryDto,
  ): RecipientRequirementResponse {
    try {
      return this.recipientOnboardingService.getRequirements(query);
    } catch (error) {
      throw this.mapOnboardingError(error);
    }
  }

  @Get()
  async listRecipients(
    @CurrentCustomer() customer: CurrentCustomerView,
  ): Promise<{ items: RecipientListResponse[] }> {
    const recipients = await this.getRecipientsQuery.list(customer);

    return {
      items: recipients.map((recipient) => this.toListResponse(recipient)),
    };
  }

  @Get(':recipientId')
  async getRecipientDetail(
    @CurrentCustomer() customer: CurrentCustomerView,
    @Param('recipientId') recipientId: string,
  ): Promise<RecipientDetailResponse> {
    const recipient = await this.getRecipientsQuery.getDetail(customer, recipientId);

    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    return this.toDetailResponse(recipient);
  }

  @Post()
  @UsePipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  )
  async createRecipient(
    @CurrentCustomer() customer: CurrentCustomerView,
    @Body() body: CreateRecipientDto,
  ): Promise<RecipientCreateResponse> {
    try {
      const result = await this.recipientOnboardingService.createRecipientWithRail({
        countryCode: body.rail.countryCode,
        currency: body.rail.currency,
        customerId: customer.id,
        details: body.rail.details,
        rail: body.rail.rail,
        recipientName: body.name,
        ...(body.rail.isDefault === undefined ? {} : { isDefault: body.rail.isDefault }),
      });

      return {
        createdAt: null,
        id: result.recipient.id,
        name: result.recipient.name,
        rails: [this.toRailResponse(result.rail)],
        status: result.recipient.status,
      };
    } catch (error) {
      throw this.mapOnboardingError(error);
    }
  }

  @Post(':recipientId/rails')
  @UsePipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  )
  async addRecipientRail(
    @CurrentCustomer() customer: CurrentCustomerView,
    @Param('recipientId', new ParseUUIDPipe({ version: '4' })) recipientId: string,
    @Body() body: CreateRecipientRailDto,
  ): Promise<{ rail: RecipientListResponse['rails'][number] }> {
    try {
      const rail = await this.recipientOnboardingService.addRailToRecipient({
        countryCode: body.countryCode,
        currency: body.currency,
        customerId: customer.id,
        details: body.details,
        rail: body.rail,
        recipientId,
        ...(body.isDefault === undefined ? {} : { isDefault: body.isDefault }),
      });

      return {
        rail: this.toRailResponse(rail),
      };
    } catch (error) {
      throw this.mapOnboardingError(error);
    }
  }

  private toListResponse(recipient: RecipientListItemView): RecipientListResponse {
    return {
      createdAt: toIsoTimestamp(recipient.createdAt),
      id: recipient.id,
      name: recipient.name,
      rails: recipient.rails.map((rail) => this.toRailResponse(rail)),
      status: recipient.status,
    };
  }

  private toDetailResponse(recipient: RecipientDetailView): RecipientDetailResponse {
    return {
      createdAt: toIsoTimestamp(recipient.createdAt),
      id: recipient.id,
      name: recipient.name,
      rails: recipient.rails.map((rail) => ({
        ...this.toRailResponse(rail),
        details: rail.details,
      })),
      status: recipient.status,
    };
  }

  private toRailResponse(
    rail:
      | RecipientListItemView['rails'][number]
      | RecipientDetailView['rails'][number]
      | {
          countryCode: string;
          currency: string | null;
          id: string;
          isDefault: boolean;
          providerRegistrationError: string | null;
          providerRegistrationStrategy: string;
          rail: string;
          readinessStatus: string;
        },
  ): RecipientListResponse['rails'][number] {
    return {
      countryCode: rail.countryCode,
      currency: rail.currency,
      id: rail.id,
      isDefault: rail.isDefault,
      payoutReady: rail.readinessStatus === 'active',
      providerRegistrationError: rail.providerRegistrationError,
      providerRegistrationStrategy: rail.providerRegistrationStrategy,
      rail: rail.rail,
      readinessStatus: rail.readinessStatus,
    };
  }

  private mapOnboardingError(error: unknown): Error {
    if (error instanceof UnsupportedRecipientRailConfigurationError) {
      return new BadRequestException(error.message);
    }

    if (error instanceof RecipientRailValidationError) {
      return new BadRequestException({
        error: 'RECIPIENT_RAIL_VALIDATION_FAILED',
        message: error.message,
        missingFields: error.missingFields,
      });
    }

    if (error instanceof RecipientNotFoundError) {
      return new NotFoundException('Recipient not found');
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Recipient onboarding failed');
  }
}
