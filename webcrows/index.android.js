/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react'
import {
  AppRegistry,
  StyleSheet,
  Navigator,
  Text
} from 'react-native'

import Home from './app/screens/Home'
import Entity from './app/screens/Entity'
import Login from './app/screens/Login'
import styles from './app/styles/appStyles'


export default class webcrows extends Component {

  _renderScene(route, navigator) {
    var globalNavProps  = { navigator }

    switch(route.rt) {
      case "Login":
        return (
            <Login {...globalNavProps} />
          )

      case "Home":
        return (
            <Home {...globalNavProps}
             name={route.name}
            />
          )

      case "Entity":
        return (
            <Entity
              {...globalNavProps}
              element={route.element}
              name={route.name}
            />
          )

      case "Temp":
        return (
            <Text>{`a temp route..`}</Text>
          )

      default:
        return (
            <Home {...globalNavProps}
             name={route.name}
            />
          )
    }
  }

  render() {
    return (
      <Navigator
        initialRoute={{rt: "Login"}}
        ref="appNavigator"
        style={styles.navStyles}
        renderScene={ this._renderScene }
        configureScene={ (route) => ({
          ...route.sceneConfig || Navigator.SceneConfigs.FloatFromRight,
          gestures: route.gestures
        }) }
      />
    );
  }
}

AppRegistry.registerComponent('webcrows', () => webcrows);