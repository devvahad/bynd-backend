import uploadPhotos from '../user/uploadPhotos.js';

export default ({ userId, photo }) => uploadPhotos({ id: userId, photo, action: 'upload' });
