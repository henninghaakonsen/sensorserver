// @flow

import { call, put, take, fork } from 'redux-saga/effects'
import type { Action } from '../actions'
import type { Node } from '../types'

import {
  fetchNodeList,
  fetchOneNode,
} from '../api'

export function typedAction(action: any): Action {
  return action
}

function* fetchNodes() {
  try {
    const nodes = yield call(fetchNodeList)
    yield put({type: 'NODES_FETCH_SUCCEEDED', nodes})
  } catch (e) {
    yield put({type: 'NODES_FETCH_FAILED', message: e.message})
  }
}

function* fetchNode(node: Node) {
  try {
    const nodeInformation = yield call(fetchOneNode, node)
    yield put({type: 'NODE_FETCH_SUCCEEDED', nodeInformation})
  } catch (e) {
    yield put({type: 'NODE_FETCH_FAILED', message: e.message})
  }
}

function* nodeQueryClicked(node: Node) {
  try {
    yield put({type: 'NODE_SELECTED', node})
    const nodeInformation = yield call(fetchOneNode, node)
    yield put({type: 'NODE_FETCH_SUCCEEDED', nodeInformation})
  } catch (e) {
    yield put({type: 'NODE_FETCH_FAILED', message: e.message})
  }
}

function* handleRequests(): Generator<*,*,*> {
  while (true) {
    const action = typedAction(yield take())
    switch (action.type) {
      case 'NODES_FETCH_REQUESTED': yield fork(fetchNodes); break
      case 'NODE_FETCH_REQUESTED': yield fork(fetchNode, action.node); break
      case 'NODE_QUERY_CLICKED': yield fork(nodeQueryClicked, action.node); break
    }
  }
}

export default function* app(): Generator<*,*,*> {
  yield call(handleRequests)
}
