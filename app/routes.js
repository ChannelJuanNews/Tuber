// app/routes.js
module.exports = function(app, passport) {

    // landing page
    app.get('/', function(req, res) {
      if (isAuthenticated(req)){
        res.render('/tuber.ejs')
      }
      else {
        res.render('index.ejs'); // load the index.ejs file
      }
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
         successRedirect : '/profile', // redirect to the secure profile section
         failureRedirect : '/signup', // redirect back to the signup page if there is an error
         failureFlash : true // allow flash messages
    }));

    app.post('/login', passport.authenticate('local-login', {
       successRedirect : '/profile', // redirect to the secure profile section
       failureRedirect : '/login', // redirect back to the signup page if there is an error
       failureFlash : true // allow flash messages
   }));


    /*************PROTECTED ROUTES *****************/
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    app.get('/users', isLoggedIn, function(req, res){
      // return users json
    })
    app.get('/user/:id', isLoggedIn, function(req, res){
      // return one user
    })

    app.put('/users/:id', isLoggedIn, function(req, res){

    })
    app.get('/classes', isLoggedIn, function(req, res){

    })




};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();
    // if they aren't redirect them to the home page
    res.redirect('/');
}
function isAuthenticated(req){
    if (req.isAuthenticated()){
      return true
    }
    return false
}
