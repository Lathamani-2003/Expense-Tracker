import { useState } from "react";

function ExpenseForm({ onAddExpense, categoryOptions, tripOptions = [] }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categoryOptions[0] || "Other");
  const [date, setDate] = useState("");
  const [tripId, setTripId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const numericAmount = Number(amount);

    if (!trimmedTitle || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid title and amount greater than zero.");
      return;
    }

    if (!category || !date) {
      setError("Category and date are required.");
      return;
    }

    onAddExpense(trimmedTitle, numericAmount, category, date, tripId);
    setTitle("");
    setAmount("");
    setCategory(categoryOptions[0] || "Other");
    setDate("");
    setTripId("");
    setError("");
  };

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="expense-title">Title</label>
        <input
          id="expense-title"
          type="text"
          placeholder="Enter expense title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="expense-amount">Amount</label>
        <input
          id="expense-amount"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="expense-category">Category</label>
        <select
          id="expense-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="expense-date">Date</label>
        <input
          id="expense-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="expense-trip">Trip</label>
        <select
          id="expense-trip"
          value={tripId}
          onChange={(e) => setTripId(e.target.value)}
        >
          <option value="">No Trip</option>
          {tripOptions.map((trip) => (
            <option key={trip.id} value={trip.id}>
              {trip.name}
            </option>
          ))}
        </select>
      </div>
      <button type="submit">Add Expense</button>
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}

export default ExpenseForm;
