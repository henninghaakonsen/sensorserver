// @flow

import React, { Component } from 'react'
import { connect } from 'react-redux'

import { Map, GoogleApiWrapper} from 'google-maps-react'
import { colors } from '../styles'

import type { AppState } from '../types.js'
import type { Action } from '../actions.js'

let googleMap = undefined
let mapClickedMarker = undefined
let polygons = []
let countryDefinedZoom = 7

let markers = []

let handler = ''

let componentShouldUpdate:boolean = false
class MapComponent extends Component {
  props: {
    facilities: any,
    selected: any,
    navigationLvl: number,
    google: any,
    editor: any,
    addNewFacility: () => void,
    clickHandler: (location: any) => void,
    selectedUnit: (id: string) => void,
  }

  componentDidUpdate() {
    if(componentShouldUpdate == true) {
      this.updateMap()
      componentShouldUpdate = false;
      handler = ''
    }
  }

  componentWillReceiveProps(nextProps) {
    if(this.props.navigationLvl > nextProps.navigationLvl) {
      this.clearMarkers()
      switch (nextProps.navigationLvl-1) {
        case 0:
          googleMap && googleMap.setZoom(3)
          googleMap && googleMap.setCenter({lat: 0, lng: 0})
          break
        case 1:
          handler = 'HANDLE_COUNTRY'
          break
        case 2:
          handler = 'HANDLE_DISTRICT'
          break
        default:
          console.warn('Unknown level in componentWillReceiveProps, navigationLvl of nextProps: ' + nextProps.navigationLvl + ', navigationLvl of this.props: ' + this.props.navigationLvl)
          break
      }
    } else {
      if(nextProps.selected.country !== this.props.selected.country) {
        handler = 'HANDLE_COUNTRY'
      } else if(nextProps.selected.district !== this.props.selected.district) {
        handler = 'HANDLE_DISTRICT'
      } else if(nextProps.facilities !== this.props.facilities) {
        // When facilities is loaded we can display the new chiefdom and the markers within this chiefdom
        handler = 'HANDLE_CHIEFDOM'
      } else if(nextProps.selected.facility !== this.props.selected.facility) {
        handler = 'HANDLE_FACILITY'
      }
    }

    if(handler != '') componentShouldUpdate = true
    if(mapClickedMarker != undefined) {
      mapClickedMarker.setMap(null)
      this.props.clickHandler({lat: 0, lng: 0})
      mapClickedMarker = undefined
    }

    if((handler != 'HANDLE_FACILITY') && polygons && !(nextProps.editor != this.props.editor)) {
      polygons.map(polygon => polygon.polyArea.setMap(null))
      polygons = []
    }
  }

  handlePolygon(areaObject) {
    let polygonStrings = areaObject.coordinates.substring(3, areaObject.coordinates.length-3).split("]],[[");

    const google = this.props.google
    for(let i=0; i<polygonStrings.length; i++){
      let polygonCoordinates = '[' + polygonStrings[i] + ']';
      polygonCoordinates = JSON.parse(polygonCoordinates)

      let poly = []
      let bounds = new google.maps.LatLngBounds();
      polygonCoordinates.map(polygonCoordinate => {
        let LatLng = new google.maps.LatLng(polygonCoordinate[1], polygonCoordinate[0])
        poly.push(LatLng)
        bounds.extend(LatLng);
      })

      // Construct the polygon/polyline.
      let polyArea = new google.maps.Polygon({
        paths: poly,
        strokeColor: colors.region,
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: colors.region,
        fillOpacity: 0.3,
      })

      googleMap && googleMap.addListener('zoom_changed', function() {
        if(googleMap && googleMap.getZoom() > 13) polyArea.setOptions({fillOpacity: 0})
        else polyArea.setOptions({fillOpacity: 0.2})
      })

      const self = this
      polyArea.addListener('click', function(e) {
        if(self.props.navigationLvl == 4) {
          if(self.props.editor.edit || self.props.editor.add) {
            self.props.clickHandler({lat: e.latLng.lat(), lng: e.latLng.lng()})

            if(mapClickedMarker != null) mapClickedMarker.setMap(null)

            mapClickedMarker = new google.maps.Marker({
              position: e.latLng,
              map: googleMap,
              icon: {
                path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0',
                fillColor: colors.accentLight,
                fillOpacity: 1,
                strokeColor: colors.accent,
                strokeWeight: 2,
                scale: 1,
              },
            })
          }
        }
      })

      polyArea.setMap(googleMap)
      googleMap && googleMap.fitBounds(bounds)
      polygons.push({polyArea})
    }
  }

