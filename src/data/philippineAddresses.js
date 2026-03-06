/**
 * Flattens philippine_provinces_cities_municipalities_and_barangays_2019v2.json
 * into an array of "Barangay, Municipality, Province" strings for the address datalist.
 */
export function flattenPhilippineAddresses(data) {
  if (!data || typeof data !== 'object') return [];
  const list = [];
  const regions = data;
  for (const regionCode of Object.keys(regions)) {
    const region = regions[regionCode];
    if (!region || typeof region !== 'object') continue;
    const provinceList = region.province_list || {};
    for (const provinceName of Object.keys(provinceList)) {
      const province = provinceList[provinceName];
      if (!province || typeof province !== 'object') continue;
      const municipalityList = province.municipality_list || {};
      for (const munName of Object.keys(municipalityList)) {
        const municipality = municipalityList[munName];
        const barangayList = municipality?.barangay_list || [];
        for (const brgy of barangayList) {
          if (typeof brgy === 'string' && brgy.trim()) {
            list.push(`${brgy.trim()}, ${munName}, ${provinceName}`);
          }
        }
      }
    }
  }
  return list;
}

/**
 * Builds a cascading structure for Province → City (Municipality) → Barangay dropdowns.
 * Stored address format: "City, Province, Barangay"
 */
export function buildAddressStructure(data) {
  if (!data || typeof data !== 'object') return null;
  const provinces = [];
  const cityByProvince = {};
  const barangayByProvinceCity = {};
  for (const regionCode of Object.keys(data)) {
    const region = data[regionCode];
    if (!region || typeof region !== 'object') continue;
    const provinceList = region.province_list || {};
    for (const provinceName of Object.keys(provinceList)) {
      const province = provinceList[provinceName];
      if (!province || typeof province !== 'object') continue;
      if (!provinces.includes(provinceName)) provinces.push(provinceName);
      cityByProvince[provinceName] = cityByProvince[provinceName] || [];
      const municipalityList = province.municipality_list || {};
      for (const munName of Object.keys(municipalityList)) {
        if (!cityByProvince[provinceName].includes(munName)) cityByProvince[provinceName].push(munName);
        const key = `${provinceName}|${munName}`;
        const brgyList = (municipalityList[munName]?.barangay_list || []).filter((b) => typeof b === 'string' && b.trim());
        barangayByProvinceCity[key] = brgyList;
      }
    }
  }
  provinces.sort((a, b) => a.localeCompare(b));
  Object.keys(cityByProvince).forEach((p) => cityByProvince[p].sort((a, b) => a.localeCompare(b)));
  return {
    provinces,
    getCities: (province) => (province ? (cityByProvince[province] || []) : []),
    getBarangays: (province, city) => (province && city ? (barangayByProvinceCity[`${province}|${city}`] || []) : []),
  };
}

/** Parse stored address "City, Province, Barangay" into { city, province, barangay } */
export function parseAddressString(address) {
  if (!address || typeof address !== 'string') return { city: '', province: '', barangay: '' };
  const parts = address.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 3) return { city: parts[0], province: parts[1], barangay: parts[2] };
  if (parts.length === 2) return { city: parts[0], province: parts[1], barangay: '' };
  if (parts.length === 1) return { city: parts[0], province: '', barangay: '' };
  return { city: '', province: '', barangay: '' };
}

/** Compose "City, Province, Barangay" from selections */
export function formatAddressString(city, province, barangay) {
  return [city, province, barangay].filter(Boolean).join(', ');
}
