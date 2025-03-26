import { Container } from 'inversify';
import 'reflect-metadata';
import { types } from './ioc-types';
import { ILogService, LogService } from './services/log';
import { IUserService, UserService } from './services/user';
import { MongoClient } from 'mongodb';
import { ITenantService, TenantService } from './services/tenant';

const container = new Container();
container.bind<MongoClient>(types.MongoClient).toDynamicValue(() => new MongoClient(process.env.DB_URI)).inSingletonScope();
container.bind<ILogService>(types.Logger).toDynamicValue((context) => new LogService(context.get(types.MongoClient))).inSingletonScope();
container.bind<ITenantService>(types.TenantService).toDynamicValue((context) => new TenantService(context.get(types.MongoClient))).inSingletonScope();
container.bind<IUserService>(types.UserService).toDynamicValue((context) => new UserService(context.get(types.MongoClient))).inSingletonScope();
export {container}
