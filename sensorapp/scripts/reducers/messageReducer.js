// @flow

import type { Action } from '../actions.js'

export type Messages = {
  message: ?string,
  hostile: boolean,
}

const initialState = {
  message: null,
  hostile: false,
}

export default function messageReducer(state: Messages = initialState, action: Action): Messages {
  switch (action.type) {
    case 'FACILITY_DELETION_SUCCEEDED':
      return {...state, message: 'Successfully deleted facility: ' + action.facility.name}

    case 'FACILITY_ADD_SUCCEEDED':
      return {...state, message: 'Successfully added facility: ' + action.facility.name}

    case 'FACILITY_UPDATE_SUCCEEDED':
      return {...state, message: 'Successfully updated facility: ' + action.facility.name}

    case 'FACILITY_DELECTION_FAILED':
      return {
        message: "Cannot delete a facility with dependencies.",
        hostile: true,
      }

    case 'EDIT_FIELDS_WERE_UNCHANGED':
        return {...state, message: 'No changes were made'}

    case 'REQUIRED_FIELDS_EMPTY':
      return {...state, message: 'Must fill out required fields: name, opening date and coordinates'}

    case 'ENABLE_FACILITY_CREATION':
    case 'ENABLE_FACILITY_EDITING':
      return {...state,  message: 'Click on the map to select a new location.'}

    case 'CLICKED_OUTSIDE_CHIEFDOM':
      return {...state,  message: 'Click inside the chiefdom to add a new facility'}

    case 'HIDE_MESSAGE':
      return {
        message: null,
        hostile: false,
      }

    default:
      return state
  }
}
