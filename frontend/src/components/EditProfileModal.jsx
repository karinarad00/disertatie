import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateProfile } from "../redux/authSlice";
import { X, Upload } from "lucide-react";
import axios from "../axiosClient";

export function EditProfileModal({ isOpen, onClose, user }) {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    location: "",
    experience: "",
  });

  const [locationOptions, setLocationOptions] = useState([]);
  const [experienceOptions, setExperienceOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Initialize formData
  useEffect(() => {
    if (!user) return;

    setFormData({
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      location: user.location_id ?? "",
      experience: user.experience || "",
    });
  }, [user]);

  // Fetch filters
  useEffect(() => {
    if (!isOpen) return;

    axios.get("/api/jobs/filters")
      .then((res) => {
        setLocationOptions(res.data.locations || []);
        setExperienceOptions(res.data.experience || []);
      })
      .catch((err) => console.error("Eroare la preluarea filtrelor:", err));
  }, [isOpen]);

  // Image preview
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) throw new Error("Nu ești autentificat");

      const payload = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone || null,
        experience: formData.experience || null,
        location: formData.location ? Number(formData.location) : null,
      };

      const resProfile = await axios.put("/api/users/update-profile", payload);

      let updatedUser = {
        ...user,
        ...resProfile.data.user,
      };

      if (selectedFile) {
        const formDataImage = new FormData();
        formDataImage.append("profileImage", selectedFile);

        const resImage = await axios.post("/api/image/upload", formDataImage, {
          headers: {
            "Content-Type": "multipart/form-data"
          },
        });

        updatedUser.imagine_profil = resImage.data.url;
      }

      dispatch(updateProfile(updatedUser));

      alert("Profil actualizat!");
      onClose();
    } catch (err) {
      console.error(err);
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        alert(err.response?.data?.message || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4">
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
            {/* IMAGE */}
            <div className="flex flex-col items-center gap-2">
              <img
                src={
                  previewUrl ||
                  user?.imagine_profil ||
                  "https://via.placeholder.com/150"
                }
                alt="Preview"
                className="w-24 h-24 object-cover rounded-full"
              />

              <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700">
                <Upload className="size-5" />
                Schimbă imagine
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {/* INPUTS */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nume utilizator</label>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Introdu numele de utilizator"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Introdu adresa de email"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Introdu numărul de telefon"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Locație</label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Selectează locația</option>
                  {locationOptions.map((loc) => (
                    <option key={loc.id_oras} value={loc.id_oras}>
                      {loc.denumire_oras}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experiență</label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Selectează experiența</option>
                  {experienceOptions.map((exp) => (
                    <option key={exp} value={exp}>
                      {exp}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
