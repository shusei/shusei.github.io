import crypto from 'crypto';

interface TransactionData {
    date: string;
    amount: number;
    description: string;
    type: string;
}

export const generateTransactionHash = (data: TransactionData): string => {
    // Normalize: trim, lowercase
    const normalizedString = `${data.date}|${data.amount}|${data.description.trim().toLowerCase()}|${data.type}`;
    return crypto.createHash('sha256').update(normalizedString).digest('hex');
};
