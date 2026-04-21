import { Request, Response, NextFunction } from 'express';
import {
  listProfiles,
  parseNaturalLanguageQuery,
} from '../services/profile.service.js';



export const getProfiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Parse query parameters
    const {
      gender,
      country_id,
      age_group,
      min_age,
      max_age,
      min_gender_probability,
      min_country_probability,
      sort_by,
      order,
      page = '1',
      limit = '10',
    } = req.query;

    // Validate query parameters
    let pageNum = parseInt(page as string, 10);
    let limitNum = parseInt(limit as string, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(422).json({ status: 'error', message: 'Invalid query parameters' });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      return res.status(422).json({ status: 'error', message: 'Invalid query parameters' });
    }

    // Parse numeric filters
    const minAge = min_age ? parseInt(min_age as string, 10) : undefined;
    const maxAge = max_age ? parseInt(max_age as string, 10) : undefined;
    const minGenderProb = min_gender_probability
      ? parseFloat(min_gender_probability as string)
      : undefined;
    const minCountryProb = min_country_probability
      ? parseFloat(min_country_probability as string)
      : undefined;

    if ((min_age && isNaN(minAge!)) || (max_age && isNaN(maxAge!))) {
      return res.status(422).json({ status: 'error', message: 'Invalid query parameters' });
    }

    if ((min_gender_probability && isNaN(minGenderProb!)) || (min_country_probability && isNaN(minCountryProb!))) {
      return res.status(422).json({ status: 'error', message: 'Invalid query parameters' });
    }

    // Validate sort parameters
    const validSortFields = ['age', 'created_at', 'gender_probability'];
    const validOrders = ['asc', 'desc'];

    if (sort_by && !validSortFields.includes(sort_by as string)) {
      return res.status(422).json({ status: 'error', message: 'Invalid query parameters' });
    }

    if (order && !validOrders.includes(order as string)) {
      return res.status(422).json({ status: 'error', message: 'Invalid query parameters' });
    }

    const result = await listProfiles(
      {
        gender: gender as string | undefined,
        country_id: country_id as string | undefined,
        age_group: age_group as string | undefined,
        min_age: minAge,
        max_age: maxAge,
        min_gender_probability: minGenderProb,
        min_country_probability: minCountryProb,
      },
      {
        page: pageNum,
        limit: limitNum,
        sort_by: sort_by as any,
        order: order as any,
      }
    );

    return res.status(200).json({
      status: 'success',
      page: result.page,
      limit: result.limit,
      total: result.total,
      data: result.data.map(formatProfileFull),
    });
  } catch (err) {
    next(err);
  }
};

export const searchProfiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, page = '1', limit = '10' } = req.query;

    // Validate query parameter
    if (!q || typeof q !== 'string' || q.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'Query parameter q is required' });
    }

    // Parse natural language query
    const filters = parseNaturalLanguageQuery(q);

    if (filters === null) {
      return res.status(200).json({
        status: 'error',
        message: 'Unable to interpret query',
      });
    }

    // Parse pagination parameters
    let pageNum = parseInt(page as string, 10);
    let limitNum = parseInt(limit as string, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      pageNum = 1;
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      limitNum = 10;
    }

    const result = await listProfiles(filters, {
      page: pageNum,
      limit: limitNum,
    });

    return res.status(200).json({
      status: 'success',
      page: result.page,
      limit: result.limit,
      total: result.total,
      data: result.data.map(formatProfileFull),
    });
  } catch (err) {
    next(err);
  }
};



// Full profile shape for list/search endpoints
const formatProfileFull = (profile: any) => ({
  id: profile.id,
  name: profile.name,
  gender: profile.gender,
  gender_probability: profile.gender_probability,
  age: profile.age,
  age_group: profile.age_group,
  country_id: profile.country_id,
  country_name: profile.country_name,
  country_probability: profile.country_probability,
  created_at: profile.created_at,
});
