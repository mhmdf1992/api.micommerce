import express from 'express';
import { IUserService } from '../../services/user';
import { IFilter } from '../../dtos/filter';
import { NotFound } from '../../errors/not-found';
import { container } from '../../ioc-container';
import { types } from '../../ioc-types';
import { ICreateTenant } from '../../dtos/tenant/create-tenant';
import { ITenantService } from '../../services/tenant';
import { ICreateTenantResponse } from '../../dtos/tenant/create-tenant-response';
import { UserRole } from '../../data/models/user';
import { body, param } from 'express-validator';
import { validate } from './validate';
import { IUpdateTenant } from '../../dtos/tenant/update-tenant';
export const  tenantRoutes = express.Router();

tenantRoutes.post('/', 
 validate([
    body('name').notEmpty(),
    body('domain').notEmpty(), 
    body('disabled').isBoolean().optional()]),
 async (req, res, next) => {
    const tenant = req.body as ICreateTenant;
    try{
        const tenantService = container.get<ITenantService>(types.TenantService);
        const userService = container.get<IUserService>(types.UserService);
        const tenant_id = await tenantService.create(tenant);
        const admin_user = {
            firstname: "admin",
            lastname: "admin",
            username: "administrator",
            password: "administrator",
            role: UserRole.ADMIN,
            disabled: false
        };
        await userService.create(admin_user, tenant_id.toHexString());
        const response: ICreateTenantResponse = {
            _id: tenant_id.toHexString(),
            admin_username: admin_user.username,
            admin_password: admin_user.password
        }
        res.body(response)
        res.activity({ 
            action: "created",
            entity: "tenant",
            value: tenant.name 
        });
    }catch(err){
        return next(err);
    }
});

tenantRoutes.get('/', async (req, res, next) => {
    const filter: IFilter = {
        page: parseInt(req.query.page as string, 10) || 1,
        page_size: parseInt(req.query.page_size as string, 10) || 12,
        sort: {
            "field": "created_on",
            "order": "descending"
        }
    }
    const service = container.get<ITenantService>(types.TenantService);
    try{
        const result = await service.getMany(filter);
        res.body(result);
    }catch(err){
        return next(err);
    }
});

tenantRoutes.get('/:id', async (req, res, next) => {
    try{
        const service = container.get<ITenantService>(types.TenantService);
        const tenant = await service.get(req.params.id);
        if(!tenant)
            throw new NotFound("Tenant does not exists.");
        res.body(tenant)
    }catch(err){
        return next(err);
    }
})

tenantRoutes.delete('/:id', async (req, res, next) => {
    try{
        const service = container.get<ITenantService>(types.TenantService);
        if(!await service.exists(req.params.id))
            throw new NotFound("Tenant does not exists.");
        await service.delete(req.params.id);
        res.activity = { 
            action: "deleted",
            entity: "tenant",
            value: req.params.id
        }
        res.body();
        res.activity({
            entity: "tenant",
            action: "deleted",
            value: req.params.id
        });
    }catch(err){
        return next(err);
    }
})

tenantRoutes.put(
 '/:id',
 validate([
    body('name').notEmpty(),
    body('domain').notEmpty(), 
    body('disabled').isBoolean().optional()
 ]), 
 async (req, res, next) => {
    const tenant = req.body as IUpdateTenant;
    const service = container.get<ITenantService>(types.TenantService);
    try{
        if(!await service.exists(req.params.id))
            throw new NotFound("Tenant does not exists.");
        await service.replace(req.params.id, tenant);
        res.body();
        res.activity({ 
            action: "replaced",
            entity: "tenant",
            value: tenant.name 
        });
    }catch(err){
        return next(err);
    }
});

tenantRoutes.patch(
 '/:id',
 validate([
    body('name').notEmpty().optional(),
    body('domain').notEmpty().optional(), 
    body('disabled').isBoolean().optional()
 ]), 
 async (req, res, next) => {
    const tenant = req.body as IUpdateTenant;
    const service = container.get<ITenantService>(types.TenantService);
    try{
        if(!await service.exists(req.params.id))
            throw new NotFound("Tenant does not exists.");
        await service.update(req.params.id, tenant);
        res.body();
        res.activity({ 
            action: "updated",
            entity: "tenant",
            value: tenant.name 
        });
    }catch(err){
        return next(err);
    }
});

tenantRoutes.post('/filters', async (req, res, next) => {
    const filter: IFilter = {
        page: parseInt(req.query.page as string, 10) || 1,
        page_size: parseInt(req.query.page_size as string, 10) || 12,
        equal: req.body.equal,
        regex: req.body.regex,
        between: req.body.between,
        sort: req.body.sort ?? {
            "field": "created_on",
            "order": "descending"
        }
    }
    const service = container.get<ITenantService>(types.TenantService);
    try{
        const result = await service.getMany(filter);
        res.body(result);
    }catch(err){
        return next(err);
    }
});