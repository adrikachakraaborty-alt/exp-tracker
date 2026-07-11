"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase"; // adjust path if your client lives elsewhere

interface AddMoneyProps {
  onAdded?: () => void; // call this to refresh the transaction list / balance after adding
}

export default function AddMoney({ onAdded }: AddMoneyProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddMoney() {
    const value = parseFloat(amount);

    if (isNaN(value) || value <= 0) {
      setError("Enter a valid amount greater than 0");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from("transactions").insert({
      type: "income",
      category: "Add Money",
      description: "Balance top-up",
      amount: value,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setAmount("");
    onAdded?.(); // let the parent refresh balance/transactions
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border rounded-md px-3 py-2 w-32 text-sm"
      />
      <button
        onClick={handleAddMoney}
        disabled={loading}
        className="bg-green-600 text-white text-sm px-4 py-2 rounded-md disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Money"}
      </button>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}
