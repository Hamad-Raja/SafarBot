const express = require('express');
const { registerUser, loginUser, getProfile, updateProfile, registerProvider  } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();


router.post('/signup', registerUser);
router.post('/register', registerUser);
router.post('/provider/register' , registerProvider);

router.post('/login', loginUser);


router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
