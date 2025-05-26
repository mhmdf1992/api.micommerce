import { MongoClient, ObjectId } from "mongodb";
import { injectable } from "inversify";
import { IFilter } from "../dtos/filter";
import { IPagedList } from "../dtos/paged-list";
import { ArgumentError } from "../errors/argument";
import { AggregateBuilder } from "../data/helpers/aggregate-builder";
import { IUserActivity } from "../data/models/user-activity";

export interface IUserActivityService{
    getMany(filter: IFilter, tenant_id: string): Promise<IPagedList<IUserActivity>>;
    log({tenant_id, user_id, username, action, path, reference, message}:{tenant_id: string, user_id: string, username: string, action: string, path: string, reference?: string, message?: string}): Promise<void>;
}
@injectable()
export class UserActivityService implements IUserActivityService{
    _mongoClient: MongoClient;
    constructor(mongoClient: MongoClient){
        this._mongoClient = mongoClient;
    }

    public getMany = async (filter: IFilter, tenant_id: string): Promise<IPagedList<IUserActivity>> =>{
        if(!ObjectId.isValid(tenant_id))
            throw new ArgumentError("tenant_id", "tenant_id is not valid");
        if(!filter.equal)
            filter.equal = [{field: "tenant_id", value: tenant_id}];
        else
            filter.equal.push({field: "tenant_id", value: tenant_id});
        const aggregate = AggregateBuilder.build(filter);
        const result = 
            await this.
            _mongoClient
                .db()
                .collection<IUserActivity>("user-activity")
                .aggregate(aggregate)
                .toArray();
        const pagedList: IPagedList<IUserActivity> = {
            items: result[0].data,
            page: filter.page,
            page_size: filter.page_size,
            total_items: result[0].data.length == 0 ? 0 : result[0].metadata[0].total,
            total_pages: result[0].data.length == 0 ? 0 : Math.ceil(result[0].metadata[0].total / filter.page_size) | 0
        }
        return pagedList;
    }

    public log = async ({tenant_id, user_id, username, action, path, reference, message}:{tenant_id: string, user_id: string, username: string, action: string, path: string, reference?: string, message?: string}): Promise<void> =>{
        const logItem: IUserActivity = {
            tenant_id: tenant_id,
            user_id: user_id,
            username: username,
            action: action,
            path: path,
            reference: reference,
            message: message,
            created_on: new Date()
        };
        await this._mongoClient
            .db()
            .collection("user-activity")
            .insertOne(logItem);
    }
};