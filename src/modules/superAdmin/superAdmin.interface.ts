
export interface IGetAllUsersRequest {
    page?: number;
    limit?: number;
    searchParameter?: string;
}

export interface IChangeNotificationStatusRequest {
    notificationId: number;
    status: number;
}

export interface IUserRequest {
    user_id: number
    full_name: string;
    email: string;
    password: string;
    role: string;
    permissions: string;
    phoneNo: string;
}

export interface ISignInRequest {
    email: string;
    password: string;
}


export interface IGetAllUsersRequest {
    page?: number;
    limit?: number;
    searchParameter?: string;
    company_name?: string;
    company_address?: string;
    start_date?: string;
    end_date?: string;
    payment_method?: string;
    status?: string;
    isExportToEmail?: boolean;
    recipientEmail?: string;
    full_name?: string;
    email?: string;
    phoneNo?: string;
    role?: string;
    permissions?: string;
    password?: string;
    created_at?: string;
    gst?: string;
    pan?: string;
    industry_type?: string;
    cost?: string;
}

export interface ICreateClientRequest {
    user_id?: string;
    company_name: string;
    company_address: string;
    payment_method: string;
    gst_number: string;
    pan_number: string;
    industry_type: string;
    company_id: string;
    status: string;
    plan_id: string;
    plan_type: string;
    cost: number;
    id: number;
}


export interface ICreateLicenseRequest {
    license_id?: string;
    user_id: string;
    issue_date: string;
    expiry_date: string;
    // license_type: string;
    status: string;
    // company_id: string;
    // company_name: string;
    // company_pan: string;
}

export interface ICreateAuditLogRequest {
   module: string;
   action: string;
}


export interface ICreateNotificationRequest {
    title: string;
    message: string;
    type: string;
    expiry_date: string;
    user_ids: number[];
}

export interface IGetNotificationRequest {
    notificationId: number;
}