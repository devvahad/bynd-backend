import uploadPhotos from '../user/uploadPhotos.js';

export default ({ userId, photoOrder }) => uploadPhotos({ id: userId, photoOrder, action: 'reorder' });
