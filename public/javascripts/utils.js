// Some basic utility functions

dist(x1, y1, x2, y2) {
  return (Math.hypot(x2-x1, y2-y1))
}

unit(x1, y1, x2, y2) {
  dist = dist(x1, y1, x2, y2);
  dir = {
    x: (x2 - x1)/dist,
    y: (y2 - y1)/dist
  }
}
