import {prisma} from '../lib/prisma.js';
import { Profile } from '../generated/prisma/client.js';

export interface CreateProfileData {
  id: string;
  name: string;
  gender: string;
  gender_probability: number;
  sample_size: number;
  age: number;
  age_group: string;
  country_id: string;
  country_probability: number;
}

export interface ProfileFilters {
  gender?: string;
  country_id?: string;
  age_group?: string;
}

export const findProfileByName = async (name: string): Promise<Profile | null> => {
  return prisma.profile.findUnique({ where: { name } });
};

export const findProfileById = async (id: string): Promise<Profile | null> => {
  return prisma.profile.findUnique({ where: { id } });
};

export const createProfile = async (data: CreateProfileData): Promise<Profile> => {
  return prisma.profile.create({ data });
};

export const getAllProfiles = async (filters: ProfileFilters): Promise<Profile[]> => {
  const where: Record<string, unknown> = {};

  if (filters.gender) {
    where.gender = filters.gender.toLowerCase();
  }
  if (filters.country_id) {
    where.country_id = filters.country_id.toUpperCase();
  }
  if (filters.age_group) {
    where.age_group = filters.age_group.toLowerCase();
  }

  return prisma.profile.findMany({ where });
};

export const deleteProfile = async (id: string): Promise<Profile> => {
  return prisma.profile.delete({ where: { id } });
};
