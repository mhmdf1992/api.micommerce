import express from 'express';
import { NotFound } from '../../errors/not-found';
import { MongoClient, ObjectId } from 'mongodb';
import { IPagedList } from '../../dtos/paged-list';
import { IFilter } from '../../dtos/filter';
import { AggregateBuilder } from '../../data/helpers/aggregate-builder';
import { ILogItem } from '../../data/models/log-item';
import { container } from '../../ioc-container';
import { types } from '../../ioc-types';
export const  logRoutes = express.Router();

logRoutes.get('/', async (req, res, next) => {
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
    const aggregate = AggregateBuilder.build(filter);
    try{
        const mongoClient = container.get<MongoClient>(types.MongoClient);
        const result = 
         await mongoClient
            .db()
            .collection<ILogItem>("logs")
            .aggregate(aggregate)
            .toArray();
        const pagedList: IPagedList<ILogItem> = {
            items: result[0].data,
            page: filter.page,
            page_size: filter.page_size,
            total_items: result[0].data.length == 0 ? 0 : result[0].metadata[0].total,
            total_pages: result[0].data.length == 0 ? 0 : Math.ceil(result[0].metadata[0].total / filter.page_size) | 0
        }
        res.body(pagedList);
    }catch(err){
        return next(err);
    }
});
logRoutes.get('/:id', async (req, res, next) => {
    
    const id = req.params.id;
    const mongoClient = container.get<MongoClient>(types.MongoClient);
    try{
        if(!ObjectId.isValid(id))
            throw new NotFound(`resource does not exist`);
        const user = 
         await mongoClient
            .db()
            .collection<ILogItem>("logs")
            .findOne({ _id: ObjectId.createFromHexString(id) });
        if(!user)
            throw new NotFound(`resource does not exist`);
        res.body(user);
    }catch(err){
        return next(err);
    }
});