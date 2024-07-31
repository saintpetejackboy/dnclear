// Function to sanitize phone numbers
const sanitizePhoneNumber = (phoneNumber) => {
    let sanitized = phoneNumber.replace(/[^0-9]/g, '');
    if (sanitized.length === 11 && sanitized.startsWith('1')) {
        sanitized = sanitized.slice(1);
    } else if (sanitized.length === 12 && sanitized.startsWith('91')) {
        sanitized = sanitized.slice(2);
    }
    // Ensure the number is 10 digits long
    if (sanitized.length > 10) {
        sanitized = sanitized.slice(-10);
    }
    return sanitized;
};

module.exports = {
    sanitizePhoneNumber
};
