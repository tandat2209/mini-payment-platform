import { randomUUID } from 'node:crypto';

import { Injectable, UnprocessableEntityException } from '@nestjs/common';

import {
  type RegisterBeneficiaryRequest,
  type RegisterBeneficiaryResponse,
} from './beneficiaries.types';

@Injectable()
export class BeneficiariesService {
  async registerBeneficiary(
    request: RegisterBeneficiaryRequest,
  ): Promise<RegisterBeneficiaryResponse> {
    validateBeneficiaryRequest(request);

    return {
      beneficiaryId: `bene_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      countryCode: request.countryCode,
      currency: request.currency,
      provider: 'psp_sandbox',
      rail: request.rail,
      recipientName: request.recipientName,
      registeredAt: new Date().toISOString(),
      status: 'active',
    };
  }
}

function validateBeneficiaryRequest(request: RegisterBeneficiaryRequest): void {
  if (request.rail === 'sepa') {
    const iban = typeof request.details.iban === 'string' ? request.details.iban.trim() : '';

    if (!iban || !/^[A-Z]{2}[A-Z0-9]{13,32}$/u.test(iban.toUpperCase())) {
      throw new UnprocessableEntityException({
        error: 'BENEFICIARY_VALIDATION_FAILED',
        message: 'Valid IBAN is required for SEPA beneficiary registration',
      });
    }

    return;
  }

  const accountNumber =
    typeof request.details.accountNumber === 'string' ? request.details.accountNumber.trim() : '';
  const swiftCode =
    typeof request.details.swiftCode === 'string' ? request.details.swiftCode.trim() : '';

  if (!accountNumber) {
    throw new UnprocessableEntityException({
      error: 'BENEFICIARY_VALIDATION_FAILED',
      message: 'Account number is required for SWIFT beneficiary registration',
    });
  }

  if (!/^[A-Z0-9]{8}([A-Z0-9]{3})?$/u.test(swiftCode.toUpperCase())) {
    throw new UnprocessableEntityException({
      error: 'BENEFICIARY_VALIDATION_FAILED',
      message: 'Valid SWIFT/BIC is required for SWIFT beneficiary registration',
    });
  }
}
