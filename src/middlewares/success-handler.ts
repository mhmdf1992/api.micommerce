export const successHandler = (req, res, next) => {
	res.body = (data) =>{
		res.send({
			status_code: 200,
			data: data
		});
	}
	next();
}