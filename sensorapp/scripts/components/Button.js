// @flow

import React from 'react'
import { colors, fonts } from '../styles'

class Button extends React.Component {
  props: {
    text: string,
    onClick: () => void,
  }

  state: {
    pressed: boolean,
    hover: boolean,
  }

  constructor(props: any) {
    super(props)
    this.state = {
      pressed: false,
      hover: false,
    }
  }

  getBackgroundColor() {
    if (this.props.selected) {
      return this.state.pressed ?
        colors.accentLighter : colors.accent
    } else {
      return this.state.pressed ?
        colors.wetasphalt : this.state.hover ?
          colors.grayLight : colors.gray
    }
  }

  render() {
    return (
      <div
        onClick={() => this.props.onClick()}
        onMouseDown={() => this.setState({pressed: true})}
        onMouseEnter={() => this.setState({hover: true})}
        onMouseLeave={() => this.setState({hover: false, pressed: false})}
        onMouseUp={() => this.setState({pressed: false})}
        style={{
          alignItems: 'center',
          backgroundColor: this.getBackgroundColor(),
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          fontSize: fonts.large,
          fontWeight: 600,
          height: 40,
          justifyContent: 'flex-start',
          paddingLeft: 20,
          textAlign: 'center',
          userSelect: 'none',
        }}>
        { this.props.text.toUpperCase() }
      </div>
    )
  }
}

export default Button
