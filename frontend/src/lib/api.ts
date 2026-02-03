
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

export interface Quest {
    id: string;
    title: string;
    description: string;
    guild_class: 'SLAY' | 'GATHER' | 'ESCORT' | 'PUZZLE' | 'OTHER';
    risk_level: 'L0' | 'L1' | 'L2';
    reward_gp: number;
    tags: string[];
    // Backend returns lowercase status
    status: 'posted' | 'accepted' | 'in_progress' | 'submitted' | 'approved' | 'paid' | 'completed' | 'cancelled';
}

export async function fetchQuests(): Promise<Quest[]> {
    try {
        const res = await fetch(`${API_BASE_URL}/quests`, {
            cache: 'no-store', // Dynamic data, never cache
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch quests: ${res.status}`);
        }

        const data = await res.json();
        // Validate response structure if needed, for now assume backend returns { data: Quest[] } or just Quest[]
        // Based on standard API practices, let's assume it returns the array directly or we adjust.
        // Checking backend controller: res.json(quests); -> It returns the array directly.
        return data;
    } catch (error) {
        console.error('Error fetching quests:', error);
        return [];
    }
}

export async function acceptQuest(questId: string, adventurerId: string): Promise<{ success: boolean; message?: string }> {
    try {
        const res = await fetch(`${API_BASE_URL}/quests/${questId}/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mercenary_id: adventurerId }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `Failed to accept quest: ${res.status}`);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error accepting quest:', error);
        return { success: false, message: error.message };
    }
}
