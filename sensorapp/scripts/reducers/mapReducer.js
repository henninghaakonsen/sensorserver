// @flow

import type { Action } from '../actions'
import type { Location } from '../types'

const initialState = {
  lat: 0,
  lng: 0,
}

export default function mapReducer(state: Location = initialState, action: Action): Location {
  switch (action.type) {
    case 'MAP_WAS_CLICKED':
      return action.location

    case 'EXIT_EDITOR':
      return initialState

    case 'UNIT_WAS_SELECTED':
      return initialState

    default:
      return state
  }
}
