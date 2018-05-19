// -----------------------------------------------------------------------------
// ============================== UTILITY ========================================
// -----------------------------------------------------------------------------

var utils = {
  dist: function(x1, y1, x2, y2) {
      return (Math.hypot(x2-x1, y2-y1))
    },
  unit: function(x1, y1, x2, y2) {
      let d = this.dist(x1, y1, x2, y2);
      let dir = {
        x: (x2 - x1)/d,
        y: (y2 - y1)/d
      }
      return dir;
    },
  validate: function(format, input) {
      var keys = Object.keys(format);
      for(var i=0;i<keys.length;i++){
        var key = keys[i];
        if(input[key] == null) {
          return false;
        }
        else {
          if(typeof format[key] === 'object') {
            if(!this.validate(format[key], input[key]))
              return false;
          }
        }
      }
      return true;
    }
}

module.exports = utils;
