import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './App.module.css'
 
// ─── Utility ────────────────────────────────────────────────────────────────
function getGrade(pct) {
  if (pct >= 90) return { label: 'A — Outstanding', cls: 'gradeA' }
  if (pct >= 80) return { label: 'B — Great',       cls: 'gradeB' }
  if (pct >= 70) return { label: 'C — Good',        cls: 'gradeC' }
  if (pct >= 60) return { label: 'D — Needs Work',  cls: 'gradeD' }
  return               { label: 'F — Keep Trying',  cls: 'gradeF' }
}
 
const GRADE_COLORS = {
  gradeA: ['#00ffaa', '#00c8ff'],
  gradeB: ['#7bff00', '#00ffaa'],
  gradeC: ['#ffd700', '#ff9500'],
  gradeD: ['#ff6b35', '#ffd700'],
  gradeF: ['#ff3366', '#ff6b35'],
}
 
// ─── Calculator Tab ──────────────────────────────────────────────────────────
function Calculator() {
  const [scored, setScored]   = useState('')
  const [maxPts, setMaxPts]   = useState('')
  const [history, setHistory] = useState([])
  const timerRef = useRef(null)
 
  const pct = scored !== '' && maxPts !== '' && Number(maxPts) > 0
    ? Math.round((Number(scored) / Number(maxPts)) * 10000) / 100
    : null
 
  const grade = pct !== null ? getGrade(pct) : null
 
  // Auto-save to history 0.8 s after last keystroke
  useEffect(() => {
    if (pct === null) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setHistory(prev => {
        const entry = { scored, maxPts, pct, grade: grade.label, time: new Date().toLocaleTimeString() }
        return [entry, ...prev].slice(0, 10)
      })
    }, 800)
    return () => clearTimeout(timerRef.current)
  }, [scored, maxPts, pct])  // eslint-disable-line
 
  const barWidth  = pct !== null ? Math.min(pct, 100) : 0
  const barColors = grade ? GRADE_COLORS[grade.cls] : ['#00ffaa', '#00c8ff']
 
  return (
    <div className={styles.calcSection}>
      {/* Input card */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>// Calculate Percentage</div>
        <div className={styles.inputRow}>
          <div className={styles.inputGroup}>
            <label>Points Scored</label>
            <input
              type="number" min="0" placeholder="e.g. 78"
              value={scored} onChange={e => setScored(e.target.value)}
            />
          </div>
          <div className={styles.slash}>/</div>
          <div className={styles.inputGroup}>
            <label>Maximum Points</label>
            <input
              type="number" min="1" placeholder="e.g. 100"
              value={maxPts} onChange={e => setMaxPts(e.target.value)}
            />
          </div>
        </div>
 
        {/* Result */}
        <div className={styles.resultDisplay}>
          <div className={`${styles.resultPct} ${grade ? styles[grade.cls] : styles.empty}`}>
            {pct !== null ? `${pct.toFixed(2)}%` : '—%'}
          </div>
          <div className={styles.resultGrade}>
            {grade ? grade.label : 'Enter your score above'}
          </div>
          <div className={styles.progressWrap}>
            <div
              className={styles.progressBar}
              style={{
                width: `${barWidth}%`,
                background: `linear-gradient(90deg, ${barColors[0]}, ${barColors[1]})`
              }}
            />
          </div>
        </div>
 
        {/* Quick presets */}
        <div className={styles.presets}>
          <span className={styles.presetLabel}>Max:</span>
          {[10, 20, 50, 100, 120].map(v => (
            <button key={v} className={styles.presetBtn} onClick={() => setMaxPts(String(v))}>
              {v}
            </button>
          ))}
        </div>
      </div>
 
      {/* History card */}
      <div className={styles.card}>
        <div className={styles.historyHeader}>
          <div className={styles.cardTitle} style={{ margin: 0 }}>// History</div>
          <button className={styles.clearBtn} onClick={() => setHistory([])}>Clear</button>
        </div>
        <div className={styles.historyList}>
          {history.length === 0
            ? <div className={styles.emptyMsg}>No calculations yet.</div>
            : history.map((h, i) => {
                const g = getGrade(h.pct)
                const color = GRADE_COLORS[g.cls][0]
                return (
                  <div key={i} className={styles.historyItem}>
                    <span className={styles.historyScore}>{h.scored} / {h.maxPts}</span>
                    <span className={styles.historyTime}>{h.time}</span>
                    <span className={styles.historyPct} style={{ color }}>{h.pct.toFixed(2)}%</span>
                  </div>
                )
              })
          }
        </div>
      </div>
    </div>
  )
}
 
