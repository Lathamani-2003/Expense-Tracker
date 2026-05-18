import { useEffect, useMemo, useRef, useState } from "react";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import "./styles.css";

const STORAGE_KEY = "expense-tracker-items";
const CATEGORY_OPTIONS = ["Food", "Travel", "Shopping", "Bills", "Health", "Other"];
const MENU_ITEMS = ["Home", "Expenses", "Trips", "Approvals", "Settings"];

const DEFAULT_EXPENSES = [
  { id: "exp-1", title: "Groceries", amount: 72.5, category: "Food", date: "2026-05-03", tripId: "", reported: true },
  { id: "exp-2", title: "Cab Ride", amount: 18.25, category: "Travel", date: "2026-05-05", tripId: "trip-1", reported: false },
  { id: "exp-3", title: "Electricity Bill", amount: 56.0, category: "Bills", date: "2026-05-06", tripId: "", reported: false },
  { id: "exp-4", title: "Coffee", amount: 9.75, category: "Food", date: "2026-05-08", tripId: "", reported: true }
];

const DEFAULT_TRIPS = [
  { id: "trip-1", name: "Chennai Client Visit", date: "2026-05-20", budget: 500, status: "Active" },
  { id: "trip-2", name: "Bangalore Summit", date: "2026-06-10", budget: 850, status: "Active" }
];

const DEFAULT_APPROVALS = [
  { id: "app-1", item: "Hotel reimbursement - Priya", amount: 220, status: "Pending" },
  { id: "app-2", item: "Travel advance - Karan", amount: 300, status: "Pending" },
  { id: "app-3", item: "Meal claim - Alex", amount: 45, status: "Approved" }
];

const createExpenseId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now();
const createTripId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `trip-${Date.now()}`;

