import { AddAppDetailService, ListAppDetailService, GetAppDetailService, UpdateAppDetailService } from '../../model/appDetail/services.js';
import ModelResolver from './modelResolver.js';

export const AddAppDetailResolver = (req, res) =>
  ModelResolver(req, res, AddAppDetailService);

export const ListAppDetailResolver = (req, res) =>
  ModelResolver(req, res, ListAppDetailService);

export const GetAppDetailResolver = (req, res) =>
  ModelResolver(req, res, GetAppDetailService);

export const UpdateAppDetailResolver = (req, res) =>
  ModelResolver(req, res, UpdateAppDetailService);
