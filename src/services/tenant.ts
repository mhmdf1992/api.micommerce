import { MongoClient, ObjectId } from "mongodb";
import { ArgumentError } from "../errors/argument";
import { IPagedList } from "../dtos/paged-list";
import { IFilter } from "../dtos/filter";
import { AggregateBuilder } from "../data/helpers/aggregate-builder";
import { NotFound } from "../errors/not-found";
import { injectable } from "inversify";
import { ITenant } from "../data/models/tenant";
import { IUpdateTenant } from "../dtos/tenant/update-tenant";
import { ICreateTenant } from "../dtos/tenant/create-tenant";

export interface ITenantService{
    any() : Promise<boolean>;
    getByName(name: string): Promise<ITenant>;
    getByDomain(domain: string): Promise<ITenant>;
    exists(id: string): Promise<boolean>;
    get(id: string): Promise<ITenant>;
    getMany(filter: IFilter): Promise<IPagedList<ITenant>>;
    delete(id: string): Promise<void>;
    update(id: string, tenant: IUpdateTenant): Promise<void>;
    replace(id: string, tenant: IUpdateTenant): Promise<void>;
    create(tenant: ICreateTenant): Promise<ObjectId>;
}

@injectable()
export class TenantService implements ITenantService{
    protected _mongoClient: MongoClient;
    
    constructor(mongoClient: MongoClient){
        this._mongoClient = mongoClient;
    }
    async getByName(name: string): Promise<ITenant> {
        const tenant = 
         await this.
            _mongoClient
                .db()
                .collection<ITenant>("tenants")
                .findOne({ name: name, disabled: false });
        return tenant;
    }
    async any(): Promise<boolean> {
        return await this.
            _mongoClient
                .db()
                .collection<ITenant>("tenants")
                .countDocuments() > 0;
    }
    async getByDomain(domain: string): Promise<ITenant> {
        const tenant = 
         await this.
            _mongoClient
                .db()
                .collection<ITenant>("tenants")
                .findOne({ domain: domain });
        return tenant;
    }

    public exists = async (id: string): Promise<boolean> => {
        const tenant = 
         await this.
            _mongoClient
                .db()
                .collection("tenants")
                .findOne({ _id: ObjectId.createFromHexString(id) }, { projection: {"_id": 1} });
        return !tenant ? false : true;
    }

    public get = async (id: string): Promise<ITenant> => {
        const tenant = 
         await this.
            _mongoClient
                .db()
                .collection<ITenant>("tenants")
                .findOne({ _id: ObjectId.createFromHexString(id) });
        return tenant;
    }

    public getMany = async (filter: IFilter): Promise<IPagedList<ITenant>> =>{
        const aggregate = AggregateBuilder.build(filter);
        const result = 
         await this.
            _mongoClient
                .db()
                .collection<ITenant>("tenants")
                .aggregate(aggregate)
                .toArray();
        const pagedList: IPagedList<ITenant> = {
            items: result[0].data,
            page: filter.page,
            page_size: filter.page_size,
            total_items: result[0].data.length == 0 ? 0 : result[0].metadata[0].total,
            total_pages: result[0].data.length == 0 ? 0 : Math.ceil(result[0].metadata[0].total / filter.page_size) | 0
        }
        return pagedList;
    }

    public delete = async (id: string): Promise<void> => {
         await this.
            _mongoClient
                .db()
                .collection("tenants")
                .deleteOne({ _id: ObjectId.createFromHexString(id) });
    }

    public update = async (id: string, tenant: IUpdateTenant): Promise<void> => {
        const set: any = {};
        if(tenant.name)
            set.name = tenant.name;
        if(tenant.domain)
            set.domain = tenant.domain;
        if(tenant.disabled === false || tenant.disabled === true)
            set.disabled = tenant.disabled;
        set.updated_on = new Date();
        await this.
         _mongoClient
            .db()
            .collection("tenants")
            .updateOne({ _id: ObjectId.createFromHexString(id) }, {$set: set});
    }

    public replace = async (id: string, tenant: IUpdateTenant): Promise<void> => {
        const oldTenant =
         await this.
            _mongoClient
                .db()
                .collection("tenants")
                .findOne({ _id: ObjectId.createFromHexString(id) }, { projection: { "_id": 1, "created_on": 1 } });
        if(!oldTenant)
            throw new NotFound("Tenant does not exists");
        const newTenant: ITenant = {
            _id: oldTenant._id,
            name: tenant.name,
            domain: tenant.domain,
            disabled: tenant.disabled,
            created_on: oldTenant.created_on,
            updated_on: new Date()
        };
        await this.
         _mongoClient
            .db()
            .collection<ITenant>("tenants")
            .replaceOne({ _id: ObjectId.createFromHexString(id) }, newTenant);
    }

    public create = async (tenant: ICreateTenant): Promise<ObjectId> => {
        const newTenant: ITenant = {
            _id: null,
            name: tenant.name,
            domain: tenant.domain,
            created_on: new Date(),
            disabled: tenant.disabled ?? false
        };
        await this.
         _mongoClient
            .db()
            .collection("tenants")
            .insertOne(newTenant);
        return newTenant._id;
    }
    
}