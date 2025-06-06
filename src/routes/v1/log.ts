import express from 'express';
import { NotFound } from '../../errors/not-found';
import { IFilter } from '../../dtos/filter';
import { container } from '../../ioc-container';
import { types } from '../../ioc-types';
import { ILogService } from '../../services/log';
export const  logRoutes = express.Router();

logRoutes.get('/', async (req, res, next) => {
    const tenant_id = req.jwtPayload.tenant_id;
    const filter: IFilter = {
        page: parseInt(req.query.page as string, 10) || 1,
        page_size: parseInt(req.query.page_size as string, 10) || 12,
        sort: {
            "field": "created_on",
            "order": "descending"
        }
    }
    const service = container.get<ILogService>(types.LogService);
    try{
        const result = await service.getMany(filter, tenant_id);
        res.body(result);
    }catch(err){
        return next(err);
    }
});

logRoutes.get('/:id', async (req, res, next) => {
    try{
        const service = container.get<ILogService>(types.LogService);
        const log = await service.get(req.params.id);
        if(!log)
            throw new NotFound("Log does not exists.");
        res.body(log)
    }catch(err){
        return next(err);
    }
});

logRoutes.post('/filters', async (req, res, next) => {
    const tenant_id = req.jwtPayload.tenant_id;
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
    const service = container.get<ILogService>(types.LogService);
    try{
        const result = await service.getMany(filter, tenant_id);
        res.body(result);
    }catch(err){
        return next(err);
    }
});