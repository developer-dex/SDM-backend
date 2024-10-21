// Define an interface for the plan creation request
export interface ICreatePlanRequest {
    period: string;
    interval: number;
    itemName: string;
    amount: number;
    currency: string;
}

export enum EPlanStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
}
