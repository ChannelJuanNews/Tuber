var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;


var jwt_auth = require('./jwt.js')
var fb = require('./fb.js')
var twitter = require('./fb.js')


var jwt = require('jsonwebtoken');
var User = require('../app/models/user');
// expose this function to our app using module.exports
module.exports = function(passport) {
    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });
    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    }, function(req, email, password, done) {
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            User.findOne({
                'local.email': email
            }, function(err, user) {
                // if there are any errors, return the error
                if (err) return done(err);
                // check to see if theres already a user with that email
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                } else {
                    // if there is no user with that email
                    // create the user
                    var newUser = new User();
                    // set the user's local credentials
                    newUser.local.email = email;
                    newUser.local.password = newUser.generateHash(password);
                    newUser.local.username = req.body.username
                        // save the user
                    newUser.save(function(err, user) {
                        if (err) {
                            console.log(err);
                        } else {
                            user.token = jwt.sign({
                                _id: user._id
                            }, jwt_auth.jwt_secret);
                            user.save(function(err, user1) {
                                if (err) {
                                    console.log(err)
                                } else {
                                    return
                                    done(null, newUser);
                                }
                            })
                        }
                    });
                }
            });
        });
    }));
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    }, function(req, email, password, done) { // callback with email and password from our form
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        console.log("WE IN NIGGA")
        User.findOne({
            'local.username': email
        }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err) return done(err);
            // if no user is found, return the message
            if (!user) return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
            // if the user is found but the password is wrong
            if (!user.validPassword(password)) return
            done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
            // all is well, return successful user
            return done(null, user);
        });
    }));

    passport.use('facebook', new FacebookStrategy({
            clientID: fb.clientID,
            clientSecret: fb.clientSecret,
            callbackURL: fb.callbackURL,
            profileFields: ['id', 'photos', 'emails', 'name', 'gender', 'profileUrl']
        },

        // facebook will send back the tokens and profile
        function(access_token, refresh_token, profile, done) {

            if (!profile){
              console.log("FACE NO profile")
            }
            // asynchronous
            process.nextTick(function() {

              console.log("PROFILE IS: ", profile)

                // find the user in the database based on their facebook id
                User.findOne({
                    'facebook.id': profile.id
                }, function(err, user) {
                  
                    // if there is an error, stop everything and return that
                    // ie an error connecting to the database
                    if (err)
                        done(err);

                    // if the user is found, then log them in
                    if (user) {
                        done(null, user); // user found, return that user
                    } else {
                        // if there is no user found with that facebook id, create them
                        var newUser = new User();

                        // set all of the facebook information in our user model
                        newUser.facebook.id = profile.id; // set the users facebook id
                        newUser.facebook.access_token = access_token; // we will save the token that facebook provides to the user
                        newUser.facebook.firstName = profile.name.givenName;
                        newUser.facebook.lastName = profile.name.familyName; // look at the passport user profile to see how names are returned
                        newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
                        newUser.facebook.fbURL = profile.profileUrl;
                        newUser.facebook.username = profile.username;
                        // save our user to the database
                        newUser.save(function(err, user) {
                            if (err){
                                throw err;
                                console.log(err)
                            }
                            // if successful, return the new user
                            done(null, user);
                        });
                    }
                });
            });
        }));

};
