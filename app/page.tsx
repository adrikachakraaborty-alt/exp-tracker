"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Mic, Plus, Search, Send, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { categories, Transaction } from "@/lib/types";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const todayIST = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const day = (iso: string) => { const today = todayIST(); const yesterday = new Date(Date.now() - 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); if (iso === today) return "Today"; if (iso === yesterday) return "Yesterday"; return new Date(iso + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }); };

export default function Home() {
  const [items, setItems] = useState<Transaction[]>([]); const [loading, setLoading] = useState(true);
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState("");
  const [query, setQuery] = useState(""); const [editing, setEditing] = useState<Transaction | null>(null); const [adding, setAdding] = useState(false);
  const client = useMemo(() => supabase(), []);
  async function load() { setLoading(true); const { data } = await client.from("transactions").select("*").order("transaction_date", { ascending: false }).order("created_at", { ascending: false }); setItems((data as Transaction[]) || []); setLoading(false); }
  useEffect(() => { load(); }, [client]);
  const visible = items.filter(x => [x.description, x.category, x.note].join(" ").toLowerCase().includes(query.toLowerCase()));
  const income = items.filter(x => x.type === "income").reduce((s, x) => s + Number(x.amount), 0); const expense = items.filter(x => x.type === "expense").reduce((s, x) => s + Number(x.amount), 0);

  // Pocket money: this month's incomes marked "starting money" minus this month's expenses.
  const monthKey = todayIST().slice(0, 7);
  const monthRows = items.filter(x => x.transaction_date.startsWith(monthKey));
  const pocketRows = monthRows.filter(x => x.type === "income" && x.is_starting);
  const pocket = pocketRows.reduce((s, x) => s + Number(x.amount), 0);
  const spentMonth = monthRows.filter(x => x.type === "expense").reduce((s, x) => s + Number(x.amount), 0);
  const pocketLeft = pocket - spentMonth;
  const alertAt = pocketRows.map(x => x.alert_below).filter((v): v is number => v != null && v > 0).slice(-1)[0] ?? null;

  // Insights: recent spend and all-time split by category.
  const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const spentSince = (since: string) => items.filter(x => x.type === "expense" && x.transaction_date >= since).reduce((s, x) => s + Number(x.amount), 0);
  const spent7 = spentSince(daysAgo(6)); const spent30 = spentSince(daysAgo(29));
  const catTotals = Object.entries(items.reduce<Record<string, number>>((m, x) => { if (x.type === "expense") m[x.category] = (m[x.category] || 0) + Number(x.amount); return m; }, {})).sort((a, b) => b[1] - a[1]);
  const palette = ["#2a9d8f", "#e76f51", "#457b9d", "#f4a261", "#9b5de5", "#f15bb5", "#8ab17d", "#e63946", "#90a955", "#6c757d"];
  const pie = (() => { let acc = 0; return catTotals.map(([, v], i) => { const from = (acc / expense) * 100; acc += v; return `${palette[i % palette.length]} ${from}% ${(acc / expense) * 100}%`; }).join(", "); })();

  async function resetAll() {
    if (!confirm("Delete ALL transactions permanently? This cannot be undone.")) return;
    const { error } = await client.from("transactions").delete().gte("transaction_date", "1900-01-01");
    if (error) setNotice("Couldn't reset. Check your internet and try again.");
    else { setItems([]); setNotice("Everything deleted. Fresh start!"); }
  }

  async function insert(t: Omit<Transaction, "id">) {
    const { data, error } = await client.from("transactions").insert(t).select().single();
    if (error || !data) { setNotice("Couldn't save that. Check your internet and try again."); return false; }
    setItems(old => [data as Transaction, ...old]); return true;
  }
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
        if (d.transaction) { if (await insert(d.transaction)) { setText(""); setNotice(`Added: ${d.transaction.description} — ${money.format(d.transaction.amount)}`); } }
        else setNotice(d.error || "Couldn't understand that. Try: samosa 15");
      }
    } catch { setNotice("No connection. Check your internet and try again."); }
    finally { setBusy(false); }
  }
  async function saveEdit(t: Transaction) { setItems(xs => xs.map(x => x.id === t.id ? t : x)); setEditing(null); const { error } = await client.from("transactions").update({ transaction_date: t.transaction_date, description: t.description, category: t.category, type: t.type, amount: t.amount, note: t.note, is_starting: t.type === "income" && !!t.is_starting, alert_below: t.is_starting ? t.alert_below ?? null : null }).eq("id", t.id); if (error) { setNotice("That edit didn't save — showing the sheet as it is on the server."); load(); } }
  async function remove(id: string) { setItems(xs => xs.filter(x => x.id !== id)); setEditing(null); const { error } = await client.from("transactions").delete().eq("id", id); if (error) { setNotice("Couldn't delete that one — showing the sheet as it is on the server."); load(); } }
  function dictate() { const Speech = window.SpeechRecognition || window.webkitSpeechRecognition; if (!Speech) return alert("Voice input is not available in this browser. Try Chrome on Android."); const recognition = new Speech(); recognition.lang = "en-IN"; recognition.onresult = (event: SpeechRecognitionEvent) => setText(event.results[0][0].transcript); recognition.start(); }

  return <main className="app">
    <div className="side">
    <header className="hero">
      <div className="brand"><i>◒</i> ledgerly</div>
      <div className="balance-label">Balance</div>
      <div className="balance">{money.format(income - expense)}</div>
      <div className="inout"><span className="in">↓ {money.format(income)} in</span><span className="out">↑ {money.format(expense)} out</span></div>
      {pocket > 0 && <div className={`pocket ${alertAt != null && pocketLeft <= alertAt ? "low" : ""}`}>
        <span>Pocket money · {new Date().toLocaleDateString("en-IN", { month: "long" })}</span>
        <strong>{money.format(pocketLeft)} left of {money.format(pocket)}</strong>
        <div className="bar"><i style={{ width: `${Math.max(0, Math.min(100, (pocketLeft / pocket) * 100))}%` }} /></div>
        <em>{alertAt != null && pocketLeft <= alertAt ? `⚠️ below your ${money.format(alertAt)} alert` : `Spent ${money.format(spentMonth)} · Saving ${money.format(Math.max(0, pocketLeft))} so far`}</em>
      </div>}
    </header>
    <form className="smartbar" onSubmit={submit}>
      <input value={text} onChange={e => setText(e.target.value)} placeholder="Type it: ate a samosa, paid 15rs" disabled={busy} />
      <button type="button" className="round" title="Speak" onClick={dictate}><Mic size={18} /></button>
      <button className="round go" disabled={busy || !text.trim()} title="Add">{busy ? <Loader2 size={18} className="spin" /> : <Send size={18} />}</button>
    </form>
    <div className="hint-row">
      <p className="hint">Describe it and the row gets added. End with “?” to ask about your spending.</p>
      <button className="ghost small" onClick={() => setAdding(true)}><Plus size={15} /> Add money</button>
    </div>
    {notice && <div className="notice">{notice}<button onClick={() => setNotice("")}><X size={14} /></button></div>}
    {expense > 0 && <section className="insights">
      <div className="spend-row">
        <div><span>Last 7 days</span><strong>{money.format(spent7)}</strong></div>
        <div><span>Last 30 days</span><strong>{money.format(spent30)}</strong></div>
      </div>
      <div className="pie-wrap">
        <div className="pie" style={{ background: `conic-gradient(${pie})` }} />
        <ul className="legend">{catTotals.map(([c, v], i) => <li key={c}><i style={{ background: palette[i % palette.length] }} />{c}<b>{money.format(v)} · {Math.round((v / expense) * 100)}%</b></li>)}</ul>
      </div>
    </section>}
    </div>
    <section className="list">
      <div className="list-head">
        <Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search" />
        {items.length > 0 && <button className="reset" onClick={resetAll}>Reset all</button>}
      </div>
      {visible.map(row => <button className="row" key={row.id} onClick={() => setEditing(row)}>
        <div className="row-main"><span className="desc">{row.is_starting ? "★ " : ""}{row.description}</span><span className="meta">{day(row.transaction_date)} · {row.category}</span></div>
        <span className={`amt ${row.type}`}>{row.type === "income" ? "+" : "−"}{money.format(Number(row.amount))}</span>
      </button>)}
      {!loading && visible.length === 0 && <div className="empty">{items.length === 0 ? "Nothing yet. Type your first expense above." : "No matches."}</div>}
      {loading && <div className="empty">Loading…</div>}
    </section>
    {editing && <EditModal item={editing} onClose={() => setEditing(null)} onSave={saveEdit} onDelete={remove} />}
    {adding && <AddMoneyModal onClose={() => setAdding(false)} onAdd={async t => { if (await insert(t)) setAdding(false); }} />}
  </main>;
}

