import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { logger } from '../../services/logger.js';
import { SUCCESS_CODE } from '../../constants.js';

export default async ({ placeId }) => {
  const { code, message } = PropsValidationUtility({ validProps: ['placeId'], sourceDocument: { placeId } });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw ResponseUtility.GENERIC_ERR({ code: 500, httpStatus: 500, message: 'Google Places API key is not configured.' });
  }

  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=en`, {
      headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': '*' },
    });

    if (!response.ok) {
      throw ResponseUtility.GENERIC_ERR({ code: response.status, httpStatus: response.status, message: 'Failed to fetch location details.' });
    }

    const place = await response.json();
    if (!place?.id) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Location details not found.' });
    }

    return ResponseUtility.SUCCESS({
      message: 'Location details fetched successfully.',
      data: {
        placeId: place.id,
        name: place.displayName?.text || '',
        address: place.formattedAddress || '',
        coordinates: place.location ? { lat: place.location.latitude, lng: place.location.longitude } : null,
        phone: place.nationalPhoneNumber || null,
        website: place.websiteUri || null,
        rating: place.rating || null,
        totalRatings: place.userRatingCount || 0,
        priceLevel: place.priceLevel || null,
        types: place.types || [],
        businessStatus: place.businessStatus || 'OPERATIONAL',
        openingHours: place.regularOpeningHours
          ? { openNow: place.regularOpeningHours.openNow || false, weekdayText: place.regularOpeningHours.weekdayDescriptions || [] }
          : null,
        photos: place.photos
          ? place.photos.slice(0, 5).map((photo) => ({
            name: photo.name,
            width: photo.widthPx,
            height: photo.heightPx,
            url: `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&key=${apiKey}`,
          }))
          : [],
      },
    });
  } catch (err) {
    if (err.success !== undefined) throw err;
    logger.error(`getLocationDetails error: ${err.message}`);
    throw ResponseUtility.GENERIC_ERR({ message: 'Failed to fetch location details.', error: err.message });
  }
};
