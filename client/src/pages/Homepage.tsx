import React from 'react';
import { motion } from 'framer-motion';


const features = [
  {
    title: 'Interviuri în browser',
    description: 'Studenții pot susține interviuri direct pe platformă, fără a instala aplicații sau a folosi screen sharing.',
    icon: '🧑‍💻',
  },
  {
    title: 'Editor de cod integrat',
    description: 'Editor în timp real unde intervievatorul poate evalua live codul scris de student.',
    icon: '⌨️',
  },
  {
    title: 'Provocări și testare',
    description: 'Companiile pot crea provocări personalizate pentru studenți, evaluându-i obiectiv.',
    icon: '🧠',
  },
  {
    title: 'Platformă doar pentru studenți',
    description: 'Accesul se face exclusiv prin emailul instituțional universitar. Este un spațiu sigur și dedicat dezvoltării carierei studențești.',
    icon: '🎓',
  },
];

const logo = './logo-cropped.svg';

const Homepage: React.FC = () => {
  return (
    <div className="w-full min-h-screen flex flex-col bg-white text-gray-900 font-sans">
      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-md px-6 md:px-12 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="InternStud Logo" className="h-12 w-auto" />
        </div>
        <nav className="hidden md:flex space-x-12 text-base font-medium">
          <a
            href="#features"
            className="relative text-[#0056a0] hover:text-[#ff8c00] transition duration-300 after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-[#F2542D] hover:after:w-full after:transition-all after:duration-300"
          >
            Funcționalități
          </a>
          <a
            href="#about"
            className="relative text-[#0056a0] hover:text-[#ff8c00] transition duration-300 after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-[#F2542D] hover:after:w-full after:transition-all after:duration-300"
          >
            Despre
          </a>
          <a
            href="#contact"
            className="relative text-[#0056a0] hover:text-[#ff8c00] transition duration-300 after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-[#F2542D] hover:after:w-full after:transition-all after:duration-300"
          >
            Contact
          </a>
        </nav>

        <div className="space-x-4 hidden md:flex">
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0px 0px 12px #0056a0" }}
          whileTap={{ scale: 0.97 }}
          className="px-5 py-2 rounded-lg bg-[#0056a0] text-white font-semibold transition duration-300 hover:bg-[#ff7043]"
        >
          Autentificare
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0px 0px 12px #ff7043" }}
          whileTap={{ scale: 0.97 }}
          className="px-5 py-2 rounded-lg bg-[#F2542D] text-white font-semibold transition duration-300 hover:bg-[#ff7043]"
        >
          Înregistrare
        </motion.button>
      </div>

      </header>

      {/* HERO SECTION */}
      <section className="flex-1 flex items-center justify-center text-center pt-32 pb-20 px-6 bg-gradient-to-b from-[#0056a0] to-[#1B263B] text-white">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Găsește stagii. Fii angajat. Crește rapid.</h1>
          <p className="text-lg md:text-xl mb-8 text-gray-300">
            InternStud este platforma ta completă pentru a te conecta cu companiile, a exersa interviuri și a străluci ca student.
          </p>
          <div className="flex justify-center space-x-4">
            <button className="px-6 py-3 bg-[#ff8c00] text-white rounded-full font-semibold hover:bg-white hover:text-[#ff8c00] transition duration-300">
              Începe acum
            </button>
            <button className="px-6 py-3 border border-white text-white rounded-full font-semibold hover:bg-white hover:text-[#ff8c00] transition duration-300">
              Află mai multe
            </button>
          </div>
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
          <h2 className="text-4xl font-bold mb-4 text-[#F2542D]">Funcționalități principale</h2>
          <p className="text-lg text-gray-600 mb-12">
            Creat special pentru studenți care vor să evolueze rapid. Tot ce ai nevoie, într-un singur loc.
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

              <h3 className="text-xl font-semibold mb-2 text-[#1B263B]">{feature.title}</h3>
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
          <h2 className="text-4xl font-bold mb-6 text-[#F2542D]">Despre InternStud</h2>
          <p className="text-lg leading-relaxed text-gray-700">
            InternStud este o platformă construită cu gândul la studenți — un loc unde poți trece prin interviuri reale, rezolva probleme de cod live și interacționa cu angajatori direct din browser.
            <br /><br />
            Nu e pentru toată lumea — ci doar pentru studenți autentici, verificați prin adresa instituțională.
            <strong> Vrem să oferim un spațiu profesional, sigur și util pentru viitoarea ta carieră.</strong>
          </p>
        </motion.div>
      </section>

      <section id="contact-form" className="py-24 px-6 bg-white text-gray-800">
        <motion.div className="max-w-4xl mx-auto text-center" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
          <h2 className="text-4xl font-bold mb-6 text-[#F2542D]">Contactează-ne</h2>
          <p className="text-lg leading-relaxed text-gray-700 mb-12">
            Ai întrebări sau sugestii? Trimite-ne un mesaj și îți vom răspunde cât mai curând!
          </p>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <input type="text" placeholder="Nume complet" className="border border-gray-300 p-3 rounded-lg w-full" />
            <input type="email" placeholder="Email" className="border border-gray-300 p-3 rounded-lg w-full" />
            <textarea placeholder="Mesaj" className="border border-gray-300 p-3 rounded-lg md:col-span-2 h-32 resize-none w-full"></textarea>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="md:col-span-2 bg-[#F2542D] hover:bg-[#ff7043] text-white py-3 px-6 rounded-lg font-semibold transition">
              Trimite mesajul
            </motion.button>
          </form>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="bg-[#1B263B] text-white py-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <h3 className="text-lg font-bold text-[#F2542D] mb-2">InternStud</h3>
            <p className="text-gray-400">Conectăm studenții cu firmele prin interviuri în timp real și provocări de cod direct în browser.</p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">Linkuri rapide</h3>
            <ul className="space-y-1 text-gray-400">
              <li><a href="#features" className="hover:text-[#F2542D] transition">Funcționalități</a></li>
              <li><a href="#about" className="hover:text-[#F2542D] transition">Despre</a></li>
              <li><a href="#" className="hover:text-[#F2542D] transition">Blog</a></li>
              <li><a href="#" className="hover:text-[#F2542D] transition">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">Contact</h3>
            <p className="text-gray-400">Email: support@internstud.com</p>
            <p className="text-gray-400">Telefon: +1 (123) 456-7890</p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="hover:text-[#F2542D] transition"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="hover:text-[#F2542D] transition"><i className="fab fa-twitter"></i></a>
              <a href="#" className="hover:text-[#F2542D] transition"><i className="fab fa-linkedin-in"></i></a>
            </div>
          </div>
        </div>
        <p className="text-center text-gray-500 text-xs mt-8">&copy; {new Date().getFullYear()} InternStud. Toate drepturile rezervate.</p>
      </footer>
    </div>
  );
};

export default Homepage;
