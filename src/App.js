import { useEffect, useMemo, useState } from "react";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import "./styles.css";

const STORAGE_KEY = "expense-tracker-items";
const CATEGORY_OPTIONS = ["Food", "Travel", "Shopping", "Bills", "Health", "Other"];
const createExpenseId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now();

function App() {
  const [expenses, setExpenses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const normalized = parsed.map((item) => ({
          id: item.id,
          title: item.title || item.name || "",
          amount: Number(item.amount) || 0,
          category: item.category || "Other",
          date: item.date || ""
        }));
        setExpenses(normalized);
      }
    } catch (error) {
      console.error("Failed to load expenses from localStorage.", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = (title, amount, category, date) => {
    const newExpense = {
      id: createExpenseId(),
      title: title.trim(),
      amount: Number(amount),
      category,
      date
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const deleteExpense = (id) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  };

  const filteredExpenses = useMemo(() => {
    if (selectedCategory === "All") {
      return expenses;
    }
    return expenses.filter((expense) => expense.category === selectedCategory);
  }, [expenses, selectedCategory]);

  const totalAmount = useMemo(
    () => filteredExpenses.reduce((sum, item) => sum + item.amount, 0),
    [filteredExpenses]
  );

  return (
    <main className="app">
      <section className="card">
        <h1 className="title">Expense Tracker</h1>
        <p className="subtitle">A clean way to manage where your money goes.</p>

        <ExpenseForm onAddExpense={addExpense} categoryOptions={CATEGORY_OPTIONS} />

        <div className="filter-row">
          <label htmlFor="category-filter">Filter by category</label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            <option value="All">All</option>
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="total-box">
          <span>Total Amount</span>
          <strong>${totalAmount.toFixed(2)}</strong>
        </div>

        <ExpenseList expenses={filteredExpenses} onDeleteExpense={deleteExpense} />
      </section>
    </main>
  );
}

export default App;
