/**
 * Usage Example — drop this into your app's screen/entry point.
 *
 * The scheduler takes the full available space, so wrap it in
 * a SafeAreaView (or your own safe-area handling) as needed.
 */

import React from "react"
import { SafeAreaView, StatusBar, StyleSheet } from "react-native"
import {
  SchedulerProvider,
  SchedulerLayout,
} from "./components/scheduler"

export default function SmartSchedulerScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SchedulerProvider>
        <SchedulerLayout />
      </SchedulerProvider>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
})
