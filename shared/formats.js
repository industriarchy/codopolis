
const map = require('../server/map.js');

const formats = {
  unit: {
    x: map.neutralSpawn.x || 500,
    y: map.neutralSpawn.y || 500,
    ll: true,
    health: 100,
    timeout: 0,
    alive: false,
    loggedIn: true
  },
  newUser: {
    username: 'aname',
    email: 'email',
    password: 'password'
  },
  missles: { sender: 0, curX: 0, curY: 0, dX: 0, dY: 0, dist: 0, type: "A" },
  flags: { x: 0, y: 0, owner: "a", health: 0 },
  build: { type: 'g', x: 0, y: 0 },
  aiProfiles: {
    pet: {
      owner: "",
      x: 600,
      y: 350,
      ll: true,
      right: 0,
      up: 0,
      health: 100,
      timeout: 0,
      alive: false,
      damage: 20,
      speed: 1,
      atkRange: 10,
      atkSpeed: 1,
      program: ''
    }
  }
};

module.exports = formats;
