import { container } from "../ioc-container";
import { types } from "../ioc-types";
import { IUserActivityService } from "../services/user-activity";

export const userActivity = (req, res, next) => {
	res.activity = async (activity) =>{
		const service = container.get<IUserActivityService>(types.UserActivityService);
		await service.log({
			tenant_id: req.jwtPayload?.tenant_id  ?? activity.tenant_id,
			user_id: req.jwtPayload?.user_id ?? activity.user_id,
			username: req.jwtPayload?.username ?? activity.username,
			path: `${req.baseUrl}${req.path}` ,
			action: req.method,
			reference: activity.reference,
			message: activity.message
		});
	}
	next();
}