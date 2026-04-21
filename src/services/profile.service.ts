import {
  getAllProfiles,
  ProfileFilters,
  QueryOptions,
  PaginatedResult,
} from '../models/profile.model.js';

export const listProfiles = async (filters: ProfileFilters, options: QueryOptions): Promise<PaginatedResult> => {
  return getAllProfiles(filters, options);
};

/**
 * Natural language query parser
 * Converts plain English queries to profile filters
 */
export const parseNaturalLanguageQuery = (query: string): ProfileFilters | null => {
  const lowerQuery = query.toLowerCase().trim();
  const filters: ProfileFilters = {};

  // Parse gender - handle "male and female" cases properly
  const hasMale = lowerQuery.includes('male');
  const hasFemale = lowerQuery.includes('female');
  
  // If both male and female are mentioned, we should not set gender filter
  // This handles cases like "male and female teenagers above 17" correctly
  if (hasMale && !hasFemale) {
    filters.gender = 'male';
  } else if (hasFemale && !hasMale) {
    filters.gender = 'female';
  }
  // If both or neither are mentioned, don't set gender filter

  // Parse age groups
  if (lowerQuery.includes('child') || lowerQuery.includes('children')) {
    filters.age_group = 'child';
  } else if (lowerQuery.includes('teenager') || lowerQuery.includes('teens')) {
    filters.age_group = 'teenager';
  } else if (lowerQuery.includes('adult') && !lowerQuery.includes('senior')) {
    filters.age_group = 'adult';
  } else if (lowerQuery.includes('senior')) {
    filters.age_group = 'senior';
  }

  // Parse age ranges
  // "young" typically refers to ages 16-24
  if (lowerQuery.includes('young')) {
    filters.min_age = 16;
    filters.max_age = 24;
  }

  // Check for "above X" or "over X" patterns
  const aboveMatch = lowerQuery.match(/(?:above|over)\s+(\d+)/);
  if (aboveMatch) {
    const age = parseInt(aboveMatch[1], 10);
    if (!isNaN(age)) {
      filters.min_age = age;
    }
  }

  // Check for "below X" or "under X" patterns
  const belowMatch = lowerQuery.match(/(?:below|under)\s+(\d+)/);
  if (belowMatch) {
    const age = parseInt(belowMatch[1], 10);
    if (!isNaN(age)) {
      filters.max_age = age;
    }
  }

  // Parse countries - map country names to country IDs
  const countryMap: Record<string, string> = {
    'nigeria': 'NG',
    'nigerian': 'NG',
    'kenya': 'KE',
    'kenyan': 'KE',
    'ghana': 'GH',
    'ghanaian': 'GH',
    'uganda': 'UG',
    'ugandan': 'UG',
    'tanzania': 'TZ',
    'tanzanian': 'TZ',
    'benin': 'BJ',
    'beninese': 'BJ',
    'sudan': 'SD',
    'sudanese': 'SD',
    'egypt': 'EG',
    'egyptian': 'EG',
    'south africa': 'ZA',
    'south african': 'ZA',
    'ethiopia': 'ET',
    'ethiopian': 'ET',
    'cameroon': 'CM',
    'cameroonian': 'CM',
    'mozambique': 'MZ',
    'mozambican': 'MZ',
    'malawi': 'MW',
    'malawian': 'MW',
    'zimbabwe': 'ZW',
    'zimbabwean': 'ZW',
    'botswana': 'BW',
    'motswana': 'BW',
    'namibia': 'NA',
    'namibian': 'NA',
    'lesotho': 'LS',
    'basotho': 'LS',
    'eswatini': 'SZ',
    'swazi': 'SZ',
    'mauritius': 'MU',
    'mauritian': 'MU',
    'algeria': 'DZ',
    'algerian': 'DZ',
    'tunisia': 'TN',
    'tunisian': 'TN',
    'morocco': 'MA',
    'moroccan': 'MA',
    'liberia': 'LR',
    'liberian': 'LR',
    'sierra leone': 'SL',
    'sierra leonean': 'SL',
    'guinea': 'GN',
    'guinean': 'GN',
    'mali': 'ML',
    'malian': 'ML',
    'senegal': 'SN',
    'senegalese': 'SN',
    'mauritania': 'MR',
    'mauritanian': 'MR',
    'yemen': 'YE',
    'yemeni': 'YE',
    'congo': 'CD',
    'congolese': 'CD',
    'united states': 'US',
    'usa': 'US',
    'american': 'US',
    'united kingdom': 'GB',
    'uk': 'GB',
    'british': 'GB',
    'canada': 'CA',
    'canadian': 'CA',
    'australia': 'AU',
    'australian': 'AU',
    'angola': 'AO',
    'angolan': 'AO',
  };

  for (const [country, code] of Object.entries(countryMap)) {
    if (lowerQuery.includes(country)) {
      filters.country_id = code;
      break;
    }
  }

  // If no filters were extracted, return null (can't interpret)
  if (Object.keys(filters).length === 0) {
    return null;
  }

  return filters;
};
