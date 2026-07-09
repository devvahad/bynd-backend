export const TOKEN_EXPIRY = '7d';
export const LOGIN_TOKEN_LIFE = '60d';
export const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

export const PAGINATION_LIMIT = 20;
export const MAX_LIMIT = 100;
export const MAX_SEARCH_TEXT_LENGTH = 100;

export const SUCCESS_CODE = 100;
export const MISSING_PROPS_CODE = 101;
export const INVALID_INPUT_CODE = 102;
export const CONN_ERR_CODE = 103;
export const NO_USER_CODE = 104;
export const LOGIN_AUTH_FAILED_CODE = 105;
export const GENERIC_ERR_CODE = 106;
export const INVALID_ACCESS_TOKEN_CODE = 107;
export const EMAIL_ALREADY_TAKEN_CODE = 108;
export const NUMBER_NOT_REGISTERED_CODE = 109;
export const OTP_TYPE_ERROR_CODE = 110;
export const TOKEN_NOT_VERIFIED_CODE = 111;
export const EMAIL_ALREADY_VERIFIED_CODE = 112;
export const TOKEN_TRY_EXPIRED_CODE = 113;
export const TOKEN_EXPIRED_CODE = 114;
export const INVALID_VERIFICATION_CODE_CODE = 115;
export const BROKEN_REFERENCE_CODE = 116;
export const NOTHING_MODIFIED_CODE = 117;
export const NOT_MEMBER_OF_GROUP_CODE = 118;
export const MALFORMED_REQUEST_CODE = 400;
export const REFRESH_TOKEN_MISMATCH_CODE = 401;

export const MONTHS = Object.freeze([
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]);

export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 86_400_000;

export const APP_NAME = process.env.APP_NAME || 'Bynd';
export const APP_LOGO_URL = process.env.APP_LOGO_URL || '';
export const HOST = process.env.HOST || 'http://localhost:3000';
export const DEFAULT_PORT = 3000;
export const SHUTDOWN_TIMEOUT_MS = 10_000;
export const tokenLife = '100d';


export const mongoConnectionString =
  process.env.MONGO_URI ||
  `mongodb+srv://${process.env.ATLAS_USER}:${process.env.ATLAS_PASSWORD}@${process.env.ATLAS_CLUSTER}/${process.env.DB_NAME}?retryWrites=true&w=majority`;

export const S3_IMAGES = Object.freeze({
  SMALL: process.env.S3_BUCKET_SMALL || process.env.S3_BUCKET,
  AVERAGE: process.env.S3_BUCKET_AVERAGE || process.env.S3_BUCKET,
  BEST: process.env.S3_BUCKET_BEST || process.env.S3_BUCKET,
  GLOBAL: process.env.S3_BUCKET || '',
});

export const DEVICE_TYPES = Object.freeze({ IOS: 'ios', ANDROID: 'android' });
export const OTP_TYPES = Object.freeze({ EMAIL: 'email', SMS: 'sms' });
export const USER_ROLES = Object.freeze({ USER: 'user', ADMIN: 'admin' });

export const EMPTY_STATS = { total: 0, active: 0, blocked: 0, deleted: 0 };

export const TYPE_OF_NOTIFICATIONS = {
  ADMIN: 1,
  MESSAGE: 2,
  DATE_REQUEST: 3,
  MATCH: 4,
};

export const ADMIN_USER_ACTIONS = {
  VERIFIED: 1,
  BLOCKED: 2,
  UNBLOCKED: 3,
  DELETED: 4,
};

export const VERIFICATION_TYPE = {
  CHANGE_PASSWORD: 1,
  EMAIL_VERIFICATION: 2,
};

export const SUPPORTED_SOCIAL_PROVIDERS = Object.freeze(['google', 'apple']);

export const SOCIAL_IDENTIFIER = {
  FB: 1,
  APPLE: 2,
  GOOGLE: 3,
};

export const CHAT_FILTER_TYPES = {
  UNREAD: 1,
  READ: 2,
  SENT_UNREAD: 3,
};

