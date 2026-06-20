import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const TASKS = [
  // SELF CARE
  { id: 'self_care',     label: 'Self-care basics ✨',          desc: 'Breakfast, face wash, teeth, shower', points: 1, type: 'daily',    who: 'all' },
  // DAILY ASSIGNED
  { id: 'dishes_in',    label: 'Dishes in dishwasher',          desc: '',             points: 1, type: 'daily',    who: 'Chyna' },
  { id: 'dishes_up',    label: 'Put dishes away',               desc: '',             points: 1, type: 'daily',    who: 'Jet'   },
  { id: 'kitchen_table',label: 'Wipe & reset kitchen table',    desc: '',             points: 1, type: 'daily',    who: 'Jet'   },
  { id: 'living_reset', label: 'Living room reset',             desc: '',             points: 1, type: 'daily',    who: 'Joe'   },
  { id: 'cat_litter',   label: 'Cat litter',                    desc: 'Alternate',    points: 1, type: 'daily',    who: 'Chyna/Joe' },
  { id: 'read_30',      label: 'Read 30 minutes 📖',            desc: '',             points: 1, type: 'daily',    who: 'all'   },
  // WEEKLY
  { id: 'bathroom',     label: 'Clean bathroom',                desc: 'Alternate',    points: 3, type: 'weekly',   who: 'Chyna/Joe' },
  { id: 'bathroom_jet', label: 'Clean bathroom',                desc: '',             points: 3, type: 'weekly',   who: 'Jet'   },
  { id: 'sheets',       label: 'Change sheets',                 desc: 'Alternate',    points: 2, type: 'weekly',   who: 'Chyna/Joe' },
  { id: 'sheets_jet',   label: 'Change sheets',                 desc: '',             points: 2, type: 'weekly',   who: 'Jet'   },
  { id: 'sweep_kitchen',label: 'Sweep kitchen',                 desc: '',             points: 1, type: 'weekly',   who: 'Jet'   },
  { id: 'fold_laundry', label: 'Fold washed clothes',           desc: '',             points: 2, type: 'weekly',   who: 'all'   },
  { id: 'spruce_room',  label: 'Spruce up your room',           desc: '',             points: 1, type: 'weekly',   who: 'all'   },
  { id: 'fridge_clean', label: 'Clean out fridge',              desc: '',             points: 2, type: 'weekly',   who: 'Chyna' },
  { id: 'grocery_inv',  label: 'Grocery inventory',             desc: '',             points: 1, type: 'weekly',   who: 'Chyna' },
  { id: 'trash_out',    label: 'Take out trash',                desc: 'When needed',  points: 1, type: 'asneeded', who: 'Jet'   },
  // BI-WEEKLY
  { id: 'mop_floors',   label: 'Mop floors',                    desc: 'Alternate',    points: 3, type: 'biweekly', who: 'Chyna/Joe' },
  // MONTHLY
  { id: 'meal_prep',    label: 'Meal prep session 🍱',          desc: '',             points: 4, type: 'monthly',  who: 'Chyna' },
  { id: 'deep_clean',   label: 'Deep clean a room',             desc: '',             points: 4, type: 'monthly',  who: 'all'   },
]

const WEEKLY_BASELINE = {
  Chyna: ['self_care', 'dishes_in', 'read_30', 'fridge_clean', 'spruce_room'],
  Joe:   ['self_care', 'living_reset', 'read_30', 'fold_laundry', 'spruce_room'],
  Jet:   ['self_care', 'dishes_up', 'kitchen_table', 'read_30', 'bathroom_jet', 'sweep_kitchen', 'spruce_room'],
}

const REWARDS = {
  daily:   { Chyna: 'Sour Patch Kids handful 🍬', Joe: 'Sour Patch Kids handful 🍬', Jet: 'Sour Patch Kids handful 🍬' },
  weekly:  { Chyna: 'Solo bath time — no interruptions 🛁', Joe: 'Pick the show tonight 📺', Jet: 'Stay up 1 hr late (non-school night) 🌙' },
  monthly: 'Family outing or movie night 🎬',
}

const MEMBERS = ['Chyna', 'Joe', 'Jet']
const FAMILY_GOAL = 50

