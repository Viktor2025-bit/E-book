const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
require('dotenv').config();

const hasUsableGoogleCredentials = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const placeholders = ['your_google_client_id_here', 'your_google_client_secret_here'];

  return Boolean(clientId && clientSecret)
    && !placeholders.includes(clientId)
    && !placeholders.includes(clientSecret)
    && !clientId.toLowerCase().includes('placeholder')
    && !clientSecret.toLowerCase().includes('placeholder');
};

if (hasUsableGoogleCredentials()) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ where: { googleId: profile.id } });
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

      if (!email) {
        return done(new Error('Google did not return an email address.'), null);
      }
      
      if (!user) {
        user = await User.findOne({ where: { email } });
      }

      if (user) {
        await user.update({
          googleId: user.googleId || profile.id,
          displayName: user.displayName || profile.displayName,
          avatarUrl: avatarUrl || user.avatarUrl,
        });
      } else {
        user = await User.create({
          googleId: profile.id,
          displayName: profile.displayName || 'BEMS Books Reader',
          email,
          avatarUrl,
        });
      }
      
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
  ));
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
