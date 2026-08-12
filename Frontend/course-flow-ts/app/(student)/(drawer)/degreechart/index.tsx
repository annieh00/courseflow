import React from "react"
import { FlowchartProvider } from "./FlowchartContext"
import { FlowchartScreen } from "./FlowchartScreen"

export default function DegreeFlowchartEntry() {
  return (
    <FlowchartProvider>
      <FlowchartScreen />
    </FlowchartProvider>
  )
}