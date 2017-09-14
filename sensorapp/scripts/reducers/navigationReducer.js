// @flow

import type { Action } from '../actions'
import type { Node, NodeInformation } from '../types'

export type Navigation = {
  nodes: Node[],
  selectedNode: Node,
  selectedNodeInformation: NodeInformation[],
  fetchingChildren: boolean,
}

const initialState: Navigation = {
  nodes: [],
  selectedNode: null,
  selectedNodeInformation: [],
  fetchingChildren: false,
}

export default function navigationReducer(state: Navigation = initialState, action: Action): Navigation {
  switch (action.type) {
    case 'NODES_FETCH_REQUESTED':
      return {...state, fetchingNodes: true}

    case 'NODES_FETCH_SUCCEEDED':
      return {
        ...state,
        nodes: action.nodes,
        fetchingNodes: false,
      }

    case 'NODES_FETCH_FAILED':
      return {...state, nodes: [], fetchingNodes: false}

    case 'NODE_SELECTED':
      return {...state, selectedNode: action.node}

    case 'NODE_FETCH_REQUESTED':
      return {...state, selectedNode: action.node}

    case 'NODE_FETCH_FAILED':
      return {...state, selectedNode: null, selectedNodeInformation: []}

    case 'NODE_FETCH_SUCCEEDED':
      return {
        ...state,
        selectedNodeInformation: action.nodeInformation,
      }

    default:
      return state
  }
}
