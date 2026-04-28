import { geoContains } from "d3-geo";
import { feature } from "topojson-client";
import countriesAtlas from "world-atlas/countries-110m.json";

const COUNTRIES = feature(countriesAtlas, countriesAtlas.objects.countries);
const COUNTRY_NAME_OVERRIDES = {
  "Bosnia and Herz.": "Bosnien und Herzegowina",
  "Central African Rep.": "Zentralafrikanische Republik",
  "Dem. Rep. Congo": "DR Kongo",
  "Dominican Rep.": "Dominikanische Republik",
  "Eq. Guinea": "Äquatorialguinea",
  "Solomon Is.": "Salomonen",
  "S. Sudan": "Südsudan",
  "United States of America": "USA",
  "W. Sahara": "Westsahara"
};

function formatCountryName(name) {
  return COUNTRY_NAME_OVERRIDES[name] || name;
}

export function lookupGroundTrack(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return "Nicht verfügbar";
  }

  const matchingCountry = COUNTRIES.features.find((countryFeature) =>
    geoContains(countryFeature, [longitude, latitude])
  );

  if (matchingCountry) {
    return formatCountryName(matchingCountry.properties.name);
  }

  return "Offener Ozean";
}
