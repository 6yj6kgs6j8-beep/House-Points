import { useState, useEffect, useCallback, useRef } from 'react'
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
const TYPE_LABEL = { daily: 'Every day', weekly: 'Every week', biweekly: 'Every two weeks', asneeded: 'As needed', monthly: 'Once a month' }

const G = {
  bg:        '#F5EFE0',
  paper:     '#FDFAF3',
  card:      '#FFFDF7',
  border:    '#D9CEB8',
  borderDark:'#B8A98A',
  text:      '#3A2F1E',
  muted:     '#8C7A5E',
  Chyna:     { main: '#C45E72', light: '#FAEAED', dark: '#7A2A3A', mid: '#E8A0AD' },
  Joe:       { main: '#C47A35', light: '#FAF0E0', dark: '#7A4010', mid: '#E8B878' },
  Jet:       { main: '#4A967A', light: '#E5F4EE', dark: '#1E5C42', mid: '#8ECDB8' },
  sage:      '#6B8F6B',
  sageLight: '#E8F0E8',
  terracotta:'#C4714A',
  terracottaLight: '#FAE8DF',
  gold:      '#D4940A',
  goldLight: '#FDF3D0',
  cream:     '#F8F2E4',
}

const DEFAULT_INVENTORY = [
  { id: 'eggs',      name: 'Eggs',           qty: 0, unit: 'count',   low: 4, category: 'fridge' },
  { id: 'milk',      name: 'Milk',           qty: 0, unit: 'cups',    low: 2, category: 'fridge' },
  { id: 'butter',    name: 'Butter',         qty: 0, unit: 'sticks',  low: 1, category: 'fridge' },
  { id: 'cheese',    name: 'Cheese',         qty: 0, unit: 'slices',  low: 4, category: 'fridge' },
  { id: 'juice',     name: 'Juice',          qty: 0, unit: 'bottles', low: 1, category: 'fridge' },
  { id: 'fruit',     name: 'Fruit',          qty: 0, unit: 'count',   low: 3, category: 'fridge' },
  { id: 'veggies',   name: 'Vegetables',     qty: 0, unit: 'count',   low: 3, category: 'fridge' },
  { id: 'bread',     name: 'Bread',          qty: 0, unit: 'slices',  low: 4, category: 'pantry' },
  { id: 'rice',      name: 'Rice',           qty: 0, unit: 'cups',    low: 2, category: 'pantry' },
  { id: 'pasta',     name: 'Pasta',          qty: 0, unit: 'boxes',   low: 1, category: 'pantry' },
  { id: 'canned',    name: 'Canned goods',   qty: 0, unit: 'cans',    low: 2, category: 'pantry' },
  { id: 'sp_kids',   name: 'Sour Patch Kids',qty: 0, unit: 'bags',    low: 1, category: 'pantry' },
  { id: 'cookies',   name: 'Cookies',        qty: 0, unit: 'count',   low: 3, category: 'pantry' },
  { id: 'snacks',    name: 'Snacks',         qty: 0, unit: 'count',   low: 3, category: 'pantry' },
]

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
  inventory: DEFAULT_INVENTORY,
  groceryExtra: [],
}

async function fetchState() {
  const { data } = await supabase.from('app_state').select('*').eq('id', 1).single()
  return data?.state || null
}

async function pushState(state) {
  await supabase.from('app_state').upsert({ id: 1, state, updated_at: new Date().toISOString() })
}

const compressImage = (file) => new Promise((resolve) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()
  img.onload = () => {
    const size = 160
    canvas.width = size; canvas.height = size
    const scale = Math.max(size / img.width, size / img.height)
    const w = img.width * scale, h = img.height * scale
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
    resolve(canvas.toDataURL('image/jpeg', 0.75))
  }
  img.src = URL.createObjectURL(file)
})

