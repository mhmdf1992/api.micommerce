import { UserRole } from "../data/models/user";
import { Unauthorized } from "../errors/unauthorized";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../types/jwt-payload";

export const adminAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null)
        throw new Unauthorized("Token is not valid.")
    jwt.verify(token, process.env.JWT_SECRET, (err: any, user: any) => {
        if(err)
            throw new Unauthorized("Token is not valid.");
        const payload = jwt.decode(token) as JWTPayload;
        if((payload.role as UserRole) > UserRole.ADMIN)
            throw new Unauthorized("Unauthorized Access.");
        req.jwtPayload = payload;
        next();
    });
}