const PropsValidationUtility = ({ validProps, sourceDocument }) =>
  new Promise((resolve, reject) => {
    if (!validProps || !sourceDocument) {
      return reject({ code: 101, message: 'validProps and sourceDocument are required.' });
    }

    const missing = validProps.filter((p) => sourceDocument[p] === undefined);

    if (!missing.length) {
      return resolve({ code: 100, message: 'Validated' });
    }

    const joined = missing.length === 1
      ? missing[0]
      : `${missing.slice(0, -1).join(', ')} and ${missing.at(-1)}`;

    return resolve({ code: 102, message: `Missing required ${missing.length > 1 ? 'properties' : 'property'}: ${joined}` });
  });

export default PropsValidationUtility;