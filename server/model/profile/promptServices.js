import PromptMongoModel from '../prompt/index.js';
import { ResponseUtility } from '../../utility/index.js';
import { PROMPTS } from '../../constants.js';

export const ListPromptsService = async ({ userId }) => {
  try {
    const prompts = await PromptMongoModel.find({ userRef: userId, deleted: false }).sort({ order: 1 });
    return ResponseUtility.SUCCESS({
      data: prompts.map((p) => ({
        promptId: p.promptId,
        promptText: PROMPTS[p.promptId],
        response: p.response,
        order: p.order,
      })),
    });
  } catch (err) {
    throw ResponseUtility.GENERIC_ERR({ error: err.message });
  }
};

export const SkipPromptsService = async () => ResponseUtility.SUCCESS({ message: 'Prompts skipped.' });
