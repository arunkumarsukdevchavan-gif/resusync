const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

// Initialize Google OAuth2 client
const client = new OAuth2Client('595202264177-s97i4i7bmi7csrnu6vd9gcuf0314qq7a.apps.googleusercontent.com');

// POST /api/auth/google - Verify Google token and authenticate user
router.post('/google', async (req, res) => {
  try {
    const { token, credential } = req.body;
    const idToken = token || credential; // Support both formats
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google token or credential is required'
      });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: '595202264177-s97i4i7bmi7csrnu6vd9gcuf0314qq7a.apps.googleusercontent.com'
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: profilePicture } = payload;

    // Find or create user in database
    let user = await User.findOne({ googleId });
    
    if (!user) {
      // Create new user
      user = new User({
        googleId,
        email,
        name,
        profilePicture: profilePicture || '',
        lastLogin: new Date(),
        isActive: true
      });
      await user.save();
      console.log(`✅ New user created: ${name} (${email})`);
    } else {
      // Update existing user's last login
      user.lastLogin = new Date();
      user.name = name; // Update name in case it changed
      user.profilePicture = profilePicture || user.profilePicture;
      await user.save();
      console.log(`✅ User authenticated: ${name} (${email})`);
    }

    // Return user information
    res.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user._id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Google authentication error:', error);
    
    if (error.message && error.message.includes('Token used too late')) {
      return res.status(401).json({
        success: false,
        message: 'Google token has expired. Please sign in again.'
      });
    }
    
    res.status(401).json({
      success: false,
      message: 'Invalid Google token or authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/auth/profile - Get user profile (requires authentication)
router.get('/profile', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

// POST /api/auth/logout - Logout user (optional endpoint)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;