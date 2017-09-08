// @flow

import React, { Component } from 'react'
import { connectClass } from '../connect'

import type { Action } from '../actions'
import type { Facility, AppState, Location } from '../types'
import { fonts, shadow } from '../styles'
import {orange500, blue500} from 'material-ui/styles/colors';

import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'
import Divider from 'material-ui/Divider';
import DatePicker from 'material-ui/DatePicker';

class EditPanel extends Component {
  props: {
    chiefdom: Facility,
    location: Location,
    show: boolean,
    edit: boolean,
    add: boolean,
    facility?: Facility,
    cancel: () => void,
    updateFacility: (facility: Facility) => void,
    addFacility: (facility: Facility) => void,
    noUpdate: () => void,
    requiredFieldsEmpty: () => void,
  }

  state: {
    open: boolean,
    name: string,
    description: string,
    comment: string,
    openingDate: string,
  }

  constructor(props) {
    super(props)
    this.state = {
      open: true,
      name: "",
      description: "",
      comment: "",
      openingDate: "",
    }
  }

  flushFields = () => {
    this.setState({
      name: "",
      description: "",
      comment: "",
      openingDate: "",
    })
  }

  changeName = (value: string) => {
    this.setState({ name : value })
  }

  changeDescription = (value: string) => {
    this.setState({ description : value })
  }

  changeComment = (value: string) => {
    this.setState({ comment : value })
  }

  changeDate = (value: string) => {
    this.setState({ openingDate : value })
  }

  handleRequestClose = () => {
    this.setState({
      open: false,
    })
  }

  componentWillReceiveProps = (nextProps) => {
    if(nextProps.edit !== this.props.edit && nextProps.edit){
      this.setState({
        open: true,
      })
    }
  }

  requiredFields = () => {
    return this.state.name && this.state.openingDate && this.markerPlacedOnMap()
  }

  markerPlacedOnMap = () => {
    return this.props.location.lng != 0 && this.props.location.lat != 0
  }

  changesWasMade = () => {
    return this.state.name || this.state.comment ||
           this.state.description || this.state.openingDate ||
           this.markerPlacedOnMap()
  }



  handleSave = () => {
    if (this.props.facility && this.changesWasMade()) {
      let facilityCoordinates = this.props.facility.coordinates
      const facility = {
        ...this.props.facility,
        shortName: this.state.name ? this.state.name : this.props.facility.displayName,
        displayName: this.state.name ? this.state.name : this.props.facility.displayName,
        name: this.state.name ? this.state.name : this.props.facility.displayName,
        comment: this.state.comment ? this.state.comment : this.props.facility.comment,
        description: this.state.description ? this.state.description : this.props.facility.description,
        coordinates: this.markerPlacedOnMap() ?
                     JSON.stringify([this.props.location.lng.toFixed(4), this.props.location.lat.toFixed(4)]) :
                     facilityCoordinates,
      }
      this.props.updateFacility(facility)
    } else {
      this.props.noUpdate()
    }
    this.handleCancel()
  }

  buildFacility() {
    const facility = {
        parent: {
          id: this.props.chiefdom.id,
        },
        id: '',
        level: 4,
        shortName: this.state.name,
        name: this.state.name,
        displayName: this.state.name,
        comment: this.state.comment,
        description: this.state.description,
        coordinates: JSON.stringify([this.props.location.lng.toFixed(4), this.props.location.lat.toFixed(4)]),
        openingDate: this.state.openingDate,
    }
    return facility
  }

  handleAdd = () => {
    if(this.requiredFields()){
      this.props.addFacility(this.buildFacility())
      this.handleCancel()
    }else{
      this.props.requiredFieldsEmpty()
    }
  }

  handleCancel = () => {
    this.flushFields()
    this.props.cancel()
  }

  render() {
    return (
      <div style={{zIndex: 2, backgroundColor: 'white'}}>
      { this.props.show  &&
        <div style={{
          boxShadow: shadow.upWards,
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 16,
          paddingTop: 23,
        }}>
          <Fields
            location={ this.props.location }
            facility={ this.props.facility }
            edit={ this.props.edit }
            changeName={ this.changeName }
            changeDescription={ this.changeDescription }
            changeComment={ this.changeComment }
            changeDate={ this.changeDate }
          />
          <Buttons
            add={ this.props.add }
            handleAdd={() => this.handleAdd() }
            handleSave={() => this.handleSave() }
            handleCancel={() => this.handleCancel() }
          />
        </div>
      }
      </div>
    )
  }
}

const styles = {
  errorStyle: {
    color: orange500,
  },
  underlineStyle: {
    borderColor: orange500,
  },
  floatingLabelStyle: {
    color: orange500,
  },
  floatingLabelFocusStyle: {
    color: blue500,
  },
};