export const USER_CHAT_ACTION = {
  BLOCK: 1,
  UNMATCH: 2,
  REPORT: 3,
};

export const TYPE_OF_ABUSE_CHAT = {
  SPAM: 1,
  ABUSIVE_OR_OFFENSIVE: 2,
  HARASSMENT: 3,
  INAPPROPRIATE_LANGUAGE: 4,
  MISINFORMATION: 5,
  VIOLENCE: 6,
};

export const MIN_AGE = 18;
export const MIN_YEAR = 1900;
export const COOLDOWN_SECONDS = 60;
export const MAX_RETRIES = 3;
export const RETRY_WINDOW_MINUTES = 15;
export const MAX_VERIFICATION_TRIES = 5;
export const MIN_PASSWORD_LENGTH = 8;
export const DUPLICATE_KEY_ERROR_CODE = 11000;
export const DUMMY_HASH = process.env.DUMMY_HASH;

export const MAX_BIO_LENGTH = 500;
export const MAX_EDUCATION_LENGTH = 200;
export const MAX_SCHOOL_LENGTH = 100;
export const MAX_JOB_TITLE_LENGTH = 100;
export const MAX_INDUSTRY_LENGTH = 100;
export const MAX_SUB_GENDER_LENGTH = 50;
export const MAX_LANGUAGE_LENGTH = 50;
export const PROFILE_PLACEHOLDER = 'NA';
export const NA = 'NA';

export const MAX_AGE = 100;
export const MIN_HEIGHT_CM = 100;
export const MAX_HEIGHT_CM = 250;
export const FEET_TO_CM = 30.48;
export const INCHES_TO_CM = 2.54;
export const HEIGHT_PATTERN = /^(\d+)'(\d+)"?$/;
export const MIN_DISTANCE_MILES = 1;
export const MAX_DISTANCE_MILES = 100;
export const MAX_PHOTOS = 6;
export const MIN_PHOTOS = 2;
export const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024;
export const MAX_PROFILE_PERCENTAGE = 100;
export const MAX_TAGS_PER_CATEGORY = 3;
export const MAX_TOTAL_TAGS = 10;
export const MAX_LANGUAGES = 10;
export const MAX_LOVE_LANGUAGES = 2;
export const MAX_PETS = 3;
export const MAX_SEXUALITY_OPTIONS = 2;
export const MAX_ETHNICITIES = 3;
export const MAX_FIRST_DATE_PREFERENCES = 3;

export const MAX_PROMPTS = 4;
export const MAX_PROMPT_RESPONSE_LENGTH = 300;
export const PROMPT_CATEGORIES = ['About Me', 'Interests', 'Dating', 'Digging Deeper'];

export const USER_DISPLAY_PROJECTION = '-password -phoneToken -changePassToken -socialToken -fcmToken';
export const USER_PREVIEW_PROJECTION = '-password -phoneToken -changePassToken -socialToken -fcmToken -phoneTokenRetries';

export const GEOCODE_TIMEOUT_MS = 3000;
export const GEOCODE_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

