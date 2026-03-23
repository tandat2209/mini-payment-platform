import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import {
  type WalletFundingDetailsQueryRepository,
  type WalletFundingDetailsView,
} from '../domain/wallet-funding-details-query.repository';

type FundingDetailRow = {
  funding_detail_currency: string | null;
  funding_detail_details: Record<string, unknown> | null;
  funding_detail_id: string | null;
  funding_detail_rail: string | null;
  funding_detail_updated_at: Date | string | null;
  wallet_id: string;
  wallet_status: string;
};

@Injectable()
export class SqlWalletFundingDetailsQueryRepository implements WalletFundingDetailsQueryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getActiveWalletFundingDetails(
    customerId: string,
  ): Promise<WalletFundingDetailsView | null> {
    const result = await this.databaseService.query<FundingDetailRow>(
      `
        SELECT
          w.id AS wallet_id,
          w.status AS wallet_status,
          wfd.id AS funding_detail_id,
          wfd.rail AS funding_detail_rail,
          wfd.currency AS funding_detail_currency,
          wfd.details AS funding_detail_details,
          wfd.updated_at AS funding_detail_updated_at
        FROM wallets w
        LEFT JOIN wallet_funding_details wfd
          ON wfd.wallet_id = w.id
         AND wfd.is_active = TRUE
        WHERE w.user_id = $1
          AND w.status = 'active'
        ORDER BY wfd.currency ASC NULLS LAST, wfd.rail ASC NULLS LAST, wfd.id ASC NULLS LAST
      `,
      [customerId],
    );

    const firstRow = result.rows[0];

    if (!firstRow) {
      return null;
    }

    return {
      fundingDetails: result.rows
        .filter((row) => row.funding_detail_id !== null)
        .map((row) => ({
          currency: row.funding_detail_currency ?? 'USD',
          details: row.funding_detail_details ?? {},
          id: row.funding_detail_id ?? '',
          rail: row.funding_detail_rail ?? 'bank_transfer',
          updatedAt: row.funding_detail_updated_at,
        })),
      walletId: firstRow.wallet_id,
      walletStatus: firstRow.wallet_status,
    };
  }
}
