import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./components/HomePage";
import MindMap from "./components/MindMap";
import Quiz from "./components/Quiz";
import FlashCards from "./components/FlashCards";
import Profile from "./components/Profile";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import About from "./pages/About";
import Dashboard from "./components/Dashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { ProtectedRoute, PublicRoute } from "./utils/ProtectedRoute";
import Summarizer from "./components/Summarizer";
import ChatAssistant from "./components/Chatbot/ChatAssistant";

function App() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [mindMapData, setMindMapData] = useState({ nodes: [], links: [] });
  const [quizQuestions, setQuizQuestions] = useState([]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      {/* Add padding to prevent overlapping */}
      <div className="flex-grow pt-[72px]">

        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <HomePage />
              </PublicRoute>
            }
          />
          {/* <Route path="/summary" element={<Summary summary={summary} />} /> */}
          <Route path="/mindmap" element={<MindMap data={mindMapData} />} />
          <Route path="/quiz" element={<Quiz questions={quizQuestions} />} />
          <Route path="/flashcards" element={<FlashCards />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignUp />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
          <Route path="/summarization" element={<Summarizer></Summarizer> } />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard userName="Arushi" />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
      
            <ChatAssistant></ChatAssistant>
      <Footer />
    </div>
  );
}

export default App;


