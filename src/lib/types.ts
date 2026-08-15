export type Product = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  stock: number;
  category: string;
  active: boolean;
};

export type Profile = {
  id: string;
  name: string;
  phone: string;
  premium_status: boolean;
  premium_unlocked_at: string | null;
  referral_code: string;
};

export type PointTx = {
  id: string;
  transaction_type: "earned" | "redeemed";
  amount: number;
  description: string;
  created_at: string;
};

export type PaymentState =
  | "idle"
  | "initiated"
  | "waiting"
  | "successful"
  | "failed"
  | "cancelled"
  | "timeout";

export const PREMIUM_PRICE = 1;
