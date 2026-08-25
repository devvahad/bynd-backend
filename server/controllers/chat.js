import { ChatModel } from '../model/index.js';
import { ModelResolver } from './resolvers/index.js';

export default {
  userList: (req, res) => ModelResolver(req, res, ChatModel.UserList),
  messageList: (req, res) => ModelResolver(req, res, ChatModel.MessageList),
  action: (req, res) => ModelResolver(req, res, ChatModel.Action),
};
