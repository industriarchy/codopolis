var express = require('express');
var router = express.Router();
const ai = require('./ai');
var map = require('./map.js');
var uuidv1 = require('uuid/v1');
var formats = require('../shared/formats');
const utils = require('../server/utility');
const { encrypt, decrypt } = require('./encrypt');

router.post('/test', function(req, res) {
  res.send('testing!');
});

router.post('/login', function(req, res) {
  var db = req.db;
  var collection = db.get('userlist');
  var emailn = req.body.email;
  var password = req.body.password;
  collection.findOne({ 'email' : emailn }, {}, function(e,docs){
    if(e === null) {
      if(docs != null) {
        let decryptPW = decrypt(docs.password);
        if(password == decryptPW) {
          console.log("password match");
          res.cookie('userId', docs.username);
          // req.session.user = docs.username;
          res.send( docs );
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
  let db = req.db;
  console.log(req.body);
  let collection = db.get('userlist');
  if( utils.validate(formats.newUser, req.body) ) {
    console.log("format valid");
    checkUser(req.body.username, collection).then( (result) => {
      if (result) {
        let newUser = {};
        newUser.username = req.body.username;
        newUser.email = req.body.email;
        newUser.password = encrypt(req.body.password);
        newUser.char = Object.assign({}, formats.unit);
        console.log("new user", newUser);
        collection.insert(newUser, function(err, result){
            res.cookie('userId', req.body.username);
            res.send(
                (err === null) ? { msg: '' } : { msg: err }
            );
        });
        const newAi = Object.assign({}, formats.aiProfiles.pet);
        newAi.owner = req.body.username;
        ai.new(newAi, db);
      }
      else {
        console.log('user already exists');
        res.send( { msg: 'already exists' } );
      }
    });
  }
  else {
    res.send( { msg: 'body invalid' } );
  }
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

router.get('/getSession', function(req, res) {
  console.log("cur session", req.session);
  if (req.session.user) {
    console.log("session found");
    res.send({ user: req.session.user });
  } else {
    res.send({ error: 'User not found.' });
  }
});

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

function loadChar(id, db) {
  return new Promise( function(resolve) {
    const collection = db.get('userlist');
    collection.findOne({ 'username' : id }, {}, function(e,docs){
      if(e === null) {
        if(docs != null) {
          console.log("unit found", docs);
          map.mapData.units[id] = docs.char;
          ai.load(id, db).then( () => {
            resolve(true);
          });
        }
        else {
          map.mapData.units[id] = Object.assign({}, formats.unit);
          resolve(false);
        }
      }
    });
  });
}

checkUser = (user, collection) => {
  return new Promise( function(resolve) {
    collection.find({ 'username' : user }, {}, function(e,docs){
      if(e === null) {
        if(docs[0] != null) {
          resolve(false);
        }
        else {resolve(true);}
      }
    });
  });
};

module.exports = { router: router, loadChar: loadChar };
