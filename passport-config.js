// passport-config.js
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt'); // or 'bcryptjs'
const { ObjectId } = require('mongodb');

function initializePassport(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    // Use the email to find the user
    const user = await getUserByEmail(email);
    if (!user) {
      return done(null, false, { message: 'No user with that email' });
    }
    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Password incorrect' });
      }
    } catch (err) {
      return done(err);
    }
  };

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));

  // Serialize the user: store the _id as a string
  passport.serializeUser((user, done) => done(null, user._id.toString()));

  // Deserialize the user: convert the stored string back to an ObjectId before fetching the user
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await getUserById(new ObjectId(id));
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = initializePassport;
