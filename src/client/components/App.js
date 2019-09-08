import React, { useState, useEffect } from 'react'
import { Route, Redirect, withRouter, Switch } from 'react-router-dom'
import Async from 'react-code-splitting'
import Login from './Auth/Login'
import Header from './Header'
import { userSession } from './Utility/utility.js';

const Home = () => <Async load={import('./Home')} />

const App = () => {
  const [loggedIn, setLoggedIn] = useState(false);

  let user = userSession();
  user = user.loggedIn ? user : { loggedIn: false };

  return (
  <div>
    <Header user={user} />
    <Switch>
      {user.loggedIn && <Route path="/" render={() => <Home user={user} />} />}
      <Route path="/login" render={() => <Login login={setLoggedIn} />} />
      <Redirect to="/login" />
    </Switch>
  </div>
)};

export default withRouter(App);
