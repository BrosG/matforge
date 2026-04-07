"use client";

import { motion } from "framer-motion";
import { Atom, Code2, FlaskConical, GraduationCap, Users } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <section className="pt-28 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              About <span className="gradient-text">MatForge</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              MATERIA - Materials Accelerated Through Engineering, Research,
              Intelligence &amp; Analysis
            </p>
          </motion.div>

          {/* Mission */}
          <motion.div
            className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 md:p-12 mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Materials discovery is one of the most impactful challenges in
              science and engineering. Traditional approaches require expensive
              simulations, lengthy experiments, and expert intuition.
            </p>
            <p className="text-gray-600 leading-relaxed">
              MatForge democratizes this process by combining physics-based
              evaluation with machine learning surrogate models and intelligent
              active learning. Our platform enables researchers to explore
              vast material design spaces 100x faster, discovering
              Pareto-optimal candidates that balance competing objectives.
            </p>
          </motion.div>

          {/* Approach */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              {
                icon: FlaskConical,
                title: "Physics-First",
                desc: "Every domain plugin encodes real physics equations from peer-reviewed literature. Surrogate models accelerate - but never replace - physical understanding.",
              },
              {
                icon: Code2,
                title: "Open Source",
                desc: "The core MATERIA engine is fully open-source. Write custom plugins, evaluators, and optimizers. Your research, your code.",
              },
              {
                icon: GraduationCap,
                title: "Research-Grade",
                desc: "NSGA-II Pareto sorting, CMA-ES optimization, MC Dropout uncertainty estimation. Algorithms you can cite in papers.",
              },
              {
                icon: Users,
                title: "Collaborative",
                desc: "Share campaigns, export results, and build on discoveries. Materials science is a team sport.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="bg-white rounded-xl border p-6"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
              >
                <item.icon className="h-8 w-8 text-blue-500 mb-3" />
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Tech Stack */}
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-2xl font-bold mb-6">Technology Stack</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Python", "NumPy", "FastAPI", "Celery", "PostgreSQL", "Redis",
                "Next.js 14", "React 18", "TypeScript", "Tailwind CSS", "Three.js",
                "Docker", "WebSocket",
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1.5 rounded-full bg-gray-100 text-sm font-medium text-gray-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
