"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Mic, Search, Send, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { categories, Transaction } from "@/lib/types";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const day = (iso: string) => { const today = new Date().toISOString().slice(0, 10); const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10); if (iso === today) return "Today"; if (iso === yesterday) return "Yesterday"; return new Date(iso + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }); };

export default function Home() {
  const [items, setItems] = useState<Transaction[]>([]); const [loading, setLoading] = useState(true);
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState("");
  const [query, setQuery] = useState(""); const [editing, setEditing] = useState<Transaction | null>(null);
  const client = useMemo(() => supabase(), []);
  async function load() { setLoading(true); const { data } = await client.from("transactions").select("*").order("transaction_date", { ascending: false }).order("created_at", { ascending: false }); setItems((data as Transaction[]) || []); setLoading(false); }
  useEffect(() => { load(); }, [client]);
  const visible = items.filter(x => [x.description, x.category, x.note].join(" ").toLowerCase().includes(query.toLowerCase()));
  const income = items.filter(x => x.type === "income").reduce((s, x) => s + Number(x.amount), 0); const expense = items.filter(x => x.type === "expense").reduce((s, x) => s + Number(x.amount), 0);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault(); const t = text.trim(); if (!t || busy) return;
    setBusy(true); setNotice("");
    try {
      if (t.endsWith("?")) {
        const r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: t, transactions: items }) });
        const d = await r.json().catch(() => ({})); setNotice(d.answer || d.error || "The AI is busy right now — try again in a minute.");
      } else {
        const r = await fetch("/api/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t }) });
        const d = await r.json().catch(() => ({}));
        if (d.transaction) {
          const { data, error } = await client.from("transactions").insert(d.transaction).select().single();
          if (!error && data) { setItems(old => [data as Transaction, ...old]); setText(""); setNotice(`Added: ${d.transaction.description} — ${money.format(d.transaction.amount)}`); }
          else setNotice("Couldn't save that. Check your internet and try again.");
        } else setNotice(d.error || "Couldn't understand that. Try: samosa 15");
      }
    } catch { setNotice("No connection. Check your internet and try again."); }
    finally { setBusy(false); }
  }
  async function saveEdit(t: Transaction) { setItems(xs => xs.map(x => x.id === t.id ? t : x)); setEditing(null); const { error } = await client.from("transactions").update({ transaction_date: t.transaction_date, description: t.description, category: t.category, type: t.type, amount: t.amount, note: t.note }).eq("id", t.id); if (error) { setNotice("That edit didn't save — showing the sheet as it is on the server."); load(); } }
  async function remove(id: string) { setItems(xs => xs.filter(x => x.id !== id)); setEditing(null); const { error } = await client.from("transactions").delete().eq("id", id); if (error) { setNotice("Couldn't delete that one — showing the sheet as it is on the server."); load(); } }
  function dictate() { const Speech = window.SpeechRecognition || window.webkitSpeechRecognition; if (!Speech) return alert("Voice input is not available in this browser. Try Chrome on Android."); const recognition = new Speech(); recognition.lang = "en-IN"; recognition.onresult = (event: SpeechRecognitionEvent) => setText(event.results[0][0].transcript); recognition.start(); }

  return <main className="app">
    <header className="hero">
      <div className="brand"><i>◒</i> ledgerly</div>
      <div className="balance-label">Balance</div>
      <div className="balance">{money.format(income - expense)}</div>
      <div className="inout"><span className="in">↓ {money.format(income)} in</span><span className="out">↑ {money.format(expense)} out</span></div>
    </header>
    <form className="smartbar" onSubmit={submit}>
      <input value={text} onChange={e => setText(e.target.value)} placeholder="Type it: ate a samosa, paid 15rs" disabled={busy} />
      <button type="button" className="round" title="Speak" onClick={dictate}><Mic size={18} /></button>
      <button className="round go" disabled={busy || !text.trim()} title="Add">{busy ? <Loader2 size={18} className="spin" /> : <Send size={18} />}</button>
    </form>
    <p className="hint">Just describe it — the row gets added for you. End with “?” to ask about your spending.</p>
    {notice && <div className="notice">{notice}<button onClick={() => setNotice("")}><X size={14} /></button></div>}
    <section className="list">
      <div className="list-head">
        <Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search" />
      </div>
      {visible.map(row => <button className="row" key={row.id} onClick={() => setEditing(row)}>
        <div className="row-main"><span className="desc">{row.description}</span><span className="meta">{day(row.transaction_date)} · {row.category}</span></div>
        <span className={`amt ${row.type}`}>{row.type === "income" ? "+" : "−"}{money.format(Number(row.amount))}</span>
      </button>)}
      {!loading && visible.length === 0 && <div className="empty">{items.length === 0 ? "Nothing yet. Type your first expense above." : "No matches."}</div>}
      {loading && <div className="empty">Loading…</div>}
    </section>
    {editing && <EditModal item={editing} onClose={() => setEditing(null)} onSave={saveEdit} onDelete={remove} />}
  </main>;
}

function EditModal({ item, onClose, onSave, onDelete }: { item: Transaction; onClose: () => void; onSave: (t: Transaction) => void; onDelete: (id: string) => void }) {
  const [draft, setDraft] = useState(item);
  const change = (field: keyof Transaction, value: string) => setDraft(d => ({ ...d, [field]: field === "amount" ? Number(value) : value }));
  return <div className="modal-back" onClick={onClose}><form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); if (draft.description.trim() && draft.amount > 0) onSave(draft); }}>
    <h2>Edit</h2>
    <div className="form-grid">
      <label className="field"><span>Date</span><input type="date" value={draft.transaction_date} onChange={e => change("transaction_date", e.target.value)} /></label>
      <label className="field"><span>Type</span><select value={draft.type} onChange={e => change("type", e.target.value)}><option value="expense">Expense</option><option value="income">Income</option></select></label>
      <label className="field full"><span>Description</span><input required value={draft.description} onChange={e => change("description", e.target.value)} /></label>
      <label className="field"><span>Category</span><select value={draft.category} onChange={e => change("category", e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
      <label className="field"><span>Amount (₹)</span><input required type="number" min="1" step="0.01" value={draft.amount || ""} onChange={e => change("amount", e.target.value)} /></label>
      <label className="field full"><span>Note</span><input value={draft.note || ""} onChange={e => change("note", e.target.value)} placeholder="Optional" /></label>
    </div>
    <div className="modal-actions">
      <button type="button" className="danger" onClick={() => onDelete(draft.id)}><Trash2 size={15} /> Delete</button>
      <button type="button" className="ghost" onClick={onClose}>Cancel</button>
      <button className="primary">Save</button>
    </div>
  </form></div>;
}
