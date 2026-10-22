import { SubscriptionModel } from '../model/index.js';
import { ModelResolver } from './resolvers/index.js';

export default {
  buy: (req, res) => ModelResolver(req, res, SubscriptionModel.Buy),
  detail: (req, res) => ModelResolver(req, res, SubscriptionModel.Detail),
  restore: (req, res) => ModelResolver(req, res, SubscriptionModel.Restore),
  cancel: (req, res) => ModelResolver(req, res, SubscriptionModel.Cancel),
  transactionHistory: (req, res) => ModelResolver(req, res, SubscriptionModel.TransactionHistory),
  getPlans: (req, res) => ModelResolver(req, res, SubscriptionModel.GetPlans),
};
