import express from 'express';
import { ICreateUser } from '../../dtos/user/create-user';
import { ICreateUserResponse } from '../../dtos/user/create-user-response';
import { IUserService, UserService } from '../../services/user';
import { ArgumentError } from '../../errors/argument';
import { IFilter } from '../../dtos/filter';
import { NotFound } from '../../errors/not-found';
import { IUpdateUser } from '../../dtos/user/update-user';
import { container } from '../../ioc-container';
import { types } from '../../ioc-types';
export const  userRoutes = express.Router();

userRoutes.post('/', async (req, res, next) => {
    const user = req.body as ICreateUser;
    const tenant_id = req.jwtPayload.tenant_id;
    try{
        const service = container.get<IUserService>(types.UserService);
        UserService.validateUsername(user.username);
        if(await service.usernameExists(user.username, tenant_id))
            throw new ArgumentError("username", "Username already exists.");
        UserService.validatePassword(user.password);
        const id = await service.create(user, tenant_id);
        const response: ICreateUserResponse = {
            _id: id.toString()
        }
        res.body(response)
    }catch(err){
        return next(err);
    }
});

userRoutes.get('/', async (req, res, next) => {
    const tenant_id = req.jwtPayload.tenant_id;
    const filter: IFilter = {
        page: parseInt(req.body.page as string, 10) || 1,
        page_size: parseInt(req.body.page_size as string, 10) || 12,
        equal: req.body.equal,
        regex: req.body.regex,
        between: req.body.between,
        sort: req.body.sort ?? {
            "field": "created_on",
            "order": "descending"
        }
    }
    const service = container.get<IUserService>(types.UserService);
    try{
        const result = await service.getMany(filter, tenant_id);
        res.body(result);
    }catch(err){
        return next(err);
    }
});

userRoutes.get('/:id', async (req, res, next) => {
    try{
        UserService.validateId(req.params.id);
        const service = container.get<IUserService>(types.UserService);
        const user = await service.get(req.params.id);
        if(!user)
            throw new NotFound("User does not exists.");
        res.body(user)
    }catch(err){
        return next(err);
    }
})

userRoutes.delete('/:id', async (req, res, next) => {
    try{
        UserService.validateId(req.params.id);
        const service = container.get<IUserService>(types.UserService);
        if(!await service.exists(req.params.id))
            throw new NotFound("User does not exists.");
        await service.delete(req.params.id);
        res.body();
    }catch(err){
        return next(err);
    }
})

userRoutes.put('/:id', async (req, res, next) => {
    const user = req.body as IUpdateUser;
    const service = container.get<IUserService>(types.UserService);
    try{
        UserService.validateId(req.params.id);
        if(!await service.exists(req.params.id))
            throw new NotFound("User does not exists.");
        await service.replace(req.params.id, user);
        res.body();
    }catch(err){
        return next(err);
    }
});

userRoutes.patch('/:id', async (req, res, next) => {
    const user = req.body as IUpdateUser;
    const service = container.get<IUserService>(types.UserService);
    try{
        UserService.validateId(req.params.id);
        if(!await service.exists(req.params.id))
            throw new NotFound("User does not exists.");
        await service.update(req.params.id, user);
        res.body();
    }catch(err){
        return next(err);
    }
});