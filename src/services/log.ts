import { MongoClient, ObjectId } from "mongodb";
import { ILogItem, LogType } from "../data/models/log-item";
import { injectable } from "inversify";

export interface ILogService{
    log(type: LogType, message: string, metadata: any): Promise<ObjectId>;
}
@injectable()
export class LogService implements ILogService{
    _mongoClient: MongoClient;
    constructor(mongoClient: MongoClient){
        this._mongoClient = mongoClient;
    }
    public log = async (type: LogType, message: string, metadata: any): Promise<ObjectId> =>{
        const logItem: ILogItem = {
            _id: null,
            type: type,
            message: message,
            created_on: new Date()
        };
        await this._mongoClient
            .db()
            .collection("logs")
            .insertOne(logItem);
        return logItem._id;
    }
};