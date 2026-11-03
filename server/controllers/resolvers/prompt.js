import ModelResolver from './modelResolver.js';
import { ListPromptsService, SkipPromptsService, CompletePromptsStepService } from '../../model/profile/promptServices.js';

export const ListPromptsResolver = (req, res) =>
  ModelResolver(req, res, (payload) => ListPromptsService({ userId: payload.id }));

export const SkipPromptsResolver = (req, res) =>
  ModelResolver(req, res, SkipPromptsService);

export const CompletePromptsStepResolver = (req, res) =>
  ModelResolver(req, res, CompletePromptsStepService);