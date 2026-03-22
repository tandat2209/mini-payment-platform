import { Injectable, UnauthorizedException } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import { type CurrentCustomer } from './current-customer.types';

type UserRow = {
  external_ref: string;
  id: string;
};

@Injectable()
export class CurrentCustomerService {
  constructor(private readonly databaseService: DatabaseService) {}

  async resolveCurrentCustomer(headers: Record<string, unknown>): Promise<CurrentCustomer> {
    const customerId = this.getHeaderValue(headers, 'x-customer-id');
    const customerExternalRef = this.getHeaderValue(headers, 'x-customer-external-ref');

    if (!customerId && !customerExternalRef) {
      throw new UnauthorizedException(
        'Provide x-customer-id or x-customer-external-ref for customer API requests',
      );
    }

    const result = customerId
      ? await this.databaseService.query<UserRow>(
          `
            SELECT id, external_ref
            FROM users
            WHERE id = $1
            LIMIT 1
          `,
          [customerId],
        )
      : await this.databaseService.query<UserRow>(
          `
            SELECT id, external_ref
            FROM users
            WHERE external_ref = $1
            LIMIT 1
          `,
          [customerExternalRef],
        );

    const user = result.rows[0];

    if (!user) {
      throw new UnauthorizedException('Invalid customer identity header');
    }

    return {
      externalRef: user.external_ref,
      id: user.id,
    };
  }

  private getHeaderValue(headers: Record<string, unknown>, key: string): string | null {
    const headerValue = headers[key];

    if (Array.isArray(headerValue)) {
      return typeof headerValue[0] === 'string' && headerValue[0].trim().length > 0
        ? headerValue[0].trim()
        : null;
    }

    return typeof headerValue === 'string' && headerValue.trim().length > 0
      ? headerValue.trim()
      : null;
  }
}
