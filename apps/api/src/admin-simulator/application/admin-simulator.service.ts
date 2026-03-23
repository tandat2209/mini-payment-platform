import { BadGatewayException, Injectable, Logger } from '@nestjs/common';

import { toStructuredLog } from '../../shared/logging/structured-log';
import type {
  AdminSimulatorFundingRequest,
  AdminSimulatorFundingResponse,
} from '../domain/admin-simulator.types';

@Injectable()
export class AdminSimulatorService {
  private readonly logger = new Logger(AdminSimulatorService.name);

  async simulateFunding(
    request: AdminSimulatorFundingRequest,
  ): Promise<AdminSimulatorFundingResponse> {
    const targetUrl = `${this.getSimulatorBaseUrl()}/simulate/funding`;
    this.logger.log(
      toStructuredLog({
        amountMinor: request.amountMinor,
        currency: request.currency,
        destinationIdentifier: request.destinationIdentifier,
        destinationType: request.destinationType,
        event: 'admin_simulator_dispatch_started',
        externalEventId: request.externalEventId,
        targetUrl,
      }),
    );

    const response = await fetch(targetUrl, {
      body: JSON.stringify(request),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    });
    const responseBody = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      const errorMessage =
        typeof responseBody.error === 'object' &&
        responseBody.error !== null &&
        'message' in responseBody.error
          ? String(responseBody.error.message)
          : `Admin simulator request failed with status ${response.status}`;

      this.logger.error(
        toStructuredLog({
          event: 'admin_simulator_dispatch_failed',
          externalEventId: request.externalEventId,
          message: errorMessage,
          statusCode: response.status,
          targetUrl,
        }),
      );

      throw new BadGatewayException(errorMessage);
    }

    const typedResponse = responseBody as AdminSimulatorFundingResponse;
    this.logger.log(
      toStructuredLog({
        deliveryTarget: typedResponse.deliveryTarget,
        event: 'admin_simulator_dispatch_completed',
        externalEventId: typedResponse.externalEventId,
        receiverDuplicate:
          typeof typedResponse.receiverResponse.duplicate === 'boolean'
            ? typedResponse.receiverResponse.duplicate
            : undefined,
        receiverProcessingStatus:
          typeof typedResponse.receiverResponse.processingStatus === 'string'
            ? typedResponse.receiverResponse.processingStatus
            : undefined,
      }),
    );

    return typedResponse;
  }

  private getSimulatorBaseUrl(): string {
    return (process.env.ADMIN_SIMULATOR_BASE_URL ?? 'http://127.0.0.1:3002').replace(/\/$/, '');
  }
}
