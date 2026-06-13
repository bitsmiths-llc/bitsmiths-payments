import jwt from 'jsonwebtoken';

export type LineItem = {
  name: string;
  description?: string;
  amount: number; // in cents
};

export type PaymentPayload = {
  customerId: string;
  customerName: string;
  items: LineItem[];
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
