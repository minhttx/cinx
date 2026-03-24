/**
 * Tách chuỗi có dấu phẩy thành mảng các phần tử đã được trim và lọc bỏ chuỗi rỗng
 * @param {string} str - Chuỗi cần tách (ví dụ: "hành động, hài, tình cảm")
 * @returns {string[]} - Mảng các phần tử
 */
export const splitCommaString = (str) => {
  if (!str) return [];
  return str
    .split(',')
    .map(item => item.trim())
    .filter(item => item !== "");
};
