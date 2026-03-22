import { Global, Module } from '@nestjs/common';

import { CurrentCustomerGuard } from './current-customer.guard';
import { CurrentCustomerService } from './current-customer.service';

@Global()
@Module({
  providers: [CurrentCustomerService, CurrentCustomerGuard],
  exports: [CurrentCustomerService, CurrentCustomerGuard],
})
export class CustomerAccessModule {}