export const DOB_FORMAT_REGEX = /^(\d{2})-(\d{2})-(\d{4})$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PROFILE_COMPLETENESS_RULES = [
  { field: 'firstName', weight: 6, test: (user) => Boolean(user.firstName) },
  { field: 'age/dob', weight: 6, test: (user) => Boolean(user.age || user.dob) },
  { field: 'photos', weight: 6, test: (user) => Array.isArray(user.photos) && user.photos.length >= 2 },
  { field: 'prompts', weight: 6, test: (_u, ctx) => ctx.promptsCount >= 1 },
  { field: 'interests', weight: 6, test: (user) => Array.isArray(user.interests) && user.interests.length >= 1 },
  { field: 'bio', weight: 4, test: (user) => Boolean(user.bio) },
  { field: 'verified', weight: 6, test: (user) => Boolean(user.verified) },
  { field: 'gender', weight: 6, test: (user) => Boolean(user.gender) },
  { field: 'location', weight: 2, test: (user) => Boolean(user.location?.coordinates) },
  { field: 'languages', weight: 2, test: (user) => Array.isArray(user.languages) && user.languages.length > 0 },
  { field: 'heightLabel', weight: 2, test: (user) => Boolean(user.heightLabel) },
  { field: 'work', weight: 2, test: (user) => Boolean(user.work?.jobTitle || user.work?.industry) },
  { field: 'school', weight: 2, test: (user) => Boolean(user.school) },
  { field: 'education', weight: 2, test: (user) => Boolean(user.education) },
  { field: 'pronouns', weight: 2, test: (user) => Array.isArray(user.pronouns) && user.pronouns.length > 0 },
  { field: 'userEthnicities', weight: 2, test: (user) => Array.isArray(user.userEthnicities) && user.userEthnicities.length > 0 },
  { field: 'politicalView', weight: 2, test: (user) => Boolean(user.politicalView) },
  { field: 'religion', weight: 2, test: (user) => Boolean(user.religion) },
  { field: 'zodiacSign', weight: 2, test: (user) => Boolean(user.zodiacSign) },
  { field: 'sexuality', weight: 2, test: (user) => Array.isArray(user.sexuality) && user.sexuality.length > 0 },
  { field: 'children', weight: 2, test: (user) => Boolean(user.children) },
  { field: 'familyPlans', weight: 2, test: (user) => Boolean(user.familyPlans) },
  { field: 'pets', weight: 2, test: (user) => Array.isArray(user.pets) && user.pets.length > 0 },
  { field: 'exercise', weight: 2, test: (user) => Boolean(user.exercise) },
  { field: 'drinkingHabits', weight: 2, test: (user) => Boolean(user.drinkingHabits) },
  { field: 'smokingHabits', weight: 2, test: (user) => Boolean(user.smokingHabits) },
  { field: 'cannabis', weight: 2, test: (user) => Boolean(user.cannabis) },
  { field: 'dietaryPreferences', weight: 2, test: (user) => Array.isArray(user.dietaryPreferences) && user.dietaryPreferences.length > 0 },
  { field: 'foodAllergies', weight: 2, test: (user) => Array.isArray(user.foodAllergies) && user.foodAllergies.length > 0 },
  { field: 'firstDatePreferences', weight: 2, test: (user) => Array.isArray(user.firstDatePreferences) && user.firstDatePreferences.length > 0 },
  { field: 'meetingAvailability', weight: 2, test: (user) => Array.isArray(user.meetingAvailability) && user.meetingAvailability.length > 0 },
  { field: 'firstDateDistance', weight: 2, test: (user) => Boolean(user.firstDateDistance) },
  { field: 'relationshipType', weight: 2, test: (user) => Boolean(user.relationshipType) },
  { field: 'loveLanguages', weight: 2, test: (user) => Array.isArray(user.loveLanguages) && user.loveLanguages.length > 0 },
  { field: 'datingExpectations', weight: 2, test: (user) => Boolean(user.datingExpectations) },
];

export const PREMIUM_FEATURE_DEFINITIONS = [
  { icon: 'heart', title: 'Unlimited Likes', lockedDescription: 'Like as many profiles as you want' },
  { icon: 'eye', title: 'See Who Likes You', lockedDescription: 'See everyone who has liked your profile' },
  { icon: 'filter', title: 'Advanced Filters', lockedDescription: 'Filter matches by more detailed preferences' },
  { icon: 'checkmark', title: 'Read Receipts', lockedDescription: 'Know when your messages have been read' },
  { icon: 'undo', title: 'Undo Swipes', lockedDescription: 'Undo accidental swipes and get a second chance' },
  { icon: 'rocket', title: 'Boost Your Profile', lockedDescription: 'Get more visibility with profile boosts' },
  { icon: 'support', title: 'Priority Support', lockedDescription: 'Get faster responses from our support team' },
];

export const OTP_VALIDITY_MINUTES = 5;
export const OTP_LENGTH = 5;
export const OTP_HASH_ITERATIONS = 10;
export const MAX_OTP_RETRIES = 5;

