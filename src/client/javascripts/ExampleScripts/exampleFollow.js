if (utils.dist(pet.x, pet.y, model.X, model.Y) > 100) {
  var unitCoord = utils.unit(pet.x, pet.y, model.X, model.Y);
  var goX = unitCoord.x * 6;
  var goY = unitCoord.y * 6;
  if(functions.canGo(pet.x + goX, pet.y, 20, 80, model.MAP)) {
    pet.x += goX;
  }
  if(functions.canGo(pet.x, pet.y + goY, 20, 80, model.MAP)) {
    pet.y += goY;
  }
}
