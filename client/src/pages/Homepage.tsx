import React, { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

import growthImage from "/growth.png";

const features = [
  {
    title: "Interviuri în browser",
    description: "Exersezi interviuri cu feedback AI.",
    icon: "🧑‍💻",
  },
  {
    title: "Editor de cod integrat",
    description:
      "Editor în timp real pentru evaluarea live a codului scris de student în interviuri sau provocări.",
    icon: "⌨️",
  },
  {
    title: "Provocări și testare",
    description:
      "Companiile pot crea teste și provocări pentru evaluare obiectivă.",
    icon: "🧠",
  },
  {
    title: "Platformă doar pentru studenți",
    description: "Spațiu sigur, dedicat dezvoltării studențești.",
    icon: "🎓",
  },
];

const Homepage: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("http://localhost:3001/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          to: "alexdragomirescu@internstud.ro",
        }),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-white text-gray-900 font-sans">
      <Navbar />

      {/* HERO SECTION */}
      <section className="flex-1 flex flex-col md:flex-row items-center justify-center text-center md:text-start pt-32 pb-20 px-6 bg-gradient-to-b from-[#0056a0] to-[#1B263B] text-white relative overflow-hidden">
        <div className="max-w-3xl z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Găsește stagii. <br /> Crește rapid.
          </h1>
          <p className="text-lg md:text-xl mb-8 text-gray-300">
            InternStud este platforma ta completă pentru a te conecta cu
            companiile, a exersa interviuri și a străluci ca student.
          </p>
          <div className="flex flex-col sm:flex-row justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
            {user ? (
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "#c63d1a" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/dashboard")}
                className="w-auto h-auto px-6 py-4 bg-[#F2542D] text-white rounded-full transition duration-300 font-bold text-xl shadow-lg"
              >
                <span className="text-white font-bold text-xl">
                  Vezi anunțuri
                </span>
              </motion.button>
            ) : (
              <Link to="/register">
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: "#003f7a",
                    boxShadow: "0px 0px 15px rgba(0,0,0,0.3)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="w-auto h-auto px-6 py-4 bg-[#0056a0] text-white rounded-full transition duration-300 font-bold text-xl shadow-lg"
                >
                  <p className="text-white font-bold text-xl">Începe acum</p>
                </motion.button>
              </Link>
            )}
          </div>
        </div>

        {/* Imagine statică pentru mobil, animată pentru desktop */}
        <div className="w-full max-w-md mt-10 md:mt-0 md:ml-10 z-0">
          {/* Versiunea mobilă - fără animație */}
          <img src={growthImage} alt="Growth" className="md:hidden w-full" />
          {/* Versiunea desktop - cu animație */}
          <motion.img
            src={growthImage}
            alt="Growth"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="hidden md:block w-full"
          />
        </div>
      </section>

      <section id="features" className="py-24 px-6 bg-white text-gray-800">
        <motion.div
          className="max-w-6xl mx-auto text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-4 text-[#F2542D]">
            Funcționalități principale
          </h2>
          <p className="text-lg text-gray-600 mb-12">
            Creat special pentru studenți care vor să evolueze rapid. Tot ce ai
            nevoie, într-un singur loc.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-[#F7F9FC] border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="text-4xl mb-4 inline-block transition-transform duration-300"
                animate={{ y: 0 }}
                whileHover={{}}
              >
                <motion.div
                  className="group-hover:-translate-y-2 transition-transform duration-300"
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {feature.icon}
                </motion.div>
              </motion.div>

              <h3 className="text-xl font-semibold mb-2 text-[#1B263B]">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="about" className="py-24 px-6 bg-gray-100 text-gray-800">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-6 text-[#F2542D]">
            Despre InternStud
          </h2>
          <p className="text-lg leading-relaxed text-gray-700">
            InternStud este o platformă construită cu gândul la studenți, un loc
            unde poți trece prin interviuri reale, rezolva probleme de cod live
            și interacționa cu angajatori direct din browser.
            <br />
            <br />
            Nu e pentru toată lumea, ci doar pentru studenți autentici,
            verificați prin adresa instituțională.
            <strong>
              {" "}
              Vrem să oferim un spațiu profesional, sigur și util pentru
              viitoarea ta carieră.
            </strong>
          </p>
        </motion.div>
      </section>

      <section id="contact-form" className="py-24 px-6 bg-white text-gray-800">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-6 text-[#F2542D]">
            Contactează-ne
          </h2>
          <p className="text-lg leading-relaxed text-gray-700 mb-12">
            Ai întrebări sau sugestii? Trimite-ne un mesaj și îți vom răspunde
            cât mai curând!
          </p>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left"
          >
            <input
              required
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nume complet"
              className="border border-gray-300 p-3 rounded-lg w-full"
            />
            <input
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
              className="border border-gray-300 p-3 rounded-lg w-full"
            />
            <textarea
              required
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Mesaj"
              className="border border-gray-300 p-3 rounded-lg md:col-span-2 h-32 resize-none w-full"
            ></textarea>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isSubmitting}
              className="md:col-span-2 bg-[#1B263B] text-white py-3 px-6 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {isSubmitting ? "Se trimite..." : "Trimite mesajul"}
            </motion.button>
            {submitStatus === "success" && (
              <p className="md:col-span-2 text-green-600">
                Mesajul a fost trimis cu succes!
              </p>
            )}
            {submitStatus === "error" && (
              <p className="md:col-span-2 text-red-600">
                A apărut o eroare la trimiterea mesajului. Vă rugăm să încercați
                din nou.
              </p>
            )}
          </form>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="bg-[#1B263B] text-white py-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <h3 className="text-lg font-bold text-[#F2542D] mb-2">
              InternStud
            </h3>
            <p className="text-gray-400">
              Conectăm studenții cu firmele prin interviuri în timp real și
              provocări de cod direct în browser.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">Linkuri rapide</h3>
            <ul className="space-y-1 text-gray-400">
              <li>
                <a href="#features" className="hover:text-[#F2542D] transition">
                  Funcționalități
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#F2542D] transition">
                  Despre
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#F2542D] transition">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#F2542D] transition">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">Contact</h3>
            <p className="text-gray-400">Email: support@internstud.com</p>
            <p className="text-gray-400">Telefon: +1 (123) 456-7890</p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="hover:text-[#F2542D] transition">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="hover:text-[#F2542D] transition">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="hover:text-[#F2542D] transition">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>
        </div>
        <p className="text-center text-gray-500 text-xs mt-8">
          &copy; {new Date().getFullYear()} InternStud. Toate drepturile
          rezervate.
        </p>
      </footer>
    </div>
  );
};

export default Homepage;
