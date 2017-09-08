/*
 * This is the Redux store. We give it the Thunk middleware, enabling
 * asynchronous dispatcher calls, as well as the Redux Logger for easy store
 * inspection through the Chrome console. This way, we can see everything that
 * is going on inside our application as a '(state, action) -> state' chain.
 */

import { createStore, applyMiddleware, compose } from 'redux'
import createSagaMiddleware from 'redux-saga'
//import createLogger from 'redux-logger'

import rootReducer from './reducers/rootReducer'
import rootSaga from './reducers/rootSaga'

const sagaMiddleware = createSagaMiddleware()

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const middleware = applyMiddleware(
  //createLogger(),
  sagaMiddleware,
)

const store = createStore(
  rootReducer,
  composeEnhancers(middleware),
)

sagaMiddleware.run(rootSaga)

export default function configureStore() {
  return store
}