function StartingFields({ starting, alert, onStarting, onAlert }: { starting: boolean; alert: string; onStarting: (v: boolean) => void; onAlert: (v: string) => void }) {
  return <>
    <label className="check full"><input type="checkbox" checked={starting} onChange={e => onStarting(e.target.checked)} /> This is my starting money (monthly pocket money)</label>
    {starting && <label className="field full"><span>Alert me when what’s left drops below (₹, optional)</span><input type="number" min="0" value={alert} onChange={e => onAlert(e.target.value)} placeholder="e.g. 2000" /></label>}
  </>;
}

function AddMoneyModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: Omit<Transaction, "id">) => void }) {
  const [amount, setAmount] = useState(""); const [description, setDescription] = useState("Pocket money"); const [date, setDate] = useState(todayIST()); const [starting, setStarting] = useState(true); const [alert, setAlert] = useState("");
  return <div className="modal-back" onClick={onClose}><form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); const a = Number(amount); if (a > 0) onAdd({ transaction_date: date, description: description.trim() || "Money added", category: "misc", type: "income", amount: a, note: null, is_starting: starting, alert_below: starting && alert !== "" ? Number(alert) : null }); }}>
    <h2>Add money</h2>
    <div className="form-grid">
      <label className="field"><span>Amount (₹)</span><input required autoFocus type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" /></label>
      <label className="field"><span>Date</span><input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
      <label className="field full"><span>What is it?</span><input value={description} onChange={e => setDescription(e.target.value)} /></label>
      <StartingFields starting={starting} alert={alert} onStarting={setStarting} onAlert={setAlert} />
    </div>
    <div className="modal-actions">
      <button type="button" className="ghost" onClick={onClose}>Cancel</button>
      <button className="primary">Add money</button>
    </div>
  </form></div>;
}

