import { fetchExternalData } from './external.service.js';
import { getAgeGroup } from '../utils/classify.js';
import { generateId } from '../utils/uuid.js';
import {
  findProfileByName,
  findProfileById,
  createProfile,
  getAllProfiles,
  deleteProfile,
  ProfileFilters,
} from '../models/profile.model.js';
import { Profile } from '../generated/prisma/client.js';

export const createOrFetchProfile = async (
  name: string
): Promise<{ profile: Profile; alreadyExists: boolean }> => {
  

  const existing = await findProfileByName(name);
  if (existing) {
    return { profile: existing, alreadyExists: true };
  }


  const externalData = await fetchExternalData(name);

  const profile = await createProfile({
    id: generateId(),
    name,
    gender: externalData.gender,
    gender_probability: externalData.gender_probability,
    sample_size: externalData.sample_size,
    age: externalData.age,
    age_group: getAgeGroup(externalData.age),
    country_id: externalData.country_id,
    country_probability: externalData.country_probability,
  });

  return { profile, alreadyExists: false };
};

export const getProfileById = async (id: string): Promise<Profile | null> => {
  return findProfileById(id);
};

export const listProfiles = async (filters: ProfileFilters): Promise<Profile[]> => {
  return getAllProfiles(filters);
};

export const removeProfile = async (id: string): Promise<boolean> => {
  const profile = await findProfileById(id);
  if (!profile) return false;
  await deleteProfile(id);
  return true;
};
