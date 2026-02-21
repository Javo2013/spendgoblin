import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard({ token, username, onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("income");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const [budgets, setBudgets] = useState([]);
  const [budgetMonth, setBudgetMonth] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetCategory, setBudgetCategory] = useState("Food");

  const [exchangeRate, setExchangeRate] = useState(null);
  const [meal, setMeal] = useState(null);
  const [showFullRecipe, setShowFullRecipe] = useState(false);

  // Default selected month = current month
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toLocaleString("default", {
      month: "long",
      year: "numeric",
    })
  );

  // ------------------------
  // FETCH FUNCTIONS
  // ------------------------

  const fetchTransactions = async () => {
    const res = await axios.get("http://127.0.0.1:5000/transactions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setTransactions(res.data);
  };

  const fetchBudgets = async () => {
    const res = await axios.get("http://127.0.0.1:5000/budgets", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setBudgets(res.data);
  };

  const fetchExchangeRate = async () => {
    const res = await axios.get("http://127.0.0.1:5000/exchange-rate");
    setExchangeRate(res.data.USD_to_EUR);
  };

  const fetchMeal = async () => {
    const res = await axios.get("http://127.0.0.1:5000/cheap-meal");
    setMeal(res.data);
    setShowFullRecipe(false);
  };

  // ------------------------
  // HANDLERS
  // ------------------------

  const handleAddTransaction = async (e) => {
    e.preventDefault();

    if (!amount || isNaN(amount)) {
      alert("Please enter a valid amount");
      return;
    }

    if (!date) {
      alert("Please select a date");
      return;
    }

    await axios.post(
      "http://127.0.0.1:5000/transactions",
      { amount: parseFloat(amount), type, category, description, date },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setAmount("");
    setType("income");
    setCategory("Food");
    setDescription("");
    setDate("");

    fetchTransactions();
  };

  const handleDeleteTransaction = async (id) => {
    await axios.delete(`http://127.0.0.1:5000/transactions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchTransactions();
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();

    await axios.post(
      "http://127.0.0.1:5000/budgets",
      {
        month: budgetMonth,
        category: budgetCategory,
        amount: parseFloat(budgetAmount),
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setBudgetMonth("");
    setBudgetAmount("");
    setBudgetCategory("Food");

    fetchBudgets();
  };

  // ------------------------
  // LOAD DATA
  // ------------------------

  useEffect(() => {
    if (token) {
      fetchTransactions();
      fetchBudgets();
      fetchExchangeRate();
      fetchMeal();
    }
  }, [token]);

  // ------------------------
  // FILTER BY SELECTED MONTH
  // ------------------------

  const filteredTransactions = transactions.filter((t) => {
    const transactionMonth = new Date(t.date).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    return transactionMonth === selectedMonth;
  });

  const filteredBudgets = budgets.filter(
    (b) => b.month === selectedMonth
  );

  // ------------------------
  // BALANCE (MONTH-SPECIFIC)
  // ------------------------

  const balance = filteredTransactions.reduce((acc, t) => {
    return t.type === "income"
      ? acc + t.amount
      : acc - t.amount;
  }, 0);

  // ------------------------
  // REMAINING PER CATEGORY
  // ------------------------

  const calculateRemaining = (budget) => {
    const spent = filteredTransactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.category === budget.category
      )
      .reduce((sum, t) => sum + t.amount, 0);

    return budget.amount - spent;
  };

  // ------------------------
  // UI
  // ------------------------

  return (
    <div style={{ padding: "30px" }}>
      <h2>Welcome, {username}</h2>
      <button onClick={onLogout}>Logout</button>

      {/* MONTH SELECTOR */}
      <hr />
      <h3>Select Month</h3>
      <input
        type="month"
        onChange={(e) => {
          const [year, month] = e.target.value.split("-");
          const dateObj = new Date(year, month - 1);
          const formatted = dateObj.toLocaleString("default", {
            month: "long",
            year: "numeric",
          });
          setSelectedMonth(formatted);
        }}
      />

      <p>Viewing: {selectedMonth}</p>

      <hr />

      <h3>Current Balance: ${balance.toFixed(2)}</h3>
      {exchangeRate && <p>USD to EUR: {exchangeRate}</p>}

      <hr />

      {/* TRANSACTIONS */}
      <h3>Add Transaction</h3>

      <form onSubmit={handleAddTransaction}>
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>Food</option>
          <option>Rent</option>
          <option>Utilities</option>
          <option>Entertainment</option>
          <option>Other</option>
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button type="submit">Add</button>
      </form>

      <h3>Transactions</h3>
      {filteredTransactions.map((t) => (
        <div key={t.id}>
          <p>
            {t.type} - {t.category} - ${t.amount} - {t.description} - {t.date}
          </p>
          <button onClick={() => handleDeleteTransaction(t.id)}>
            Delete
          </button>
        </div>
      ))}

      <hr />

      {/* BUDGETS */}
      <h3>Monthly Budgets</h3>

      <form onSubmit={handleAddBudget}>
        <input
          placeholder="Month (e.g. January 2026)"
          value={budgetMonth}
          onChange={(e) => setBudgetMonth(e.target.value)}
          required
        />

        <input
          placeholder="Budget Amount"
          value={budgetAmount}
          onChange={(e) => setBudgetAmount(e.target.value)}
          required
        />

        <select
          value={budgetCategory}
          onChange={(e) => setBudgetCategory(e.target.value)}
        >
          <option>Food</option>
          <option>Rent</option>
          <option>Utilities</option>
          <option>Entertainment</option>
          <option>Other</option>
        </select>

        <button type="submit">Set Budget</button>
      </form>

      {filteredBudgets.map((b) => {
        const remaining = calculateRemaining(b);

        return (
          <div key={b.id} style={{ marginBottom: "10px" }}>
            <p>
              {b.month} - {b.category} Budget: ${b.amount}
            </p>

            <p>Remaining: ${remaining.toFixed(2)}</p>

            {remaining < 0 && (
              <p style={{ color: "red" }}>
                Over budget by ${Math.abs(remaining).toFixed(2)}
              </p>
            )}
          </div>
        );
      })}

      <hr />

      {/* MEAL SECTION */}
      <h3>💰 Budget Meal Suggestion</h3>
      <button onClick={fetchMeal}>Get New Meal</button>

      {meal && (
        <div style={{ marginTop: "15px" }}>
          <h4>{meal.name}</h4>

          <img
            src={meal.image}
            width="250"
            alt="meal"
            style={{ borderRadius: "10px" }}
          />

          <p style={{ maxWidth: "600px" }}>
            {showFullRecipe
              ? meal.instructions
              : meal.instructions.substring(0, 200) + "..."}
          </p>

          <button onClick={() => setShowFullRecipe(!showFullRecipe)}>
            {showFullRecipe ? "Show Less" : "Read More"}
          </button>
        </div>
      )}
    </div>
  );
}