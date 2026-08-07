const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const env = require("../../config/env");
const authService = require("../auth.service");

/**
 * Google OAuth2 strategy (stateless JWT flow — no session serialization).
 * Only registered when GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are set.
 */
const isGoogleConfigured = Boolean(env.googleClientId && env.googleClientSecret);

if (isGoogleConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: env.googleCallbackUrl,
        passReqToCallback: false,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const { user, token } = await authService.googleAuthCallback({ profile });
          return done(null, { user, token });
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

module.exports = {
  passport,
  isGoogleConfigured,
};
