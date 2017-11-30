// Some basic utility functions

function dist(x1, y1, x2, y2) {
  return (Math.hypot(x2-x1, y2-y1))
}

function unit(x1, y1, x2, y2) {
  dist = dist(x1, y1, x2, y2);
  dir = {
    x: (x2 - x1)/dist,
    y: (y2 - y1)/dist
  }
  return dir;
}

function validate(format, input) {
  var keys = Object.keys(format);
  for(var i=0;i<keys.length;i++){
    var key = keys[i];
    if(input[key] == null) {
      return false;
    }
    else {
      var keys2 = Object.keys(format[key]);
      if(keys2.length > 0) {
        return validate(format[key], input[key]);
      }
    }
  }
  return true;
}
