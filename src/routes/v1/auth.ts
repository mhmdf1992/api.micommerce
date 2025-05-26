import express from 'express';
import { body } from 'express-validator';
import { ILogin } from '../../dtos/auth/login';
import { container } from '../../ioc-container';
import { IUserService } from '../../services/user';
import { types } from '../../ioc-types';
import { ITenantService } from '../../services/tenant';
import { ArgumentError } from '../../errors/argument';
import { validate } from './validate';
export const  authRoutes = express.Router();

authRoutes.post(
 '/login', 
 validate([
    body('username').matches(/^[a-z][a-z0-9_.]{6,24}$/).withMessage("Username is not valid"),
    body('password').matches(/[a-zA-Z0-9_.@$]{6,24}$/).withMessage("Password is not valid."), 
    body('domain').notEmpty()]), 
 async (req, res, next) => {
    const tenantService = container.get<ITenantService>(types.TenantService);
    const userService = container.get<IUserService>(types.UserService);
    const user = req.body as ILogin;
    const tenant = await tenantService.getByDomain(user.domain);
    try{
        if(!tenant)
            throw new ArgumentError("domain", "Domain does not belong to any tenant.");
        const response = await userService.authenticate(user.username, user.password, tenant._id.toHexString());
        res.body(response);
        res.activity({ 
            tenant_id: tenant._id,
            user_id: response.user_id,
            username: user.username,
            message: "logged in"
        });
    }catch(err){
        return next(err);
    }
});

authRoutes.post(
 '/super-login', 
 validate([
  body('username').matches(/^[a-z][a-z0-9_.]{6,24}$/).withMessage("Username is not valid."),
  body('password').matches(/[a-zA-Z0-9_.@$]{6,24}$/).withMessage("Password is not valid."), 
  body('domain').notEmpty()]), 
 async (req, res, next) => {
    const tenantService = container.get<ITenantService>(types.TenantService);
    const userService = container.get<IUserService>(types.UserService);
    const user = req.body as ILogin;
    const tenant = await tenantService.getByDomain(user.domain);
    try{
        if(!tenant)
            throw new ArgumentError("domain", "Domain does not belong to any tenant.");
        const response = await userService.authenticateSuper(user.username, user.password, tenant._id.toHexString());
        res.body(response);
        res.activity({ 
            tenant_id: tenant._id,
            user_id: response.user_id,
            username: user.username,
            message: "logged in" 
        });
    }catch(err){
        return next(err);
    }
});