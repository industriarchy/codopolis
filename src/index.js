import Offline from 'offline-plugin/runtime'
import React from 'react'
import { render } from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.css';
import './client/styles/style.css';

// Importing jquery for now...
// import './public/vendor/jquery.js';

import App from './client/components/App'

if (process.env.NODE_ENV === 'production') Offline.install()

export const Root = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
)

if (!module.hot) render(<Root />, document.querySelector('react'))
