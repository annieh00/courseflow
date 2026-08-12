import React, { useMemo } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native'
import Svg, {
  Rect,
  Polygon,
  Path,
  Defs,
  Marker,
  G,
  Text as SvgText,
} from 'react-native-svg'
import {
  X,
  GraduationCap,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react-native'
import { useFlowchart } from './FlowchartContext'
import type { DegreeProgram } from './degree-programs'


// ── App palette (ISU) ─────────────────────────────────────────

const RED    = '#C8102E'
const GOLD   = '#F1BE48'
const GREEN  = '#1A7F4B'


// ── Layout constants ──────────────────────────────────────────
const NW = 72   // node width
const NH = 32   // node height
const HG = 10   // horizontal gap between nodes
const RH = 84   // vertical row height per semester
const CP = 20   // canvas padding

// ── Node colours (ISU palette) ────────────────────────────────
const COLS = {
  completed:  { bg: GREEN,  stroke: '#15803D', text: '#ffffff' },
  inProgress: { bg: GOLD,   stroke: '#D4A017', text: '#78350F' },
  remaining:  { bg: '#F1F5F9', stroke: '#CBD5E1', text: '#64748B' },
}

type Status = 'completed' | 'inProgress' | 'remaining'

interface GNode {
  id: string
  label: string
  title: string
  credits: number
  semester: number
  x: number
  y: number
  status: Status
}

interface GEdge { from: string; to: string }

const CODE_RX = /\b([A-Z]{2,6}\s+\d{3,4})\b/g

function parseCodes(s: string): string[] {
  const out: string[] = []
  let m: RegExpExecArray | null
  CODE_RX.lastIndex = 0
  while ((m = CODE_RX.exec(s)) !== null) out.push(m[1])
  return out
}


function buildGraph(
  program: DegreeProgram,
  done: Set<string>,
  wip: Set<string>,
): { nodes: GNode[]; edges: GEdge[]; cW: number; cH: number } {
  const info = new Map<string, {
    sem: number; title: string; credits: number; prereqs: string[]
  }>()

  for (const sem of program.semesters) {
    for (const item of sem.items) {
      if (item.kind === 'course') {
        info.set(item.course.code, {
          sem: sem.number,
          title: item.course.title,
          credits: item.course.credits,
          prereqs: item.course.prerequisites ?? [],
        })
      }
    }
  }

  const bySem = new Map<number, string[]>()
  for (const [code, d] of info) {
    if (!bySem.has(d.sem)) bySem.set(d.sem, [])
    bySem.get(d.sem)!.push(code)
  }

  const maxRow = Math.max(...[...bySem.values()].map(a => a.length), 1)
  const cW = maxRow * (NW + HG) - HG + CP * 2
  const cH = program.semesters.length * RH + NH + CP * 2

  const nodes: GNode[] = []
  for (const [semNum, codes] of bySem) {
    const rowW = codes.length * NW + (codes.length - 1) * HG
    const startX = (cW - rowW) / 2
    const y = CP + (semNum - 1) * RH
    codes.forEach((code, i) => {
      const d = info.get(code)!
      let status: Status = 'remaining'
      if (done.has(code)) status = 'completed'
      else if (wip.has(code)) status = 'inProgress'
      nodes.push({
        id: code,
        label: code,
        title: d.title,
        credits: d.credits,
        semester: semNum,
        x: startX + i * (NW + HG),
        y,
        status,
      })
    })
  }

  const known = new Set(info.keys())
  const seen = new Set<string>()
  const edges: GEdge[] = []
  for (const [code, d] of info) {
    for (const prereqStr of d.prereqs) {
      for (const pc of parseCodes(prereqStr)) {
        if (known.has(pc) && pc !== code) {
          const key = `${pc}>${code}`
          if (!seen.has(key)) { seen.add(key); edges.push({ from: pc, to: code }) }
        }
      }
    }
  }

  return { nodes, edges, cW, cH }
}


interface Props {
  visible: boolean
  onClose: () => void
  program: DegreeProgram
}

export function PrerequisiteGraphModal({ visible, onClose, program }: Props) {
  const {
    completedCourses,
    inProgressCourses,
    getCompletedCredits,
    getProgressPercent,
  } = useFlowchart()

  const { nodes, edges, cW, cH } = useMemo(
    () => buildGraph(program, completedCourses, inProgressCourses),
    [program, completedCourses, inProgressCourses],
  )

  const byId = useMemo(() => {
    const m = new Map<string, GNode>()
    nodes.forEach(n => m.set(n.id, n))
    return m
  }, [nodes])

  const completedCredits   = getCompletedCredits(program)
  const inProgressCredits  = nodes.filter(n => n.status === 'inProgress').reduce((sum, n) => sum + n.credits, 0)
  const pct                = getProgressPercent(program)

  const recommended = useMemo(() =>
    nodes.filter(n => {
      if (n.status !== 'remaining') return false
      const incoming = edges.filter(e => e.to === n.id)
      return incoming.every(e => byId.get(e.from)?.status === 'completed')
    }).slice(0, 6),
    [nodes, edges, byId],
  )

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.backdrop}>
      <View style={styles.popup}>


        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <GraduationCap size={20} color="#ffffff" strokeWidth={2} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.headerTitle}>Degree Progress</Text>
              <Text style={styles.headerSub}>{program.program} · {program.institution}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>


        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            icon={<CheckCircle2 size={14} color={GREEN} />}
            label="COMPLETED"
            value={`${completedCredits} cr`}
            color={GREEN}
          />
          <StatCard
            icon={<Clock size={14} color="#D97706" />}
            label="IN PROGRESS"
            value={`${inProgressCredits} cr`}
            color="#D97706"
          />
          <StatCard
            icon={<GraduationCap size={14} color={RED} />}
            label="CREDITS"
            value={`${completedCredits}/${program.totalCredits}`}
            color={RED}
          />
        </View>

        {/* Progress bar */}
        <View style={styles.progressWrap}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={styles.progressPct}>{pct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
          </View>
        </View>


        {/* Two-panel layout */}
        <View style={styles.panels}>

          {/* Left — SVG prerequisite graph */}
          <View style={styles.graphPanel}>
            <Text style={styles.panelTitle}>Prerequisite Chain Visualization</Text>
            <View style={styles.legendRow}>
              <LegDot color={GREEN} label="Completed" />
              <LegDot color={GOLD}  label="In Progress" />
              <LegDot color="#CBD5E1" label="Remaining" />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.graphScroll}>
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                <Svg width={cW} height={cH}>
                  <Defs>

                    <Marker
                      id="graphArrow"
                      markerWidth="7"
                      markerHeight="7"
                      refX="6"
                      refY="3"
                      orient="auto"
                    >
                      <Path d="M0,0 L0,6 L7,3 z" fill="#CBD5E1" />
                    </Marker>
                  </Defs>


                  {/* Edges */}
                  {edges.map((e, i) => {
                    const a = byId.get(e.from)
                    const b = byId.get(e.to)
                    if (!a || !b) return null
                    const x1 = a.x + NW / 2
                    const y1 = a.y + NH
                    const x2 = b.x + NW / 2
                    const y2 = b.y
                    const my = (y1 + y2) / 2

                    const edgeColor = a.status === 'completed'
                      ? 'rgba(26,127,75,0.35)'
                      : a.status === 'inProgress'
                        ? 'rgba(241,190,72,0.5)'
                        : 'rgba(203,213,225,0.7)'
                    return (
                      <Path
                        key={i}
                        d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`}
                        stroke={edgeColor}
                        strokeWidth="1.5"
                        fill="none"
                        markerEnd="url(#graphArrow)"
                      />
                    )
                  })}

                  {nodes.map(n => {
                    const col = COLS[n.status]
                    const cx = n.x + NW / 2
                    const cy = n.y + NH / 2
                    const lbl = n.label.length > 11 ? n.label.slice(0, 10) + '…' : n.label

                    if (n.status === 'inProgress') {
                      return (
                        <G key={n.id}>
                          <Polygon
                            points={`${cx},${n.y} ${n.x + NW},${cy} ${cx},${n.y + NH} ${n.x},${cy}`}
                            fill={col.bg}
                            stroke={col.stroke}
                            strokeWidth="1.5"
                          />

                          <SvgText
                            x={cx}
                            y={cy + 1}
                            textAnchor="middle"
                            fontSize={8}
                            fontWeight="bold"
                            fill={col.text}
                          >

                            {lbl}
                          </SvgText>
                        </G>
                      )
                    }


                    const rx = n.status === 'completed' ? 14 : 6
                    return (
                      <G key={n.id}>
                        <Rect

                          x={n.x}
                          y={n.y}
                          width={NW}
                          height={NH}
                          rx={rx}
                          fill={col.bg}
                          stroke={col.stroke}
                          strokeWidth="1.5"
                        />
                        <SvgText
                          x={cx}
                          y={cy + 1}
                          textAnchor="middle"
                          fontSize={8}
                          fontWeight="bold"
                          fill={col.text}
                        >

                          {lbl}
                        </SvgText>
                      </G>
                    )
                  })}
                </Svg>
              </ScrollView>
            </ScrollView>
          </View>


          <View style={styles.recPanel}>
            <View style={styles.recHeaderRow}>
              <ChevronRight size={14} color={RED} />
              <Text style={[styles.panelTitle, { color: '#1E293B' }]}>
                Recommended{'\n'}Next
              </Text>
            </View>
            <Text style={styles.recSub}>Prerequisites completed</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {recommended.map(n => (
                <View key={n.id} style={styles.recCard}>
                  <View style={styles.recCardBody}>
                    <Text style={styles.recCode}>{n.id}</Text>
                    <Text style={styles.recTitle} numberOfLines={2}>{n.title}</Text>
                  </View>
                  <View style={styles.creditBadge}>
                    <Text style={styles.creditText}>{n.credits} cr</Text>
                  </View>
                </View>
              ))}
              {recommended.length === 0 && (
                <Text style={styles.noRec}>
                  Complete more prerequisites to unlock recommendations
                </Text>
              )}
            </ScrollView>
          </View>

        </View>
      </View>
      </View>
    </Modal>
  )
}


// ── Sub-components ────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) {

  return (
    <View style={styles.statCard}>
      {icon}
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function LegDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legItem}>
      <View style={[styles.legDot, { backgroundColor: color }]} />
      <Text style={styles.legLabel}>{label}</Text>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window')
const POPUP_H  = Math.round(SH * 0.74)
const POPUP_W  = Math.round(SW * 0.45)
const PAD_H    = Math.round((SW - POPUP_W) / 2)
const GRAPH_W  = Math.round(POPUP_W * 0.62)
const REC_W    = POPUP_W - GRAPH_W


const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: PAD_H,
  },
  popup: {
    width: POPUP_W,
    height: POPUP_H,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 24,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: RED,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  headerSub: { fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 1 },

  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // Stats — matching ProgressSidebar statPill style
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 2,
    overflow: 'hidden',
  },
  statValue: { fontSize: 14, fontWeight: '800' },
  statLabel: {
    fontSize: 6.5,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  // Progress bar
  progressWrap: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: { fontSize: 10, color: '#64748B', fontWeight: '500' },
  progressPct: { fontSize: 10, color: '#1E293B', fontWeight: '700' },
  progressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: RED,
    borderRadius: 4,
  },

  panels: { flex: 1, flexDirection: 'row' },

  // Left graph panel
  graphPanel: {
    width: GRAPH_W,
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    paddingTop: 10,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
  },

  panelTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  legendRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legDot: { width: 8, height: 8, borderRadius: 4 },
  legLabel: { fontSize: 8.5, color: '#64748B' },
  graphScroll: { flex: 1 },


  // Right recommended panel
  recPanel: {
    width: REC_W,
    paddingTop: 10,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
  },
  recHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 2,
  },
  recSub: { fontSize: 8.5, color: '#94A3B8', marginBottom: 10 },

  // Recommended course cards — matching ProgressSidebar courseItem style
  recCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 9,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  recCardBody: { flex: 1 },
  recCode: { fontSize: 11, fontWeight: '700', color: '#1E293B' },
  recTitle: { fontSize: 8.5, color: '#64748B', marginTop: 2, lineHeight: 12 },

  creditBadge: {
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  creditText: { fontSize: 8.5, color: '#9B0F24', fontWeight: '700' },
  noRec: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
  },
})
