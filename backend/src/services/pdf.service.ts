const { PDFParse } = require('pdf-parse');

export const extractTextFromPdf = async (buffer: Buffer): Promise<string> => {
    try {
        const uint8Array = new Uint8Array(buffer);
        const parser = new PDFParse(uint8Array);
        const data = await parser.getText();
        return data.text;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error('Failed to extract text from PDF');
    }
};
