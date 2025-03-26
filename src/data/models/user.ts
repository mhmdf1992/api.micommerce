import { ObjectId } from "mongodb";

export interface IUser{
    _id: ObjectId;
    tenant_id?: string;
    username: string;
    password: string;
    firstname: string;
    lastname: string;
    created_on: Date;
    updated_on?: Date;
    role: UserRole;
    disabled: boolean;
}
export enum UserRole{
    SUPER_USER = 1,
    ADMIN = 2
}