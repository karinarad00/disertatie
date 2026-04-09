import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function EditProfileModal({ isOpen, onClose, user, onProfileUpdated }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    location: "",
    experience: "",
  });

  const [loading, setLoading] = useState(false);
  const [locationOptions, setLocationOptions] = useState([]);
  const [experienceOptions, setExperienceOptions] = useState([]);

  useEffect(() => {
    if (!user || !isOpen) return;

    setFormData({
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      location: user.location_id ?? "",
      experience: user.experience || "",
    });
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    fetch("http://localhost:5000/api/jobs/filters")
      .then((res) => res.json())
      .then((data) => {
        setLocationOptions(data.locations || []);
        setExperienceOptions(data.experience || []);
      })
      .catch((err) => console.error("Eroare la preluarea filtrelor:", err));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const localUser = JSON.parse(localStorage.getItem("user"));

      const payload = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone || null,
        experience: formData.experience || null,
        location: formData.location ? Number(formData.location) : null, // numeric ID
      };

      const res = await fetch(
        "http://localhost:5000/api/users/update-profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localUser.token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Eroare la actualizare");

      const updatedUser = {
        ...data.user,
        token: localUser.token,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      onProfileUpdated?.(updatedUser);

      alert("Profil actualizat!");
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Editează Profil</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {loading ? (
          <p>Se salvează...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />

            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />

            <input
              name="phone"
              placeholder="Telefon"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />

            {/* LOCATION (ID) */}
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="">Selectează locația</option>
              {locationOptions.map((loc) => (
                <option key={loc.id_oras} value={loc.id_oras}>
                  {loc.denumire_oras}
                </option>
              ))}
            </select>

            {/* EXPERIENCE */}
            <select
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="">Selectează experiența</option>
              {experienceOptions.map((exp) => (
                <option key={exp} value={exp}>
                  {exp}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose}>
                Anulează
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded">
                Salvează
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
