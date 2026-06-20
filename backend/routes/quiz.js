const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/add-quiz', async (req, res) => {
  try {
    const { userId, quiz } = req.body;

    if (!userId || !quiz || typeof quiz.id !== 'number') {
      return res.status(400).json({ message: 'Invalid quiz format or missing userId' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.quizzes.push(quiz);
    user.stats.quizzes += 1;

    await user.save();

    res.status(200).json({ message: 'Quiz saved successfully', quiz });
  } catch (err) {
    console.error('Add quiz error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
