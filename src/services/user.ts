import { MongoClient, ObjectId } from "mongodb";
import { IUser, UserRole } from "../data/models/user";
import { ArgumentError } from "../errors/argument";
import { ICreateUser } from "../dtos/user/create-user";
import { IPagedList } from "../dtos/paged-list";
import { IFilter } from "../dtos/filter";
import { AggregateBuilder } from "../data/helpers/aggregate-builder";
import { IUpdateUser } from "../dtos/user/update-user";
import { NotFound } from "../errors/not-found";
import { Unauthorized } from "../errors/unauthorized";
import { ILoginResponse } from "../dtos/auth/login-response";
import jwt from 'jsonwebtoken';
import { injectable } from "inversify";
import { JWTPayload } from "../types/jwt-payload";

export interface IUserService{
    authenticateSuper(username: string, password: string, tenant_id: string): Promise<ILoginResponse>;
    authenticate(username: string, password: string, tenant_id: string): Promise<ILoginResponse>;
    usernameExists(username: string, tenant_id: string): Promise<boolean>;
    superRoleExists(): Promise<boolean>;
    exists(id: string): Promise<boolean>;
    get(id: string): Promise<IUser>;
    getMany(filter: IFilter, tenant_id: string): Promise<IPagedList<IUser>>;
    delete(id: string): Promise<IUser>;
    update(id: string, userUpdate: IUpdateUser): Promise<IUser>;
    replace(id: string, userUpdate: IUpdateUser): Promise<IUser>;
    create(userCreate: ICreateUser, tenant_id: string): Promise<ObjectId>;
}

@injectable()
export class UserService implements IUserService{
    protected _mongoClient: MongoClient;
    
    constructor(mongoClient: MongoClient){
        this._mongoClient = mongoClient;
    }
    async superRoleExists(): Promise<boolean> {
        const user = 
         await this.
            _mongoClient
                .db()
                .collection("users")
                .findOne({ role: UserRole.SUPER_USER }, { projection: {"_id": 1} });
        return !user ? false : true;
    }

