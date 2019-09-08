import React from 'react'
import PropTypes from 'prop-types'
import { Redirect } from 'react-router-dom'
import { GameView } from './Game/Game'

const Home = () => {
  return (
    <div>
      <GameView />
    </div>
  );
}

export default Home;
