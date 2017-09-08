// @flow

import type { Facility } from '../types.js'
import type { Action } from '../actions.js'

export type Facilities = Facility[]
const initialState: Facilities = []

export default function facilitiesReducer(state: Facilities = initialState, action: Action): Facilities {
  switch (action.type) {
    case 'FACILITIES_FETCH_SUCCEEDED':
      return action.facilities

    case 'FACILITY_DELETION_SUCCEEDED':
      const id = action.facility.id
      return state.filter(facility => facility.id !== id)

    case 'FACILITY_UPDATE_SUCCEEDED':
      const updatedFacility = action.facility
      return state.map(facility => facility.id === updatedFacility.id ? updatedFacility : facility)

    default:
      return state
  }
}