export const MAX_LOG_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_LOG_FILES = 10;

export const DOWNLOAD_TIMEOUT_MS = 10000;
export const DOWNLOAD_MAX_RETRIES = 2;
export const DOWNLOAD_MAX_BYTES = 20 * 1024 * 1024;
export const DOWNLOAD_MAX_REDIRECTS = 5;

export const DEFAULT_SALT_ROUNDS = 12;
export const MIN_SALT_ROUNDS = 10;
export const MAX_SALT_ROUNDS = 15;

export const IMAGE_MIN_DIMENSION = 300;
export const IMAGE_MAX_DIMENSION = 4096;
export const IMAGE_MAX_INPUT_BYTES = 10 * 1024 * 1024;
export const IMAGE_ALLOWED_FORMATS = Object.freeze(new Set(['jpeg', 'png', 'webp', 'avif', 'tiff', 'gif']));

export const GENDERS = Object.freeze({
  MAN: 'Man',
  WOMAN: 'Woman',
  NON_BINARY: 'Non-binary',
});

export const SUB_GENDERS = Object.freeze({
  [GENDERS.MAN]: [
    'Cis man', 'Trans man', 'Transmasculine', 'Non-binary man',
    'Genderqueer man', 'Genderfluid man', 'Intersex man',
    'Gender questioning man', 'Demiboy',
  ],
  [GENDERS.WOMAN]: [
    'Cis woman', 'Trans woman', 'Transfeminine', 'Non-binary woman',
    'Genderqueer woman', 'Genderfluid woman', 'Intersex woman',
    'Gender questioning woman', 'Demigirl',
  ],
  [GENDERS.NON_BINARY]: [
    'Agender', 'Bigender', 'Genderfluid', 'Gender non-conforming',
    'Genderqueer', 'Gender questioning', 'Gender variant', 'Intersex', 'Neutrois',
  ],
});

export const ALLOWED_GENDERS = Object.values(GENDERS);

export const LOOKING_FOR = [
  'A long-term relationship',
  'Short-term, open to long',
  'Casual dating',
  'Marriage',
  'Still figuring it out',
];

export const DRINKING_HABITS = ['Yes', 'Sometimes', 'Rarely', 'Never', 'Sober'];
export const SMOKING_HABITS = ['Yes', 'Occasionally', 'Never', 'Trying to quit'];
export const CANNABIS = ['Yes', 'Sometimes', 'Rarely', 'Never', 'Sober'];
export const ACTIVE_STATUS = ['Yes', 'Often', 'Sometimes', 'Rarely', 'Never'];

export const EXERCISE_HABITS = [
  "I'm open to dating everyone",
  'Yes', 'Often', 'Sometimes', 'Rarely', 'Never',
];

export const CHILDREN_STATUS = [
  "I'm open to dating everyone",
  'I have kids',
  "I don't have kids",
];

export const FAMILY_PLANS = [
  "I'm open to dating everyone",
  'I want kids',
  'I am open to kids',
  "I don't want kids",
  'Still figuring it out',
];

export const RELATIONSHIP_TYPES = [
  "I'm open to dating everyone",
  'Monogamy',
  'Non-monogamy',
  'Open relationship',
  'Polyamory',
];

export const DATING_EXPECTATIONS = [
  'A long-term relationship',
  'Short-term, open to long',
  'Casual dating',
  'Marriage',
  'Still figuring it out',
];

export const LOVE_LANGUAGES = [
  'Acts of service',
  'Physical touch',
  'Quality time',
  'Receiving gifts',
  'Words of affirmation',
];

export const FIRST_DATE_ACTIVITIES = [
  'Active', 'Arts', 'Breakfast', 'Coffee', 'Tea', 'Dessert',
  'Dinner', 'Drinks', 'Fun and Games', 'Lunch', 'Outdoors',
];

export const MEETING_DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];
export const MEETING_TIME_SLOTS = ['Morning', 'Afternoon', 'Evening'];

export const ZODIAC_SIGNS = [
  'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn',
];

