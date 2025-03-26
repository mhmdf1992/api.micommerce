import { ObjectId } from "mongodb";

export interface ILogItem{
    _id: ObjectId;
    user_id?: string;
    tenant_id?: string;
    username?: string;
    type: LogType;
    created_on: Date;
    message?: string;
}

export type LogType = 'info' | 'error' | 'activity';