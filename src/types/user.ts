export type UserRecord = {
  _id: string;
  username: string;
  name: string;
  role: "admin" | "field";
  isActive: boolean;
  createdAt?: Date | string;
  budgetLimit?: {
    totalLimit?: number;
    spentAmount?: number;
    availableAmount?: number;
    updatedAt?: Date | string;
    updatedBy?: string;
  };
};
