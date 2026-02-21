import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard({ token, username, onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("income");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [exchangeRate, setExchangeRate] = useState(null);
  const [meal, setMeal] = useState(null);
  const [showFullRecipe, setShowFullRecipe] = useState(false);

  const [budgets, setBudgets] = useState([]);
  const [budgetMonth, setBudgetMonth] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetCategory, setBudgetCategory] = useState("Food");

  // ------------------------
  // FETCH FUNCTIONS
  // ------------------------

  const fetchTransactions = async () => {
    const res = await axios.get("http://127.0.0.1:5000/transactions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setTransactions(res.data);
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

  const fetchBudgets = async () => {
    const res = await axios.get("http://127.0.0.1:5000/budgets", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setBudgets(res.data);
  };

  // ------------------------
  // HANDLERS
  // ------------------------

  const handleAddTransaction = async (e) => {
    e.preventDefault();

    await axios.post(
      "http://127.0.0.1:5000/transactions",
      { amount: parseFloat(amount), type, category, description },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setAmount("");
    setType("income");
    setCategory("Food");
    setDescription("");
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
      { month: budgetMonth, category: budgetCategory, amount: parseFloat(budgetAmount) },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setBudgetMonth("");
    setBudgetAmount("");
    setBudgetCategory("Food");
    fetchBudgets();
  };

  // ------------------------
  // LOAD DASHBOARD
  // ------------------------

  useEffect(() => {
    if (token) {
      fetchTransactions();
      fetchExchangeRate();
      fetchMeal();
      fetchBudgets();
    }
  }, [token]);

  const balance = transactions.reduce((acc, t) => {
    return t.type === "income"
      ? acc + t.amount
      : acc - t.amount;
  }, 0);

  const calculateRemaining = (budget) => {
  const spent = transactions
    .filter(
      (t) =>
        t.type === "expense" &&
        t.category === budget.category
    )
    .reduce((sum, t) => sum + t.amount, 0);

  return budget.amount - spent;
};

  return (
    <div style={{ padding: "30px" }}>
      <h2>Welcome, {username}</h2>
      <button onClick={onLogout}>Logout</button>

      <h3>Current Balance: ${balance.toFixed(2)}</h3>

      {exchangeRate && <p>USD to EUR: {exchangeRate}</p>}

      <hr />

      {/* TRANSACTIONS */}
      <h3>Add Transaction</h3>
      <form onSubmit={handleAddTransaction}>
        <input
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

       {/*CATEGORY DROPDOWN */}
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>Food</option>
          <option>Rent</option>
          <option>Utilities</option>
          <option>Entertainment</option>
          <option>Other</option>
        </select>

        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button type="submit">Add</button>
      </form>

      <h3>Transactions</h3>
      {transactions.map((t) => (
        <div key={t.id}>
          <p>{t.type} - {t.category} - ${t.amount} - {t.description}</p>
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
        />

        <input
          placeholder="Budget Amount"
          value={budgetAmount}
          onChange={(e) => setBudgetAmount(e.target.value)}
        />

        <select value={budgetCategory} onChange={(e) => setBudgetCategory(e.target.value)}>
          <option>Food</option>
          <option>Rent</option>
          <option>Utilities</option>
          <option>Entertainment</option>
          <option>Other</option>
        </select>

        <button type="submit">Set Budget</button>
      </form>

      {budgets.map((b) => {
  const remaining = calculateRemaining(b);

  return (
    <div key={b.id} style={{ marginBottom: "10px" }}>
      <p>
        {b.month} - {b.category} Budget: ${b.amount}
      </p>

      <p>
        Remaining: ${remaining.toFixed(2)}
      </p>

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