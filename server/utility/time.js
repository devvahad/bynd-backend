import { MONTHS, MS_PER_MINUTE, MS_PER_HOUR, MS_PER_DAY } from '../constants.js';

const assertFiniteNumber = (value, label) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number, received: ${value}`);
  }
};

const toValidDate = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Invalid timestamp: ${timestamp}`);
  }
  return date;
};

const pad2 = (value) => String(value).padStart(2, '0');

const minutesToMillis = (minutes) => {
  assertFiniteNumber(minutes, 'minutes');
  return minutes * MS_PER_MINUTE;
};

const hoursToMillis = (hours) => {
  assertFiniteNumber(hours, 'hours');
  return hours * MS_PER_HOUR;
};

const daysToMillis = (days) => {
  assertFiniteNumber(days, 'days');
  return days * MS_PER_DAY;
};

const millisToMinutes = (millis) => {
  assertFiniteNumber(millis, 'millis');
  return millis / MS_PER_MINUTE;
};

const millisToHours = (millis) => {
  assertFiniteNumber(millis, 'millis');
  return millis / MS_PER_HOUR;
};

const millisToDays = (millis) => {
  assertFiniteNumber(millis, 'millis');
  return millis / MS_PER_DAY;
};

const formatTimestamp = (timestamp) => {
  const date = toValidDate(timestamp);
  const day = pad2(date.getDate());
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

const formatTimestampISO = (timestamp) => toValidDate(timestamp).toISOString();

const monthName = (month) => {
  assertFiniteNumber(month, 'month');
  if (month < 0 || month > 11 || !Number.isInteger(month)) {
    throw new RangeError(`month must be an integer between 0 and 11, received: ${month}`);
  }
  return MONTHS[month];
};

const TimeConversionUtility = Object.freeze({
  minutesToMillis,
  hoursToMillis,
  daysToMillis,
  millisToMinutes,
  millisToHours,
  millisToDays,
  formatTimestamp,
  formatTimestampISO,
  monthName,
});

export default TimeConversionUtility;
export {
  minutesToMillis,
  hoursToMillis,
  daysToMillis,
  millisToMinutes,
  millisToHours,
  millisToDays,
  formatTimestamp,
  formatTimestampISO,
  monthName,
};