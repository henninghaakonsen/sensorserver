/*
 * AppState type for type checking the reducers using flow.
 *
 * @flow
 */

import type { Navigation } from './navigationReducer'

export type AppState = {
  navigation: Navigation,
}
