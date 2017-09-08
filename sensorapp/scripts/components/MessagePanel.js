// @flow

import React from 'react'
import { connectClass } from '../connect'

import SnackBar from 'material-ui/SnackBar';
import type { Action } from '../actions'
import type { AppState } from '../types'
import { colors } from '../styles'

const MessagePanel = ({message, hostile, hideMessage}: {
  message: string,
  hostile: boolean,
  hideMessage: () => void,
}) => (
  <div>
    <SnackBar
      open={message ? true : false}
      message={message || ''}
      autoHideDuration={4000}
      onActionTouchTap={() => hideMessage()}
      onRequestClose={() => hideMessage()}
      contentStyle={{color: hostile ? colors.warning : 'white'}}
    />
  </div>
)

const Connected = connectClass(
  (state: AppState) => ({
    message: state.messages.message,
    hostile: state.messages.hostile,
  }),
  (dispatch: (action: Action) => void) => ({
    hideMessage: () => dispatch({type: 'HIDE_MESSAGE'}),
  }), MessagePanel,
)

export default Connected;
