// @flow

import type { Editor } from './reducers/editorReducer'
import type { Messages } from './reducers/messageReducer'
import type { Navigation } from './reducers/navigationReducer'

export type AppState = {
  navigation: Navigation,
  messages: Messages,
  editor: Editor,
}

export type Node = {
  id: string,
  displayName: string,
}

export type NodeInformation = {
  type: string,
  timestamp: string,
  latency: number,
  coverage: string,
}
