import got from 'got';
import { DOWNLOAD_TIMEOUT_MS, DOWNLOAD_MAX_RETRIES, DOWNLOAD_MAX_BYTES, DOWNLOAD_MAX_REDIRECTS } from '../constants.js';

function isValidHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function DownloadFileService(
  url,
  {
    timeoutMs = DOWNLOAD_TIMEOUT_MS,
    retries = DOWNLOAD_MAX_RETRIES,
    maxBytes = DOWNLOAD_MAX_BYTES,
    maxRedirects = DOWNLOAD_MAX_REDIRECTS,
    headers = {},
  } = {}
) {
  if (!isValidHttpUrl(url)) {
    throw new Error(`Invalid URL: ${url}`);
  }

  try {
    const response = await got(url, {
      responseType: 'buffer',
      timeout: { request: timeoutMs },
      retry: { limit: retries },
      followRedirect: true,
      maxRedirects,
      headers,
      throwHttpErrors: true,
    }).on('downloadProgress', ({ transferred }) => {
      if (transferred > maxBytes) {
        throw new Error(`Download exceeded maximum allowed size of ${maxBytes} bytes`);
      }
    });

    if (response.body.length > maxBytes) {
      throw new Error(`Downloaded file exceeds maximum allowed size of ${maxBytes} bytes`);
    }

    return response.body;
  } catch (error) {
    if (error instanceof got.HTTPError) {
      throw new Error(`Failed to download file: HTTP ${error.response.statusCode} for ${url}`);
    }
    if (error instanceof got.TimeoutError) {
      throw new Error(`Failed to download file: request timed out for ${url}`);
    }
    if (error instanceof got.RequestError) {
      throw new Error(`Failed to download file: ${error.message} for ${url}`);
    }
    throw error;
  }
}

export default DownloadFileService;