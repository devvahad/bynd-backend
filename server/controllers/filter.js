import { FiltersModel } from '../model/index.js';
import { ModelResolver } from './resolvers/index.js';

export default {
  basic: (req, res) => ModelResolver(req, res, FiltersModel.ApplyBasicFiltersModel),
  advanced: (req, res) => ModelResolver(req, res, FiltersModel.ApplyAdvancedFiltersModel),
  getSaved: (req, res) => ModelResolver(req, res, FiltersModel.GetSavedFiltersModel),
  reset: (req, res) => ModelResolver(req, res, FiltersModel.ResetFiltersModel),
};
