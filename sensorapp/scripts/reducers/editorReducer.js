// @flow

import type { Action } from '../actions'

export type Editor = {
  show: boolean,
  add: boolean,
  edit: boolean
}

const initialState: Editor = {
  show: false,
  add: false,
  edit: false,
}

export default function editPanelReducer(state: Editor = initialState, action: Action) {
  switch (action.type) {
    case 'EXIT_EDITOR':
      return { ...state, show: false, edit: false, add: false}

    case 'ENABLE_FACILITY_EDITING':
      return { ...state, show: true, edit: true, add: false}

    case 'ENABLE_FACILIY_CREATION':
      return { ...state, show: true, edit: false, add: true }

    case 'UNIT_WAS_SELECTED':
      return { ...state, show: false, edit: false, add: false}

    default:
      return state
  }
}
