import UserModel from './index.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE, HEIGHT_PATTERN, FEET_TO_CM, INCHES_TO_CM } from '../../constants.js';

const parseHeight = (heightLabel) => {
  const match = heightLabel.match(HEIGHT_PATTERN);
  if (!match) return null;
  return {
    heightFeet: Number(match[1]),
    heightInches: Number(match[2]),
    heightCm: Number(match[1]) * FEET_TO_CM + Number(match[2]) * INCHES_TO_CM,
  };
};

export default async ({ id, heightLabel, heightSkipped = false }) => {
  if (!id) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User ID missing from authentication context.' });
  }

  const resolvedHeightLabel = heightSkipped ? '' : heightLabel;

  if (!heightSkipped && !resolvedHeightLabel) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Height label is required unless skipped.' });
  }

  let heightCm = 0;

  if (!heightSkipped) {
    const parsed = parseHeight(resolvedHeightLabel);
    if (!parsed) {
      throw ResponseUtility.GENERIC_ERR({
        message: "Invalid height format. Expected format like 5'9\".",
      });
    }
    heightCm = parsed.heightCm;
  }

  const { code, message } = await PropsValidationUtility({
    validProps: ['heightLabel'],
    sourceDocument: { heightLabel: resolvedHeightLabel },
  });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const profileProgress = heightSkipped || resolvedHeightLabel ? 8 : 0;

  const updatedUser = await UserModel.findOneAndUpdate(
    { _id: id, deleted: false },
    {
      $set: {
        heightCm,
        heightLabel: resolvedHeightLabel,
        heightSkipped,
        profileProgress,
        lastUpdatedAt: new Date(),
      },
    },
    { new: true, strict: false },
  ).select('heightCm heightLabel heightSkipped profileProgress');

  if (!updatedUser) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User not found.' });
  }

  return ResponseUtility.SUCCESS({
    message: 'Height updated successfully.',
    data: {
      userId: id,
      heightLabel: resolvedHeightLabel,
      heightCm,
      heightSkipped,
      profileProgress,
    },
  });
};