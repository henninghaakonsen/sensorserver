// @flow

import React, { Component } from 'react'
import { connectClass } from '../connect'
import { colors, shadow, fonts } from '../styles'
import type { Action } from '../actions'
import type { AppState } from '../types'
import type { Node } from '../types'
import AutoComplete from 'material-ui/AutoComplete';

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

class Search extends Component {
  props: {
    nodes: Node[],
    fetchNode: (node: Node) => void,
  }

  sourceIndex(query: string, data: any) {
    return data.indexOf(capitalizeFirstLetter(query))
  }

  selectResult(query: string, index: number) {
    let selection = index < 0 ?
      this.props.nodes[this.sourceIndex(query, this.props.nodes)] :
      this.props.nodes[index]

    if (selection) {
      this.props.fetchNode(selection)
    }
  }

  render() {
    return (
      <div style={{
        backgroundColor: 'white',
        boxShadow: shadow.downWards,
        paddingLeft: 20,
        zIndex: 2,
      }}>
        <AutoComplete
          dataSource={this.props.nodes}
          dataSourceConfig={{text: 'displayName', value: 'id'}}
          filter={AutoComplete.caseInsensitiveFilter}
          floatingLabelStyle={{color: colors.accent, fontSize: fonts.medium}}
          floatingLabelText="Search ..."
          fullWidth={true}
          maxSearchResults={10}
          onNewRequest={(chosenRequest, index) => this.selectResult(chosenRequest, index)}
          style={{width: '90%'}}
          underlineShow={false}
        />
      </div>
    )
  }
}

const Connected = connectClass(
  (state: AppState) => ({
    nodes: state.navigation.nodes,
  }),
  (dispatch: (action: Action) => void) => ({
    fetchNode: (node: Node) => dispatch(
      {type: 'NODE_QUERY_CLICKED', node: node}
    ),
  }),
  Search
)

export default Connected;
