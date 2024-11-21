
export interface IGetAllClientsRequest {
    page?: number;
    limit?: number;
    searchParameter?: string;
}

export interface IChangeNotificationStatusRequest {
    notificationId: number;
    status: number;
}

export interface IClientRequest {
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
