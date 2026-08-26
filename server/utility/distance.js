const calculateDistance = (coords1, coords2) => {
  if (
    !Array.isArray(coords1) || !Array.isArray(coords2)
    || coords1.length !== 2 || coords2.length !== 2
  ) {
    return null;
  }

  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  if (
    typeof lon1 !== 'number' || typeof lat1 !== 'number'
    || typeof lon2 !== 'number' || typeof lat2 !== 'number'
  ) {
    return null;
  }

  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180)
    * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  const distanceMiles = distanceKm * 0.621371;

  return Math.round(distanceMiles * 10) / 10;
};

export default calculateDistance;
