const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateUser } = require('../middleware/auth');

// Save Summary
router.post('/summary',   authenticateUser, async (req, res) => {
  const { id, title, date, likes = 0, comments = 0 } = req.body;
  try {
    const user = await User.findById(req.user.userId);
    user.summaries.push({ id, title, date, likes, comments });
    user.stats.summaries += 1;
    await user.save();
    res.status(201).json({ message: "Summary saved", summaries: user.summaries });
  } catch (err) {
    res.status(500).json({ message: "Error saving summary", error: err.message });
  }
});

// Save Mind Map
router.post('/mindmap',   authenticateUser, async (req, res) => {
  const { id, title, date, nodes } = req.body;
  try {
    const user = await User.findById(req.user.userId);
    user.mindMaps.push({ id, title, date, nodes });
    user.stats.mindMaps += 1;
    await user.save();
    res.status(201).json({ message: "Mind map saved", mindMaps: user.mindMaps });
  } catch (err) {
    res.status(500).json({ message: "Error saving mind map", error: err.message });
  }
});

// Save Quiz
router.post('/quiz',  authenticateUser, async (req, res) => {
  const { id, title, date, score, totalQuestions } = req.body;
  try {
    const user = await User.findById(req.user.userId);
    user.quizzes.push({ id, title, date, score, totalQuestions });
    user.stats.quizzes += 1;
    await user.save();
    res.status(201).json({ message: "Quiz saved", quizzes: user.quizzes });
  } catch (err) {
    res.status(500).json({ message: "Error saving quiz", error: err.message });
  }
});

router.post('/flashcards', authenticateUser, async (req, res) => {
  const { id, title, content, date } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newFlashcard = { id, title, content, date, likes: 0, comments: 0 };
    user.flashcards.push(newFlashcard);
    await user.save();

    res.status(201).json({ message: "Flashcard saved", flashcards: user.flashcards });
  } catch (err) {
    console.error("Error saving flashcard:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

// Get flashcards
router.get('/flashcards', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ flashcards: user.flashcards });
  } catch (err) {
    console.error("Error fetching flashcards:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

module.exports = router;
