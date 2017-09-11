// @flow

import { combineReducers } from 'redux'
import navigation from './navigationReducer'

const rootReducer = combineReducers({
  navigation,
})

export default rootReducer
