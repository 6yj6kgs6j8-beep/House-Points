import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const TASKS = [
  { id: 'dishes_in',     label: 'Dishes in dishwasher',           desc: '',            points: 1, type: 'daily',    who: 'Chyna' },
  { id: 'dishes_up',     label: 'Put dishes away',                desc: '',            points: 1, type: 'daily',    who: 'Jet'   },
  { id: 'living_reset',  label: 'Living room reset',              desc: '',            points: 1, type: 'daily',    who: 'Joe'   },
  { id: 'cat_litter',    label: 'Cat litter',                     desc: '',            points: 1, type: 'daily',    who: 'Joe'   },
  { id: 'read_30',       label: 'Read 30 minutes',                desc: '',            points: 1, type: 'daily',    who: 'all'   },
  { id: 'bathroom_cj',   label: 'Clean bathroom',                 desc: 'Chyna/Joe alternate', points: 3, type: 'weekly', who: 'Chyna/Joe' },
  { id: 'bathroom_jet',  label: 'Clean bathroom',                 desc: '',            points: 3, type: 'weekly',   who: 'Jet'   },
  { id: 'sheets_cj',     label: 'Change sheets',                  desc: 'Chyna/Joe alternate', points: 2, type: 'weekly', who: 'Chyna/Joe' },
  { id: 'sheets_jet',    label: 'Change sheets',                  desc: '',            points: 2, type: 'weekly',   who: 'Jet'   },
  { id: 'sweep_kitchen', label: 'Sweep kitchen',                  desc: '',            points: 1, type: 'weekly',   who: 'Jet'   },
  { id: 'fold_chyna',    label: 'Fold your laundry',              desc: '',            points: 2, type: 'weekly',   who: 'Chyna' },
  { id: 'fold_joe',      label: 'Fold your laundry',              desc: '',            points: 2, type: 'weekly',   who: 'Joe'   },
  { id: 'fold_jet',      label: 'Fold your laundry',              desc: '',            points: 2, type: 'weekly',   who: 'Jet'   },
  { id: 'wash_load',     label: 'Put all 3 baskets in washer',    desc: 'Chyna/Joe alternate', points: 2, type: 'weekly', who: 'Chyna/Joe' },
  { id: 'dry_baskets',   label: 'Move dry clothes to baskets',    desc: '',            points: 1, type: 'weekly',   who: 'Chyna' },
  { id: 'spruce_room',   label: 'Spruce up your room',            desc: '',            points: 1, type: 'weekly',   who: 'all'   },
  { id: 'fridge_clean',  label: 'Clean out fridge',               desc: '',            points: 2, type: 'weekly',   who: 'Chyna' },
  { id: 'grocery_inv',   label: 'Grocery inventory',              desc: '',            points: 1, type: 'weekly',   who: 'Chyna' },
  { id: 'trash_out',     label: 'Take out trash',                 desc: 'When needed', points: 1, type: 'asneeded', who: 'Jet'   },
  { id: 'mop_floors',    label: 'Mop floors',                     desc: 'Chyna/Joe alternate', points: 3, type: 'biweekly', who: 'Chyna/Joe' },
  { id: 'meal_prep',     label: 'Meal prep session',              desc: '',            points: 4, type: 'monthly',  who: 'Chyna' },
  { id: 'deep_clean',    label: 'Deep clean a room',              desc: '',            points: 4, type: 'monthly',  who: 'all'   },
]

const WEEKLY_BASELINE = {
  Chyna: ['dishes_in', 'read_30', 'wash_load', 'dry_baskets', 'fold_chyna', 'fridge_clean', 'spruce_room'],
  Joe:   ['living_reset', 'cat_litter', 'read_30', 'fold_joe', 'spruce_room'],
  Jet:   ['dishes_up', 'read_30', 'bathroom_jet', 'sweep_kitchen', 'fold_jet', 'spruce_room'],
}

const REWARDS = {
  daily:  { Chyna: 'a cookie', Joe: 'Sour Patch Kids handful', Jet: 'Sour Patch Kids handful' },
  weekly: { Chyna: 'solo thrift store trip', Joe: 'Liquid Death + Slim Jim + big Sour Patch', Jet: 'stay up 1 hr late (non-school night)' },
  monthly: 'family outing or movie night',
}

const MEMBERS = ['Chyna', 'Joe', 'Jet']
const FAMILY_GOAL = 35

const EMOJIS = { Chyna: '🌸', Joe: '⚡', Jet: '✨' }

