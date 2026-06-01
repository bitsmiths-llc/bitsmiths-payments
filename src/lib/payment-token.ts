import jwt from 'jsonwebtoken';

export type PaymentPayload = {
  customerId: string;
  customerName: string;
  amount: number;
  description: string;
};

export function signPaymentToken(payload: PaymentPayload, secret: string): string {
  return jwt.sign(payload, secret);
}

export function verifyPaymentToken(
  token: string,
  secret: string,
): PaymentPayload | null {
  try {
    return jwt.verify(token, secret) as PaymentPayload;
  } catch {
    return null;
  }
}
