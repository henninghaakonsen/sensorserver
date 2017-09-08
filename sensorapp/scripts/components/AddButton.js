import React from 'react';
import { connectClass } from '../connect'

import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';


const AddButton = ({level, addRequested}: {
  level: number,
  addRequested: () => void,
}) => {
  return (
  <div>
    { level === 4 &&
    <FloatingActionButton primary={true}
      onClick={ addRequested }>
      <ContentAdd />
    </FloatingActionButton>
    }
  </div>
  )
}

const Connected = connectClass(
  (state: AppState) => ({
    level: state.navigation.level,
  }),
  (dispatch: (action: Action) => void) => ({
    addRequested: () => dispatch({ type: 'ENABLE_FACILIY_CREATION' }),
  }), AddButton,
)


export default Connected;
