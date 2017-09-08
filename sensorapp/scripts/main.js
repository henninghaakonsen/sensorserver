/*
 * This is the entry point for our React application. The provider acts as a
 * wrapper around our App component, providing the goods of Redux.
 */

import 'babel-polyfill'
import 'isomorphic-fetch'
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import App from './containers/App'
import configureStore from './store'
import injectTapEventPlugin from 'react-tap-event-plugin';

const store = configureStore({})
injectTapEventPlugin();

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('main')
)