const Field = ({text, onChange, multiLine}: {required?: boolean, multiLine?: boolean, text: string, onChange: (value:string) => void}) => (
  <div>
    <TextField
      style={{
        color: '#999999',
        fontWeight: '500',
        marginRight: 16,
        marginLeft: 16,
        marginTop: -8,
        marginBottom: -8,
        fontSize: fonts.small,
      }}
      hintText={text}
      onChange={(event, value) => onChange(value)}
      multiLine={multiLine}
      underlineShow={false}
      underlineFocusStyle={styles.underlineStyle}
    />
    <Divider/>
  </div>
)

const Date = ({onChange, text}:{text: string, onChange: (value: any) => void}) => (
  <div>
    <DatePicker
      textFieldStyle={{
        color: '#999999',
        fontWeight: '500',
        marginRight: 16,
        marginLeft: 16,
        marginTop: -8,
        marginBottom: -8,
        fontSize: fonts.small,
      }}
      hintText={text}
      mode="landscape"
      underlineShow={false}
      onChange={(event, value) => onChange(value)}
    />
    <Divider/>
  </div>
)

const Coords = ({text} : {text: string}) => (
  <div style={{
    display: 'flex',
    flexDirection: 'row',
    fontSize: fonts.small,
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 16,
    marginRight: 16,
  }}>
    <div style={{
      color: '#999999',
      fontWeight: '500',
      marginRight: 16,
    }}> COORDINATES: </div>
    <div style={{textAlign: 'right'}}> {text}</div>
  </div>
)

const Fields = ({location, facility, edit, changeDescription, changeName, changeComment, changeDate }: {
  facility?: Facility,
  location: Location,
  edit: boolean,
  changeName: (value: string) => void,
  changeDescription: (value: string) => void,
  changeComment: (value: string) => void,
  changeDate: (value: any) => void,
}) => {''
    return (
      <div>
        <Field
          text={edit && facility ? facility.name : "NAME *"}
          floatingLabelText="NAME"
          onChange={changeName}
        />
        <Field
          text= {"DESCRIPTION"}
          floatingLabelText="DESCRIPTION"
          multiLine={true}
          onChange={changeDescription}
        />
        <Field
          text= {"COMMENT"}
          floatingLabelText="COMMENT"
          multiLine={true}
          onChange={changeComment}
        />
        <Date
          text={edit && facility ? facility.openingDate : "OPENING DATE *"}
          onChange={changeDate}
        />
        <Coords
          text={
            edit && facility && (location.lat == 0 && location.lng == 0) && facility.coordinates ?
            facility.coordinates.substring(1, facility.coordinates.length - 1) :
            `${location.lng.toFixed(3)}, ${location.lat.toFixed(3)}`
          }
        />
        <Divider/>
      </div>
    )
}

const Buttons = ({add, handleCancel, handleSave, handleAdd}: {
  add: boolean,
  handleCancel: () => void,
  handleSave: () => void,
  handleAdd: () => void,
}) => {
  return (
    <div style={{
      display: 'flex',
      marginTop: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginLeft: 20,
      marginRight: 20,
    }}>
      <RaisedButton
        label="CANCEL"
        labelStyle={{fontSize: fonts.small}}
        secondary={true}
        onClick={handleCancel}
        style={{flex: '0.5', marginRight: 4}} />
      <RaisedButton
        label= { add ? "ADD" : "SAVE" }
        labelStyle={{fontSize: fonts.small}}
        primary={true}
        onClick={ add ? handleAdd : handleSave }
        style={{flex: '0.5'}} />
    </div>
  )
}

const Connected = connectClass(
  (state: AppState) => ({
    chiefdom: state.selected.chiefdom,
    selected: state.selected,
    location: state.lastClicked,
    show: state.editor.show,
    edit: state.editor.edit,
    add: state.editor.add,
    facility: state.selected.facility,
  }),
  (dispatch: (action: Action) => void) => ({
    updateFacility: (facility: Facility) => dispatch({ type: 'FACILITY_UPDATE_REQUESTED', facility }),
    addFacility: (facility: Facility) => dispatch({ type: 'FACILITY_ADD_REQUESTED', facility }),
    cancel: () => dispatch({ type: 'EXIT_EDITOR' }),
    noUpdate: () => dispatch({ type: 'EDIT_FIELDS_WERE_UNCHANGED' }),
    requiredFieldsEmpty: () => dispatch({ type: 'REQUIRED_FIELDS_EMPTY' }),
  }), EditPanel,
)

export default Connected;
