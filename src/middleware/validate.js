import { z } from 'zod';

// validate({ body: schema, query: schema, params: schema })
export const validate = (schemas) => (req, res, next) => {
  const valid = {};

  for (const part of ['body', 'query', 'params']) {
    if (!schemas[part]) continue;

    const result = schemas[part].safeParse(req[part]);
    if (!result.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: z.flattenError(result.error).fieldErrors, // v3: result.error.flatten().fieldErrors
      });
    }
    valid[part] = result.data;
  }

  req.valid = valid; // чистые данные лежат здесь
  next();
};
