import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import PromptModel from '../prompt/index.js';
import { SUCCESS_CODE, PROMPTS, MAX_PROMPTS, MAX_PROMPT_RESPONSE_LENGTH, DUPLICATE_KEY_ERROR_CODE } from '../../constants.js';

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const toValidPromptId = (promptId) => {
  if (typeof promptId !== 'number' && typeof promptId !== 'string') return null;
  const pid = Number(promptId);
  return Number.isInteger(pid) && hasOwn(PROMPTS, pid) ? pid : null;
};

const toValidOrder = (order) => {
  if (typeof order !== 'number' && typeof order !== 'string') return null;
  const value = Number(order);
  return Number.isInteger(value) && value >= 0 && value < MAX_PROMPTS ? value : null;
};

const handleDelete = async ({ userId, promptId }) => {
  const { code, message } = await PropsValidationUtility({
    validProps: ['promptId'],
    sourceDocument: { promptId },
  });
  if (code !== SUCCESS_CODE) throw ResponseUtility.MISSING_PROPS({ message });

  const pid = toValidPromptId(promptId);
  if (pid === null) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Invalid prompt ID: ${promptId}.` });
  }

  const deleted = await PromptModel.findOneAndUpdate(
    { userRef: userId, promptId: pid, deleted: false },
    { $set: { deleted: true, updatedOn: new Date() } },
    { new: true, runValidators: true }
  );

  if (!deleted) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'Prompt not found.' });
  }

  return ResponseUtility.SUCCESS({ message: 'Prompt deleted.' });
};

const handleAddOrUpdate = async ({ userId, promptId, response, order, action }) => {
  const { code, message } = await PropsValidationUtility({
    validProps: ['promptId', 'response'],
    sourceDocument: { promptId, response },
  });
  if (code !== SUCCESS_CODE) throw ResponseUtility.MISSING_PROPS({ message });

  const pid = toValidPromptId(promptId);
  if (pid === null) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Invalid prompt ID: ${promptId}.` });
  }

  if (typeof response !== 'string') {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Response must be a string.' });
  }

  const trimmedResponse = response.trim();

  if (trimmedResponse.length === 0) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Response cannot be empty.' });
  }

  if (trimmedResponse.length > MAX_PROMPT_RESPONSE_LENGTH) {
    throw ResponseUtility.GENERIC_ERR({
      code: 400,
      message: `Response cannot exceed ${MAX_PROMPT_RESPONSE_LENGTH} characters.`,
    });
  }

  if (action === 'add') {
    const existingCount = await PromptModel.countDocuments({ userRef: userId, deleted: false });

    if (existingCount >= MAX_PROMPTS) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Cannot add more than ${MAX_PROMPTS} prompts.` });
    }

    let promptOrder = existingCount;

    if (order !== undefined && order !== null) {
      const validOrder = toValidOrder(order);
      if (validOrder === null) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Order must be an integer between 0 and ${MAX_PROMPTS - 1}.`,
        });
      }
      promptOrder = validOrder;
    }

    try {
      const newPrompt = await PromptModel.create({
        userRef: userId,
        promptId: pid,
        response: trimmedResponse,
        order: promptOrder,
        createdOn: new Date(),
        updatedOn: new Date(),
      });

      return ResponseUtility.SUCCESS({
        message: 'Prompt added.',
        data: {
          promptId: newPrompt.promptId,
          promptText: PROMPTS[newPrompt.promptId],
          response: newPrompt.response,
          order: newPrompt.order,
        },
      });
    } catch (err) {
      if (err?.code === DUPLICATE_KEY_ERROR_CODE) {
        throw ResponseUtility.GENERIC_ERR({
          code: 409,
          message: 'This prompt is already added. Use action "update" to change the response.',
        });
      }
      throw err;
    }
  }

  const updated = await PromptModel.findOneAndUpdate(
    { userRef: userId, promptId: pid, deleted: false },
    { $set: { response: trimmedResponse, updatedOn: new Date() } },
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'Prompt not found.' });
  }

  return ResponseUtility.SUCCESS({
    message: 'Prompt updated.',
    data: {
      promptId: updated.promptId,
      promptText: PROMPTS[updated.promptId],
      response: updated.response,
      order: updated.order,
    },
  });
};

const handleReorder = async ({ userId, promptId, order }) => {
  const { code, message } = await PropsValidationUtility({
    validProps: ['promptId', 'order'],
    sourceDocument: { promptId, order },
  });
  if (code !== SUCCESS_CODE) throw ResponseUtility.MISSING_PROPS({ message });

  const pid = toValidPromptId(promptId);
  if (pid === null) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Invalid prompt ID: ${promptId}.` });
  }

  const newOrder = toValidOrder(order);
  if (newOrder === null) {
    throw ResponseUtility.GENERIC_ERR({
      code: 400,
      message: `Order must be an integer between 0 and ${MAX_PROMPTS - 1}.`,
    });
  }

  const updated = await PromptModel.findOneAndUpdate(
    { userRef: userId, promptId: pid, deleted: false },
    { $set: { order: newOrder, updatedOn: new Date() } },
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'Prompt not found.' });
  }

  return ResponseUtility.SUCCESS({
    message: 'Prompt reordered.',
    data: { promptId: updated.promptId, order: updated.order },
  });
};

const ACTION_HANDLERS = new Map([
  ['delete', handleDelete],
  ['add', handleAddOrUpdate],
  ['update', handleAddOrUpdate],
  ['reorder', handleReorder],
]);

export default async ({ userId, promptId, response, order, action }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId', 'action'],
      sourceDocument: { userId, action },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const handler = ACTION_HANDLERS.get(action);

    if (!handler) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Invalid action. Allowed: add, update, delete, reorder.' });
    }

    return await handler({ userId, promptId, response, order, action });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};