var authController = require('../app/controller/authcontroller.js');
 
module.exports = function(app, passport) {
 
    app.get('/signup', authController.signup);
    app.get('/login', authController.login);
    app.post('/login', passport.authenticate('local-signin', {
        successRedirect: '/panel',
        failureRedirect: '/login'
    }
    ));
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/panel',
        failureRedirect: '/signup',
        failureFlash : true 
    }  ));
    app.get('/logout',authController.logout);
    app.get('/panel',isLoggedIn,authController.dashboard);
    app.post('/panel/add',isLoggedIn,authController.dashboardADD);

    function isLoggedIn(req, res, next) {
 
    if (req.isAuthenticated()) {
    next();
    } else {
        res.redirect('/login');
    }
    }
 
}
