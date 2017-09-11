import React from 'react';
import { connectClass } from '../connect'

import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';


const AddButton = ({addRequested}: {
  addRequested: () => void,
}) => {
  return (
  <div>
    <FloatingActionButton
      onClick={ addRequested }>
      <ContentAdd />
    </FloatingActionButton>
  </div>
  )
}

const Connected = connectClass(
  (state: AppState) => ({
  }),
  (dispatch: (action: Action) => void) => ({
    addRequested: () => dispatch({ type: 'ENABLE_FACILIY_CREATION' }),
  }), AddButton,
)

export default Connected;
