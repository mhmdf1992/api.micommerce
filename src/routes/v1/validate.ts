import { ArgumentError } from "../../errors/argument";

export const validate = validations => {
    return async (req, res, next) => {
      for (const validation of validations) {
        const result = await validation.run(req);
        if (!result.isEmpty()) {
            const error = result.array()[0];
            return next(new ArgumentError(error.path, error.msg))
        }
      }
      next();
    };
};