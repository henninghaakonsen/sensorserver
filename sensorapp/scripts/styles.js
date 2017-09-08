// @flow

import getMuiTheme from 'material-ui/styles/getMuiTheme';

export const colors = {
  primary: '#FC4482',
  primaryDark: '#1976D2',
  accent: '#2E86C1',
  accentLight: '#3993d0',
  accentLighter: '#4d9ed5',
  region: '#FC4482',

  wetasphalt: "34495e",
  midnightblue: "2c3e50",

  dark: '#444444',
  gray: '#CCCCCC',
  grayLight: '#DDDDDD',
  grayLighter: '#EEEEEE',
  warning: 'red',
}

export const shadow = {
  downWards: '0px 2px 8px #AAAAAA',
  upWards: '0px -2px 8px #AAAAAA',
}

export const fonts = {
  small: 11,
  medium: 13,
  large: 14,
}

const theme = getMuiTheme({
  palette: {
    primary1Color: colors.primary,
    primary2Color: colors.primary,
    accent1Color: colors.accent,
  },
});

export default theme
