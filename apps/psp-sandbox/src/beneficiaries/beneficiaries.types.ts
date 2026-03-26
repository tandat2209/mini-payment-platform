export type RegisterBeneficiaryRequest = {
  countryCode: string;
  currency: string;
  details: Record<string, unknown>;
  rail: 'sepa' | 'swift';
  recipientName: string;
};

export type RegisterBeneficiaryResponse = {
  beneficiaryId: string;
  countryCode: string;
  currency: string;
  provider: 'psp_sandbox';
  rail: 'sepa' | 'swift';
  recipientName: string;
  registeredAt: string;
  status: 'active';
};
