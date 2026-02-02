export type GuildClass = 'Slay' | 'Gather' | 'Escort' | 'Puzzle';
export type AdventurerRank = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export type QuestStatus = 'posted' | 'accepted' | 'in_progress' | 'submitted' | 'approved' | 'paid' | 'completed' | 'cancelled' | 'expired' | 'disputed';
export type RiskLevel = 'L0' | 'L1' | 'L2';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    adventurer_rank: AdventurerRank;
    client_reputation: string;
    title: string;
    trust_score: number;
    created_at: Date;
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    guild_class: GuildClass;
    tags: string[];
    status: QuestStatus;
    reward_gp: number;
    risk_level: RiskLevel;
    required_rank: AdventurerRank;
    creator_id: string;
    mercenary_id?: string;
    location?: string;
    is_public: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface LedgerEvent {
    id: string;
    event_type: 'escrow_deposit' | 'escrow_release' | 'cancel_fee_payout' | 'refund_full' | 'refund_partial' | 'ledger_reversal';
    amount: number;
    from_user_id: string;
    to_user_id?: string;
    quest_id: string;
    description?: string;
    created_at: Date;
}
