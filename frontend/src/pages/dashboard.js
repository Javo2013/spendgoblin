import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard({ token, onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("income");
  const [description, setDescription] = useState("");
  const [exchangeRate, setExchangeRate] = useState(null);

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

  const handleAdd = async (e) => {
    e.preventDefault();

    await axios.post(
      "http://127.0.0.1:5000/transactions",
      { amount: parseFloat(amount), type, description },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setAmount("");
    setDescription("");
    fetchTransactions();
  };

  const handleDelete = async (id) => {
    await axios.delete(`http://127.0.0.1:5000/transactions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchTransactions();
  };

  useEffect(() => {
    fetchTransactions();
    fetchExchangeRate();
  }, []);

  const balance = transactions.reduce((acc, t) => {
    return t.type === "income"
      ? acc + t.amount
      : acc - t.amount;
  }, 0);

  return (
    <div>
      <h2>SpendGoblin Dashboard</h2>

      <button onClick={onLogout}>Logout</button>

      <h3>Balance: ${balance.toFixed(2)}</h3>

      {exchangeRate && <p>USD to EUR: {exchangeRate}</p>}

      <hr />

      <h3>Add Transaction</h3>

      <form onSubmit={handleAdd}>
        <input
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button type="submit">Add</button>
      </form>

      <hr />

      <h3>Transactions</h3>

      {transactions.map((t) => (
        <div key={t.id}>
          <p>
            {t.type} - ${t.amount} - {t.description}
          </p>
          <button onClick={() => handleDelete(t.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}