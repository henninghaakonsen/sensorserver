// @flow

import React from 'react'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import Header from '../components/Header'
import Navigation from '../components/Navigation'
import NodeInfoComponent from '../components/NodeInformation'
import Search from '../components/Search'
import theme from '../styles'

const App = () => {
  return (
    <MuiThemeProvider muiTheme={theme}>
      <div style={{height: '100vh', width: '100vw'}}>
        <Vertical>
          <SideBar>
            <Header />
            <Search />
            <Navigation />
          </SideBar>
          <Main>
            <NodeInfoComponent/>
          </Main>
        </Vertical>
      </div>
    </MuiThemeProvider>
  )
}

const Vertical = ({children}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      height: '100%',
    }}>
      { children }
    </div>
  )
}

const Main = ({children}) => {
  return (
    <div style={{
      height: '100%',
    }}>
      { children }
    </div>
  )
}

const SideBar = ({children}) => {
  return (
    <div style={{
      backgroundColor: '#f4f4f4',
      boxShadow: '0px 4px 8px #444444',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '20%',
      zIndex: 1,
    }}>
      { children }
    </div>
  )
}

export default App