export const PRONOUNS = [
  'She/her', 'He/him', 'They/them', 'Xe/Xem', 'Ey/em',
  'Ze/zir', 'Ve/ver', 'Ae/aer', 'Fae/faer', 'Co/co', 'Per/per', 'Not listed',
];

export const SEXUALITY_OPTIONS = [
  'Straight', 'Bisexual', 'Gay', 'Lesbian', 'Queer', 'Questioning',
  'Allosexual', 'Asexual', 'Androsexual', 'Autosexual', 'Bicurious',
  'Demisexual', 'Fluid', 'Graysexual', 'Gynesexual', 'Omnisexual',
  'Pansexual', 'Polysexual', 'Sapiosexual', 'Skoliosexual', 'Spectrasexual', 'Other',
];

export const USER_ETHNICITIES = [
  'African American', 'Black', 'Central Asian', 'East Asian', 'Hispanic',
  'Jewish', 'Latina', 'Latino', 'Latinx', 'Middle Eastern', 'Native American',
  'North African', 'Pacific Islander', 'South Asian', 'Southeast Asian', 'White', 'Other',
];

export const RELIGIONS = [
  'Agnostic', 'Atheist', "Bahá'í Faith", 'Buddhist', 'Catholic', 'Christian',
  'Eastern Orthodox', 'Hindu', 'Humanist', 'Muslim', 'Jain', "Jehovah's Witness",
  'Jewish', 'Mormon', 'Indigenous Religion', 'Sikh', 'Spiritual', 'Taoist',
  'Unitarian Universalist', 'Wicca', 'Witch', 'Other', 'None',
];

export const POLITICAL_VIEWS = [
  'Not political', 'Moderate', 'Liberal', 'Conservative',
  'Progressive', 'Libertarian', 'Leftist', 'Other',
];

export const DIETARY_PREFERENCES = [
  'Carnivore', 'Dairy-free', 'Gluten-free', 'Halal', 'Keto', 'Kosher',
  'Paleo', 'Pescatarian', 'Raw vegan', 'Sugar-free', 'Vegan', 'Vegetarian', 'Other',
];

export const FOOD_ALLERGIES = [
  'Corn allergy', 'Egg allergy', 'Fish allergy', 'Fruit allergy',
  'Gluten intolerance', 'Lactose intolerance', 'Legume allergy', 'Lupin allergy',
  'Meat allergy', 'Milk allergy', 'Peanut allergy', 'Potato allergy',
  'Sesame allergy', 'Shellfish allergy', 'Soy allergy', 'Tree nut allergy',
  'Wheat allergy', 'Other',
];

export const PETS_OPTIONS = [
  'Cat', 'Dog', 'Bird', 'Fish', 'Horse', 'Rabbit', 'Reptile',
  'Small mammal', 'No pets', 'Other',
];

