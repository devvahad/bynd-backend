import { SUCCESS_CODE, MISSING_PROPS_CODE, INVALID_INPUT_CODE } from '../constants.js';

const isMissing = (value) =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0);

const formatList = (items) => {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
};

const PropsValidationUtility = ({ validProps = [], sourceDocument = {} } = {}) => {
  if (!Array.isArray(validProps)) {
    return {
      code: INVALID_INPUT_CODE,
      message: 'validProps must be an array of property names.',
      error: 'Invalid Input',
    };
  }

  if (typeof sourceDocument !== 'object' || sourceDocument === null || Array.isArray(sourceDocument)) {
    return {
      code: INVALID_INPUT_CODE,
      message: 'sourceDocument must be a plain object.',
      error: 'Invalid Input',
    };
  }

  const missing = validProps.filter((prop) => isMissing(sourceDocument[prop]));

  if (missing.length > 0) {
    const label = missing.length > 1 ? 'properties' : 'property';
    return {
      code: MISSING_PROPS_CODE,
      message: `Missing required ${label}: ${formatList(missing)}.`,
      error: 'Missing Props',
      missingProps: missing,
    };
  }

  return {
    code: SUCCESS_CODE,
    message: 'All properties are valid.',
  };
};

export default PropsValidationUtility;