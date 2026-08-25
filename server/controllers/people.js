import { PeopleModel } from '../model/index.js';
import { ModelResolver } from './resolvers/index.js';

export default {
  home: (req, res) => ModelResolver(req, res, PeopleModel.PeopleHomeModel),
};
