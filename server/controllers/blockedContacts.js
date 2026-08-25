import { BlockedContactsModel } from '../model/index.js';
import { ModelResolver } from './resolvers/index.js';

export default {
  add: (req, res) => ModelResolver(req, res, BlockedContactsModel.BlockedContactAddModel),
  list: (req, res) => ModelResolver(req, res, BlockedContactsModel.BlockedContactListModel),
  unblock: (req, res) => ModelResolver(req, res, BlockedContactsModel.BlockedContactUnblockModel),
  syncContacts: (req, res) => ModelResolver(req, res, BlockedContactsModel.SyncContactsModel),
  contactsList: (req, res) => ModelResolver(req, res, BlockedContactsModel.ContactsListModel),
};