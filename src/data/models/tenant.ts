import { ObjectId } from "mongodb";

export interface ITenant{
    _id: ObjectId;
    name: string;
    domain: string;
    created_on: Date;
    updated_on?: Date;
    disabled: boolean;
}