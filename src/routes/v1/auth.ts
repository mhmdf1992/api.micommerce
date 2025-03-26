import express from 'express';
import { ILogin } from '../../dtos/auth/login';
import { container } from '../../ioc-container';
import { IUserService } from '../../services/user';
import { types } from '../../ioc-types';
import { ITenantService } from '../../services/tenant';
import { ArgumentError } from '../../errors/argument';
export const  authRoutes = express.Router();

authRoutes.post('/login', async (req, res, next) => {
    const tenantService = container.get<ITenantService>(types.TenantService);
    const userService = container.get<IUserService>(types.UserService);
    const user = req.body as ILogin;
    const tenant = await tenantService.getByDomain(user.domain);
    try{
        if(!tenant)
            throw new ArgumentError("domain", "Domain does not belong to any tenant.");
        const response = await userService.authenticate(user.username, user.password, tenant._id.toHexString());
        res.body(response);
    }catch(err){
        return next(err);
    }
});

authRoutes.post('/super-login', async (req, res, next) => {
    const tenantService = container.get<ITenantService>(types.TenantService);
    const userService = container.get<IUserService>(types.UserService);
    const user = req.body as ILogin;
    const tenant = await tenantService.getByDomain(user.domain);
    try{
        if(!tenant)
            throw new ArgumentError("domain", "Domain does not belong to any tenant.");
        const response = await userService.authenticateSuper(user.username, user.password, tenant._id.toHexString());
        res.body(response);
    }catch(err){
        return next(err);
    }
});