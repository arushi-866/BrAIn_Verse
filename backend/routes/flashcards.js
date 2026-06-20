
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/flashcards/add-flashcard
router.post('/add-flashcard', async (req, res) => {
    try {
      const { userId, flashcard } = req.body;
  
      if (!userId || !Array.isArray(flashcard) || flashcard.length === 0) {
        return res.status(400).json({ message: 'User ID and flashcard array are required' });
      }
  
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      // Optional: add IDs or dates if missing
      flashcard.forEach(card => {
        if (!card.id) card.id = `fc-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        if (!card.date) card.date = new Date().toISOString();
        if (typeof card.likes !== 'number') card.likes = 0;
        if (typeof card.comments !== 'number') card.comments = 0;
      });
  
      // Add all flashcards
      user.flashcards.push(...flashcard);
      user.stats.flashcards += flashcard.length;
  
      await user.save();
  
      res.status(200).json({ message: 'Flashcards added successfully', flashcards: user.flashcards });
    } catch (error) {
      console.error('Add flashcards error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  module.exports = router;