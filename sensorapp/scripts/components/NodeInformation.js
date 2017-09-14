// @flow

import React from 'react'
import { connectClass } from '../connect'
import type { Node, NodeInformation } from '../types'

import { colors } from '../styles'
import {Tabs, Tab} from 'material-ui/Tabs';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';

import {Line} from 'react-chartjs-2';

class NodeInfoComponent extends React.Component {
  props: {
    nodes: Node[],
    selectedNode: Node,
    selectedNodeInformation: NodeInformation[],
    selectedRows: number[],
  };

  state: {
  }

  constructor(props: any) {
    super(props)
    this.state = {
    }
  }

  render() {
    let latencyPoints = []
    let latencyLabels = []
    this.props.selectedNodeInformation.map((nodeInformation, i) => {
      latencyLabels[i] = i
      latencyPoints[i] = nodeInformation.latency
    })

    const latencyData = {
      labels: latencyLabels,
      datasets: [
        {
          label: 'Latency',
          type: 'line',
          fill: false,
          lineTension: 0.1,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(75,192,192,1)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(75,192,192,1)',
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: latencyPoints,
        },
      ],
    };

    let coveragePoints = []
    let coverageLabels = []
    let index = 0
    this.props.selectedNodeInformation.map(nodeInformation => {
      if(nodeInformation.type == 'coverage') {
        coverageLabels[index] = index
        coveragePoints[index++] = nodeInformation.coverage
      }
    })

    const coverageData = {
      labels: coverageLabels,
      datasets: [
        {
          label: 'Coverage',
          type: 'line',
          fill: false,
          lineTension: 0.1,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(75,192,192,1)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(75,192,192,1)',
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: coveragePoints,
        },
      ],
    };

    return (
      this.props.selectedNode &&
      <Tabs style={{height: '100vh', width: '80vw', overflowY: 'scroll'}}>
        <Tab label="RAW DATA" style={{height: 50, backgroundColor: colors.accentLight}}>
          <Table
            multiSelectable={true}
            >
            <TableHeader adjustForCheckbox={true}>
              <TableRow>
                <TableHeaderColumn>TIMESTAMP</TableHeaderColumn>
                <TableHeaderColumn>TYPE</TableHeaderColumn>
                <TableHeaderColumn>LATENCY</TableHeaderColumn>
                <TableHeaderColumn>COVERAGE</TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody>
              { this.props.selectedNodeInformation.map((nodeInformation, i) =>
                <TableRow key={i} value={nodeInformation}>
                  <TableRowColumn> {nodeInformation.timestamp} </TableRowColumn>
                  <TableRowColumn> {nodeInformation.type} </TableRowColumn>
                  <TableRowColumn> {nodeInformation.latency} </TableRowColumn>
                  <TableRowColumn> {nodeInformation.coverage} </TableRowColumn>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Tab>
        <Tab label="GRAPH OVERVIEW" style={{height: 50, backgroundColor: colors.accentLight}}>
          <Line data={latencyData} width={40} height={10}
                options={{maintainAspectRatio: true}}/>
          <Line data={coverageData} width={40} height={10}
                options={{maintainAspectRatio: true}}/>
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
  }), (dispatch: (action: Action) => void) => ({
  }), NodeInfoComponent
)

export default Connected