function App() {
  const [expenses, setExpenses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeSection, setActiveSection] = useState("Home");
  const [trips, setTrips] = useState(DEFAULT_TRIPS);
  const [tripForm, setTripForm] = useState({ name: "", date: "", budget: "" });
  const [tripFormError, setTripFormError] = useState("");
  const [approvals, setApprovals] = useState(DEFAULT_APPROVALS);
  const [profile, setProfile] = useState({ name: "Janice Chandler", email: "janice@expensio.app" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [settingsMessage, setSettingsMessage] = useState("");
  const [quickActionMessage, setQuickActionMessage] = useState("");
  const [reportSummary, setReportSummary] = useState("");
  const expenseFormSectionRef = useRef(null);

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
          date: item.date || "",
          tripId: item.tripId || "",
          reported: Boolean(item.reported)
        }));
        setExpenses(normalized);
      } else {
        setExpenses(DEFAULT_EXPENSES);
      }
    } catch (error) {
      console.error("Failed to load expenses from localStorage.", error);
      setExpenses(DEFAULT_EXPENSES);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = (title, amount, category, date, tripId = "") => {
    const newExpense = {
      id: createExpenseId(),
      title: title.trim(),
      amount: Number(amount),
      category,
      date,
      tripId,
      reported: false
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
  const pendingApprovals = useMemo(
    () =>
      approvals.filter((item) => item.status === "Pending").length +
      expenses.filter((expense) => expense.amount >= 100).length,
    [approvals, expenses]
  );
  const tripsRegistered = useMemo(
    () =>
      trips.length +
      expenses.filter((expense) => expense.category === "Travel").length,
    [trips, expenses]
  );
  const unreportedExpenses = expenses.filter((expense) => !expense.reported).length;
  const upcomingExpenses = expenses.filter((expense) => {
    if (!expense.date) return false;
    const expenseDate = new Date(expense.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expenseDate > today;
  }).length;
  const recentExpenses = useMemo(
    () =>
      [...expenses]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 5),
    [expenses]
  );

  const pendingApprovalCount = approvals.filter((item) => item.status === "Pending").length;
  const activeTrips = useMemo(
    () => trips.filter((trip) => trip.status !== "Completed"),
    [trips]
  );
  const expensesByTrip = useMemo(
    () =>
      trips.map((trip) => ({
        ...trip,
        linkedExpenseCount: expenses.filter((expense) => expense.tripId === trip.id).length,
        linkedExpenseTotal: expenses
          .filter((expense) => expense.tripId === trip.id)
          .reduce((sum, expense) => sum + expense.amount, 0),
        finalTripTotal:
          trip.budget +
          expenses
            .filter((expense) => expense.tripId === trip.id)
            .reduce((sum, expense) => sum + expense.amount, 0)
      })),
    [expenses, trips]
  );
  const monthlySummary = useMemo(() => {
    const grouped = expenses.reduce((acc, expense) => {
      const date = expense.date ? new Date(expense.date) : null;
      const label = date && !Number.isNaN(date.valueOf())
        ? date.toLocaleString("default", { month: "short", year: "numeric" })
        : "No Date";
      acc[label] = (acc[label] || 0) + expense.amount;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([label, total]) => ({ label, total }))
      .slice(-7);
  }, [expenses]);
  const daySummary = useMemo(() => {
    const grouped = expenses.reduce((acc, expense) => {
      const label = expense.date || "No Date";
      acc[label] = (acc[label] || 0) + expense.amount;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => new Date(a.label) - new Date(b.label))
      .slice(-7);
  }, [expenses]);
  const monthlyBarData = useMemo(() => {
    const max = Math.max(...monthlySummary.map((item) => item.total), 1);
    return monthlySummary.map((item) => ({
      ...item,
      height: `${Math.max(12, (item.total / max) * 100)}%`
    }));
  }, [monthlySummary]);
  const dailyBarData = useMemo(() => {
    const max = Math.max(...daySummary.map((item) => item.total), 1);
    return daySummary.map((item) => ({
      ...item,
      height: `${Math.max(12, (item.total / max) * 100)}%`
    }));
  }, [daySummary]);

  const handleAddTrip = (event) => {
    event.preventDefault();
    const budgetValue = Number(tripForm.budget);
    const trimmedName = tripForm.name.trim();

    if (!trimmedName || !tripForm.date || Number.isNaN(budgetValue) || budgetValue <= 0) {
      setTripFormError("Enter a valid trip name, date, and budget.");
      return;
    }

    setTrips((prev) => [
      { id: createTripId(), name: trimmedName, date: tripForm.date, budget: budgetValue, status: "Active" },
      ...prev
    ]);
    setTripForm({ name: "", date: "", budget: "" });
    setTripFormError("");
  };

  const handleApprovalStatus = (approvalId, status) => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === approvalId ? { ...item, status } : item))
    );
  };

  const handleCompleteTrip = (tripId) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId ? { ...trip, status: "Completed" } : trip
      )
    );
  };

  const handleQuickNewExpense = () => {
    setQuickActionMessage("Expense form is ready.");
    setActiveSection("Home");
    requestAnimationFrame(() => {
      expenseFormSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      const titleInput = document.getElementById("expense-title");
      if (titleInput) titleInput.focus();
    });
  };

  const handleQuickAddReceipt = () => {
    setQuickActionMessage("Receipt upload will be connected soon.");
  };

  const handleQuickCreateReport = () => {
    const total = expenses.reduce((sum, item) => sum + item.amount, 0);
    setReportSummary(
      `Report: ${expenses.length} expenses recorded with total spend ₹${total.toFixed(2)}.`
    );
  };

  const handleQuickCreateTrip = () => {
    const today = new Date().toISOString().slice(0, 10);
    const newTrip = {
      id: createTripId(),
      name: `Quick Trip ${trips.length + 1}`,
      date: today,
      budget: 300
    };
    setTrips((prev) => [newTrip, ...prev]);
    setQuickActionMessage(`Trip "${newTrip.name}" added.`);
  };

  const handleProfileSubmit = (event) => {
    event.preventDefault();
    setSettingsMessage("Profile details saved.");
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setSettingsMessage("Fill all password fields.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSettingsMessage("New password and confirm password must match.");
      return;
    }
    setSettingsMessage("Password updated successfully.");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const renderHomeSection = () => (
    <>
      <div className="dashboard-grid">
        <article className="panel">
          <h3>Pending Tasks</h3>
          <ul className="task-list">
            <li><span>Pending Approvals</span><strong>{pendingApprovals}</strong></li>
            <li><span>New Trips Registered</span><strong>{tripsRegistered}</strong></li>
            <li><span>Unreported Expenses</span><strong>{unreportedExpenses}</strong></li>
            <li><span>Upcoming Expenses</span><strong>{upcomingExpenses}</strong></li>
          </ul>
        </article>

        <article className="panel">
          <div className="panel-row">
            <h3>Recent Expenses</h3>
            <div className="total-pill">₹{totalAmount.toFixed(2)}</div>
          </div>
          <ExpenseList expenses={filteredExpenses.slice(0, 5)} onDeleteExpense={deleteExpense} />
        </article>
      </div>

      <section className="panel">
        <h3>Quick Access</h3>
        <div className="quick-actions">
          <button type="button" className="quick-btn" onClick={handleQuickNewExpense}>+ New Expense</button>
          <button type="button" className="quick-btn" onClick={handleQuickAddReceipt}>+ Add Receipt</button>
          <button type="button" className="quick-btn" onClick={handleQuickCreateReport}>+ Create Report</button>
          <button type="button" className="quick-btn" onClick={handleQuickCreateTrip}>+ Create Trip</button>
        </div>
        {quickActionMessage ? <p className="empty-text">{quickActionMessage}</p> : null}
        {reportSummary ? <p className="empty-text">{reportSummary}</p> : null}
      </section>

      <section className="panel" ref={expenseFormSectionRef}>
        <h3>Add Expense</h3>
        <ExpenseForm
          onAddExpense={addExpense}
          categoryOptions={CATEGORY_OPTIONS}
          tripOptions={activeTrips}
        />
      </section>

      <div className="filter-row">
        <label htmlFor="category-filter-home">Filter by category</label>
        <select
          id="category-filter-home"
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

      <section className="chart-grid">
        <article className="panel chart-panel">
          <h3>Monthly Report</h3>
          <div className="chart-bars">
            {monthlyBarData.map((item) => (
              <span key={item.label} style={{ height: item.height }} title={`${item.label}: ₹${item.total.toFixed(2)}`} />
            ))}
          </div>
          {monthlySummary.length ? (
            <ul className="task-list">
              {monthlySummary.map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <strong>₹{item.total.toFixed(2)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-text">No monthly data yet.</p>
          )}
        </article>
        <article className="panel chart-panel">
          <h3>Day-to-Day Expenses</h3>
          <div className="chart-bars">
            {dailyBarData.map((item) => (
              <span key={item.label} style={{ height: item.height }} title={`${item.label}: ₹${item.total.toFixed(2)}`} />
            ))}
          </div>
          {daySummary.length ? (
            <ul className="task-list">
              {daySummary.map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <strong>₹{item.total.toFixed(2)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-text">No day-wise data yet.</p>
          )}
        </article>
      </section>
    </>
  );

  const renderExpensesSection = () => (
    <>
      <section className="panel">
        <h3>Add Expense</h3>
        <ExpenseForm
          onAddExpense={addExpense}
          categoryOptions={CATEGORY_OPTIONS}
          tripOptions={activeTrips}
        />
      </section>

      <div className="filter-row">
        <label htmlFor="category-filter-expenses">Filter by category</label>
        <select
          id="category-filter-expenses"
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

      <section className="panel">
        <div className="panel-row">
          <h3>Expenses</h3>
          <div className="total-pill">₹{totalAmount.toFixed(2)}</div>
        </div>
        <ExpenseList expenses={filteredExpenses} onDeleteExpense={deleteExpense} />
      </section>
    </>
  );

  const renderTripsSection = () => (
    <>
      <section className="panel">
        <h3>Add Trip</h3>
        <form className="expense-form" onSubmit={handleAddTrip}>
          <div className="field">
            <label htmlFor="trip-name">Trip Name</label>
            <input
              id="trip-name"
              type="text"
              placeholder="Enter trip name"
              value={tripForm.name}
              onChange={(event) => setTripForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="trip-date">Date</label>
            <input
              id="trip-date"
              type="date"
              value={tripForm.date}
              onChange={(event) => setTripForm((prev) => ({ ...prev, date: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="trip-budget">Budget</label>
            <input
              id="trip-budget"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={tripForm.budget}
              onChange={(event) => setTripForm((prev) => ({ ...prev, budget: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="trip-structure">Expense Linking</label>
            <input id="trip-structure" value="Structure ready for trip-expense mapping" readOnly />
          </div>
          <button type="submit">Add Trip</button>
          {tripFormError ? <p className="form-error">{tripFormError}</p> : null}
        </form>
      </section>

      <section className="panel">
        <h3>Trips</h3>
        <ul className="expense-list">
          {expensesByTrip.map((trip) => (
            <li key={trip.id} className="expense-item">
              <div>
                <p className="expense-name">{trip.name}</p>
                <p className="expense-meta">{trip.date}</p>
                <p className="expense-amount">₹{trip.budget.toFixed(2)}</p>
              </div>
              <div>
                <p className="expense-meta">Linked expenses: {trip.linkedExpenseCount}</p>
                <p className="expense-amount">Total: ₹{trip.finalTripTotal.toFixed(2)}</p>
                <p className="expense-meta">Status: {trip.status || "Active"}</p>
                <button
                  type="button"
                  className="quick-btn"
                  onClick={() => handleCompleteTrip(trip.id)}
                  disabled={trip.status === "Completed"}
                >
                  {trip.status === "Completed" ? "Completed" : "Mark Completed"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );

  const renderApprovalsSection = () => (
    <section className="panel">
      <div className="panel-row">
        <h3>Pending Approvals</h3>
        <div className="total-pill">{pendingApprovalCount} Pending</div>
      </div>
      <ul className="expense-list">
        {approvals.map((approval) => (
          <li key={approval.id} className="expense-item">
            <div>
              <p className="expense-name">{approval.item}</p>
              <p className="expense-meta">Status: {approval.status}</p>
              <p className="expense-amount">₹{approval.amount.toFixed(2)}</p>
            </div>
            <div className="quick-actions">
              <button
                type="button"
                className="quick-btn"
                onClick={() => handleApprovalStatus(approval.id, "Approved")}
              >
                Approve
              </button>
              <button
                type="button"
                className="delete-btn"
                onClick={() => handleApprovalStatus(approval.id, "Rejected")}
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );

  const renderSettingsSection = () => (
    <>
      <section className="panel">
        <h3>User Profile</h3>
        <form className="expense-form" onSubmit={handleProfileSubmit}>
          <div className="field">
            <label htmlFor="profile-name">Name</label>
            <input
              id="profile-name"
              type="text"
              value={profile.name}
              onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="profile-email">Email</label>
            <input
              id="profile-email"
              type="email"
              value={profile.email}
              onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>
          <button type="submit">Save Profile</button>
        </form>
      </section>

      <section className="panel">
        <h3>Change Password</h3>
        <form className="expense-form" onSubmit={handlePasswordSubmit}>
          <div className="field">
            <label htmlFor="current-password">Current Password</label>
            <input
              id="current-password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
              }
            />
          </div>
          <button type="submit">Update Password</button>
          {settingsMessage ? <p className="form-error">{settingsMessage}</p> : null}
        </form>
      </section>
    </>
  );

  const renderActiveSection = () => {
    if (activeSection === "Expenses") return renderExpensesSection();
    if (activeSection === "Trips") return renderTripsSection();
    if (activeSection === "Approvals") return renderApprovalsSection();
    if (activeSection === "Settings") return renderSettingsSection();
    return renderHomeSection();
  };

  return (
    <main className="app">
      <section className="dashboard">
        <aside className="sidebar">
          <div className="profile">
            <div className="avatar">J</div>
            <p className="profile-name">Janice Chandler</p>
          </div>
          <nav className="menu">
            {MENU_ITEMS.map((item) => (
              <button
                key={item}
                type="button"
                className={`menu-item ${activeSection === item ? "active" : ""}`}
                onClick={() => setActiveSection(item)}
              >
                {item}
              </button>
            ))}
          </nav>
          <h2 className="brand"></h2>
        </aside>

        <div className="main-panel">
          <header className="top-bar">
            <h1 className="title">{activeSection === "Home" ? "Expense Dashboard" : activeSection}</h1>
            <span className="pro-tag"></span>
          </header>
          {renderActiveSection()}
        </div>
      </section>
    </main>
  );
}

export default App;
