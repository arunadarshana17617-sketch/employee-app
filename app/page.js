"use client"; // this page uses state and browser events, so it runs in the browser

import { useEffect, useState } from "react";

// Empty form values (used to reset the form)
const emptyForm = {
  firstName: "",
  secondName: "",
  middleName: "",
  lastName: "",
  address: "",
  email: "",
  gender: "",
  dob: "",
  age: "",
};

export default function Home() {
  const [form, setForm] = useState(emptyForm); // current form values
  const [employees, setEmployees] = useState([]); // saved employees from MongoDB
  const [loading, setLoading] = useState(true); // true while the list is loading
  const [saving, setSaving] = useState(false); // true while saving/updating
  const [message, setMessage] = useState(null); // { type: "ok" | "error", text }
  const [editingId, setEditingId] = useState(null); // id of the employee being edited (null = adding new)

  const isEditing = editingId !== null;

  // Load all employees from the API
  async function loadEmployees() {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (res.ok) setEmployees(data);
    } finally {
      setLoading(false);
    }
  }

  // Load the list once when the page opens
  useEffect(() => {
    loadEmployees();
  }, []);

  // Update the form state whenever the user types in a field
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Create a new employee OR update the one being edited
  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Editing -> PUT to /api/employees/:id, adding -> POST to /api/employees
    const url = isEditing ? `/api/employees/${editingId}` : "/api/employees";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Something went wrong." });
      } else {
        setMessage({
          type: "ok",
          text: isEditing ? "Employee updated." : "Employee saved.",
        });
        setForm(emptyForm);
        setEditingId(null);
        loadEmployees(); // refresh the table
      }
    } catch {
      setMessage({ type: "error", text: "Could not connect to the server." });
    } finally {
      setSaving(false);
    }
  }

  // Fill the form with an existing employee so it can be edited
  function handleEdit(emp) {
    setEditingId(emp._id);
    setForm({
      firstName: emp.firstName,
      secondName: emp.secondName || "",
      middleName: emp.middleName || "",
      lastName: emp.lastName,
      address: emp.address,
      email: emp.email,
      gender: emp.gender,
      dob: fmtDate(emp.dob), // the date input needs the YYYY-MM-DD format
      age: String(emp.age),
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" }); // go back up to the form
  }

  // Stop editing and clear the form
  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage(null);
  }

  // Delete an employee after the user confirms
  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
    if (res.ok) {
      // Remove the row from the table without reloading
      setEmployees(employees.filter((e) => e._id !== id));
      // If we were editing this employee, leave edit mode
      if (editingId === id) handleCancelEdit();
    }
  }

  // Helpers
  // Joins all name parts, skipping the empty ones
  const fullName = (e) => [e.firstName, e.secondName, e.middleName, e.lastName].filter(Boolean).join(" ");
  const fmtDate = (d) => new Date(d).toISOString().slice(0, 10); // YYYY-MM-DD
  const today = new Date().toISOString().slice(0, 10); // used to block future birthdays

  return (
    <main className="page">
      <h1>Employee registry</h1>

      {/* ---------- Add / Edit form ---------- */}
      <section className="panel">
        <h2>{isEditing ? "Edit employee" : "Add employee"}</h2>

        <form onSubmit={handleSubmit} className="grid">
          <label>
            First name
            <input name="firstName" value={form.firstName} onChange={handleChange} required />
          </label>

          <label>
            Second name
            <input name="secondName" value={form.secondName} onChange={handleChange} />
          </label>

          <label>
            Middle name
            <input name="middleName" value={form.middleName} onChange={handleChange} />
          </label>

          <label>
            Last name
            <input name="lastName" value={form.lastName} onChange={handleChange} required />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={(e) => {
                e.target.setCustomValidity(""); // clear the custom message when the user types
                handleChange(e);
              }}
              onInvalid={(e) =>
                // show our own message instead of the browser's default one
                e.target.setCustomValidity(
                  e.target.validity.valueMissing
                    ? "Please enter your email."
                    : "Please enter a valid email address."
                )
              }
              required
            />
          </label>

          <label className="wide">
            Address
            <input name="address" value={form.address} onChange={handleChange} required />
          </label>

          <label>
            Gender
            <select name="gender" value={form.gender} onChange={handleChange} required>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>

          <label>
            Date of birth
            <input type="date" name="dob" max={today} value={form.dob} onChange={handleChange} required />
          </label>

          <label>
            Age
            <input type="number" name="age" min="1" max="120" step="1" value={form.age} onChange={handleChange} required />
          </label>

          <div className="wide actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Update employee" : "Save employee"}
            </button>

            {/* Cancel button only appears while editing */}
            {isEditing && (
              <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
                Cancel
              </button>
            )}

            {/* Success or error message */}
            {message && (
              <p className={message.type === "ok" ? "msg ok" : "msg error"} role="status">
                {message.text}
              </p>
            )}
          </div>
        </form>
      </section>

      {/* ---------- Saved employees table ---------- */}
      <section className="panel">
        <h2>Saved employees ({employees.length})</h2>

        {loading ? (
          <p className="muted">Loading...</p>
        ) : employees.length === 0 ? (
          <p className="muted">No employees yet. Add one using the form above.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Gender</th>
                  <th>Date of birth</th>
                  <th>Address</th>
                  <th className="num">Age</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e._id} className={e._id === editingId ? "editing" : ""}>
                    <td>{fullName(e)}</td>
                    <td>{e.email}</td>
                    <td>{e.gender === "male" ? "Male" : "Female"}</td>
                    <td>{fmtDate(e.dob)}</td>
                    <td>{e.address}</td>
                    <td className="num">{e.age}</td>
                    <td>
                      <div className="row-actions">
                        <button className="link-edit" onClick={() => handleEdit(e)}>
                          Edit
                        </button>
                        <button className="link-danger" onClick={() => handleDelete(e._id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}