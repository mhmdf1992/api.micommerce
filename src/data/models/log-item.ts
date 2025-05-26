import { ObjectId } from "mongodb";

export interface ILogItem{
    _id: ObjectId;
    tenant_id: string;
    user_id: string;
    username: string;
    message: string;
    request?: ILogRequest;
    type: LogType;
    created_on: Date;
}

export type LogType = 'info' | 'error';
export interface ILogRequest{
    params,
    query,
    headers,
    url,
    body,
    response:{
        status_code: number,
        message: string
    }
}