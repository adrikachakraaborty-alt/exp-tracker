export type Transaction = { id: string; transaction_date: string; description: string; category: string; type: "income" | "expense"; amount: number; note: string | null; created_at?: string };

export const categories = ["Food & dining", "Transport", "Shopping", "Bills", "Health", "Entertainment", "Salary", "Freelance", "Other"];
