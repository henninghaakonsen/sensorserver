// @flow

import React from 'react'
import { connectClass } from '../connect'
import type { Node, NodeInformation } from '../types'

import {Tabs, Tab} from 'material-ui/Tabs';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';

const styles = {
  headline: {
    fontSize: 24,
    paddingTop: 16,
    marginBottom: 12,
    fontWeight: 400,
  },
};

class NodeInfoComponent extends React.Component {
  props: {
    nodes: Node[],
    selectedNode: Node,
    selectedNodeInformation: NodeInformation[],
  };

  state: {
  }

  constructor(props: any) {
    super(props)
    this.state = {
    }
  }

  render() {
    return (
      <Tabs style={{height: '100vh', width: '80vw'}}>
        <Tab label="RAW DATA">
          <Table multiSelectable={true}>
            <TableHeader enableSelectAll={false} adjustForCheckbox={true} displaySelectAll={false}>
              <TableRow>
                <TableHeaderColumn>TYPE</TableHeaderColumn>
                <TableHeaderColumn>TIMESTAMP</TableHeaderColumn>
                <TableHeaderColumn>COVERAGE</TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody >
              { this.props.selectedNodeInformation.map(nodeInformation =>
                <TableRow displayRowCheckbox={false}>
                  <TableRowColumn> {nodeInformation.type} </TableRowColumn>
                  <TableRowColumn> {nodeInformation.timestamp} </TableRowColumn>
                  <TableRowColumn> {nodeInformation.coverage} </TableRowColumn>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Tab>
        <Tab label="GRAPH OVERVIEW">
          <div>graph with uptime and coverage</div>
        </Tab>
      </Tabs>
    )
  }
}

const Connected = connectClass(
  (state: AppState) => ({
    nodes: state.navigation.nodes,
    selectedNode: state.navigation.selectedNode,
    selectedNodeInformation: state.navigation.selectedNodeInformation,
  }),
  (dispatch: (action: Action) => void) => ({
  }), NodeInfoComponent
)

export default Connected
