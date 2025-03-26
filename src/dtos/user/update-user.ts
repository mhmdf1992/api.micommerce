import { UserRole } from "../../data/models/user";

export interface IUpdateUser{
    password: string;
    firstname: string;
    lastname: string;
    role: UserRole;
    disabled: boolean;
}