const C = {
  bg: '#1a1a2e', card: '#16213e', accent: '#e94560',
  gold: '#f5a623', sage: '#7ec8a4', text: '#eaeaea',
  muted: '#8892a4', border: '#2a2a4a',
}

const memberColor = { Chyna: C.accent, Joe: C.gold, Jet: C.sage }

const badge = (pts) => pts >= 3
  ? { label: '💎 Big',   color: C.accent }
  : pts === 2
  ? { label: '⭐ Med',   color: C.gold }
  : { label: '✓ Quick', color: C.sage }

const TYPE_LABEL = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Bi-Weekly', asneeded: 'As Needed', monthly: 'Monthly / Big' }

// ─── SUPABASE HELPERS ─────────────────────────────────────────────────────────

async function fetchState() {
  const { data } = await supabase.from('app_state').select('*').eq('id', 1).single()
  return data?.state || null
}

async function pushState(state) {
  await supabase.from('app_state').upsert({ id: 1, state, updated_at: new Date().toISOString() })
}

// ─── DEFAULT STATE ────────────────────────────────────────────────────────────

const DEFAULT_STATE = {
  week: 1, month: 1,
  members: {
    Chyna: { points: 5, weeklyRewardClaimed: false },
    Joe:   { points: 5, weeklyRewardClaimed: false },
    Jet:   { points: 5, weeklyRewardClaimed: false },
  },
  familyPoints: 15,
  pendingApprovals: [],
  log: [],
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const sx = {
  app:      { minHeight: '100svh', background: C.bg, color: C.text, fontFamily: 'inherit', paddingBottom: 72 },
  header:   { background: C.card, borderBottom: `2px solid ${C.accent}`, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 },
  title:    { fontSize: 18, fontWeight: 800, color: C.accent, letterSpacing: 1 },
  sub:      { fontSize: 11, color: C.muted, marginTop: 2 },
  page:     { padding: '14px 14px 0' },
  card:     { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 12 },
  label:    { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  bigNum:   { fontSize: 32, fontWeight: 900, lineHeight: 1 },
  bar:      { height: 8, background: C.border, borderRadius: 99, overflow: 'hidden', marginTop: 8 },
  fill:     (pct, color) => ({ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width .5s ease' }),
  pill:     (color) => ({ display: 'inline-block', background: `${color}22`, color, border: `1px solid ${color}55`, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }),
  btn:      (color, outline) => ({ background: outline ? 'transparent' : color, color: outline ? color : '#fff', border: `2px solid ${color}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }),
  taskRow:  (sel) => ({ background: sel ? `${C.accent}22` : `${C.border}44`, border: `1px solid ${sel ? C.accent : C.border}`, borderRadius: 10, padding: '11px 13px', marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }),
  mCard:    (color) => ({ background: C.card, border: `1px solid ${color}33`, borderLeft: `4px solid ${color}`, borderRadius: 12, padding: 14, marginBottom: 10 }),
  nav:      { position: 'fixed', bottom: 0, left: 0, right: 0, background: C.card, borderTop: `1px solid ${C.border}`, display: 'flex', zIndex: 100 },
  navBtn:   (active) => ({ flex: 1, padding: '10px 4px', background: 'none', border: 'none', color: active ? C.accent : C.muted, fontSize: 10, fontWeight: active ? 700 : 400, cursor: 'pointer', borderTop: active ? `2px solid ${C.accent}` : '2px solid transparent' }),
  toast:    (color) => ({ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: color, color: '#fff', padding: '10px 22px', borderRadius: 99, fontWeight: 700, fontSize: 13, zIndex: 999, boxShadow: '0 4px 20px #0008', whiteSpace: 'nowrap' }),
  divider:  { borderTop: `1px solid ${C.border}`, margin: '10px 0' },
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [state, setState]           = useState(null)
  const [view, setView]             = useState('board')
  const [me, setMe]                 = useState(null)         // who is using this device right now
  const [selectedTask, setTask]     = useState(null)
  const [submitter, setSubmitter]   = useState('Chyna')
  const [toast, setToast]           = useState(null)
  const [syncing, setSyncing]       = useState(false)
  const [loading, setLoading]       = useState(true)

  // ── Load & subscribe ──
  useEffect(() => {
    fetchState().then(s => {
      setState(s || DEFAULT_STATE)
      setLoading(false)
    })

    const channel = supabase
      .channel('state-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, payload => {
        if (payload.new?.state) setState(payload.new.state)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const update = useCallback(async (updater) => {
    setSyncing(true)
    setState(prev => {
      const next = updater(prev)
      pushState(next).finally(() => setSyncing(false))
      return next
    })
  }, [])

  const showToast = (msg, color = C.sage) => {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 2800)
  }

  // ── Actions ──
  const submitTask = () => {
    if (!selectedTask) return
    const task = TASKS.find(t => t.id === selectedTask)
    const item = { id: Date.now(), who: submitter, taskId: task.id, taskLabel: task.label, points: task.points }
    update(s => ({ ...s, pendingApprovals: [...s.pendingApprovals, item] }))
    setTask(null)
    showToast(`"${task.label}" sent for approval!`, C.gold)
    setView('board')
  }

  const approveTask = (approver, pendingId) => {
    update(s => {
      const item = s.pendingApprovals.find(p => p.id === pendingId)
      if (!item || item.who === approver) return s
      const newMembers = {
        ...s.members,
        [item.who]: { ...s.members[item.who], points: s.members[item.who].points + item.points }
      }
      return {
        ...s,
        members: newMembers,
        familyPoints: s.familyPoints + item.points,
        pendingApprovals: s.pendingApprovals.filter(p => p.id !== pendingId),
        log: [{ text: `${approver} approved ${item.who}: +${item.points}pt for ${item.taskLabel}`, ts: Date.now() }, ...s.log.slice(0, 29)],
      }
    })
    showToast('Approved! Points added ✓', C.sage)
  }

  const rejectTask = (pendingId) => {
    update(s => ({ ...s, pendingApprovals: s.pendingApprovals.filter(p => p.id !== pendingId) }))
    showToast('Task removed.', C.muted)
  }

  const claimWeeklyReward = (member) => {
    update(s => {
      if (s.members[member].weeklyRewardClaimed) return s
      return {
        ...s,
        members: { ...s.members, [member]: { ...s.members[member], weeklyRewardClaimed: true } },
        log: [{ text: `${member} claimed their weekly reward 🎉`, ts: Date.now() }, ...s.log.slice(0, 29)],
      }
    })
    showToast(`Enjoy it, ${member}! 🎉`, C.gold)
  }

  const resetWeek = () => {
    update(s => {
      const newMembers = {}
      MEMBERS.forEach(m => { newMembers[m] = { ...s.members[m], weeklyRewardClaimed: false } })
      return { ...s, members: newMembers, week: s.week + 1, log: [{ text: `Week ${s.week + 1} started`, ts: Date.now() }, ...s.log.slice(0, 29)] }
    })
    showToast('New week started!', C.accent)
  }

  const resetMonth = () => {
    update(s => ({
      ...s, familyPoints: 0, month: s.month + 1,
      log: [{ text: `Month ${s.month + 1} started — points reset 🎊`, ts: Date.now() }, ...s.log.slice(0, 29)],
    }))
    showToast('New month! Family points reset.', C.accent)
  }

  // ── Who-picker screen ──
  if (!me) {
    return (
      <div style={{ ...sx.app, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
        <div style={{ fontSize: 48 }}>🏠</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.accent }}>House Points</div>
        <div style={{ color: C.muted, fontSize: 14, marginBottom: 8 }}>Who are you?</div>
        {MEMBERS.map(m => (
          <button key={m} style={{ ...sx.btn(memberColor[m]), width: 200, padding: 14, fontSize: 16 }} onClick={() => setMe(m)}>
            {m}
          </button>
        ))}
      </div>
    )
  }

  if (loading || !state) {
    return (
      <div style={{ ...sx.app, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.muted }}>Loading…</div>
      </div>
    )
  }

  const familyPct = Math.min(100, Math.round((state.familyPoints / FAMILY_GOAL) * 100))
  const goalMet   = state.familyPoints >= FAMILY_GOAL
  const pending   = state.pendingApprovals.length

  return (
    <div style={sx.app}>
      {toast && <div style={sx.toast(toast.color)}>{toast.msg}</div>}

      {/* HEADER */}
      <header style={sx.header}>
        <div>
          <div style={sx.title}>🏠 House Points</div>
          <div style={sx.sub}>Week {state.week} · Month {state.month} {syncing ? '· syncing…' : ''}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: C.muted }}>Family pot</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: goalMet ? C.gold : C.text }}>
              {state.familyPoints}<span style={{ fontSize: 12, color: C.muted }}>/{FAMILY_GOAL}</span>
            </div>
          </div>
          <button style={{ ...sx.btn(memberColor[me], true), padding: '4px 10px', fontSize: 11 }} onClick={() => setMe(null)}>
            {me}
          </button>
        </div>
      </header>

      {/* ── BOARD ── */}
      {view === 'board' && (
        <div style={sx.page}>
          {/* Family goal */}
          <div style={sx.card}>
            <div style={sx.label}>Family Goal — Month {state.month}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ ...sx.bigNum, color: goalMet ? C.gold : C.text }}>{state.familyPoints}</div>
              <div style={{ color: C.muted }}>/ {FAMILY_GOAL} pts</div>
            </div>
            <div style={sx.bar}><div style={sx.fill(familyPct, goalMet ? C.gold : C.accent)} /></div>
            {goalMet && <div style={{ marginTop: 10, color: C.gold, fontWeight: 700 }}>🎉 Goal hit! {REWARDS.monthly}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button style={{ ...sx.btn(C.muted, true), fontSize: 11 }} onClick={resetWeek}>End Week</button>
              {goalMet && <button style={{ ...sx.btn(C.accent), fontSize: 11 }} onClick={resetMonth}>New Month</button>}
            </div>
          </div>

          {/* Members */}
          {MEMBERS.map(m => {
            const mem = state.members[m]
            const color = memberColor[m]
            return (
              <div key={m} style={sx.mCard(color)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{m} {m === me ? <span style={{ fontSize: 10, color: C.muted }}>(you)</span> : ''}</div>
                  <div style={{ ...sx.bigNum, fontSize: 26, color }}>{mem.points} <span style={{ fontSize: 12, color: C.muted, fontWeight: 400 }}>pts</span></div>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
                  Weekly reward: <span style={{ color }}>{REWARDS.weekly[m]}</span>
                </div>
                {!mem.weeklyRewardClaimed
                  ? <button style={{ ...sx.btn(color, true), marginTop: 8, fontSize: 11 }} onClick={() => claimWeeklyReward(m)}>Claim weekly reward</button>
                  : <div style={{ ...sx.pill(C.sage), marginTop: 8 }}>✓ Reward claimed this week</div>
                }
              </div>
            )
          })}

          {/* Pending notice */}
          {pending > 0 && (
            <div style={{ ...sx.card, borderColor: C.gold + '66' }}>
              <div style={sx.label}>⏳ Waiting for approval ({pending})</div>
              {state.pendingApprovals.map(p => (
                <div key={p.id} style={{ fontSize: 12, color: C.muted, padding: '4px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: memberColor[p.who], fontWeight: 700 }}>{p.who}</span> → {p.taskLabel} (+{p.points}pt)
                </div>
              ))}
            </div>
          )}

          {/* Log */}
          {state.log.length > 0 && (
            <div style={sx.card}>
              <div style={sx.label}>Recent activity</div>
              {state.log.slice(0, 6).map((l, i) => (
                <div key={i} style={{ fontSize: 12, color: C.muted, padding: '3px 0' }}>• {l.text}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── LOG TASK ── */}
      {view === 'tasks' && (
        <div style={sx.page}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Log a task</div>

          <div style={sx.card}>
            <div style={sx.label}>Who did it?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {MEMBERS.map(m => (
                <button key={m} style={{ ...sx.btn(memberColor[m], submitter !== m), flex: 1, padding: '8px 4px', fontSize: 12 }} onClick={() => setSubmitter(m)}>{m}</button>
              ))}
            </div>
          </div>

          <div style={sx.card}>
            <div style={sx.label}>Pick the task</div>
            {['daily', 'weekly', 'biweekly', 'asneeded', 'monthly'].map(type => {
              const list = TASKS.filter(t => t.type === type)
              if (!list.length) return null
              return (
                <div key={type}>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{TYPE_LABEL[type]}</div>
                  {list.map(t => {
                    const b = badge(t.points)
                    return (
                      <div key={t.id} style={sx.taskRow(selectedTask === t.id)} onClick={() => setTask(t.id)}>
                        <div>
                          <div style={{ fontSize: 13 }}>{t.label}</div>
                          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                            {t.desc && `${t.desc} · `}👤 {t.who}
                          </div>
                        </div>
                        <span style={sx.pill(b.color)}>{b.label} +{t.points}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <button
            style={{ ...sx.btn(selectedTask ? C.accent : C.muted), width: '100%', padding: 14, fontSize: 15, opacity: selectedTask ? 1 : 0.5 }}
            onClick={submitTask} disabled={!selectedTask}
          >
            Send for Approval →
          </button>
        </div>
      )}

      {/* ── APPROVE ── */}
      {view === 'approve' && (
        <div style={sx.page}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Approve tasks</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>You can only approve someone else's task.</div>

          {pending === 0
            ? <div style={{ ...sx.card, textAlign: 'center', color: C.muted, padding: 32 }}>Nothing waiting for approval 👍</div>
            : state.pendingApprovals.map(p => {
                const canApprove = p.who !== me
                return (
                  <div key={p.id} style={sx.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: memberColor[p.who] }}>{p.who}</div>
                        <div style={{ fontSize: 14, marginTop: 2 }}>{p.taskLabel}</div>
                        <div style={{ ...sx.pill(C.gold), marginTop: 6 }}>+{p.points} pts</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button style={{ ...sx.btn(C.sage), opacity: canApprove ? 1 : 0.35 }} disabled={!canApprove} onClick={() => approveTask(me, p.id)}>✓ Approve</button>
                        <button style={{ ...sx.btn(C.accent, true), fontSize: 12 }} onClick={() => rejectTask(p.id)}>✗ Remove</button>
                      </div>
                    </div>
                    {!canApprove && <div style={{ fontSize: 11, color: C.accent, marginTop: 8 }}>Can't approve your own task — ask {MEMBERS.filter(m => m !== p.who).join(' or ')}</div>}
                  </div>
                )
              })
          }
        </div>
      )}

      {/* ── REWARDS ── */}
      {view === 'rewards' && (
        <div style={sx.page}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Rewards</div>

          <div style={sx.card}>
            <div style={sx.label}>🍬 Daily — just show up</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Do anything on the list → earn your treat.</div>
            {MEMBERS.map(m => (
              <div key={m} style={{ fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: memberColor[m], fontWeight: 700 }}>{m}:</span> {REWARDS.daily[m]}
              </div>
            ))}
          </div>

          <div style={sx.card}>
            <div style={sx.label}>⭐ Weekly — hit your basics</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Complete all your must-dos every week → claim your reward on the board.</div>
            {MEMBERS.map(m => (
              <div key={m} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ color: memberColor[m], fontWeight: 700, fontSize: 14 }}>{m}</div>
                <div style={{ fontSize: 13, margin: '4px 0' }}>{REWARDS.weekly[m]}</div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  Must-dos: {WEEKLY_BASELINE[m].map(tid => TASKS.find(t => t.id === tid)?.label).join(' · ')}
                </div>
              </div>
            ))}
          </div>

          <div style={{ ...sx.card, borderColor: C.gold + '88' }}>
            <div style={sx.label}>🎬 Monthly — family goal</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.gold }}>{state.familyPoints} / {FAMILY_GOAL}</div>
            <div style={sx.bar}><div style={sx.fill(familyPct, C.gold)} /></div>
            <div style={{ fontSize: 14, marginTop: 10 }}>{REWARDS.monthly}</div>
            {goalMet && <div style={{ color: C.gold, fontWeight: 700, marginTop: 6 }}>✓ You earned it this month!</div>}
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={sx.nav}>
        {[
          { id: 'board',   icon: '🏠', label: 'Board' },
          { id: 'tasks',   icon: '✅', label: 'Log Task' },
          { id: 'approve', icon: '👍', label: pending > 0 ? `Approve (${pending})` : 'Approve' },
          { id: 'rewards', icon: '🎁', label: 'Rewards' },
        ].map(n => (
          <button key={n.id} style={sx.navBtn(view === n.id)} onClick={() => setView(n.id)}>
            <div style={{ fontSize: 20 }}>{n.icon}</div>
            <div>{n.label}</div>
          </button>
        ))}
      </nav>
    </div>
  )
}
