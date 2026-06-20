import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";


const features = [
  {
    title: "AI-Powered Summarization",
    description: "Extract key points from your notes using advanced NLP models",
    icon: "📝"
  },
  {
    title: "Interactive Mind Maps",
    description: "Visualize connections between concepts with dynamic graph rendering",
    icon: "🧠"
  },
  {
    title: "Quiz Generation",
    description: "Create customized quizzes to test your knowledge and improve retention",
    icon: "❓"
  },
  {
    title: "Topic Clustering",
    description: "Automatically group related concepts for better organization",
    icon: "🔄"
  },
  {
    title: "Customizable Quiz Difficulty",
    description: "Adjust question complexity based on your comfort level",
    icon: "🎚️"
  },
  {
    title: "Real-Time Processing",
    description: "Get instant results with our optimized AI pipeline",
    icon: "⚡"
  },
  {
    title: "Interactive Dashboard",
    description: "Track your progress and learning metrics over time",
    icon: "📊"
  }
];



const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const About = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 pt-8"
        >
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            BrainVerse
          </h1>
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-6 rounded-full"
          />
          <p className="text-xl text-blue-200 max-w-3xl mx-auto leading-relaxed">
            An AI-powered study assistant designed to revolutionize how you learn, 
            organize knowledge, and retain information through interactive visualizations 
            and personalized quizzes.
          </p>
        </motion.div>

        <motion.div 
          className="bg-blue-950/50 backdrop-blur-md rounded-xl shadow-2xl p-6 mb-12 border border-blue-800/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-blue-900/30 p-6 rounded-lg backdrop-blur-sm border border-blue-700/30 shadow-lg hover:shadow-blue-600/10 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-blue-300">{feature.title}</h3>
                <p className="text-blue-100/80">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-center text-blue-400/80 text-sm mt-12"
        >
          <p>© {new Date().getFullYear()} BrainVerse  • Revolutionizing Study Methods with AI</p>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