export const INTEREST_CATEGORIES = {
  'Arts & Creativity': [
    'Composing music', 'Creative writing', 'Dance', 'Drawing', 'Fashion',
    'Interior design', 'Makeup', 'Needlework', 'Painting', 'Photography',
    'Scrapbooking', 'Singing', 'Vlogging', 'Writing',
  ],
  Entertainment: [
    'Animation', 'Clubs', 'Comedy', 'Concerts', 'Documentaries', 'Drama',
    'Fantasy', 'Horror', 'Karaoke', 'Museums', 'Movies', 'Podcasts',
    'Rom coms', 'Romance', 'Science fiction', 'Standup', 'Theater', 'Thrillers', 'TV',
  ],
  'Food & Drinks': [
    'Baking', 'Bars', 'Brunch', 'Cafes', 'Coffee', 'Cooking', 'Dessert',
    'Fine dining', 'Local food', 'Mixology', 'Tea', 'Trying new restaurants', 'Wine tasting',
  ],
  Music: [
    'Acoustic', 'Alternative', 'Blues', 'Classical', 'Country', 'Electronic',
    'Folk', 'Funk', 'Gospel', 'Hip hop', 'Indie', 'Jazz', 'K-pop', 'Latin',
    'Metal', 'Musical theater', 'Pop', 'Punk', 'R&B', 'Rap', 'Reggae', 'Rock', 'Soul',
  ],
  Outdoors: [
    'Birding', 'Camping', 'Canoeing', 'Farmers markets', 'Fishing', 'Foraging',
    'Gardening', 'Geocaching', 'Going to the beach', 'Hiking', 'Kayaking',
    'Parks', 'Rock climbing', 'Sailing', 'Surfing', 'Winter sports',
  ],
  Reading: [
    'Comics', 'Fiction', 'Graphic novels', 'Historic fiction', 'Horror',
    'Memoir', 'Nonfiction', 'Plays', 'Poetry', 'Reading', 'Science fiction',
    'Suspense', 'Thrillers',
  ],
  'Sports & Fitness': [
    'Basketball', 'Cycling', 'Football', 'Golf', 'Martial arts',
    'Pickle ball', 'Running', 'Soccer', 'Swimming', 'Tennis', 'Weightlifting',
  ],
  Tech: ['AI', 'Drones', 'Gaming', 'Programming', 'Virtual reality (VR)'],
  'Travel & Culture': ['Learning languages', 'Road trips', 'Traveling'],
  'Wellness & Spirituality': [
    'Astrology', 'Journaling', 'Mindfulness', 'Nutrition', 'Therapy', 'Worship', 'Yoga',
  ],
  Values: [
    'Ambition', 'Authenticity', 'Being active', 'Community building', 'Confidence',
    'Creativity', 'Empathy', 'Independence', 'Integrity', 'Intelligence',
    'Kindness', 'Open-mindedness', 'Sense of humor',
  ],
};

export const PROMPTS = {
  1: 'My biggest green flag is',
  2: 'I recently found out that',
  3: 'I feel most like myself when',
  4: 'My hidden superpower is',
  5: 'My perfect weekend involves',
  6: 'My friends would describe me as',
  7: 'The #1 item on my bucket list is',
  8: "The most impulsive thing I've done is",
  9: "The best piece of advice I've received is",
  10: "If I could live one day in someone else's life, it would be",
  11: "I'm weirdly good at",
  12: "If loving this is wrong, then I don't want to be right",
  13: "One thing I can't live without is",
  14: 'If I could instantly learn any skill, it would be',
  15: 'I feel most fulfilled when',
  16: 'I know too much about',
  17: "The fictional world I'd most want to live in is",
  18: "The best meal I've ever had was",
  19: 'A book, movie, or piece of art that influenced my worldview is',
  20: "If money and time weren't an issue, I would dedicate my life to",
  21: 'Dating me is like',
  22: 'Green flags I look for',
  23: 'I show love by',
  24: 'It makes me feel loved when',
  25: "We're the same type of weird if",
  26: 'My dream date is',
  27: "We'll hit it off if",
  28: "Rather than drinks, let's",
  29: 'Together, we could',
  30: 'I show people I care about them by',
  31: 'I recharge my battery by',
  32: 'Something that comforts me during hard times is',
  33: 'If my therapist were to describe me, they would say',
  34: 'My greatest values in life are',
  35: 'The world would be a better place if',
  36: "My life wouldn't be the same without",
  37: 'I want to be remembered for',
  38: 'When I think about the future, I envision',
  39: "I'm most proud of",
  40: 'My biggest life goal is',
};

export const PROMPT_CATEGORY_MAP = {
  'About Me': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  'Interests': [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  'Dating': [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
  'Digging Deeper': [31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
};

export const DEFAULT_SERVER_SELECTION_TIMEOUT_MS = 5000;
export const DEFAULT_SOCKET_TIMEOUT_MS = 45000;
export const DEFAULT_MAX_POOL_SIZE = 10;
export const DEFAULT_MIN_POOL_SIZE = 2;
export const IPV4 = 4;

export const APPLE_KEYS_URL =
  'https://appleid.apple.com/auth/keys';

export const APPLE_ISSUER =
  'https://appleid.apple.com';