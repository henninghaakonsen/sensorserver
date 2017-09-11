// @flow

import React from 'react'
import { connectClass } from '../connect'
import AddButton from './AddButton'
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

import LineChart from 'react-linechart';
import {Line} from 'react-chartjs-2';

import IconButton from 'material-ui/IconButton';
import DeleteIcon from 'material-ui-icons/Delete';

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

  _onRowSelection(key) {
    this.props.selectedRows.put(key)
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
      <div>
      { this.props.selectedNode &&
      <Tabs style={{height: '100vh', width: '80vw'}}>
        <Tab label="RAW DATA">
          <Table
            onRowSelection={this._onRowSelection}
            multiSelectable={true}>
            <TableHeader adjustForCheckbox={true}>
              <TableRow>
                <TableHeaderColumn>TYPE</TableHeaderColumn>
                <TableHeaderColumn>TIMESTAMP</TableHeaderColumn>
                <TableHeaderColumn>LATENCY</TableHeaderColumn>
                <TableHeaderColumn>COVERAGE</TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody >
              { this.props.selectedNodeInformation.map((nodeInformation, i) =>
                <TableRow key={i} value={nodeInformation}>
                  <TableRowColumn> {nodeInformation.type} </TableRowColumn>
                  <TableRowColumn> {nodeInformation.timestamp} </TableRowColumn>
                  <TableRowColumn> {nodeInformation.latency} </TableRowColumn>
                  <TableRowColumn> {nodeInformation.coverage} </TableRowColumn>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div style={{ position: "absolute", zIndex: 1, bottom: -150, right: 60}} >
            { this.props.selectedNode && <AddButton /> }
          </div>
        </Tab>
        <Tab label="GRAPH OVERVIEW">
          <Line data={latencyData} />
          <Line data={coverageData} />
        </Tab>
      </Tabs>
      }

      </div>
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


  /*<div style={{position: "absolute", left: 50}}>
    <LineChart id='latencyChart' height='400' width='600' data={latencyData} xLabel="Timeline" yLabel="Seconds" pointRadius='2'/>
  </div>

  <div style={{position: "absolute", right: 50}}>
    <LineChart id='coverageChart' height='400' width='600' data={coverageData} xLabel="Timeline" yLabel="- Db" pointRadius='2' yMin='-120' yMax='0' />
  </div>*/
