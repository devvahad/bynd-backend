import ResponseUtility from './response.js';
const SchemaMapperUtility = (jsonObject) =>
  new Promise((resolve, reject) => {
    const result = Object.fromEntries(
      Object.entries(jsonObject).filter(([k, v]) => k !== 'id' && v !== undefined),
    );

    if (Object.keys(result).length) {
      return resolve(result);
    }
    return reject(
      ResponseUtility.GENERIC_ERR({
        message: 'No defined field',
        error: 'The resultant object is empty — no defined fields found.',
      }),
    );
  });

export default SchemaMapperUtility;