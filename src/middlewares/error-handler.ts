import { ArgumentError } from "../errors/argument";
import { BadRequest } from "../errors/bad-request";
import { NotFound } from "../errors/not-found";
import { Unauthorized } from "../errors/unauthorized";
import { container } from "../ioc-container";
import { types } from "../ioc-types";
import { ILogService } from "../services/log";

export const errorHandler = async (err, req, res, next) =>{
    if(err instanceof(BadRequest) || err instanceof(ArgumentError)){
        res.status(400).send({ status_code: 400, parameter: err.parameter, message: err.message});
        return next();
    }
    if(err instanceof(Unauthorized)){
        res.status(401).send({ status_code: 401, message: err.message});
        return next();
    }
    if(err instanceof(NotFound)){
        res.status(404).send({ status_code: 404, message: err.message});
        return next();
    }
    const logger = container.get<ILogService>(types.Logger);
    const logId = await logger.log("error", err.message, {
        request:{
            params: req.params,
            query: req.query,
            headers: req.rawHeaders,
            url: req.url,
            body: req.body
        },
        response: {
            status_code: 500, 
            message: err.message
        }
    })
    res.status(500).send({ status_code: 500, message: err.message, _id: logId });
    next();
}