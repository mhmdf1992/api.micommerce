export interface IUserActivity{
    tenant_id: string;
    user_id: string;
    username: string;
    action: string;
    path: string;
    reference?: string;
    message?: string;
    created_on: Date;
}