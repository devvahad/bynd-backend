import { ResponseUtility } from '../../utility/index.js';
import { logger } from '../../services/logger.js';

const BUSINESS_KEYWORDS = /(restaurant|cafe|coffee|hotel|bar|pub|food|pizza|burger|gym|salon|shop|store)/i;

export default async ({ input, userLat, userLng }) => {
  if (!input || !input.trim()) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Input is required.' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw ResponseUtility.GENERIC_ERR({ code: 500, httpStatus: 500, message: 'Google Places API key is not configured.' });
  }

  const isBusinessSearch = BUSINESS_KEYWORDS.test(input);
  const endpoint = isBusinessSearch
    ? 'https://places.googleapis.com/v1/places:searchText'
    : 'https://places.googleapis.com/v1/places:autocomplete';

  const payload = isBusinessSearch
    ? {
      textQuery: input,
      languageCode: 'en',
      ...(userLat && userLng
        ? { locationBias: { circle: { center: { latitude: userLat, longitude: userLng }, radius: 48000 } } }
        : {}),
    }
    : { input, languageCode: 'en', includedPrimaryTypes: ['locality', 'sublocality', 'street_address'] };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': '*',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Google Places API returned ${response.status}`);
    }

    const data = await response.json();
    let results = [];

    if (data.places) {
      results = data.places.map((place) => ({
        place_id: place.id || '',
        description: place.displayName?.text || place.formattedAddress || '',
        structured_formatting: {
          main_text: place.displayName?.text || '',
          secondary_text: place.formattedAddress || '',
        },
        location: place.location || null,
        types: place.types || [],
      }));
    }

    if (data.suggestions) {
      results = data.suggestions.map((item) => {
        const p = item.placePrediction;
        return {
          place_id: p.placeId,
          description: p.text?.text || '',
          structured_formatting: {
            main_text: p.text?.text?.split(',')[0] || '',
            secondary_text: p.text?.text?.split(',').slice(1).join(',').trim(),
          },
        };
      });
    }

    return ResponseUtility.SUCCESS({ message: 'Locations fetched successfully.', data: results });
  } catch (error) {
    logger.error(`searchLocations Google Places error: ${error.message}`);
    throw ResponseUtility.GENERIC_ERR({ message: 'Failed to fetch locations.' });
  }
};
