import PromptMongoModel from '../prompt/index.js';
import UserModel from '../user/index.js';
import { ResponseUtility } from '../../utility/index.js';
import { PROMPTS, PROFILE_PROGRESS_STEP_WEIGHT } from '../../constants.js';

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

export const SkipPromptsService = async ({ id }) => {
  try {
    const deleteResult = await PromptMongoModel.deleteMany({ userRef: id });

    await UserModel.findByIdAndUpdate(id, { $set: { skipPrompts: true } });

    return ResponseUtility.SUCCESS({
      message: 'Prompts section skipped successfully.',
      data: { deletedPrompts: deleteResult.deletedCount },
    });
  } catch (err) {
    throw ResponseUtility.GENERIC_ERR({ error: err.message });
  }
};

export const CompletePromptsStepService = async ({ id }) => {
  try {
    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: id, promptsStepCompleted: false },
      { $inc: { profileProgress: PROFILE_PROGRESS_STEP_WEIGHT }, $set: { promptsStepCompleted: true, lastUpdatedAt: new Date() } },
      { new: true },
    ).select('profileProgress');

    const user = updatedUser || (await UserModel.findById(id).select('profileProgress'));

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    return ResponseUtility.SUCCESS({
      message: 'Prompt step completed successfully.',
      data: { profileProgress: user.profileProgress },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ error: err.message });
    }
    throw err;
  }
};
