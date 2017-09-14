// @flow

import React from 'react'
import { colors } from '../styles'

const Header = () => {
  return (
    <div style={{
      alignItems: 'center',
      backgroundColor: colors.accent,
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      fontSize: 20,
      fontWeight: 200,
      height: 50,
      justifyContent: 'center',
      minHeight: 50,
      textShadow: '1px 1px 5px #888888',
      userSelect: 'none',
      zIndex: 2,
    }}>
      Sensor APP
    </div>
  )
}

export default Header
