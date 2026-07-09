import ResponseUtility from './response.js';

class SchemaMapperError extends Error {
  constructor(message, payload) {
    super(message);
    this.name = 'SchemaMapperError';
    this.payload = payload;
  }
}

const SchemaMapperUtility = (jsonObject, { excludeKeys = ['id'] } = {}) => {
  if (typeof jsonObject !== 'object' || jsonObject === null || Array.isArray(jsonObject)) {
    throw new SchemaMapperError(
      'jsonObject must be a plain object',
      ResponseUtility.MALFORMED_REQUEST({ message: 'jsonObject must be a plain object.' })
    );
  }

  const excluded = new Set(excludeKeys);

  const result = Object.fromEntries(
    Object.entries(jsonObject).filter(([key, value]) => !excluded.has(key) && value !== undefined)
  );

  if (Object.keys(result).length === 0) {
    throw new SchemaMapperError(
      'No defined fields found after mapping',
      ResponseUtility.GENERIC_ERR({
        message: 'No defined field',
        error: 'The resultant object is empty — no defined fields found.',
      })
    );
  }

  return result;
};

export default SchemaMapperUtility;
export { SchemaMapperError };