    public authenticateSuper = async (username: string, password: string, tenant_id: string): Promise<ILoginResponse> => {
        if(!ObjectId.isValid(tenant_id))
            throw new ArgumentError("tenant_id", "tenant_id is not valid");
        UserService.validateUsername(username);
        UserService.validatePassword(password);
        const user =
         await this.
            _mongoClient
                .db()
                .collection("users")
                .findOne({ username: username, tenant_id: null, role: UserRole.SUPER_USER, disabled: false }, { projection: { "_id": 1, "password": 1 } });
        if(!user || password !== user.password)
            throw new Unauthorized("Username or password is incorrect.");
        const payload: JWTPayload ={
            user_id: user._id.toHexString(),
            username: username,
            role: UserRole.SUPER_USER,
            tenant_id: tenant_id
        };
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
              expiresIn: "360d",
            }
        );
        const res: ILoginResponse = {
            token: token,
            user_id: user._id.toHexString()
        }
        return res;
    }

    public authenticate = async (username: string, password: string, tenant_id: string): Promise<ILoginResponse> => {
        if(!ObjectId.isValid(tenant_id))
            throw new ArgumentError("tenant_id", "tenant_id is not valid");
        UserService.validateUsername(username);
        UserService.validatePassword(password);
        const user =
         await this.
            _mongoClient
                .db()
                .collection("users")
                .findOne({ username: username, tenant_id: tenant_id, disabled: false }, { projection: { "_id": 1, "password": 1, "role": 1 } });
        if(!user || password !== user.password)
            throw new Unauthorized("Username or password is incorrect.");
        const payload: JWTPayload ={
            user_id: user._id.toHexString(),
            username: username,
            role: user.role,
            tenant_id: tenant_id
        };
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
              expiresIn: "360d",
            }
        );
        const res: ILoginResponse = {
            token: token,
            user_id: user._id.toHexString()
        }
        return res;
    }

    public usernameExists = async (username: string, tenant_id: string): Promise<boolean> => {
        if(!ObjectId.isValid(tenant_id))
            throw new ArgumentError("tenant_id", "tenant_id is not valid");
        UserService.validateUsername(username);
        const user = 
         await this.
            _mongoClient
                .db()
                .collection("users")
                .findOne({ username: username, tenant_id: tenant_id }, { projection: {"_id": 1} });
        return !user || !user._id ? false : true;
    }

    public exists = async (id: string): Promise<boolean> => {
        if(!ObjectId.isValid(id))
            throw new ArgumentError("id", "id is not valid");
        const user = 
         await this.
            _mongoClient
                .db()
                .collection("users")
                .findOne({ _id: ObjectId.createFromHexString(id) }, { projection: {"_id": 1} });
        return !user ? false : true;
    }

    public get = async (id: string): Promise<IUser> => {
        if(!ObjectId.isValid(id))
            throw new ArgumentError("id", "id is not valid");
        const user = 
         await this.
            _mongoClient
                .db()
                .collection<IUser>("users")
                .findOne({ _id: ObjectId.createFromHexString(id) });
        return user;
    }

    public getMany = async (filter: IFilter, tenant_id: string): Promise<IPagedList<IUser>> =>{
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
                .collection<IUser>("users")
                .aggregate(aggregate)
                .toArray();
        const pagedList: IPagedList<IUser> = {
            items: result[0].data,
            page: filter.page,
            page_size: filter.page_size,
            total_items: result[0].data.length == 0 ? 0 : result[0].metadata[0].total,
            total_pages: result[0].data.length == 0 ? 0 : Math.ceil(result[0].metadata[0].total / filter.page_size) | 0
        }
        return pagedList;
    }

    public delete = async (id: string): Promise<IUser> => {
        if(!ObjectId.isValid(id))
            throw new ArgumentError("id", "id is not valid");
        const user = 
         await this.
            _mongoClient
                .db()
                .collection<IUser>("users")
                .findOneAndDelete({ _id: ObjectId.createFromHexString(id) });
        return user;
    }

    public update = async (id: string, userUpdate: IUpdateUser): Promise<IUser> => {
        if(!ObjectId.isValid(id))
            throw new ArgumentError("id", "id is not valid");
        const set: any = {};
        if(userUpdate.firstname)
            set.firstname = userUpdate.firstname;
        if(userUpdate.lastname)
            set.lastname = userUpdate.lastname;
        if(userUpdate.password){
            UserService.validatePassword(userUpdate.password);
            set.password = userUpdate.password;
        }
        if(userUpdate.role)
            set.role = userUpdate.role;
        if(userUpdate.disabled === false || userUpdate.disabled === true)
            set.disabled = userUpdate.disabled;
        set.updated_on = new Date();
        const user = await this.
         _mongoClient
            .db()
            .collection<IUser>("users")
            .findOneAndUpdate({ _id: ObjectId.createFromHexString(id) }, {$set: set});
        return user;
    }

    public replace = async (id: string, userUpdate: IUpdateUser): Promise<IUser> => {
        if(!ObjectId.isValid(id))
            throw new ArgumentError("id", "id is not valid");
        const oldUser =
         await this.
            _mongoClient
                .db()
                .collection("users")
                .findOne({ _id: ObjectId.createFromHexString(id) }, { projection: {"username": 1, "tenant_id": 1, "created_on": 1} });
        if(!oldUser)
            throw new NotFound("User does not exists");
        UserService.validatePassword(userUpdate.password);
        const newUser: IUser = {
            _id: ObjectId.createFromHexString(id),
            tenant_id: oldUser.tenant_id,
            username: oldUser.username,
            created_on: oldUser.created_on,
            firstname: userUpdate.firstname,
            lastname: userUpdate.lastname,
            password: userUpdate.password,
            role: userUpdate.role,
            disabled: userUpdate.disabled,
            updated_on: new Date()
        };
        const user = await this.
         _mongoClient
            .db()
            .collection<IUser>("users")
            .findOneAndReplace({ _id: ObjectId.createFromHexString(id) }, newUser);
        return user;
    }

    public create = async (userCreate: ICreateUser, tenant_id: string): Promise<ObjectId> => {
        if(!ObjectId.isValid(tenant_id))
            throw new ArgumentError("tenant_id", "tenant_id is not valid");
        UserService.validateUsername(userCreate.username);
        UserService.validatePassword(userCreate.password);
        const newUser: IUser = {
            _id: null,
            tenant_id: tenant_id,
            firstname: userCreate.firstname,
            lastname: userCreate.lastname,
            username: userCreate.username,
            password: userCreate.password,
            created_on: new Date(),
            role: userCreate.role,
            disabled: userCreate.disabled ?? false
        };
        await this.
         _mongoClient
            .db()
            .collection("users")
            .insertOne(newUser);
        return newUser._id;
    }
    
    public static isValidUsername = (username: string): boolean => 
        /^[a-z][a-z0-9_.]{6,24}$/.test(username);

    public static isValidPassword = (password: string): boolean => 
        /[a-zA-Z0-9_.@$]{6,24}$/.test(password);

    public static validateUsername = (username: string) =>{
        if(!UserService.isValidUsername(username))
            throw new ArgumentError("username", "Username is not valid. Username must start with a letter minimum 6 and maximum 24 characters. Allowed characters are a-z (only lower case), 0-9, '_' (underscore) and '.' (dot).");
    }
    
    public static validatePassword = (password: string) =>{
        if(!UserService.isValidPassword(password))
            throw new ArgumentError("password", "Password is not valid. Password should be minimum 6 charecters and maximum 24. Allowed characters are a-z, A-Z, 0-9, '@', '$', '_' and '.'");
    }
}