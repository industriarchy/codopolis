# codopolis
The knights of the coding table gather here for drinks of raspberry pi-aritas and merry times

The premise of this game is that the players will acquire territory through building walls and fences. The goal being to get the most territory. Robot dogs will assist the users in this goal. They can be programmed to do various tasks (guard, attack, etc..). The more territory you accquire the more dogs you get. There will also be "creeps", or random animals out there and resources you harvest to support your building of walls and fortresses and robot dogs.

The programming of the dogs will be either on the users front end or through a separate "node" hitting the api. This is so user AI will not slow down the server.

I'd like to start everything with a simple "Battle Mode" in which each player will simply be able to quickly dual other AI or other players.

All Data is passed via JSON through Socket.io from client to server vice/versa. This might be better handled in the future with javascript blobs.

The server will store user data with mongodb.

Upload:
scp corCodopolis.zip motivey.com:/
ssh motivey.com
unzip corCodpolis

Deploy:
database: sudo mongod --fork --logpath /var/log/mongodb.log --dbpath data
use pm2:
  pm2 start index.js

<pre>
  ------------------ Model Data Format  ----------------------
  curId: int          -> specifies the next id to be created by new player
  units: {
   id: {              -> id of the units
      x: int          -> x-coord of unit
      y: int          -> y-coord of unit
      ll: bool        -> var for looking right
      timeout: int    -> time left before another shot
      health: int     -> amount of health left
      }
    },
  },
  curMId: int         -> specifies the next id of the missles
  missles: {
    id: { int         -> id of missle
      sender: int     -> id of the sender
      curX: int       -> current x-coord
      curY: int       -> current y-coord
      dX: int         -> travel speed x
      dY: int         -> travel speed y
      dist: int       -> distance traveled so far
      type: string    -> projectile type
    },
  },
  flags: {
    x: int,
    y: int,
    owner: string,
    health: float
  }
  map: map
  ----------------------------------------------------------
</pre>

AI API:

* ai: create
 * creates a new ai character
* ai: getUser
 * gets all ai associated with user
* ai: getUnit
 * gets information about the ai unit
* ai: getView
 * get the view for the unit
* ai: act
 * send commands to the unit


MAP TILE SETUP:


|Type             |Number(t)     |Walkable      |h       |o    |
|-----------------|--------------|--------------|--------|-----|
|Grass            |0             |Yes           |10      |x    |
|Deep water       |1             |No            |0       |0    |
|Shallow Water    |2             |No            |0       |x    |
|Path             |3             |Yes           |0       |x    |
|Hillside         |6             |No            |0       |0    |
|Ramp             |7             |No            |0       |x    |

|Additional(a)    |Number(a)     |Walkable      |h       |o    |
|-----------------|--------------|--------------|--------|-----|
|flag             |1             |Yes           |0       |x    |
|Tree             |2             |No            |10      |x    |
|Wall             |3             |No            |10      |x    |
|Farm             |4             |Yes           |10      |x    |
|Mine             |5             |Yes           |10      |x    |

TODO:

* Data needs to be validated so server never crashes
* Dogs need to be added
* basic following algorithm
* Programming needs to be added to Dogs
* Saved scripts to preload
* Resources need to be added
* Creeps need to be added
* Map needs to be made
* Save on logouts and every 30 seconds?
* Sidebar of flags

Server is at 138.197.17.220
