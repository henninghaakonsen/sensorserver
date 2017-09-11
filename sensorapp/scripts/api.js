/*
 * For this simple health registry application, we choose to use the online demo
 * api available online at play.dhis2.org.
 *
 * @flow
 */

import type { Node } from './types'

const apiServer = 'http://localhost:8020/api'

const fetchNodesOptions = {
    method: 'GET',
    nodes: {
        'Content-Type': 'application/json',
    },
}

const fetchNodeInformationOptions = {
    method: 'GET',
    information: {
        'Content-Type': 'application/json',
    },
}

function rejectFetchFailures(response) {
    return response.status >= 200 && response.status < 300 ?
      Promise.resolve(response) :
      Promise.reject(response)
}

export function fetchNodeList(): Promise<Node[]> {
  return fetch(`${apiServer}/nodes`, fetchNodesOptions)
    .then(rejectFetchFailures)
    .then(response => response.json())
    .then(({ nodes }) => nodes.map(node => ({
      id: node.id,
      displayName: node.displayName,
    })));
}

export function fetchOneNode( node: Node ): Promise<NodeInformation[]> {
  return fetch(`${apiServer}/nodes/${node.id}`, fetchNodeInformationOptions)
    .then(rejectFetchFailures)
    .then(response => response.json())
    .then(({ information }) => information.map(node => ({
      type: node.type,
      timestamp: node.timestamp,
      latency: node.latency,
      coverage: node.coverage,
    })));
}
