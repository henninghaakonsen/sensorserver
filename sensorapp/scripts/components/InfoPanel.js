// @flow

import React, { Component } from 'react'
import { connectClass } from '../connect'

import Divider from 'material-ui/Divider'
import Dialog from 'material-ui/Dialog';
import RaisedButton from 'material-ui/RaisedButton'
import FlatButton from 'material-ui/FlatButton'

import type { Action } from '../actions'
import type { AppState, Facility } from '../types'
import { colors, shadow, fonts } from '../styles'

const defaultInfo = {
  description: 'No description.',
  comment: 'No comment.',
}

class InfoPanel extends Component {
  props: {
    facility?: Facility,
    editing: boolean,
    level: number,
    enableEditing: () => void,
    deleteFacility: (facility: Facility) => void,
  }

  state: {
    info: any,
    confirmDeletion: boolean,
  }

  parseDate(date: string) {
    try {
      return date.substring(0, date.indexOf('T')).replace('-', '.')
    } catch(e) {
      return "2016-08-10"
    }
  }

  buildInfo(facility: Facility) {
    return {
      full_name: facility.name,
      opening_date: this.parseDate(facility.openingDate),
      coordinates: facility.coordinates &&
        facility.coordinates.substring(1, facility.coordinates.length - 1),
      api_link: facility.href,
      description: facility.description || defaultInfo.description,
      comment: facility.comment || defaultInfo.comment,
    }
  }

  toggleConfirmDeletion = () => {
    const toggled = !this.state.confirmDeletion
    this.setState({confirmDeletion: toggled});
  }

  confirmDeletion = () => {
    this.toggleConfirmDeletion()
    this.props.facility && this.props.deleteFacility(this.props.facility)
  }

  constructor(props) {
    super(props)
    this.state = {
      info: null,
      confirmDeletion: false,
    }
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.facility !== this.props.facility && nextProps.facility) {
      this.setState({
        info: this.buildInfo(nextProps.facility),
      })
    }
  }

  render() {
    return (
      <div style={{zIndex: 2, backgroundColor: 'white'}}>
        { !this.props.editing && this.props.facility && this.props.level > 3 &&
          <div style={{
            boxShadow: shadow.upWards,
            display: 'flex',
            flexDirection: 'column',
            paddingVertical: 20,
            paddingBottom: 16,
          }}>
            { Object.keys(this.state.info).map((info, index) =>
              <div key={-1 - index}>
                <Info key={info} entity={info} value={this.state.info[info] || 'Unknown'} />
                <Divider key={index} />
              </div>
            )}
            <div style={{
              display: 'flex',
              marginTop: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginLeft: 20,
              marginRight: 20,
            }}>
              <RaisedButton
                label="Delete"
                labelStyle={{fontSize: fonts.small}}
                secondary={true}
                onClick={this.toggleConfirmDeletion}
                style={{flex: '0.5', marginRight: 4}} />
              <RaisedButton
                label="Edit"
                labelStyle={{fontSize: fonts.small}}
                primary={true}
                onClick={this.props.enableEditing}
                style={{flex: '0.5'}} />
              <DialogPopup
                name={this.state.info.full_name}
                open={this.state.confirmDeletion}
                cancel={this.toggleConfirmDeletion}
                confirm={this.confirmDeletion} />
              </div>
          </div>
        }
      </div>
    )
  }
}

const DialogPopup = ({name, open, cancel, confirm}) => (
  <Dialog
    title={"Are you sure you want to delete " + name + "?"}
    actions={[
      <FlatButton
        label="Cancel"
        primary={true}
        onClick={() => cancel()}
      />,
      <FlatButton
        label="Delete"
        primary={true}
        onClick={() => confirm()}
      />,
    ]}
    modal={false}
    open={open}
    onRequestClose={() => cancel()}
  />
)

const Info = ({entity, value}: {
  entity: string,
  value: string,
}) => (
  <div style={{
    display: 'flex',
    flexDirection: 'row',
    fontSize: fonts.small,
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 20,
    marginRight: 20,
    justifyContent: 'space-between',
  }}>
    <InfoTag text={entity} />
    <InfoValue value={value} link={entity === 'api_link'} />
  </div>
)

const InfoTag = ({text}: {text: string}) => (
  <div style={{
    color: '#999999',
    fontWeight: '500',
    marginRight: 16,
  }}>
    {text.toUpperCase().replace('_', ' ')}
  </div>
)

const InfoValue = ({value, link}: {value: string, link: boolean}) => (
  <div style={{textAlign: 'right'}}>{
    link ?
      <a target="_blank"
         style={{textDecoration: 'none', color: colors.accent}}
         href={value}>{value.split('/').pop()}
      </a> : value
  }</div>
)

const Connected = connectClass(
  (state: AppState) => ({
    facility: state.selected.facility,
    editing: state.editor.show,
    level: state.navigation.level,
  }),
  (dispatch: (action: Action) => void) => ({
    enableEditing: () => dispatch({ type: 'ENABLE_FACILITY_EDITING' }),
    deleteFacility: (facility: Facility) => dispatch({ type: 'FACILITY_DELETION_REQUESTED', facility }),
  }), InfoPanel,
)

export default Connected;
