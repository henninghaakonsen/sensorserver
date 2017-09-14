// @flow

import React, { Component } from 'react'
import { connectClass } from '../connect'
import CircularProgress from 'material-ui/CircularProgress';

import Button from './Button';
import { colors, fonts } from '../styles'
import type { Action } from '../actions'
import type { AppState } from '../types'
import type { Node, NodeInformation } from '../types'

class Navigation extends Component {
  props: {
    nodes: Node[],
    selectedNode: Node,
    selectedNodeInformation: NodeInformation[],
    fetchingNodes: boolean,
    fetchNodes: () => void,
    fetchNode: (node: Node) => void,
  }

  state: {
  }

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    this.props.fetchNodes();
  }

  onClick(node: Node) {
    this.props.fetchNode(node)
  }

  render() {
    return (
      <div style={{
        textAlign: 'center',
        overflow: 'scroll',
        height: '100%',
      }}>
      <div style={{paddingTop: 20}} />

      { this.props.nodes &&
        <NodeList
          busy={this.props.fetchingNodes}
          onClick={(node) => this.onClick(node)}
          selectedId={this.props.selectedNode && this.props.selectedNode.id}
          nodes={this.props.nodes}
        />
      }
      </div>
    )
  }
}

const NodeList = ({busy, selectedId, onClick, nodes}: {
  busy: boolean,
  onClick: (node: NodeId) => void,
  selectedId?: string,
  nodes: Node[],
}) => {
  return (
    <div>
      <h2 style={{fontWeight: 400, fontSize: fonts.large}}/>
      { busy && <CircularProgress color={colors.accent}/>}
      <div style={{
        overflow: 'scroll',
      }}>
        { nodes.map(node =>
          <NodeUnit
            key= {node.id}
            onClick={() => onClick(node)}
            selected= {selectedId ? (node.id == selectedId) : false}
            node= {node}
          />
        )}
      </div>
    </div>
  )
}

const NodeUnit = ({node, onClick, selected}: {
  node: Node,
  onClick: () => void,
  selected?: boolean,
}) => {
  return (
    <div style={{marginTop: 4}}>
      <Button color="#841584"
              onClick={ selected ? doNothing : () => onClick()}
              text={ node.displayName }
              selected={ selected }/>
    </div>
  )
}

const doNothing = () => {}

const Connected = connectClass(
  (state: AppState) => ({
      nodes: state.navigation.nodes,
      selectedNode: state.navigation.selectedNode,
      fetchingNodes: state.navigation.fetchingNodes,
  }),
  (dispatch: (action: Action) => void) => ({
      fetchNodes: ( ) => dispatch({ type: 'NODES_FETCH_REQUESTED' }),
      fetchNode: (node: Node) => dispatch({ type: 'NODE_FETCH_REQUESTED', node }),
  }), Navigation
)

export default Connected;
