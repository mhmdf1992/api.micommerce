import { UserRole } from "../../data/models/user";

export interface ICreateUser{
    username: string;
    password: string;
    firstname: string;
    lastname: string;
    role: UserRole;
    disabled?: boolean;
}