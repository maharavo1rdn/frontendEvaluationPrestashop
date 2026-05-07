import { useState } from "react";

const ClientCreate = () => {
  const API_URL = `${import.meta.env.VITE_API_URL}/roles`;
  const [form, setForm] = useState({
    name: "",
    level: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
         },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        console.log("Erreur backend :", data);
        throw new Error(data.message || "Erreur création");
      }

      console.log("Succès :", data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Ajouter un role</h1>
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
        <label className="block font-medium">Level</label>
        <input
          name="level"
          type="number"
          value={form.level}
          onChange={handleChange}
          className="w-full border p-2"
          required
        />
      </div>

      <div>
        <label className="block font-medium">Description</label>
        <input
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full border p-2"
        />
      </div>

      <button type="submit">Save</button>
    </form>
  );
};
export default ClientCreate;
