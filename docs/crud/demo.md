# 🔥 CRUD React + Fetch (Version professionnelle complète avec Tailwind)

---

# 1. Installation Tailwind (CDN)

Dans `index.html` :

```html
<script src="https://cdn.tailwindcss.com"></script>
```

---

# 2. Structure du projet

```text
src/
  pages/
    Users.jsx
    AddUser.jsx
    EditUser.jsx
  App.jsx
```

---

# 3. Modèle de données (exemple réaliste)

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@mail.com",
  "birthDate": "2000-01-01",
  "gender": "male",
  "isActive": true,
  "roles": ["USER", "ADMIN"]
}
```

---

# 4. Routing (App.jsx)

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Users from "./pages/Users";
import AddUser from "./pages/AddUser";
import EditUser from "./pages/EditUser";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Users />} />
        <Route path="/add" element={<AddUser />} />
        <Route path="/edit/:id" element={<EditUser />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

# 5. Users.jsx (READ + DELETE)

```jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Users = () => {

  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = `${import.meta.env.VITE_API_URL}/users`;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Erreur API");

      const data = await res.json();
      setUsers(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirmer la suppression ?")) return;

    try {
      await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="p-4">Chargement...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-6">

      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Users</h1>

        <button
          onClick={() => navigate("/add")}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          + Add User
        </button>
      </div>

      <table className="w-full border border-gray-200 shadow-md">

        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Birth</th>
            <th>Gender</th>
            <th>Active</th>
            <th>Roles</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map(user => (
            <tr key={user.id} className="text-center border-t">
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.birthDate}</td>
              <td>{user.gender}</td>
              <td>{user.isActive ? "✅" : "❌"}</td>
              <td>{user.roles?.join(", ")}</td>

              <td className="space-x-2">
                <button
                  onClick={() => navigate(`/edit/${user.id}`)}
                  className="bg-yellow-400 px-2 py-1 rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(user.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </td>

            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
};

export default Users;
```

---

# 6. AddUser.jsx (CREATE — COMPLET AVEC LABELS)

```jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddUser = () => {

  const navigate = useNavigate();
// 1 ère option raha maika
const handleSubmit =
    async (e) => {

      e.preventDefault();

      const body =
        JSON.stringify({
          name
        });

      try {

        const response =
          await fetch(
            API_URL,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                  "Accept": "application/json"
              },
              body
            }
          );

        if (!response.ok) {

          alert(
            "Erreur de création"
          );

          return;

        }

        navigate("/");

      } catch (error) {
        
        console.error(error);    

      }

    };
    // 2 ème choix(ty no poinsse ngamba)
    const handleSubmit = async (e) => {
  
      e.preventDefault();
  
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json",
          "Accept": "application/json"
           },
          body: JSON.stringify(form)
        });
  
        if (!res.ok) 
        throw new Error("Erreur création");
  
        navigate("/");
  
      } catch (err) {
        console.error(err);
      }
    };

  const [form, setForm] = useState({
    name: "",
    email: "",
    birthDate: "",
    gender: "male",
    isActive: true,
    roles: []
  });

  const API_URL = `${import.meta.env.VITE_API_URL}/users`;

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    if (type === "checkbox" && name === "roles") {
      let newRoles = [...form.roles];

      if (checked) newRoles.push(value);
      else newRoles = newRoles.filter(r => r !== value);

      setForm({ ...form, roles: newRoles });

    } else if (type === "checkbox") {
      setForm({ ...form, [name]: checked });

    } else {
      setForm({ ...form, [name]: value });    
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-lg mx-auto space-y-4">

      <h1 className="text-xl font-bold">Add User</h1>

      <div>
        <label className="block font-medium">Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full border p-2"
        />
      </div>

      <div>
        <label className="block font-medium">Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className="w-full border p-2"
        />
      </div>

      <div>
        <label className="block font-medium">Birth Date</label>
        <input
          type="date"
          name="birthDate"
          value={form.birthDate}
          onChange={handleChange}
          className="w-full border p-2"
        />
      </div>

      <div>
        <label className="block font-medium">Gender</label>
        <div className="flex gap-4 mt-1">
          <label>
            <input type="radio" name="gender" value="male" onChange={handleChange} /> Male
          </label>
          <label>
            <input type="radio" name="gender" value="female" onChange={handleChange} /> Female
          </label>
        </div>
      </div>

      <div>
        <label className="block font-medium">Active</label>
        <input
          type="checkbox"
          name="isActive"
          checked={form.isActive}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="block font-medium">Roles</label>
        <div className="flex gap-4 mt-1">
          <label>
            <input type="checkbox" name="roles" value="USER" onChange={handleChange} /> USER
          </label>
          <label>
            <input type="checkbox" name="roles" value="ADMIN" onChange={handleChange} /> ADMIN
          </label>
        </div>
      </div>

      <button className="bg-blue-500 text-white px-4 py-2 rounded">
        Save
      </button>

    </form>
  );
};

export default AddUser;
```

---

# 7. EditUser.jsx (UPDATE COMPLET)

```jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const EditUser = () => {

  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    birthDate: "",
    gender: "male",
    isActive: false,
    roles: []
  });

  const API_URL = `${import.meta.env.VITE_API_URL}/users`;

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const res = await fetch(`${API_URL}/${id}`);
    const data = await res.json();
    setForm(data);
  };

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    if (type === "checkbox" && name === "roles") {
      let newRoles = [...form.roles];

      if (checked) newRoles.push(value);
      else newRoles = newRoles.filter(r => r !== value);

      setForm({ ...form, roles: newRoles });

    } else if (type === "checkbox") {
      setForm({ ...form, [name]: checked });

    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json",
          "Accept": "application/json",
       },
      body: JSON.stringify(form)
    });

    navigate("/");
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-lg mx-auto space-y-4">

      <h1 className="text-xl font-bold">Edit User</h1>

      <div>
        <label className="block font-medium">Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full border p-2"
        />
      </div>

      <div>
        <label className="block font-medium">Email</label>
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          className="w-full border p-2"
        />
      </div>

      <div>
        <label className="block font-medium">Birth Date</label>
        <input
          type="date"
          name="birthDate"
          value={form.birthDate}
          onChange={handleChange}
          className="w-full border p-2"
        />
      </div>

      <button className="bg-green-500 text-white px-4 py-2 rounded">
        Update
      </button>

    </form>
  );
};

export default EditUser;
```

---

# 8. Cycle d'une requête

```text
Click utilisateur
↓
handleSubmit()
↓
fetch()
↓
Backend
↓
Base de données
↓
JSON
↓
setState
↓
Re-render React
```

---

# 9. Bonnes pratiques utilisées

```text
useEffect
useState
fetch
async/await
navigate
useParams
try/catch
UI propre Tailwind
formulaire complet avec labels
```

---

# ✅ Conclusion

```text
CRUD complet
UI propre
formulaire pro
sans service
100% fetch
```

---

# 🚀 Prochaine étape

* pagination
* recherche (debounce)
* JWT auth
* protected routes
* toast notifications
* modal au lieu de confirm
* dashboard admin

---
