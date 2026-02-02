-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Mercenaries & Clients)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- 'admin', 'user'
    
    -- Gamification Profile
    adventurer_rank VARCHAR(10) DEFAULT 'F', -- F, E, D, C, B, A, S
    client_reputation VARCHAR(20) DEFAULT 'Iron', -- Iron, Bronze, Silver, Gold, Platinum
    title VARCHAR(100) DEFAULT 'Novice',
    trust_score INTEGER DEFAULT 80, -- 0-100
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Quests Table (Tasks)
CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- RPG Classification
    guild_class VARCHAR(50) NOT NULL, -- Slay, Gather, Escort, Puzzle
    tags TEXT[], -- ['#cleaning', '#delivery']
    
    -- Status Machine
    status VARCHAR(50) DEFAULT 'posted', -- posted, accepted, in_progress, submitted, approved, paid, completed, cancelled, expired, disputed
    
    -- Rewards & Requirements
    reward_gp INTEGER NOT NULL CHECK (reward_gp > 0),
    risk_level VARCHAR(10) DEFAULT 'L0', -- L0, L1, L2
    required_rank VARCHAR(10) DEFAULT 'F',
    
    -- Relationships
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mercenary_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Metadata
    location VARCHAR(255), -- "Taipei City", or "Online"
    is_public BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ledger Table (Escrow & Transactions)
CREATE TABLE ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL, -- escrow_deposit, escrow_release, cancel_fee_payout, refund_full
    amount INTEGER NOT NULL,
    
    -- Double Entry References
    from_user_id UUID REFERENCES users(id),
    to_user_id UUID REFERENCES users(id), -- Nullable for system hold
    quest_id UUID REFERENCES quests(id),
    
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for frequent queries
CREATE INDEX idx_quests_status ON quests(status);
CREATE INDEX idx_quests_creator ON quests(creator_id);
CREATE INDEX idx_quests_mercenary ON quests(mercenary_id);
CREATE INDEX idx_users_email ON users(email);