// ─── Mini Game ───────────────────────────────────────────────────────────────
const W = 800, H = 450
const NUMS = ['0','1','2','3','4','5','6','7','8','9']
 
function rand(min, max) { return min + Math.random() * (max - min) }
 
function Game() {
  const canvasRef  = useRef(null)
  const stateRef   = useRef(null)
  const animRef    = useRef(null)
  const keysRef    = useRef({})
  const touchRef   = useRef({ x: 0, y: 0 })
 
  const [ui, setUi] = useState({ score: 0, lives: 3, level: 1, started: false, over: false })
 
  // Keyboard
  useEffect(() => {
    const down = e => {
      keysRef.current[e.key] = true
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault()
    }
    const up = e => { keysRef.current[e.key] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])
 
  const startGame = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
 
    stateRef.current = {
      score: 0, lives: 3, level: 1,
      player: { x: W / 2, y: H - 80, size: 22, vx: 0, vy: 0, invincible: 0 },
      numbers: [], particles: [],
      spawnTimer: 0, spawnInterval: 90,
      scoreTimer: 0, t: 0, over: false,
    }
    setUi({ score: 0, lives: 3, level: 1, started: true, over: false })
    loop()
  }, []) // eslint-disable-line
 
  function spawnNumber(gs) {
    const isBonus  = Math.random() < 0.08
    const speed    = 1.5 + gs.level * 0.5 + Math.random() * 1.5
    const size     = 18 + Math.floor(Math.random() * 18)
    gs.numbers.push({
      x: rand(30, W - 30), y: -30,
      vx: rand(-0.6, 0.6), vy: speed,
      char: isBonus ? '✦' : (Math.random() < 0.15
        ? (Math.floor(Math.random() * 99 + 1) + '%')
        : NUMS[Math.floor(Math.random() * NUMS.length)]),
      size, isBonus,
      color: isBonus ? '#ffd700' : `hsl(${rand(340, 400)}, 80%, 65%)`,
      rotation: 0, rotSpeed: rand(-0.06, 0.06),
    })
  }
 
  function spawnParticles(gs, x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + rand(0, 0.5)
      const speed = rand(2, 6)
      gs.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color, life: 1, size: rand(3, 7) })
    }
  }
 
  const loop = useCallback(() => {
    const gs  = stateRef.current
    const cvs = canvasRef.current
    if (!gs || !cvs) return
    const ctx = cvs.getContext('2d')
    const keys = keysRef.current
    gs.t++
 
    // Player movement
    const p = gs.player, spd = 4.5
    if (keys['ArrowLeft']  || keys['a'] || keys['A']) p.vx = -spd
    else if (keys['ArrowRight'] || keys['d'] || keys['D']) p.vx = spd
    else p.vx *= 0.7
    if (keys['ArrowUp']    || keys['w'] || keys['W']) p.vy = -spd
    else if (keys['ArrowDown']  || keys['s'] || keys['S']) p.vy = spd
    else p.vy *= 0.7
    p.x = Math.max(p.size, Math.min(W - p.size, p.x + p.vx))
    p.y = Math.max(p.size, Math.min(H - p.size, p.y + p.vy))
    if (p.invincible > 0) p.invincible--
 
    // Score
    gs.scoreTimer++
    if (gs.scoreTimer % 60 === 0) gs.score++
 
    // Level
    const newLevel = Math.floor(gs.score / 15) + 1
    if (newLevel !== gs.level) {
      gs.level = newLevel
      gs.spawnInterval = Math.max(20, 90 - gs.level * 8)
      spawnParticles(gs, p.x, p.y, '#00ffaa', 20)
    }
 
    // Spawn
    gs.spawnTimer++
    if (gs.spawnTimer >= gs.spawnInterval) {
      gs.spawnTimer = 0
      spawnNumber(gs)
      if (gs.level > 3) spawnNumber(gs)
    }
 
    // Update numbers
    gs.numbers = gs.numbers.filter(n => {
      n.x += n.vx; n.y += n.vy; n.rotation += n.rotSpeed
      if (p.invincible === 0) {
        const dx = n.x - p.x, dy = n.y - p.y
        if (Math.sqrt(dx*dx + dy*dy) < n.size * 0.6 + p.size * 0.5) {
          if (n.isBonus) {
            gs.score += 5
            spawnParticles(gs, n.x, n.y, '#ffd700', 15)
          } else {
            gs.lives--
            p.invincible = 90
            spawnParticles(gs, p.x, p.y, '#ff3366', 15)
            if (gs.lives <= 0) gs.over = true
          }
          return false
        }
      }
      return n.y < H + 50
    })
 
    // Particles
    gs.particles = gs.particles.filter(pt => {
      pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.15; pt.life -= 0.025
      return pt.life > 0
    })
 
    // ── Draw ──
    ctx.clearRect(0, 0, W, H)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
    bgGrad.addColorStop(0, '#0a0a14'); bgGrad.addColorStop(1, '#0d0d1e')
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H)
 
    ctx.fillStyle = 'rgba(0,255,170,0.05)'
    for (let gx = 0; gx < W; gx += 40)
      for (let gy = 0; gy < H; gy += 40) {
        ctx.beginPath(); ctx.arc(gx, gy, 1, 0, Math.PI * 2); ctx.fill()
      }
 
    // Particles
    gs.particles.forEach(pt => {
      ctx.globalAlpha = pt.life
      ctx.fillStyle = pt.color
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, Math.PI * 2); ctx.fill()
    })
    ctx.globalAlpha = 1
 
    // Numbers
    gs.numbers.forEach(n => {
      ctx.save()
      ctx.translate(n.x, n.y); ctx.rotate(n.rotation)
      ctx.font = `bold ${n.size}px 'Courier New', monospace`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.shadowColor = n.color; ctx.shadowBlur = n.isBonus ? 20 : 8
      ctx.fillStyle = n.color; ctx.fillText(n.char, 0, 0)
      ctx.shadowBlur = 0; ctx.restore()
    })
 
    // Player
    const alpha = p.invincible > 0 ? (Math.floor(gs.t / 6) % 2 === 0 ? 0.3 : 0.9) : 1
    ctx.globalAlpha = alpha
    ctx.save(); ctx.translate(p.x, p.y)
    const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2)
    pg.addColorStop(0, 'rgba(0,255,170,0.3)'); pg.addColorStop(1, 'rgba(0,255,170,0)')
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2); ctx.fill()
    ctx.font = `bold ${p.size * 1.5}px 'Courier New', monospace`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.shadowColor = '#00ffaa'; ctx.shadowBlur = 20
    ctx.fillStyle = '#00ffaa'; ctx.fillText('%', 0, 0)
    ctx.shadowBlur = 0; ctx.restore(); ctx.globalAlpha = 1
 
    // Game Over overlay
    if (gs.over) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, H)
      ctx.textAlign = 'center'
      ctx.font = "bold 56px Impact, 'Arial Black', sans-serif"
      ctx.fillStyle = '#ff3366'; ctx.shadowColor = '#ff3366'; ctx.shadowBlur = 30
      ctx.fillText('GAME OVER', W/2, H/2 - 30)
      ctx.shadowBlur = 0; ctx.font = "24px 'Courier New', monospace"; ctx.fillStyle = '#e8e8f0'
      ctx.fillText(`Score: ${gs.score}  |  Level: ${gs.level}`, W/2, H/2 + 20)
      ctx.font = "14px 'Courier New', monospace"; ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.fillText('Press START to play again', W/2, H/2 + 60)
      setUi({ score: gs.score, lives: 0, level: gs.level, started: true, over: true })
      return
    }
 
    // Sync UI every 30 frames
    if (gs.t % 30 === 0) setUi({ score: gs.score, lives: gs.lives, level: gs.level, started: true, over: false })
 
    animRef.current = requestAnimationFrame(loop)
  }, [])
 
  // Idle canvas
  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(0,255,170,0.05)'
    for (let gx = 0; gx < W; gx += 40)
      for (let gy = 0; gy < H; gy += 40) {
        ctx.beginPath(); ctx.arc(gx, gy, 1, 0, Math.PI * 2); ctx.fill()
      }
    ctx.font = "bold 100px 'Courier New', monospace"
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(0,255,170,0.12)'
    ctx.fillText('%', W/2, H/2 + 36)
    ctx.font = "16px 'Courier New', monospace"; ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fillText('Press START to begin', W/2, H/2 + 90)
  }, [])
 
  // Touch controls
  const handleTouchStart = e => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    e.preventDefault()
  }
  const handleTouchMove = e => {
    const dx = e.touches[0].clientX - touchRef.current.x
    const dy = e.touches[0].clientY - touchRef.current.y
    keysRef.current['ArrowLeft']  = dx < -10
    keysRef.current['ArrowRight'] = dx > 10
    keysRef.current['ArrowUp']    = dy < -10
    keysRef.current['ArrowDown']  = dy > 10
    e.preventDefault()
  }
  const handleTouchEnd = () => {
    keysRef.current['ArrowLeft'] = keysRef.current['ArrowRight'] =
    keysRef.current['ArrowUp']   = keysRef.current['ArrowDown'] = false
  }
 
  return (
    <div className={styles.gameSection}>
      <div className={styles.gameUi}>
        <div className={styles.gameStat}>
          <div className={styles.gameStatLabel}>Score</div>
          <div className={styles.gameStatValue}>{ui.score}</div>
        </div>
        <div className={styles.gameStat}>
          <div className={styles.gameStatLabel}>Lives</div>
          <div className={styles.livesDisplay}>
            {[0,1,2].map(i => (
              <span key={i} className={`${styles.lifeIcon} ${i >= ui.lives ? styles.lifeLost : ''}`}>💚</span>
            ))}
          </div>
        </div>
        <div className={styles.gameStat}>
          <div className={styles.gameStatLabel}>Level</div>
          <div className={styles.gameStatValue}>{ui.level}</div>
        </div>
        <button className={styles.gameBtn} onClick={startGame}>
          {ui.started ? 'Restart' : 'Start'}
        </button>
      </div>
 
      <canvas
        ref={canvasRef}
        width={W} height={H}
        className={styles.gameCanvas}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <div className={styles.gameInstructions}>
        Arrow keys / WASD to move — you are <strong style={{ color: 'var(--accent)' }}>%</strong> — dodge the falling numbers!
        <br /><span style={{ opacity: 0.6 }}>On mobile: swipe to move</span>
      </div>
    </div>
  )
}
 
// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('calc')
 
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logo}>PERCEN<span>%</span>A</div>
        <div className={styles.tagline}>Percentage Calculator &amp; Mini Game</div>
      </header>
 
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'calc' ? styles.tabActive : ''}`} onClick={() => setTab('calc')}>
          📊 Calculator
        </button>
        <button className={`${styles.tab} ${tab === 'game' ? styles.tabActive : ''}`} onClick={() => setTab('game')}>
          🎮 Mini Game
        </button>
      </div>
 
      {tab === 'calc' ? <Calculator /> : <Game />}
    </div>
  )
}
