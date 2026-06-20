import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend, FiBook, FiUser, FiLoader, FiX } from "react-icons/fi";
import { API_BASE_URL } from "../../config";
// import "./ChatAssistant.css"

const ChatAssistant = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatOpen]);

  useEffect(() => {
    if (isChatOpen) {
      inputRef.current?.focus();
      const timer = setTimeout(() => {
        setShowIntro(false);
        setMessages([{
          sender: "StudyBuddy",
          text: "Hello! I'm your StudyBuddy AI assistant. How can I help with your studies today?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isChatOpen]);

  // Navigation function to handle redirects with suggested prompts
  const navigateTo = (path, suggestedPrompt = "") => {
    // Close the chat window
    setIsChatOpen(false);
    // Navigate to the specified path
    window.location.href = path;
  };

  // Function to check if a message contains navigation commands
  const checkForNavigation = (text) => {
    // Updated regex to handle URL parameters and suggested prompts
    const navRegex = /\[NAV:([^\|\]]+)(?:\|\|([^\]]+))?\]/g;
    const match = navRegex.exec(text);
  
    if (match) {
      const path = match[1];
      const suggestedPrompt = match[2] || "";
  
      // Remove the navigation command from the text
      const cleanText = text.replace(navRegex, '').trim();
  
      return {
        hasNavigation: true,
        path: path,
        suggestedPrompt: suggestedPrompt,
        cleanText: cleanText || text // Fallback to original text if clean is empty
      };
    }
  
    return {
      hasNavigation: false,
      cleanText: text
    };
  };
  
  // Function to verify if keywords are present before navigating to a route
  const hasKeywordForPath = (userInput, path) => {
    const lowerInput = userInput.toLowerCase();

    if (path.includes("/mindmap")) {
      const keywords = ["mindmap", "mind map"];
      return keywords.some(kw => lowerInput.includes(kw));
    }
    if (path.includes("/summarization")) {
      const keywords = ["summary", "summarize", "summarization"];
      return keywords.some(kw => lowerInput.includes(kw));
    }
    if (path.includes("/quiz")) {
      const keywords = ["quiz", "quizzes"];
      return keywords.some(kw => lowerInput.includes(kw));
    }
    if (path.includes("/flashcards")) {
      const keywords = ["flashcard", "flash card", "flashcards"];
      return keywords.some(kw => lowerInput.includes(kw));
    }
    if (path.includes("/profile")) {
      const keywords = ["profile"];
      return keywords.some(kw => lowerInput.includes(kw));
    }
    if (path.includes("/dashboard")) {
      const keywords = ["dashboard"];
      return keywords.some(kw => lowerInput.includes(kw));
    }
    return false;
  };

  // Helper function to extract a clean study topic from the user's prompt
  const extractTopic = (userInput, path) => {
    let clean = userInput.trim();
    
    // Remove trailing question marks or punctuation
    clean = clean.replace(/[?!\.\s]+$/g, "");
    
    // First, remove the specific feature keywords:
    if (path.includes("/mindmap")) {
      clean = clean.replace(/mind\s*map/gi, "");
    } else if (path.includes("/summarization")) {
      clean = clean.replace(/summarize|summary|summarisation/gi, "");
    } else if (path.includes("/quiz")) {
      clean = clean.replace(/quiz(?:zes)?/gi, "");
    } else if (path.includes("/flashcards")) {
      clean = clean.replace(/flash\s*card(?:s)?/gi, "");
    }
    
    // List of filler phrases to strip (ordered from longest/most specific to shortest/most generic)
    const fillers = [
      /can you (?:give me a|create a|generate a|make a|show me a|show me some|summarize|write a) /i,
      /can you /i,
      /please /i,
      /give me a /i,
      /create a /i,
      /generate a /i,
      /make a /i,
      /show me a /i,
      /show me some /i,
      /write a /i,
      /about /i,
      /for /i,
      /on /i,
      /this /i,
      /the /i,
      /an /i,
      /a /i,
    ];
    
    // Run multiple passes of replacements to clean up nested filler words/spaces
    let prev;
    do {
      prev = clean;
      fillers.forEach(pat => {
        clean = clean.replace(pat, " ");
      });
      // Replace duplicate whitespaces
      clean = clean.replace(/\s+/g, " ").trim();
    } while (clean !== prev);
    
    // Clean leading/trailing spaces and symbols
    clean = clean.replace(/^[:\-\s\u00A0\u200B]+|[:\-\s\u00A0\u200B]+$/g, "").trim();
    
    return clean.length > 1 ? clean : userInput;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
  
    const currentInput = input;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage = { sender: "You", text: currentInput, timestamp };
  
    setMessages([...messages, userMessage]);
    setInput("");
    setLoading(true);
  
    try {
      const { data } = await axios.post(`${API_BASE_URL}/chat`, {
        message: currentInput,
        availablePaths: [
          "/dashboard",
          "/mindmap",
          "/quiz",
          "/flashcards",
          "/profile",
          "/summarization",
        ]
      });
  
      // Check if response contains navigation instruction
      const { hasNavigation, path, suggestedPrompt, cleanText } = checkForNavigation(data.reply);
  
      // Create the bot response
      const botMessage = {
        sender: "StudyBuddy",
        text: cleanText || "I'm processing your request...",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        preserveFormatting: true
      };
  
      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
  
      // Redirect ONLY if keywords matching the route/feature are found in the user prompt
      const isNavigationAllowed = hasNavigation && hasKeywordForPath(currentInput, path);
  
      if (isNavigationAllowed) {
        const topic = extractTopic(currentInput, path);
        const encodedTopic = encodeURIComponent(topic);
        const finalPath = path.includes("?")
          ? `${path}&prompt=${encodedTopic}`
          : `${path}?prompt=${encodedTopic}`;

        setTimeout(() => {
          // Add a navigation notification message
          setMessages(prev => [...prev, {
            sender: "StudyBuddy",
            text: `Taking you to ${path}...`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isNavigation: true
          }]);
  
          // Navigate after a brief delay
          setTimeout(() => navigateTo(finalPath, suggestedPrompt), 1500);
        }, 1000);
      }
    } catch (error) {
      setTimeout(() => {
        const errorMessage = {
          sender: "StudyBuddy",
          text: "Sorry, I'm having trouble connecting right now. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        };
        setMessages(prev => [...prev, errorMessage]);
        setLoading(false);
      }, 800);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Function to render message text with proper formatting
  const renderMessageText = (message) => {
    if (message.isNavigation) {
      return (
        <div className="flex items-center text-blue-600 overflow-hidden">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
          <p className="text-sm">{message.text}</p>
        </div>
      );
    } else if (message.sender === "StudyBuddy" && message.preserveFormatting) {
      return (
        <pre className="text-sm whitespace-pre-wrap font-sans">{message.text}</pre>
      );
    }
    return <p className="text-sm">{message.text}</p>;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isChatOpen ? (
          <FiX className="text-white w-6 h-6" />
        ) : (
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </motion.button>

      {/* Chat Interface */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            className="absolute bottom-24 right-0 w-80 h-[500px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <header className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg">
                  <FiBook className="w-6 h-6 text-blue-600" />
                </div>
                <h1 className="text-white font-bold text-lg">StudyBuddy</h1>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-white hover:text-blue-200 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <AnimatePresence>
                {showIntro ? (
                  <motion.div
                    className="flex flex-col items-center justify-center h-full space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <FiBook className="w-12 h-12 text-white" />
                    </motion.div>
                    <motion.h2
                      className="text-2xl font-bold text-gray-800"
                      initial={{ y: 20 }}
                      animate={{ y: 0 }}
                    >
                      StudyBuddy
                    </motion.h2>
                    <motion.div
                      className="flex space-x-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" />
                      <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce delay-100" />
                      <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce delay-200" />
                    </motion.div>
                  </motion.div>
                ) : (
                  <>
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"} mb-4`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${msg.sender === "You"
                              ? "bg-blue-600 text-white"
                              : msg.isNavigation
                                ? "bg-blue-100 border border-blue-300"
                                : "bg-white border border-gray-200"
                            }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-medium">
                              {msg.sender}
                            </span>
                            <span className="text-xs opacity-75">
                              {msg.timestamp}
                            </span>
                          </div>
                          {renderMessageText(msg)}
                        </div>
                      </motion.div>
                    ))}
                    {loading && (
                      <motion.div
                        className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg max-w-[80%]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t p-4 bg-white">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask StudyBuddy anything..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading || showIntro}
                />
                <motion.button
                  onClick={sendMessage}
                  disabled={loading || !input.trim() || showIntro}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loading ? (
                    <FiLoader className="w-5 h-5 animate-spin" />
                  ) : (
                    <FiSend className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatAssistant;