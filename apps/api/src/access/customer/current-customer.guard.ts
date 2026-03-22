import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { REQUEST_CURRENT_CUSTOMER_KEY } from './current-customer.constants';
import { CurrentCustomerService } from './current-customer.service';

@Injectable()
export class CurrentCustomerGuard implements CanActivate {
  constructor(private readonly currentCustomerService: CurrentCustomerService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const headers = (request.headers as Record<string, unknown> | undefined) ?? {};
    const currentCustomer = await this.currentCustomerService.resolveCurrentCustomer(headers);

    request[REQUEST_CURRENT_CUSTOMER_KEY] = currentCustomer;

    return true;
  }
}
