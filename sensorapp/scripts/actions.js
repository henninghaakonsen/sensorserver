/*
 * We define a type Action so that flow can type check every action that is
 * dispatched through a smart component. Every logical action that redefines
 * another smart component should be fired with redux dispatches of actions.
 *
 * @flow
 */

import type { Node, NodeInformation } from './types'

export type Action =
    // Navigation actions
    { type: 'NODES_FETCH_REQUESTED' }
    | { type: 'NODES_FETCH_SUCCEEDED', nodes: Node[] }
    | { type: 'NODES_FETCH_FAILED', message: string }
    | { type: 'NODE_FETCH_REQUESTED', node: Node }
    | { type: 'NODE_FETCH_SUCCEEDED', nodeInformation: NodeInformation[] }
    | { type: 'NODE_FETCH_FAILED', message: string}
    | { type: 'NODE_QUERY_CLICKED', node: Node}
    | { type: 'NODE_SELECTED', node: Node};
