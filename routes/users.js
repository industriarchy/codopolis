var express = require('express');
var router = express.Router();


router.post('/login/:email/:password', function(req, res) {
  var db = req.db;
  var collection = db.get('userlist');
  var emailn = req.params.email;
  var password = req.params.password;
  collection.find({ 'email' : emailn }, {}, function(e,docs){
    if(e === null) {
      if(docs[0] != null) {
        if(password == docs[0].password) {
          console.log("password match");
          req.session.user = docs[0].username;
          res.send( docs[0] );
        }
        else {res.send( { msg: "x"} )}
      }
      else {res.send( { msg: "x"} )}
    }
  });
});

router.post('/logout', function(req, res) {
  req.session.destroy();
  res.send( { msg: "" } )
});

/*
 * POST to adduser.
 */
router.post('/adduser', function(req, res) {
  console.log("hit adduser");
    var db = req.db;
    console.log(req.body);
    var collection = db.get('userlist');
    collection.insert(req.body, function(err, result){
        req.session.user = req.body.username;
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
})

/*
 * DELETE to deleteuser.

router.delete('/deleteuser/:id', function(req, res) {
    var db = req.db;
    var collection = db.get('userlist');
    var userToDelete = req.params.id;
    collection.remove({ '_id' : userToDelete }, function(err) {
        res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
    });
});*/

router.get('/getuser/:email', function(req, res) {
  console.log("hit getuser")
  var db = req.db;
  var collection = db.get('userlist');
  var email = req.params.email;
  collection.find({ 'email' : email }, {}, function(e,docs){
    if(e === null) {
      if(docs[0] != null) {
        res.json(docs);
      }
      else {res.send( { msg: "No Buddies."} )}
    }
  });
});

router.get('/getBuddies/:email', function(req, res) {
  console.log("hit getBuddies")
  var db = req.db;
  var collection = db.get('userlist');
  var email = req.params.email;
  collection.find({ 'email' : email }, {}, function(e,docs){
    if(e === null) {
      if(docs[0] != null) {
        res.json(docs);
      }
      else {res.send( { msg: "No Buddies."} )}
    }
  });
});

/*
 * POST to demo site.
*/
router.post('/demo', function(req, res) {
    var db = req.db;
    var democol = db.get('demo');
    var collection = db.get('userlist');
    console.log("got here");
    democol.find({}, {}, function(e, docs){
      console.log("got here2");
      if(docs[0] == null) {
        democol.insert({'demnum' : 1, 'dem' : 'dem'}, function(e2, result2){
          var newUser = {
              'username': 'Demo1',
              'email': 'demo@demo.com1',
              'password': '1',
              'fullname': 'demo'
          }
          collection.insert(newUser, function(e3, result3){
              res.send(
                  (e3 === null) ? { msg: '', email: newUser.email, password: newUser.password } : { msg: err }
              );
          });
        })
      }
      else {
        console.log(docs[0]);
        var number = docs[0].demnum;
        number++;
        democol.update({'dem' : 'dem'}, {'demnum' : number, 'dem' : 'dem'});
        var newUser = {
          'username': 'Demo' + number,
          'email': 'demo@demo.com' + number,
          'password': '1',
          'fullname': 'demo'
        }
        collection.insert(newUser, function(e3, result3){
            res.send(
                (e3 === null) ? { msg: '', email: newUser.email, password: newUser.password } : { msg: err }
            );
        });
      }
    });
});

module.exports = router;
