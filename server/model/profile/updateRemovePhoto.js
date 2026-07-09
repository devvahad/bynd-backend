import uploadPhotos from '../user/uploadPhotos.js';

export default ({ userId, photoUrl }) => uploadPhotos({ id: userId, photoUrl, action: 'remove' });