export default function Home() {
  const [state, setState]     = useState(null)
  const [view, setView]       = useState('board')
  const [me, setMe]           = useState(null)
  const [selectedTask, setTask] = useState(null)
  const [submitter, setSub]   = useState('Chyna')
  const [toast, setToast]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', qty: 1, unit: 'count', low: 2, category: 'fridge' })
  const [showAddItem, setShowAddItem] = useState(false)
  const [extraItem, setExtraItem] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    fetchState().then(s => {
      const loaded = s || DEFAULT_STATE
      if (!loaded.inventory) loaded.inventory = DEFAULT_INVENTORY
      if (!loaded.groceryExtra) loaded.groceryExtra = []
      setState(loaded); setLoading(false)
    })
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
    setToast({ msg, type }); setTimeout(() => setToast(null), 2800)
  }

  const handleAvatarUpload = async (file) => {
    if (!file || !me || me === 'fridge') return
    try {
      const compressed = await compressImage(file)
      update(s => ({ ...s, members: { ...s.members, [me]: { ...s.members[me], avatar: compressed } } }))
      toast$('Photo updated!', 'good')
    } catch { toast$('Upload failed', 'muted') }
  }

  const submitTask = () => {
    if (!selectedTask) return
    const task = TASKS.find(t => t.id === selectedTask)
    update(s => ({ ...s, pendingApprovals: [...s.pendingApprovals, { id: Date.now(), who: submitter, taskId: task.id, taskLabel: task.label, points: task.points }] }))
    setTask(null); toast$('Sent for approval! +' + task.points + ' pts', 'pending'); setView('board')
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
        log: [{ text: me + ' approved ' + item.who + ': +' + item.points + 'pt for "' + item.taskLabel + '"', ts: Date.now() }, ...s.log.slice(0, 29)],
      }
    }); toast$('Approved!', 'good')
  }

  const rejectTask = (pendingId) => {
    update(s => ({ ...s, pendingApprovals: s.pendingApprovals.filter(p => p.id !== pendingId) }))
    toast$('Removed', 'muted')
  }

  const claimWeeklyReward = (member) => {
    update(s => {
      if (s.members[member].weeklyRewardClaimed) return s
      return { ...s, members: { ...s.members, [member]: { ...s.members[member], weeklyRewardClaimed: true } }, log: [{ text: member + ' claimed weekly reward', ts: Date.now() }, ...s.log.slice(0, 29)] }
    }); toast$('Enjoy it, ' + member + '!', 'gold')
  }

  const resetWeek = () => {
    update(s => {
      const nm = {}; MEMBERS.forEach(m => { nm[m] = { ...s.members[m], weeklyRewardClaimed: false } })
      return { ...s, members: nm, week: s.week + 1, log: [{ text: 'Week ' + (s.week + 1) + ' started', ts: Date.now() }, ...s.log.slice(0,29)] }
    }); toast$('New week!', 'good')
  }

  const resetMonth = () => {
    update(s => ({ ...s, familyPoints: 0, month: s.month + 1, log: [{ text: 'Month ' + (s.month + 1) + ' started', ts: Date.now() }, ...s.log.slice(0,29)] }))
    toast$('New month!', 'good')
  }

  const updateQty = (id, delta) => {
    update(s => ({ ...s, inventory: s.inventory.map(item => item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item) }))
  }

  const addInventoryItem = () => {
    if (!newItem.name.trim()) return
    update(s => ({ ...s, inventory: [...s.inventory, { ...newItem, id: 'c_' + Date.now(), qty: Number(newItem.qty), low: Number(newItem.low) }] }))
    setNewItem({ name: '', qty: 1, unit: 'count', low: 2, category: 'fridge' }); setShowAddItem(false); toast$('Item added!', 'good')
  }

  const addExtraGrocery = () => {
    if (!extraItem.trim()) return
    update(s => ({ ...s, groceryExtra: [...(s.groceryExtra || []), { id: Date.now(), name: extraItem.trim(), done: false }] }))
    setExtraItem('')
  }

  const toggleExtraGrocery = (id) => {
    update(s => ({ ...s, groceryExtra: s.groceryExtra.map(i => i.id === id ? { ...i, done: !i.done } : i) }))
  }

  const clearDoneGroceries = () => {
    update(s => ({ ...s, groceryExtra: s.groceryExtra.filter(i => !i.done) }))
  }

  const Avatar = ({ member, size = 48 }) => {
    const avatar = state && state.members[member] && state.members[member].avatar
    const c = G[member]
    if (avatar) return <img src={avatar} alt={member} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '3px solid ' + c.main, flexShrink: 0, boxShadow: '0 2px 8px ' + c.main + '44' }} />
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: c.light, border: '3px solid ' + c.mid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, flexShrink: 0 }}>
        {EMOJIS[member]}
      </div>
    )
  }

  if (loading) return <div style={{ minHeight: '100svh', background: G.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: G.muted, fontFamily: 'Georgia, serif', fontSize: 18 }}>Loading...</div>

  if (!me && state) {
    return (
      <div style={{ minHeight: '100svh', background: G.bg, fontFamily: 'Georgia, serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 0 }}>
        <div style={{ fontSize: 52, marginBottom: 2 }}>🏡</div>
        <div style={{ fontSize: 34, fontWeight: 400, color: G.text, letterSpacing: 2, fontFamily: 'Georgia, serif', marginBottom: 4, textShadow: '1px 2px 0px ' + G.border }}>House Points</div>
        <div style={{ fontSize: 13, color: G.muted, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 28 }}>our little home</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280 }}>
          {MEMBERS.map(m => {
            const c = G[m]
            return (
              <button key={m} onClick={() => { setMe(m); setView('board') }} style={{
                background: c.light,
                border: '2px solid ' + c.mid,
                borderRadius: 20,
                padding: '14px 20px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: '0 3px 0px ' + c.mid,
              }}>
                <Avatar member={m} size={46} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: c.dark, fontFamily: 'Georgia, serif' }}>{m}</div>
                  <div style={{ fontSize: 11, color: c.main, marginTop: 1 }}>{state.members[m].points} pts · {REWARDS.weekly[m].split(' ').slice(0,3).join(' ')}...</div>
                </div>
              </button>
            )
          })}

          <div style={{ height: 1, background: G.border, margin: '4px 0' }} />

          <button onClick={() => { setMe('fridge'); setView('fridge') }} style={{
            background: G.sageLight,
            border: '2px solid ' + G.sage,
            borderRadius: 20, padding: '14px 20px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 3px 0px ' + G.sage + '88',
          }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: G.sage + '33', border: '3px solid ' + G.sage, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🛒</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: G.sage, fontFamily: 'Georgia, serif' }}>Fridge & Grocery</div>
              <div style={{ fontSize: 11, color: G.muted, marginTop: 1 }}>inventory · shopping list</div>
            </div>
          </button>
        </div>

        <div style={{ marginTop: 28, fontSize: 11, color: G.muted, letterSpacing: 1 }}>Week {state.week} · Month {state.month}</div>
      </div>
    )
  }

  if (me === 'fridge' && state) {
    const inventory = state.inventory || DEFAULT_INVENTORY
    const groceryExtra = state.groceryExtra || []
    const lowItems = inventory.filter(i => i.qty <= i.low)
    return (
      <div style={{ minHeight: '100svh', background: G.bg, color: G.text, fontFamily: 'Georgia, serif', paddingBottom: 32 }}>
        {toast && <div style={{ position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)', background: G.sage, color: '#fff', padding: '10px 24px', borderRadius: 99, fontWeight: 700, fontSize: 14, zIndex: 999, boxShadow: '0 4px 16px #0002', whiteSpace: 'nowrap', fontFamily: 'Georgia, serif' }}>{toast.msg}</div>}
        <div style={{ background: G.paper, borderBottom: '2px solid ' + G.border, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 8px ' + G.border + '88' }}>
          <div style={{ fontSize: 18, fontWeight: 400, color: G.text, fontFamily: 'Georgia, serif', letterSpacing: 1 }}>🛒 Fridge & Grocery</div>
          <button onClick={() => setMe(null)} style={{ background: G.sageLight, color: G.sage, border: '1.5px solid ' + G.sage, borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>← Back</button>
        </div>
        <div style={{ padding: '16px' }}>
          <div style={{ background: G.card, border: '2px solid ' + G.border, borderRadius: 20, padding: '16px 18px', marginBottom: 16, boxShadow: '0 3px 0 ' + G.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: G.text }}>Shopping list</div>
              {groceryExtra.some(i => i.done) && <button onClick={clearDoneGroceries} style={{ background: G.cream, color: G.muted, border: '1px solid ' + G.border, borderRadius: 99, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>Clear done</button>}
            </div>
            {lowItems.length === 0 && groceryExtra.length === 0 && <div style={{ color: G.muted, fontSize: 13, textAlign: 'center', padding: '12px 0' }}>All stocked up! ✨</div>}
            {lowItems.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: G.Chyna.main, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, marginBottom: 8 }}>Running low</div>
                {lowItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed ' + G.border }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 99, background: item.qty === 0 ? G.Chyna.main : G.gold, flexShrink: 0 }} />
                      <span style={{ fontSize: 14 }}>{item.name}</span>
                    </div>
                    <span style={{ background: item.qty === 0 ? G.Chyna.light : G.goldLight, color: item.qty === 0 ? G.Chyna.main : G.gold, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                      {item.qty === 0 ? 'Out' : item.qty + ' ' + item.unit + ' left'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {groceryExtra.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: G.muted, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, marginBottom: 8 }}>Extra items</div>
                {groceryExtra.map(i => (
                  <div key={i.id} onClick={() => toggleExtraGrocery(i.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px dashed ' + G.border, cursor: 'pointer' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: '2px solid ' + (i.done ? G.Jet.main : G.border), background: i.done ? G.Jet.main : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {i.done && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 14, textDecoration: i.done ? 'line-through' : 'none', color: i.done ? G.muted : G.text }}>{i.name}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input value={extraItem} onChange={e => setExtraItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addExtraGrocery()} placeholder="Add to list..." style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1.5px solid ' + G.border, background: G.bg, color: G.text, fontSize: 14, outline: 'none', fontFamily: 'Georgia, serif' }} />
              <button onClick={addExtraGrocery} style={{ background: G.sage, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Add</button>
            </div>
          </div>

          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: G.text }}>Inventory</div>
          {['fridge', 'pantry'].map(cat => (
            <div key={cat} style={{ background: G.card, border: '2px solid ' + G.border, borderRadius: 20, padding: '16px 18px', marginBottom: 14, boxShadow: '0 3px 0 ' + G.border }}>
              <div style={{ fontSize: 11, color: G.sage, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, marginBottom: 12 }}>{cat === 'fridge' ? '❄️ Fridge' : '🌾 Pantry'}</div>
              {inventory.filter(i => i.category === cat).map(item => {
                const isLow = item.qty <= item.low
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px dashed ' + G.border }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: isLow ? 700 : 400, color: isLow ? G.Chyna.main : G.text }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: G.muted }}>{item.qty} {item.unit}{isLow ? ' · low' : ''}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => updateQty(item.id, -1)} style={{ width: 32, height: 32, borderRadius: 10, border: '1.5px solid ' + G.border, background: G.bg, color: G.text, fontSize: 18, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ fontSize: 15, fontWeight: 800, minWidth: 22, textAlign: 'center', color: isLow ? G.Chyna.main : G.text }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: G.sage, color: '#fff', fontSize: 18, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          {showAddItem ? (
            <div style={{ background: G.card, border: '2px solid ' + G.border, borderRadius: 20, padding: '16px 18px', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>New item</div>
              <input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Item name" style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid ' + G.border, background: G.bg, color: G.text, fontSize: 14, marginBottom: 10, outline: 'none', boxSizing: 'border-box', fontFamily: 'Georgia, serif' }} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input type="number" value={newItem.qty} onChange={e => setNewItem({ ...newItem, qty: e.target.value })} placeholder="Qty" style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1.5px solid ' + G.border, background: G.bg, color: G.text, fontSize: 14, outline: 'none' }} />
                <input value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} placeholder="Unit" style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1.5px solid ' + G.border, background: G.bg, color: G.text, fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input type="number" value={newItem.low} onChange={e => setNewItem({ ...newItem, low: e.target.value })} placeholder="Alert at" style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1.5px solid ' + G.border, background: G.bg, color: G.text, fontSize: 14, outline: 'none' }} />
                <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1.5px solid ' + G.border, background: G.bg, color: G.text, fontSize: 14, outline: 'none' }}>
                  <option value="fridge">Fridge</option>
                  <option value="pantry">Pantry</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addInventoryItem} style={{ background: G.sage, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', flex: 1 }}>Add</button>
                <button onClick={() => setShowAddItem(false)} style={{ background: G.cream, color: G.muted, border: '1px solid ' + G.border, borderRadius: 12, padding: '10px 18px', fontSize: 14, cursor: 'pointer', flex: 1 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddItem(true)} style={{ background: G.sageLight, color: G.sage, border: '2px dashed ' + G.sage, borderRadius: 16, padding: 14, width: '100%', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 16, fontFamily: 'Georgia, serif' }}>+ Add new item</button>
          )}
        </div>
      </div>
    )
  }

  if (!state) return null

  const familyPct = Math.min(100, Math.round((state.familyPoints / FAMILY_GOAL) * 100))
  const goalMet   = state.familyPoints >= FAMILY_GOAL
  const pending   = state.pendingApprovals.length
  const MC        = G[me] || G.Chyna
  const inventory = state.inventory || DEFAULT_INVENTORY
  const groceryExtra = state.groceryExtra || []
  const lowItems  = inventory.filter(i => i.qty <= i.low)

  const navItems = [
    { id: 'board',   icon: '🏠', label: 'Home' },
    { id: 'tasks',   icon: '✅', label: 'Log Task' },
    { id: 'approve', icon: '👍', label: pending > 0 ? 'Approve (' + pending + ')' : 'Approve' },
    { id: 'rewards', icon: '🎁', label: 'Rewards' },
  ]

  const card = (extra) => ({ background: G.card, border: '2px solid ' + G.border, borderRadius: 20, padding: '16px 18px', marginBottom: 14, boxShadow: '0 3px 0 ' + G.border, ...extra })
  const pill = (bg, color) => ({ display: 'inline-block', background: bg, color: color, borderRadius: 99, padding: '3px 12px', fontSize: 12, fontWeight: 700 })

  const Avatar = ({ member, size = 48 }) => {
    const avatar = state.members[member] && state.members[member].avatar
    const c = G[member]
    if (avatar) return <img src={avatar} alt={member} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '3px solid ' + c.main, flexShrink: 0, boxShadow: '0 2px 8px ' + c.main + '44' }} />
    return <div style={{ width: size, height: size, borderRadius: '50%', background: c.light, border: '3px solid ' + c.mid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, flexShrink: 0 }}>{EMOJIS[member]}</div>
  }

  const toastBg = { good: G.Jet.main, pending: G.gold, gold: G.terracotta, muted: G.muted }

  if (showProfile) {
    return (
      <div style={{ minHeight: '100svh', background: G.bg, fontFamily: 'Georgia, serif', color: G.text }}>
        <div style={{ background: G.paper, borderBottom: '2px solid ' + G.border, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 8px ' + G.border + '88' }}>
          <div style={{ fontSize: 16, fontWeight: 400, letterSpacing: 1 }}>Profile</div>
          <button onClick={() => setShowProfile(false)} style={{ background: MC.light, color: MC.dark, border: '1.5px solid ' + MC.mid, borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Done</button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative' }}>
            <Avatar member={me} size={110} />
            <label style={{ position: 'absolute', bottom: 4, right: 4, width: 32, height: 32, borderRadius: '50%', background: MC.main, border: '2px solid ' + G.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15 }}>
              📷
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleAvatarUpload(e.target.files[0])} />
            </label>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: MC.dark }}>{EMOJIS[me]} {me}</div>
            <div style={{ fontSize: 14, color: G.muted, marginTop: 4 }}>Tap the camera to change your photo</div>
          </div>
          <div style={{ ...card(), width: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Your rewards</div>
            <div style={{ fontSize: 13, color: G.text, marginBottom: 8 }}>🍬 Daily: <span style={{ color: MC.main, fontWeight: 700 }}>{REWARDS.daily[me]}</span></div>
            <div style={{ fontSize: 13, color: G.text, marginBottom: 8 }}>⭐ Weekly: <span style={{ color: MC.main, fontWeight: 700 }}>{REWARDS.weekly[me]}</span></div>
            <div style={{ fontSize: 13, color: G.text }}>🎬 Monthly: <span style={{ color: G.gold, fontWeight: 700 }}>family outing or movie night</span></div>
          </div>
          <div style={{ ...card(), width: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Your must-dos this week</div>
            {WEEKLY_BASELINE[me].map(tid => {
              const task = TASKS.find(t => t.id === tid)
              return task ? <div key={tid} style={{ fontSize: 13, color: G.text, padding: '5px 0', borderBottom: '1px dashed ' + G.border }}>· {task.label}</div> : null
            })}
          </div>
          <button onClick={() => { setMe(null); setShowProfile(false) }} style={{ background: G.cream, color: G.muted, border: '1.5px solid ' + G.border, borderRadius: 16, padding: '12px 0', width: '100%', fontSize: 14, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>Switch person</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100svh', background: G.bg, color: G.text, fontFamily: 'Georgia, serif', paddingBottom: 80 }}>
      {toast && <div style={{ position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)', background: toastBg[toast.type] || G.Jet.main, color: '#fff', padding: '10px 24px', borderRadius: 99, fontWeight: 700, fontSize: 14, zIndex: 999, boxShadow: '0 4px 16px #0002', whiteSpace: 'nowrap', fontFamily: 'Georgia, serif' }}>{toast.msg}</div>}

      <div style={{ background: G.paper, borderBottom: '2px solid ' + G.border, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 8px ' + G.border + '88' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 400, color: G.text, letterSpacing: 2, fontFamily: 'Georgia, serif' }}>🏡 House Points</div>
          <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1 }}>week {state.week} · month {state.month}{syncing ? ' · saving...' : ''}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: G.muted }}>family pot</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: goalMet ? G.gold : G.text }}>{state.familyPoints}<span style={{ fontSize: 11, color: G.muted, fontWeight: 400 }}>/{FAMILY_GOAL}</span></div>
          </div>
          <button onClick={() => setShowProfile(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
            <Avatar member={me} size={38} />
          </button>
        </div>
      </div>

      {view === 'board' && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ ...card(), background: goalMet ? G.goldLight : G.card, borderColor: goalMet ? G.gold : G.border }}>
            <div style={{ fontSize: 10, color: G.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Family goal · month {state.month}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 38, fontWeight: 700, color: goalMet ? G.gold : G.text }}>{state.familyPoints}</span>
              <span style={{ color: G.muted, fontSize: 15 }}>/ {FAMILY_GOAL} pts</span>
              {goalMet && <span style={{ ...pill(G.gold, G.paper), fontSize: 11 }}>Goal hit! 🎉</span>}
            </div>
            <div style={{ height: 10, background: G.border, borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ height: '100%', width: familyPct + '%', background: goalMet ? G.gold : G.terracotta, borderRadius: 99, transition: 'width .5s ease' }} />
            </div>
            {goalMet && <div style={{ fontSize: 14, color: G.text, marginBottom: 12 }}>🎬 {REWARDS.monthly}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={resetWeek} style={{ background: G.cream, color: G.muted, border: '1px solid ' + G.border, borderRadius: 12, padding: '8px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>End week</button>
              {goalMet && <button onClick={resetMonth} style={{ background: G.gold, color: '#fff', border: 'none', borderRadius: 12, padding: '8px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 700 }}>Start new month</button>}
            </div>
          </div>

          {MEMBERS.map(m => {
            const mem = state.members[m]; const c = G[m]
            return (
              <div key={m} style={{ ...card(), borderColor: c.mid, borderLeftWidth: 4, borderLeftColor: c.main }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar member={m} size={50} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 17, color: c.dark }}>{m} {m === me && <span style={{ fontSize: 11, color: G.muted, fontWeight: 400 }}>(you)</span>}</div>
                      <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>Weekly: {REWARDS.weekly[m]}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: c.main }}>{mem.points}</div>
                    <div style={{ fontSize: 10, color: G.muted }}>pts</div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  {!mem.weeklyRewardClaimed
                    ? <button onClick={() => claimWeeklyReward(m)} style={{ background: c.light, color: c.dark, border: '1.5px solid ' + c.mid, borderRadius: 12, padding: '8px 16px', fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 700 }}>Claim weekly reward ✨</button>
                    : <span style={pill(c.light, c.main)}>✓ Reward claimed this week</span>
                  }
                </div>
              </div>
            )
          })}

          {pending > 0 && (
            <div style={{ ...card(), borderColor: G.gold }}>
              <div style={{ fontSize: 10, color: G.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Waiting for approval ({pending})</div>
              {state.pendingApprovals.map(p => (
                <div key={p.id} style={{ fontSize: 13, color: G.muted, padding: '5px 0', borderBottom: '1px dashed ' + G.border }}>
                  <span style={{ color: G[p.who].main, fontWeight: 700 }}>{p.who}</span> · {p.taskLabel} <span style={pill(G.goldLight, G.gold)}>+{p.points}</span>
                </div>
              ))}
            </div>
          )}

          {state.log.length > 0 && (
            <div style={card()}>
              <div style={{ fontSize: 10, color: G.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Recent activity</div>
              {state.log.slice(0, 5).map((l, i) => <div key={i} style={{ fontSize: 12, color: G.muted, padding: '3px 0' }}>· {l.text}</div>)}
            </div>
          )}
        </div>
      )}

      {view === 'tasks' && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontSize: 18, fontWeight: 400, letterSpacing: 1, marginBottom: 16 }}>Log a task</div>
          <div style={card()}>
            <div style={{ fontSize: 10, color: G.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Who did it?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {MEMBERS.map(m => (
                <button key={m} onClick={() => setSub(m)} style={{ flex: 1, padding: '10px 4px', borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', background: submitter === m ? G[m].main : G[m].light, color: submitter === m ? '#fff' : G[m].dark, border: '2px solid ' + G[m].mid }}>
                  {EMOJIS[m]} {m}
                </button>
              ))}
            </div>
          </div>
          <div style={card()}>
            <div style={{ fontSize: 10, color: G.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Pick the task</div>
            {['daily','weekly','biweekly','asneeded','monthly'].map(type => {
              const list = TASKS.filter(t => t.type === type); if (!list.length) return null
              return (
                <div key={type}>
                  <div style={{ fontSize: 10, color: G.terracotta, fontWeight: 700, marginTop: 14, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.5 }}>{TYPE_LABEL[type]}</div>
                  {list.map(t => {
                    const sel = selectedTask === t.id
                    const pts = t.points
                    const ptColor = pts >= 3 ? G.Chyna.main : pts === 2 ? G.Joe.main : G.Jet.main
                    const ptLight = pts >= 3 ? G.Chyna.light : pts === 2 ? G.Joe.light : G.Jet.light
                    return (
                      <div key={t.id} onClick={() => setTask(t.id)} style={{ background: sel ? G.terracottaLight : G.bg, border: '1.5px solid ' + (sel ? G.terracotta : G.border), borderRadius: 14, padding: '11px 14px', marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: sel ? 700 : 400, color: sel ? G.terracotta : G.text }}>{t.label}</div>
                          {(t.desc || t.who !== 'all') && <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>{t.desc ? t.desc + ' · ' : ''}👤 {t.who}</div>}
                        </div>
                        <span style={pill(ptLight, ptColor)}>+{pts} pt{pts !== 1 ? 's' : ''}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
          <button onClick={submitTask} disabled={!selectedTask} style={{ background: selectedTask ? G.terracotta : G.border, color: selectedTask ? '#fff' : G.muted, border: 'none', borderRadius: 16, padding: 16, width: '100%', fontSize: 16, fontWeight: 700, cursor: selectedTask ? 'pointer' : 'default', opacity: selectedTask ? 1 : 0.5, marginBottom: 16, fontFamily: 'Georgia, serif', boxShadow: selectedTask ? '0 3px 0 ' + G.Chyna.dark + '55' : 'none' }}>Send for approval →</button>
        </div>
      )}

      {view === 'approve' && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontSize: 18, fontWeight: 400, letterSpacing: 1, marginBottom: 4 }}>Approve tasks</div>
          <div style={{ fontSize: 13, color: G.muted, marginBottom: 16 }}>You can only approve someone else's task.</div>
          {pending === 0
            ? <div style={{ ...card(), textAlign: 'center', color: G.muted, padding: 40, fontSize: 15 }}>Nothing waiting 🌿</div>
            : state.pendingApprovals.map(p => {
                const canApprove = p.who !== me; const c = G[p.who]
                return (
                  <div key={p.id} style={card()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <Avatar member={p.who} size={34} />
                          <span style={{ fontWeight: 700, color: c.main, fontSize: 16 }}>{p.who}</span>
                        </div>
                        <div style={{ fontSize: 14, marginBottom: 8 }}>{p.taskLabel}</div>
                        <span style={pill(c.light, c.dark)}>+{p.points} pts</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button disabled={!canApprove} onClick={() => approveTask(p.id)} style={{ background: canApprove ? G.Jet.main : G.border, color: canApprove ? '#fff' : G.muted, border: 'none', borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: canApprove ? 'pointer' : 'default', opacity: canApprove ? 1 : 0.4, fontFamily: 'Georgia, serif' }}>✓ Approve</button>
                        <button onClick={() => rejectTask(p.id)} style={{ background: G.cream, color: G.muted, border: '1px solid ' + G.border, borderRadius: 12, padding: '8px 16px', fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>Remove</button>
                      </div>
                    </div>
                    {!canApprove && <div style={{ fontSize: 12, color: G.Chyna.main, marginTop: 10 }}>Ask {MEMBERS.filter(m => m !== p.who).join(' or ')} to approve this</div>}
                  </div>
                )
              })
          }
        </div>
      )}

      {view === 'rewards' && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontSize: 18, fontWeight: 400, letterSpacing: 1, marginBottom: 16 }}>Rewards</div>
          <div style={card()}>
            <div style={{ fontSize: 10, color: G.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>🍬 Daily — just show up</div>
            {MEMBERS.map(m => (
              <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: '10px 12px', background: G[m].light, borderRadius: 14 }}>
                <Avatar member={m} size={38} />
                <div>
                  <div style={{ fontWeight: 700, color: G[m].dark }}>{m}</div>
                  <div style={{ fontSize: 13, color: G[m].main }}>{REWARDS.daily[m]}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={card()}>
            <div style={{ fontSize: 10, color: G.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>⭐ Weekly — hit your must-dos</div>
            {MEMBERS.map(m => (
              <div key={m} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px dashed ' + G.border }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Avatar member={m} size={34} />
                  <span style={{ fontWeight: 700, color: G[m].dark }}>{m}</span>
                </div>
                <div style={{ fontSize: 14, color: G[m].main, fontWeight: 600, marginBottom: 5 }}>{REWARDS.weekly[m]}</div>
                <div style={{ fontSize: 11, color: G.muted }}>{WEEKLY_BASELINE[m].map(tid => TASKS.find(t => t.id === tid) && TASKS.find(t => t.id === tid).label).filter(Boolean).join(' · ')}</div>
              </div>
            ))}
          </div>
          <div style={{ ...card(), background: G.goldLight, borderColor: G.gold }}>
            <div style={{ fontSize: 10, color: G.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>🎬 Monthly — family goal</div>
            <div style={{ fontSize: 34, fontWeight: 700, color: G.gold }}>{state.familyPoints}<span style={{ fontSize: 16, color: G.muted, fontWeight: 400 }}>/{FAMILY_GOAL}</span></div>
            <div style={{ height: 10, background: G.border, borderRadius: 99, overflow: 'hidden', margin: '10px 0' }}>
              <div style={{ height: '100%', width: familyPct + '%', background: G.gold, borderRadius: 99, transition: 'width .5s' }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: G.text }}>{REWARDS.monthly}</div>
            {goalMet && <div style={{ marginTop: 8, fontWeight: 700, color: G.gold }}>You earned it this month! 🎉</div>}
          </div>
        </div>
      )}

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: G.paper, borderTop: '2px solid ' + G.border, display: 'flex', zIndex: 100, boxShadow: '0 -2px 12px ' + G.border + '88' }}>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setView(n.id)} style={{ flex: 1, padding: '10px 4px 12px', background: 'none', border: 'none', color: view === n.id ? G.terracotta : G.muted, fontSize: 9, fontWeight: view === n.id ? 800 : 400, cursor: 'pointer', borderTop: view === n.id ? '3px solid ' + G.terracotta : '3px solid transparent', fontFamily: 'Georgia, serif', letterSpacing: 0.5 }}>
            <div style={{ fontSize: 21 }}>{n.icon}</div>
            <div>{n.label}</div>
          </button>
        ))}
      </nav>
    </div>
  )
}
