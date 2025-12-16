/**
 * Formats a numeric value into the Coroas currency string.
 * Example: 10.5 -> "👑 10,50"
 * 
 * @param {number} value - The numeric value to format
 * @returns {string} - The formatted string
 */
export const formatCurrency = (value) => {
    if (value === null || value === undefined) return '👑 0,00';

    return `👑 ${value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};
