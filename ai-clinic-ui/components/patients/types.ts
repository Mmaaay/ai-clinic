export type VitalsSnapshot = {
  bp: string | null;
  hr: string | null;
  temp: string | null;
  spo2: string | null;
  createdAt?: string | null;
};

export type Patient = {
  id: string;
  name: string;
  age: number | null;
  phone: string | null;
  createdAt: string;
  vitals?: VitalsSnapshot | null;
};
