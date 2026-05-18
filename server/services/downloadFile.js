import got from 'got';

const DownloadFileService = (url) =>
  got(url, { responseType: 'buffer' }).then((res) => res.body);

export default DownloadFileService;