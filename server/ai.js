// -----------------------------------------------------------------------------
// ================================ AI =========================================
// -----------------------------------------------------------------------------

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
  console.log("hit addAI");
  var collection = db.get('ai');
  newUnit = data;
  collection.insert(newUnit, function(data){
      console.log("made", data);
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

const ai = {
  send: send,
  new: newUnit
};


module.exports = ai;
