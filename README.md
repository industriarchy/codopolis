# codopolis
The knights of the coding table gather here for drinks of raspberry pi-aritas and merry times

The premise of this game is that the players will acquire territory through building walls and fences. The goal being to get the most territory. Robot dogs will assist the users in this goal. They can be programmed to do various tasks (guard, attack, etc..). The more territory you accquire the more dogs you get. There will also be "creeps", or random animals out there and resources you harvest to support your building of walls and fortresses and robot dogs.

The programming of the dogs will be either on the users front end or through a separate "node" hitting the api. This is so user AI will not slow down the server.

I'd like to start everything with a simple "Battle Mode" in which each player will simply be able to quickly dual other AI or other players.

All Data is passed via JSON through Socket.io from client to server vice/versa.

The server will store user data with mongodb.
<pre>
  ------------------ mapData Format  ----------------------
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
  curMId: int
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
  ----------------------------------------------------------
</pre>

TODO:

* Data needs to be validated so server never crashes
* Login needs to be created
* Database needs to be added
* Dogs need to be added
* Programming needs to be added to Dogs
* Wall Building needs to be added
* Resources need to be added
* Creeps need to be added
* Map-maker needs to be created
* Map needs to be made
