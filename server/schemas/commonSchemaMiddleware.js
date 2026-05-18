import Joi from 'joi';
import ResponseUtility from '../utility/response.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const message = error.details.map((d) => d.message).join('; ');
    return res.status(400).json(ResponseUtility.MISSING_PROPS({ message }));
  }
  return next();
};

export default validate;