function EditModal({ item, onClose, onSave, onDelete }: { item: Transaction; onClose: () => void; onSave: (t: Transaction) => void; onDelete: (id: string) => void }) {
  const [draft, setDraft] = useState(item);
  const change = (field: keyof Transaction, value: string) => setDraft(d => ({ ...d, [field]: field === "amount" ? Number(value) : value }));
  const options = categories.includes(draft.category) ? categories : [draft.category, ...categories];
  return <div className="modal-back" onClick={onClose}><form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); if (draft.description.trim() && draft.amount > 0) onSave(draft); }}>
    <h2>Edit</h2>
    <div className="form-grid">
      <label className="field"><span>Date</span><input type="date" value={draft.transaction_date} onChange={e => change("transaction_date", e.target.value)} /></label>
      <label className="field"><span>Type</span><select value={draft.type} onChange={e => change("type", e.target.value)}><option value="expense">Expense</option><option value="income">Income</option></select></label>
      <label className="field full"><span>Description</span><input required value={draft.description} onChange={e => change("description", e.target.value)} /></label>
      <label className="field"><span>Category</span><select value={draft.category} onChange={e => change("category", e.target.value)}>{options.map(c => <option key={c}>{c}</option>)}</select></label>
      <label className="field"><span>Amount (₹)</span><input required type="number" min="1" step="0.01" value={draft.amount || ""} onChange={e => change("amount", e.target.value)} /></label>
      <label className="field full"><span>Note</span><input value={draft.note || ""} onChange={e => setDraft(d => ({ ...d, note: e.target.value }))} placeholder="Optional" /></label>
      {draft.type === "income" && <StartingFields starting={!!draft.is_starting} alert={draft.alert_below != null ? String(draft.alert_below) : ""} onStarting={v => setDraft(d => ({ ...d, is_starting: v }))} onAlert={v => setDraft(d => ({ ...d, alert_below: v === "" ? null : Number(v) }))} />}
    </div>
    <div className="modal-actions">
      <button type="button" className="danger" onClick={() => onDelete(draft.id)}><Trash2 size={15} /> Delete</button>
      <button type="button" className="ghost" onClick={onClose}>Cancel</button>
      <button className="primary">Save</button>
    </div>
  </form></div>;
}