  showInfoPanel(facilityId: string) {
    markers.map(marker => {
      if(marker.facilityId == facilityId) marker.infoWindow.open(googleMap, marker)
      else marker.infoWindow.close()
    })
  }

  showMarkers() {
    markers.map(marker => marker.setMap(googleMap))
  }

  hideMarkers() {
    markers.map(marker => marker.setMap(null))
  }

  clearMarkers() {
    this.hideMarkers()
    markers = []
  }

  handleMarkers() {
    this.clearMarkers()
    this.props.facilities.map(facility => {
      if (!facility.coordinates) { return }

      const google = this.props.google
      let markerCoordinates = facility.coordinates
      markerCoordinates = JSON.parse(markerCoordinates)
      let markerLocation = new google.maps.LatLng(markerCoordinates[1], markerCoordinates[0])

      let infowindow = new google.maps.InfoWindow({
        content: facility.displayName,
      })

      var newMarker = new google.maps.Marker({
        position: markerLocation,
        map: googleMap,
        infoWindow: infowindow,
        facilityId: facility.id,
      })

      newMarker.addListener('dblclick', function() {
        googleMap && googleMap.setZoom(Math.round(googleMap && googleMap.getZoom()*1.25))
        googleMap && googleMap.setCenter(newMarker.getPosition())
      })

      const self = this
      newMarker.addListener('click', function() {
        self.props.selectedUnit(facility.id)
        self.showInfoPanel(facility.id)
      })

      newMarker.setMap(googleMap)
      markers.push(newMarker)
    })
  }

  handleCountry() {
    const google = this.props.google

    // Get lat and lng from country name
    let geocoder = new google.maps.Geocoder

    let address = this.props.selected.country.name
    let success = false
    geocoder.geocode( { 'address': address}, success = function(results, status) {
      if (status == 'OK') {
        googleMap && googleMap.setCenter(results[0].geometry.location)
        return true
      } else {
        alert('Geocode was not successful for the following reason: ' + status)
      }
    })
    if(success) googleMap && googleMap.setZoom(countryDefinedZoom)
  }

  updateMap(mapProps, map) {
    // Get map variable first time 'updateMap' is called from onReady function of Map component
    if(map != undefined) {
      googleMap = map
      return
    }

    switch (handler) {
      case 'HANDLE_COUNTRY':
        this.handleCountry()
        break
      case 'HANDLE_DISTRICT':
        switch (this.props.selected.district.featureType) {
          case 'POLYGON':
            this.handlePolygon(this.props.selected.district)
            break
          case 'MULTI_POLYGON':
            this.handlePolygon(this.props.selected.district)
            break
          default:
            console.warn('Unknown featureType for district')
            break
        }
        break
      case 'HANDLE_CHIEFDOM':
        switch (this.props.selected.chiefdom.featureType) {
          case 'POLYGON':
            this.handlePolygon(this.props.selected.chiefdom)
            break
          case 'MULTI_POLYGON':
            this.handlePolygon(this.props.selected.chiefdom)
            break
          default:
            console.warn('Unknown featureType for chiefdom')
            break
        }

        this.handleMarkers()
        if(this.props.selected.facility) this.showInfoPanel(this.props.selected.facility.id)
        break
      case 'HANDLE_FACILITY':
        this.showInfoPanel(this.props.selected.facility.id)
        break
      default:
        console.warn('Unknown handler type: \'' + handler + '\'')
        break
    }
  }

  render() {
    return (
      <Map google={this.props.google}
        onClick={!(this.props.editor.add || this.props.editor.edit) ? false : this.props.addNewFacility}
        onReady={this.updateMap}
        style={{width: '100%', height: '100%', zIndex: 0}}
        containerStyle={{width: '80vw'}}
        zoom={3}
        initialCenter={{lat: 0, lng: 0}}>
      </Map>
    )
  }
}

const Connected = connect(
  (state: AppState) => ({
    facilities: state.facilities,
    selected: state.selected,
    navigationLvl: state.navigation.level,
    editor: state.editor,
  }),
  (dispatch: (action: Action) => void) => ({
    clickHandler: (location: any) => dispatch({ type: 'MAP_WAS_CLICKED', location}),
    selectedUnit: (id: string) => dispatch({ type: 'UNIT_WAS_SELECTED', id }),
    addNewFacility: () => dispatch({ type: 'CLICKED_OUTSIDE_CHIEFDOM' }),
  })
)(MapComponent)

export default GoogleApiWrapper({
  apiKey: 'AIzaSyBEnc2AvvbEhxmyXY8e2sAjCqCKXVh3bVQ',
})(Connected)
