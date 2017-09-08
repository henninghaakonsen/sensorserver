/*
 * AppState type for type checking the reducers using flow.
 *
 * @flow
 */

import type { Navigation } from './navigationReducer'
import type { Editor } from './editorReducer'

export type AppState = {
  navigation: Navigation,
  editor: Editor,
}
