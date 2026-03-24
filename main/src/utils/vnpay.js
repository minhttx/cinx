/**
 * VNPAY Utility for CinemaHub
 * Using Web Crypto API (SubtleCrypto) for HMAC-SHA512
 * This avoids adding extra npm dependencies in Docker environment.
 */

const VNP_CONFIG = {
    TMN_CODE: '463HIKMC',
    HASH_SECRET: 'W270PLDKTP5UKM7PF86LGQMNXD6JD7EP',
    URL: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    RETURN_URL: window.location.origin + '/booking/callback'
};

/**
 * Generate HMAC-SHA512 hash using Web Crypto API
 */
async function hmacSHA512(key, data) {
    const encoder = new TextEncoder();
    const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(key),
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
    );
    const signature = await window.crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        encoder.encode(data)
    );
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Create VNPAY Payment URL
 */
export async function createVnpayUrl({ orderId, amount, orderInfo, ipAddr }) {
    const date = new Date();
    const createDate = formatDate(date);
    
    // 15 minutes expiry
    const expireDate = formatDate(new Date(date.getTime() + 15 * 60000));

    let vnp_Params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': VNP_CONFIG.TMN_CODE,
        'vnp_Locale': 'vn',
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': orderId,
        'vnp_OrderInfo': orderInfo,
        'vnp_OrderType': 'other',
        'vnp_Amount': amount * 100, // VNPAY requires amount * 100
        'vnp_ReturnUrl': VNP_CONFIG.RETURN_URL,
        'vnp_IpAddr': ipAddr || '127.0.0.1',
        'vnp_CreateDate': createDate,
        'vnp_ExpireDate': expireDate
    };

    // Sort parameters
    vnp_Params = sortObject(vnp_Params);

    // Build query string
    const querystring = new URLSearchParams(vnp_Params).toString();
    
    // Generate secure hash
    const secureHash = await hmacSHA512(VNP_CONFIG.HASH_SECRET, querystring);
    
    return `${VNP_CONFIG.URL}?${querystring}&vnp_SecureHash=${secureHash}`;
}

/**
 * Verify VNPAY return signature
 */
export async function verifyVnpaySignature(queryParams) {
    const secureHash = queryParams['vnp_SecureHash'];
    
    const params = { ...queryParams };
    delete params['vnp_SecureHash'];
    delete params['vnp_SecureHashType'];
    
    const sortedParams = sortObject(params);
    const signData = new URLSearchParams(sortedParams).toString();
    
    const checkHash = await hmacSHA512(VNP_CONFIG.HASH_SECRET, signData);
    
    return checkHash === secureHash;
}

// Helpers
function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => {
        sorted[key] = obj[key];
    });
    return sorted;
}

function formatDate(date) {
    const pad = (n) => n < 10 ? '0' + n : n;
    return date.getFullYear().toString() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds());
}
