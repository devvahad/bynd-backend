import got from 'got';
import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, GEOCODE_TIMEOUT_MS, GEOCODE_API_URL } from '../../constants.js';

const isValidCoordinatePair = (coordinates) =>
  Array.isArray(coordinates) &&
  coordinates.length === 2 &&
  coordinates.every((c) => typeof c === 'number' && Number.isFinite(c));

const isWithinBounds = ([longitude, latitude]) =>
  longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90;

const getAddressComponent = (components, type) =>
  components.find((c) => Array.isArray(c.types) && c.types.includes(type))?.long_name || null;

const reverseGeocode = async (latitude, longitude) => {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return null;
  }

  try {
    const response = await got(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        searchParams: {
          latlng: `${latitude},${longitude}`,
          key: process.env.GOOGLE_PLACES_API_KEY,
        },
        timeout: { request: GEOCODE_TIMEOUT_MS },
        retry: { limit: 0 },
      },
    ).json();

    if (response?.status !== 'OK') {
      return null;
    }

    const components = response?.results?.[0]?.address_components;
    if (!Array.isArray(components)) {
      return null;
    }

    return {
      city:
        getAddressComponent(components, 'locality') ||
        getAddressComponent(components, 'sublocality') ||
        getAddressComponent(components, 'administrative_area_level_2'),
      state: getAddressComponent(components, 'administrative_area_level_1'),
      country: getAddressComponent(components, 'country'),
    };
  } catch (_err) {
    return null;
  }
};

export default async ({ userId, location }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId', 'location'],
      sourceDocument: { userId, location },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    if (!location || typeof location !== 'object') {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Location must be an object.' });
    }

    const { coordinates } = location;

    if (!isValidCoordinatePair(coordinates)) {
      throw ResponseUtility.GENERIC_ERR({
        code: 400,
        message: 'Location coordinates must be an array of [longitude, latitude] numbers.',
      });
    }

    if (!isWithinBounds(coordinates)) {
      throw ResponseUtility.GENERIC_ERR({
        code: 400,
        message: 'Coordinates out of range. Longitude must be -180 to 180, latitude -90 to 90.',
      });
    }

    const [longitude, latitude] = coordinates;
    const geocodeResult = await reverseGeocode(latitude, longitude);

    const update = {
      location: { type: 'Point', coordinates: [longitude, latitude] },
      updatedOn: new Date(),
    };

    if (geocodeResult) {
      update.city = geocodeResult.city;
      update.state = geocodeResult.state;
      update.country = geocodeResult.country;
    }

    const user = await UserModel.findOneAndUpdate(
      { _id: userId, deleted: false, blocked: false },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    return ResponseUtility.SUCCESS({
      message: 'Location updated successfully.',
      data: { location: user.location, city: user.city, state: user.state, country: user.country },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};