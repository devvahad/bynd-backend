import bcrypt from 'bcryptjs';

const HashUtility = {
  generate: ({ text, iterations = 10 }) =>
    bcrypt.hash(text, iterations),
  compare: ({ hash, text }) => bcrypt.compare(text, hash),
};

export default HashUtility;