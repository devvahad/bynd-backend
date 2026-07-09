import ModelResolver from './modelResolver.js';
import UpdatePromptModel from '../../model/profile/updatePrompt.js';
import { ListPromptsService, SkipPromptsService } from '../../model/profile/promptServices.js';

export const AddPromptResolver = (req, res) =>
  ModelResolver(req, res, (payload) => UpdatePromptModel({ ...payload, userId: payload.id, action: 'add' }));

export const ListPromptsResolver = (req, res) =>
  ModelResolver(req, res, (payload) => ListPromptsService({ userId: payload.id }));

export const UpdatePromptResolver = (req, res) =>
  ModelResolver(req, res, (payload) => UpdatePromptModel({ ...payload, userId: payload.id, action: 'update' }));

export const DeletePromptResolver = (req, res) =>
  ModelResolver(req, res, (payload) => UpdatePromptModel({ ...payload, userId: payload.id, action: 'delete' }));

export const SkipPromptsResolver = (req, res) =>
  ModelResolver(req, res, SkipPromptsService);
