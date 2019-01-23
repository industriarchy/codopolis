// -----------------------------------------------------------------------------
// ================================ AI =========================================
// -----------------------------------------------------------------------------


var map = require('./map.js');

send = function(data) {
  console.log(data);
  if(data.cmd == 'getUser') {
    getUser(data);
  }
  else if(data.cmd == 'getUnit') {
    getUnit(data);
  }
  else if(data.cmd == 'getView') {
    getView(data);
  }
  else if(data.cmd == 'act') {
    act(data);
  }
}

newUnit = function(data, db) {
  var collection = db.get('ai');
  newUnit = data;
  collection.insert(newUnit, function(err, result){
      console.log("made", result);
  });
}

getUser = function(data) {

}

getUnit = function(data) {

}

getView = function(data) {

}

act = function(data) {

}

function loadAi(id, db) {
  return new Promise( function(resolve) {
    const collection = db.get('ai');
    collection.findOne({ 'owner' : id }, {}, function(e,docs){
      if(e === null) {
        if(docs != null) {
          console.log("ai found", docs);
          map.mapData.units[docs._id] = docs;
          resolve(true);
        }
        else {
          resolve(false);
        }
      }
    });
  });
}

const ai = {
  send: send,
  new: newUnit,
  load: loadAi
};


module.exports = ai;
