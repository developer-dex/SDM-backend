export interface ILoginRequest {
    email: string;
    password: string;
}

export interface ISignUpRequest {
    email: string;
    password: string;
    full_name: string;
}

export interface ILoginResponse {
    authorization_token: string;
    user_id: string;
    redirect_url: string;
}

export interface IForgetPasswordRequest {
    email: string;
}

export interface IResetPasswordRequest {
    reset_password_token: string
    new_password: string;
    confirm_password: string;
}
