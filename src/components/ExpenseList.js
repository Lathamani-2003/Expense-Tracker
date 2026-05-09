function ExpenseList({ expenses, onDeleteExpense }) {
  if (expenses.length === 0) {
    return <p className="empty-text">No expenses added yet.</p>;
  }

  return (
    <ul className="expense-list">
      {expenses.map((expense) => (
        <li key={expense.id} className="expense-item">
          <div>
            <p className="expense-name">{expense.title || expense.name}</p>
            <p className="expense-meta">
              {expense.category || "Other"} {expense.date ? `- ${expense.date}` : ""}
            </p>
            <p className="expense-amount">${expense.amount.toFixed(2)}</p>
          </div>
          <button
            className="delete-btn"
            onClick={() => onDeleteExpense(expense.id)}
            type="button"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}

export default ExpenseList;