const PALETTE = {
  bg:       '#FFF8F0',
  card:     '#FFFFFF',
  border:   '#F0E6D8',
  text:     '#3D2C1E',
  muted:    '#9E8572',
  Chyna:    { main: '#D4637A', light: '#FCE8EC', dark: '#8C2D3E' },
  Joe:      { main: '#E8943A', light: '#FEF0E0', dark: '#8C4A10' },
  Jet:      { main: '#5BA98B', light: '#E2F4EE', dark: '#2A6650' },
  gold:     '#F0B429',
  goldLight:'#FEF7E0',
  purple:   '#8B6CC8',
  purpleLight: '#F0EBFC',
}

const TYPE_LABEL = {
  daily: 'Every day', weekly: 'Every week',
  biweekly: 'Every two weeks', asneeded: 'As needed', monthly: 'Once a month'
}

async function fetchState() {
  const { data } = await supabase.from('app_state').select('*').eq('id', 1).single()
  return data?.state || null
}

async function pushState(state) {
  await supabase.from('app_state').upsert({ id: 1, state, updated_at: new Date().toISOString() })
}

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

const ss = (obj) => Object.entries(obj).map(([k,v]) => `${k}:${v}`).join(';')

export default function Home() {
  const [state, setState]       = useState(null)
  const [view, setView]         = useState('board')
  const [me, setMe]             = useState(null)
  const [selectedTask, setTask] = useState(null)
  const [submitter, setSub]     = useState('Chyna')
  const [toast, setToast]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [syncing, setSyncing]   = useState(false)

  useEffect(() => {
    fetchState().then(s => { setState(s || DEFAULT_STATE); setLoading(false) })
    const ch = supabase.channel('sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, p => {
        if (p.new?.state) setState(p.new.state)
      }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const update = useCallback((fn) => {
    setSyncing(true)
    setState(prev => {
      const next = fn(prev)
      pushState(next).finally(() => setSyncing(false))
      return next
    })
  }, [])

  const toast$ = (msg, type = 'good') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2600)
  }

  const submitTask = () => {
    if (!selectedTask) return
    const task = TASKS.find(t => t.id === selectedTask)
    const item = { id: Date.now(), who: submitter, taskId: task.id, taskLabel: task.label, points: task.points }
    update(s => ({ ...s, pendingApprovals: [...s.pendingApprovals, item] }))
    setTask(null)
    toast$(`Sent for approval! +${task.points} pts pending`, 'pending')
    setView('board')
  }

  const approveTask = (pendingId) => {
    update(s => {
      const item = s.pendingApprovals.find(p => p.id === pendingId)
      if (!item || item.who === me) return s
      return {
        ...s,
        members: { ...s.members, [item.who]: { ...s.members[item.who], points: s.members[item.who].points + item.points } },
        familyPoints: s.familyPoints + item.points,
        pendingApprovals: s.pendingApprovals.filter(p => p.id !== pendingId),
        log: [{ text: `${me} approved ${item.who}: +${item.points} pt for "${item.taskLabel}"`, ts: Date.now() }, ...s.log.slice(0, 29)],
      }
    })
    toast$('Points added!', 'good')
  }

  const rejectTask = (pendingId) => {
    update(s => ({ ...s, pendingApprovals: s.pendingApprovals.filter(p => p.id !== pendingId) }))
    toast$('Task removed', 'muted')
  }

  const claimWeeklyReward = (member) => {
    update(s => {
      if (s.members[member].weeklyRewardClaimed) return s
      return {
        ...s,
        members: { ...s.members, [member]: { ...s.members[member], weeklyRewardClaimed: true } },
        log: [{ text: `${member} claimed their weekly reward`, ts: Date.now() }, ...s.log.slice(0, 29)],
      }
    })
    toast$(`Enjoy it, ${member}!`, 'gold')
  }

  const resetWeek = () => {
    update(s => {
      const nm = {}
      MEMBERS.forEach(m => { nm[m] = { ...s.members[m], weeklyRewardClaimed: false } })
      return { ...s, members: nm, week: s.week + 1, log: [{ text: `Week ${s.week + 1} started`, ts: Date.now() }, ...s.log.slice(0,29)] }
    })
    toast$('New week!', 'good')
  }

  const resetMonth = () => {
    update(s => ({
      ...s, familyPoints: 0, month: s.month + 1,
      log: [{ text: `Month ${s.month + 1} — points reset`, ts: Date.now() }, ...s.log.slice(0,29)],
    }))
    toast$('New month started!', 'good')
  }

  const P = PALETTE

  const card = (extra = {}) => ({
    background: P.card,
    border: `1.5px solid ${P.border}`,
    borderRadius: 20,
    padding: '16px 18px',
    marginBottom: 14,
    ...extra,
  })

  const btn = (bg, color, extra = {}) => ({
    background: bg,
    color,
    border: 'none',
    borderRadius: 14,
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    ...extra,
  })

  const pill = (bg, color) => ({
    display: 'inline-block',
    background: bg,
    color,
    borderRadius: 99,
    padding: '3px 12px',
    fontSize: 12,
    fontWeight: 700,
  })

  const toastColors = {
    good: { bg: P.Jet.main, color: '#fff' },
    pending: { bg: P.gold, color: P.text },
    gold: { bg: P.purple, color: '#fff' },
    muted: { bg: P.muted, color: '#fff' },
  }

  if (!me) {
    return (
      <div style={{ minHeight: '100svh', background: P.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
        <div style={{ fontSize: 56 }}>🏡</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: P.text }}>House Points</div>
        <div style={{ color: P.muted, fontSize: 15, marginBottom: 8 }}>Who's playing?</div>
        {MEMBERS.map(m => {
          const c = P[m]
          return (
            <button key={m} onClick={() => setMe(m)} style={{
              background: c.light,
              color: c.dark,
              border: `2px solid ${c.main}`,
              borderRadius: 18,
              padding: '14px 0',
              width: 220,
              fontSize: 18,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}>
              <span style={{ fontSize: 24 }}>{EMOJIS[m]}</span> {m}
            </button>
          )
        })}
      </div>
    )
  }

  if (loading || !state) {
    return <div style={{ minHeight: '100svh', background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.muted }}>Loading...</div>
  }

  const familyPct = Math.min(100, Math.round((state.familyPoints / FAMILY_GOAL) * 100))
  const goalMet   = state.familyPoints >= FAMILY_GOAL
  const pending   = state.pendingApprovals.length
  const myColor   = P[me]

  const navItems = [
    { id: 'board',   icon: '🏠', label: 'Home' },
    { id: 'tasks',   icon: '✅', label: 'Log Task' },
    { id: 'approve', icon: '👍', label: pending > 0 ? `Approve (${pending})` : 'Approve' },
    { id: 'rewards', icon: '🎁', label: 'Rewards' },
  ]

  return (
    <div style={{ minHeight: '100svh', background: P.bg, color: P.text, fontFamily: 'inherit', paddingBottom: 80 }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)',
          background: toastColors[toast.type].bg, color: toastColors[toast.type].color,
          padding: '10px 24px', borderRadius: 99, fontWeight: 700, fontSize: 14,
          zIndex: 999, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', whiteSpace: 'nowrap',
        }}>{toast.msg}</div>
      )}

      {/* HEADER */}
      <div style={{
        background: P.card, borderBottom: `1.5px solid ${P.border}`,
        padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: P.text }}>🏡 House Points</div>
          <div style={{ fontSize: 11, color: P.muted }}>Week {state.week} · Month {state.month}{syncing ? ' · saving...' : ''}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: P.muted }}>Family pot</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: goalMet ? P.gold : P.text }}>
              {state.familyPoints}<span style={{ fontSize: 12, color: P.muted, fontWeight: 400 }}>/{FAMILY_GOAL}</span>
            </div>
          </div>
          <button onClick={() => setMe(null)} style={{
            background: myColor.light, color: myColor.dark,
            border: `1.5px solid ${myColor.main}`, borderRadius: 99,
            padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>{EMOJIS[me]} {me}</button>
        </div>
      </div>

      {/* BOARD */}
      {view === 'board' && (
        <div style={{ padding: '16px 16px 0' }}>

          {/* Family goal */}
          <div style={{ ...card(), background: goalMet ? P.goldLight : P.card, border: `1.5px solid ${goalMet ? P.gold : P.border}` }}>
            <div style={{ fontSize: 11, color: P.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Family goal — month {state.month}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: goalMet ? P.gold : P.text }}>{state.familyPoints}</span>
              <span style={{ color: P.muted }}>/ {FAMILY_GOAL} pts</span>
              {goalMet && <span style={{ ...pill(P.gold, P.text), marginLeft: 4 }}>Goal hit! 🎉</span>}
            </div>
            <div style={{ height: 12, background: P.border, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${familyPct}%`, background: goalMet ? P.gold : P.purple, borderRadius: 99, transition: 'width .5s ease' }} />
            </div>
            {goalMet && <div style={{ marginTop: 12, fontSize: 14, color: P.text, fontWeight: 600 }}>🎬 {REWARDS.monthly}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={resetWeek} style={btn(P.border, P.muted, { fontSize: 12, padding: '8px 14px' })}>End week</button>
              {goalMet && <button onClick={resetMonth} style={btn(P.gold, P.text, { fontSize: 12, padding: '8px 14px' })}>Start new month</button>}
            </div>
          </div>

          {/* Members */}
          {MEMBERS.map(m => {
            const mem = state.members[m]
            const c = P[m]
            return (
              <div key={m} style={{ ...card(), borderColor: c.main + '55', borderWidth: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: c.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{EMOJIS[m]}</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{m} {m === me && <span style={{ fontSize: 11, color: P.muted, fontWeight: 400 }}>(you)</span>}</div>
                      <div style={{ fontSize: 12, color: P.muted }}>Weekly: {REWARDS.weekly[m]}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 30, fontWeight: 900, color: c.main }}>{mem.points}</div>
                    <div style={{ fontSize: 11, color: P.muted }}>pts</div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  {!mem.weeklyRewardClaimed
                    ? <button onClick={() => claimWeeklyReward(m)} style={btn(c.light, c.dark, { fontSize: 12, padding: '8px 14px', border: `1.5px solid ${c.main}` })}>
                        Claim weekly reward
                      </button>
                    : <span style={pill(c.light, c.dark)}>✓ Reward claimed this week</span>
                  }
                </div>
              </div>
            )
          })}

          {/* Pending */}
          {pending > 0 && (
            <div style={{ ...card(), borderColor: P.gold }}>
              <div style={{ fontSize: 11, color: P.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Waiting for approval ({pending})</div>
              {state.pendingApprovals.map(p => (
                <div key={p.id} style={{ fontSize: 13, color: P.muted, padding: '4px 0', borderBottom: `1px solid ${P.border}` }}>
                  <span style={{ color: P[p.who].main, fontWeight: 700 }}>{p.who}</span> · {p.taskLabel} <span style={pill(P.goldLight, P.gold)}>+{p.points}</span>
                </div>
              ))}
            </div>
          )}

          {/* Log */}
          {state.log.length > 0 && (
            <div style={card()}>
              <div style={{ fontSize: 11, color: P.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Recent activity</div>
              {state.log.slice(0, 5).map((l, i) => (
                <div key={i} style={{ fontSize: 12, color: P.muted, padding: '3px 0' }}>· {l.text}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LOG TASK */}
      {view === 'tasks' && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Log a task</div>

          <div style={card()}>
            <div style={{ fontSize: 11, color: P.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Who did it?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {MEMBERS.map(m => (
                <button key={m} onClick={() => setSub(m)} style={{
                  flex: 1, padding: '10px 4px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: submitter === m ? P[m].main : P[m].light,
                  color: submitter === m ? '#fff' : P[m].dark,
                  border: `1.5px solid ${P[m].main}`,
                }}>{EMOJIS[m]} {m}</button>
              ))}
            </div>
          </div>

          <div style={card()}>
            <div style={{ fontSize: 11, color: P.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Pick the task</div>
            {['daily','weekly','biweekly','asneeded','monthly'].map(type => {
              const list = TASKS.filter(t => t.type === type)
              if (!list.length) return null
              return (
                <div key={type}>
                  <div style={{ fontSize: 11, color: P.purple, fontWeight: 700, marginTop: 14, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{TYPE_LABEL[type]}</div>
                  {list.map(t => {
                    const sel = selectedTask === t.id
                    const pts = t.points
                    const ptColor = pts >= 3 ? P.Chyna.main : pts === 2 ? P.Joe.main : P.Jet.main
                    const ptLight = pts >= 3 ? P.Chyna.light : pts === 2 ? P.Joe.light : P.Jet.light
                    return (
                      <div key={t.id} onClick={() => setTask(t.id)} style={{
                        background: sel ? P.purpleLight : P.bg,
                        border: `1.5px solid ${sel ? P.purple : P.border}`,
                        borderRadius: 14, padding: '11px 14px', marginBottom: 8,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: sel ? 700 : 400, color: sel ? P.purple : P.text }}>{t.label}</div>
                          {(t.desc || t.who !== 'all') && (
                            <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>
                              {t.desc && `${t.desc} · `}👤 {t.who}
                            </div>
                          )}
                        </div>
                        <span style={pill(ptLight, ptColor)}>+{pts} pt{pts !== 1 ? 's' : ''}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <button onClick={submitTask} disabled={!selectedTask} style={{
            ...btn(selectedTask ? P.purple : P.border, selectedTask ? '#fff' : P.muted),
            width: '100%', padding: 16, fontSize: 16, opacity: selectedTask ? 1 : 0.5,
            borderRadius: 16, marginBottom: 16,
          }}>Send for approval →</button>
        </div>
      )}

      {/* APPROVE */}
      {view === 'approve' && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Approve tasks</div>
          <div style={{ fontSize: 13, color: P.muted, marginBottom: 14 }}>You can only approve someone else's task.</div>

          {pending === 0
            ? <div style={{ ...card(), textAlign: 'center', color: P.muted, padding: 40 }}>Nothing waiting 👍</div>
            : state.pendingApprovals.map(p => {
                const canApprove = p.who !== me
                const c = P[p.who]
                return (
                  <div key={p.id} style={card()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 20 }}>{EMOJIS[p.who]}</span>
                          <span style={{ fontWeight: 800, color: c.main }}>{p.who}</span>
                        </div>
                        <div style={{ fontSize: 14, marginBottom: 8 }}>{p.taskLabel}</div>
                        <span style={pill(c.light, c.dark)}>+{p.points} pts</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button
                          disabled={!canApprove}
                          onClick={() => approveTask(p.id)}
                          style={btn(canApprove ? P.Jet.main : P.border, canApprove ? '#fff' : P.muted, { opacity: canApprove ? 1 : 0.4, fontSize: 13 })}
                        >✓ Approve</button>
                        <button onClick={() => rejectTask(p.id)} style={btn(P.bg, P.muted, { fontSize: 12, border: `1px solid ${P.border}` })}>Remove</button>
                      </div>
                    </div>
                    {!canApprove && <div style={{ fontSize: 12, color: P.Chyna.main, marginTop: 10 }}>Ask {MEMBERS.filter(m => m !== p.who).join(' or ')} to approve this</div>}
                  </div>
                )
              })
          }
        </div>
      )}

      {/* REWARDS */}
      {view === 'rewards' && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Rewards</div>

          <div style={card()}>
            <div style={{ fontSize: 11, color: P.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Daily — just show up</div>
            <div style={{ fontSize: 13, color: P.muted, marginBottom: 12 }}>Do anything on the task list and earn your treat.</div>
            {MEMBERS.map(m => (
              <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '10px 12px', background: P[m].light, borderRadius: 12 }}>
                <span style={{ fontSize: 22 }}>{EMOJIS[m]}</span>
                <div>
                  <div style={{ fontWeight: 700, color: P[m].dark }}>{m}</div>
                  <div style={{ fontSize: 13, color: P[m].main }}>{REWARDS.daily[m]}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={card()}>
            <div style={{ fontSize: 11, color: P.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Weekly — hit your must-dos</div>
            <div style={{ fontSize: 13, color: P.muted, marginBottom: 12 }}>Complete everything on your list each week to claim your reward on the board.</div>
            {MEMBERS.map(m => (
              <div key={m} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${P.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>{EMOJIS[m]}</span>
                  <span style={{ fontWeight: 800, color: P[m].dark }}>{m}</span>
                </div>
                <div style={{ fontSize: 14, color: P[m].main, fontWeight: 600, marginBottom: 6 }}>{REWARDS.weekly[m]}</div>
                <div style={{ fontSize: 11, color: P.muted }}>
                  Must-dos: {WEEKLY_BASELINE[m].map(tid => TASKS.find(t => t.id === tid)?.label).join(' · ')}
                </div>
              </div>
            ))}
          </div>

          <div style={{ ...card(), background: P.goldLight, borderColor: P.gold }}>
            <div style={{ fontSize: 11, color: P.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Monthly — family goal</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: P.gold }}>{state.familyPoints}<span style={{ fontSize: 16, color: P.muted, fontWeight: 400 }}>/{FAMILY_GOAL}</span></div>
            <div style={{ height: 10, background: P.border, borderRadius: 99, overflow: 'hidden', margin: '10px 0' }}>
              <div style={{ height: '100%', width: `${familyPct}%`, background: P.gold, borderRadius: 99, transition: 'width .5s' }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: P.text }}>{REWARDS.monthly}</div>
            {goalMet && <div style={{ marginTop: 8, fontWeight: 700, color: P.gold }}>You earned it this month!</div>}
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: P.card, borderTop: `1.5px solid ${P.border}`, display: 'flex', zIndex: 100 }}>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setView(n.id)} style={{
            flex: 1, padding: '10px 4px 12px', background: 'none', border: 'none',
            color: view === n.id ? P.purple : P.muted,
            fontSize: 10, fontWeight: view === n.id ? 800 : 400, cursor: 'pointer',
            borderTop: view === n.id ? `3px solid ${P.purple}` : '3px solid transparent',
          }}>
            <div style={{ fontSize: 22 }}>{n.icon}</div>
            <div>{n.label}</div>
          </button>
        ))}
      </nav>
    </div>
  )
