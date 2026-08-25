import { logger } from '../../services/logger.js';

const PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

/**
 * Validate an iOS receipt against Apple's verifyReceipt endpoint,
 * automatically retrying against the sandbox environment when Apple
 * reports the receipt is a sandbox receipt (status 21007).
 */
const validateiOSReceipt = async (receiptData, password) => {
  const cleanedReceipt = receiptData.replace(/[\s\n\r\t]/g, '');

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanedReceipt)) {
    throw new Error('Invalid receipt format - not valid base64');
  }

  const requestBody = {
    'receipt-data': cleanedReceipt,
    password,
    'exclude-old-transactions': false,
  };

  const postReceipt = async (url) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    return response.json();
  };

  let validationData;
  try {
    validationData = await postReceipt(PRODUCTION_URL);

    if (validationData.status === 21007) {
      validationData = await postReceipt(SANDBOX_URL);
      validationData.environment = 'sandbox';
    } else if (validationData.status === 0) {
      validationData.environment = 'production';
    }
  } catch (error) {
    logger.error(`Production receipt validation failed, trying sandbox: ${error.message}`);
    validationData = await postReceipt(SANDBOX_URL);
    validationData.environment = 'sandbox';
  }

  return validationData;
};

/**
 * Extract the most recent transaction for a given product from an
 * Apple verifyReceipt response.
 */
export const extractiOSTransactionDetails = (validationResponse, productId) => {
  const receiptInfo = validationResponse.latest_receipt_info || validationResponse.receipt?.in_app || [];

  if (!Array.isArray(receiptInfo) || receiptInfo.length === 0) {
    return null;
  }

  const relevantTransactions = receiptInfo
    .filter((transaction) => transaction.product_id === productId)
    .sort((a, b) => {
      const dateA = Number(a.purchase_date_ms || a.original_purchase_date_ms || 0);
      const dateB = Number(b.purchase_date_ms || b.original_purchase_date_ms || 0);
      return dateB - dateA;
    });

  if (relevantTransactions.length === 0) return null;

  const transaction = relevantTransactions[0];

  const expireDate = transaction.expires_date_ms
    ? new Date(Number(transaction.expires_date_ms))
    : transaction.expires_date ? new Date(transaction.expires_date) : null;

  if (!expireDate) return null;

  return {
    transaction,
    expireDate,
    productId: transaction.product_id,
    transactionId: transaction.transaction_id || transaction.original_transaction_id,
    originalTransactionId: transaction.original_transaction_id || transaction.transaction_id,
    purchaseDate: new Date(Number(transaction.purchase_date_ms || transaction.original_purchase_date_ms)),
  };
};

export const APPLE_RECEIPT_STATUS_MESSAGES = {
  21000: 'The App Store could not read the JSON object you provided.',
  21002: 'The data in the receipt-data property was malformed or missing.',
  21003: 'The receipt could not be authenticated.',
  21004: 'The shared secret you provided does not match the shared secret on file.',
  21005: 'The receipt server is not currently available.',
  21006: 'This receipt is valid but the subscription has expired.',
  21007: 'This receipt is from the test environment.',
  21008: 'This receipt is from the production environment.',
  21010: 'This receipt could not be authorized.',
};

export default validateiOSReceipt;
