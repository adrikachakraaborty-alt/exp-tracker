export type Transaction = { id: string; transaction_date: string; description: string; category: string; type: "income" | "expense"; amount: number; note: string | null; is_starting?: boolean; alert_below?: number | null; created_at?: string };

export const categories = ["food", "travel", "transport", "stationery", "cosmetics", "entertainment", "clothing", "medical", "misc"];
