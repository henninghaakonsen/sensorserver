// @flow

import { combineReducers } from 'redux'
import facilities from './facilityReducer'
import lastClicked from './mapReducer'
import messages from './messageReducer'
import navigation from './navigationReducer'
import editor from './editorReducer'

const rootReducer = combineReducers({
  navigation,
  facilities,
  messages,
  lastClicked,
  editor,
})

export default rootReducer
