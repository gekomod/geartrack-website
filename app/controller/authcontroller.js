var connection = require('../config/mysql.js')();
var exports = module.exports = {}
 
exports.signup = function(req, res) {
    res.render('signup', { messages: req.flash() });
}

exports.login = function(req, res) {
    res.render('login');
}

exports.dashboard = function(req, res) {
    connection.query("SELECT `id` AS `order`, `trackerId` AS `id`, `description`, `postCode` AS `postalcode`, `status` AS `loaded` FROM `trackers` WHERE userId="+req.user.id, function(err, rows, fields) { 
    res.render('panel', { user: req.user, przesy: JSON.parse(JSON.stringify(rows)) });
        console.log(JSON.parse(JSON.stringify(rows)));
    });
    
}

exports.dashboardADD = function(req, res) {
var data = req.body

var querys = connection.query("select COUNT(*) AS namesCount from trackers where trackerId="+data.shipping_id, function (error, results, fields) {
  if (error) throw error;
 if(results[0].namesCount <= 1) {
  		var post  = {id: null, trackerId: data.shipping_id, description: data.description, postCode: '0001', userId: req.user.id, status: 'active'};
		var query = connection.query('INSERT INTO trackers SET ?', post, function (error, results, fields) {
  		if (error) throw error;
  // Neat!
  		res.redirect('/panel');
		});
  } else {
     console.log('EH:', 'Wpis istnieje')
     res.redirect('/panel');
  }
});

    res.json({ idsh: data.shipping_id });
}

exports.logout = function(req, res) {
    req.session.destroy(function(err) {
        res.redirect('/');
    });
}