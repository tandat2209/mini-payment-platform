import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { REQUEST_CURRENT_CUSTOMER_KEY } from './current-customer.constants';
import { type CurrentCustomer as CurrentCustomerView } from './current-customer.types';

export const CurrentCustomer = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentCustomerView => {
    const request = context.switchToHttp().getRequest<Record<string, unknown>>();

    return request[REQUEST_CURRENT_CUSTOMER_KEY] as CurrentCustomerView;
  },
);
