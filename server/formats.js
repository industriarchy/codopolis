
const unit = {
  x: 500,
  y: 500,
  ll: true,
  right: 0,
  up: 0,
  health: 100,
  timeout: 0,
  alive: false,
  loggedIn: true
}
const missles = {sender: 0, curX: 0, curY: 0, dX: 0, dY: 0, dist: 0, type: "A"}
const flags = {x: 0, y: 0, owner: "a", health: 0};

module.exports = {missles: missles, flags: flags, unit: unit};
