const harvestine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
  const dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d.toFixed(2);
}

const decorateCountriesWithDistance = (countries, langitude, longitude) => {
  return countries["de"].map(country => {
    const distance = harvestine(langitude, longitude, country.latitude, country.longitude)
    return {...country, distance}
  }).sort((a, b) => {
    return a.distance - b.distance
  })
}

// This is your Appwrite function
// It's executed each time we get a request
export default async ({ req, res, log, error }) => {
  const langitude = req.query.langitude
  const longitude = req.query.longitude
  const distance = +req.query.distance || 5
  const maxEntries = +req.query['max-entries'] || 1
  const zipcode = req.query.zipcode || null;
  const stateCode = req.query['state-code'] || null;

  // First handler to check for a single zipcode
  if(zipcode !== null) {
    const country = countries["de"].filter(country => country.zipcode === zipcode)?.[0];
    return !!country ? res.json(country) : res.json({error: `Zipcode ${zipcode} not found`})
  }

  // Second handler to check for a single state code
  if(stateCode !== null) {
    const stateCountries = countries["de"].filter(country => country.state_code === stateCode);
    return !!stateCountries && stateCountries.length > 0 ? res.json(stateCountries) : res.json({error: `No entries for statecode ${stateCode} found`})
  }

  // Error handler for when long and lat are not defined
  if(!langitude || !longitude){
    return res.json({error: "Missing parameters: lat, lon"})
  } else {
  // Default handler for long and lat
  const countriesWithDistance = decorateCountriesWithDistance(countries, langitude, longitude)
  const closeCountries = countriesWithDistance.filter(country => country.distance < distance)
  return res.json(closeCountries.splice(0, maxEntries))
  }
};

const countries = {
}