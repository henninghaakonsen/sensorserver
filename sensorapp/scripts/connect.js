/*
 * Wrapper functions for the redux connect function. These functions are needed
 * in order to let flow type check the usage of a component against said
 * components actual parameters.
 *
 * @flow
 */

import React from 'react'
import { connect as reduxConnect } from 'react-redux'
import type { Action } from './actions'
import type { AppState } from './types'

export function connect<ComponentAttributes, ComponentActions>(
  mapStateToProps: (state: AppState) => ComponentAttributes,
  mapDispatchToProps: (dispatch: (action: Action) => void) => ComponentActions,
  component: (props: ComponentAttributes & ComponentActions) => React.Element<*>,
) {
  return reduxConnect(mapStateToProps, mapDispatchToProps)(component)
}

export function connectClass<ComponentAttributes, ComponentActions, Component: React$Component<*,ComponentAttributes & ComponentActions,*>>(
  mapStateToProps: (state: AppState) => ComponentAttributes,
  mapDispatchToProps: (dispatch: (action: Action) => void) => ComponentActions,
  component: Class<Component>,
) {
  return reduxConnect(mapStateToProps, mapDispatchToProps)(component)
}
