import { ContainerTypes, ValidatedRequestSchema } from "express-joi-validation";

export interface IValidationRequestSchema<T> extends ValidatedRequestSchema {
    baseUrl: string;
    [ContainerTypes.Query]: T;
}

export interface IValidationRequestBodySchema<T>
    extends ValidatedRequestSchema {
    [ContainerTypes.Body]: T;
}

export interface IScheduleDemoBody {
    fullName: string;
    phoneNo: string;
    emailAddress: string;
    companyName: string;
    jobTitle?: string;
    industry: string;
    companySize: number;
    preferredDate: Date;
    preferredTime: string;
}
