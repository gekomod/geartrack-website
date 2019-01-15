const express = require('express');
const router = express.Router();

/**
 * Home page
 */
router.get('/', function(req, res, next) {
  res.render('index',{user: req.user});
});

/**
 * About
 */
router.get('/about', function(req, res, next) {
    res.render('about', { title: 'O nas',user: req.user });
});

/**
 * App
 */
router.get('/app', function(req, res, next) {
    res.render('app', { title: 'Aplikacja na telefon',user: req.user });
});

/**
 * News
 */
router.get('/news', function(req, res, next) {
    res.render('news', { title: 'Wiadomości',user: req.user });
});

/**
 * FAQs
 */
router.get('/faqs', function(req, res, next) {
    res.render('faqs', { title: 'FAQs',user: req.user });
});

/**
 * checkIfData
 */
router.get('/checkIfData', function(req, res, next) {
    var connection = require('../app/config/mysql.js')();
    if (req.user) {
        //{"id":"LF466267124CN","postalcode":null,"description":"Przepięciówka","order":3,"loaded":true}
    connection.query("SELECT `id` AS `order`, `trackerId` AS `id`, `description`, `postCode` AS `postalcode`, `status` AS `loaded` FROM `trackers` WHERE userId="+req.user.id, function(error, results){
        if ( error ){
            /*res.status(400).send('Error in database operation');*/
        } else {
            res.status(200).json({
                success: true,
                data: JSON.parse(JSON.stringify(results))
            });
        }
    });
    //if (error) throw error;
        } else {
        res.send("error")
    }
});

/**
 * Api Save
 */
router.post('/api/save', (req, res) => {
  const id = req.body.id
  var connection = require('../app/config/mysql.js')();
  var post  = {id: null, trackerId: id};
  var query = connection.query('INSERT INTO notfoundids SET ?', post, function (error, results, fields) {
  if (error) throw error;
  // Neat!
  });

  res.json({id:id})
});


module.exports = router;
