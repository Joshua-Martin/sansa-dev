/**
 * Cleans extracted text by removing unnecessary elements
 *
 * @param {string} text - Raw text extracted from PDF
 * @returns {string} - Cleaned text
 */
export const cleanText = (text: string): string => {
  return (
    text
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      // Remove multiple newlines
      .replace(/[\r\n]+/g, '\n')
      // Remove PDF artifacts and common unwanted elements
      .replace(/^Form\s*$/gm, '')
      .replace(/Page\s*\d+\s*of\s*\d+/g, '')
      // Trim whitespace
      .trim()
  );
};
