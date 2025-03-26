import { container } from "../ioc-container";
import { types } from "../ioc-types";
import { ITenantService } from "../services/tenant";
import { IUserService } from "../services/user";
import { UserRole } from "./models/user";

export const seed = async () => {
    const tenantService = container.get<ITenantService>(types.TenantService);
    const userService = container.get<IUserService>(types.UserService);
    if(!await tenantService.getByName("default")){
        await tenantService.create({
            name: "default",
            domain: process.env.DEFAULT_TENANT_DOMAIN
        });
    }
        
    if(!await userService.superRoleExists()){
        await userService.create({
            firstname: "super",
            lastname: "user",
            username: process.env.SUPER_USER,
            password: process.env.SUPER_USER_PASSWORD,
            role: UserRole.SUPER_USER,
            disabled: false
        }, null);
    }
}