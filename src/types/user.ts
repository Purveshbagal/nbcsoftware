export type UserRecord = {
  _id: string;
  username: string;
  name: string;
  role: "admin" | "field";
  isActive: boolean;
  createdAt?: Date | string;
};
