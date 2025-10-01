import React, { useState, useEffect, useRef } from 'react';
import { Skull, Heart, Zap, Shield, Sword, TrendingUp, Pause, Play, BookOpen, Target, Wand2, Trophy } from 'lucide-react';

const SUPABASE_URL = 'https://dxxdombyxfubsbdcdwse.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4eGRvbWJ5eGZ1YnNiZGNkd3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNjk2MTUsImV4cCI6MjA3NDg0NTYxNX0.LYNdlSa5Ny84K0warzKAk6y1y9jeEyeFwvNYlla_Y9s';

const VampireSurvivor = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // menu, classSelect, firstPerk, playing, levelup, dead, paused
  const [selectedClass, setSelectedClass] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [difficultyTier, setDifficultyTier] = useState('TRIVIAL');
  const [expPercent, setExpPercent] = useState(0);
  const [hpPercent, setHpPercent] = useState(100);
  const [highscores, setHighscores] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const playerRef = useRef({
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    size: 20,
    hp: 100,
    maxHp: 100,
    exp: 0,
    level: 1,
    expToNext: 5,
    class: null,
    invulnerable: false,
    lastHit: 0,
    stats: {
      damage: 10,
      attackSpeed: 1,
      critChance: 5,
      critDamage: 150,
      armor: 0,
      dodge: 0,
      lifesteal: 0,
      movementSpeed: 3,
      projectileSpeed: 5,
      projectileSize: 1,
      pierce: 0,
      pickupRange: 50,
      maxHp: 100,
      hpRegen: 0,
      attackRange: 300
    },
    perksChosen: []
  });
  
  const gameRef = useRef({
    enemies: [],
    projectiles: [],
    xpOrbs: [],
    lastShot: 0,
    keys: {},
    lastRegen: 0,
    enemySpawnRate: 2000,
    lastSpawn: 0,
    frameCount: 0
  });
  
  const [levelUpOptions, setLevelUpOptions] = useState([]);
  
  const getDifficultyTier = (level) => {
    if (level <= 3) return { name: 'TRIVIAL', color: '#10b981', bg: '#064e3b' };
    if (level <= 6) return { name: 'EASY', color: '#3b82f6', bg: '#1e3a8a' };
    if (level <= 9) return { name: 'MODERATE', color: '#eab308', bg: '#713f12' };
    if (level <= 12) return { name: 'CHALLENGING', color: '#f97316', bg: '#7c2d12' };
    if (level <= 15) return { name: 'HARD', color: '#ef4444', bg: '#7f1d1d' };
    if (level <= 18) return { name: 'BRUTAL', color: '#dc2626', bg: '#450a0a' };
    if (level <= 21) return { name: 'NIGHTMARE', color: '#991b1b', bg: '#1a0000' };
    if (level <= 24) return { name: 'HELL', color: '#7f1d1d', bg: '#000000' };
    return { name: 'IMPOSSIBLE', color: '#000000', bg: '#ff0000' };
  };
  
  // Fetch highscores from Supabase
  const fetchHighscores = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/highscores?select=*&order=level.desc,created_at.asc&limit=10`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      const data = await response.json();
      setHighscores(data);
    } catch (error) {
      console.error('Error fetching highscores:', error);
    }
  };
  
  // Submit highscore to Supabase
  const submitHighscore = async () => {
    if (!playerName.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    console.log('Submitting score:', {
      player_name: playerName.trim(),
      class: playerRef.current.class,
      level: playerRef.current.level,
      difficulty: getDifficultyTier(playerRef.current.level).name
    });
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/highscores`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          player_name: playerName.trim(),
          class: playerRef.current.class,
          level: playerRef.current.level,
          difficulty: getDifficultyTier(playerRef.current.level).name
        })
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        alert(`Failed to submit score: ${response.status} - ${errorText}`);
        setIsSubmitting(false);
        return;
      }
      
      console.log('Score submitted successfully!');
      await fetchHighscores();
      setGameState('menu');
      setPlayerName('');
    } catch (error) {
      console.error('Error submitting highscore:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Load highscores on mount
  useEffect(() => {
    fetchHighscores();
  }, []);
  
  const classes = {
    warrior: {
      name: 'Warrior',
      icon: '⚔️',
      color: '#dc2626',
      description: 'Melee fighter with high HP and close-range power',
      startStats: {
        damage: 15,
        attackSpeed: 0.8,
        critChance: 8,
        critDamage: 180,
        armor: 10,
        dodge: 3,
        lifesteal: 5,
        movementSpeed: 2.8,
        projectileSpeed: 7,
        projectileSize: 1.3,
        pierce: 0,
        pickupRange: 60,
        maxHp: 150,
        hpRegen: 0.5,
        attackRange: 150
      }
    },
    marksman: {
      name: 'Marksman',
      icon: '🏹',
      color: '#16a34a',
      description: 'Long-range archer with speed and precision',
      startStats: {
        damage: 8,
        attackSpeed: 1.3,
        critChance: 15,
        critDamage: 200,
        armor: 0,
        dodge: 8,
        lifesteal: 0,
        movementSpeed: 3.5,
        projectileSpeed: 8,
        projectileSize: 0.8,
        pierce: 1,
        pickupRange: 70,
        maxHp: 80,
        hpRegen: 0,
        attackRange: 500
      }
    },
    exorcist: {
      name: 'Exorcist',
      icon: '✨',
      color: '#9333ea',
      description: 'Mystical spellcaster with area damage',
      startStats: {
        damage: 12,
        attackSpeed: 1.1,
        critChance: 10,
        critDamage: 160,
        armor: 3,
        dodge: 5,
        lifesteal: 2,
        movementSpeed: 3.2,
        projectileSpeed: 6,
        projectileSize: 1.5,
        pierce: 2,
        pickupRange: 80,
        maxHp: 100,
        hpRegen: 0.3,
        attackRange: 350
      }
    }
  };
  
  const classUpgrades = {
    warrior: [
      { name: 'Berserker Rage', stat: 'damage', value: 5, icon: '⚔️', desc: '+5 Melee Damage', rare: false },
      { name: 'Battle Fury', stat: 'attackSpeed', value: 0.2, icon: '⚡', desc: '+20% Attack Speed', rare: false },
      { name: 'Crushing Blow', stat: 'critDamage', value: 35, icon: '💥', desc: '+35% Crit Damage', rare: false },
      { name: 'Titan Skin', stat: 'armor', value: 8, icon: '🛡️', desc: '+8 Armor', rare: false },
      { name: 'Blood Thirst', stat: 'lifesteal', value: 5, icon: '🩸', desc: '+5% Life Steal', rare: false },
      { name: 'Bull Rush', stat: 'movementSpeed', value: 0.3, icon: '👟', desc: '+0.3 Movement Speed', rare: false },
      { name: 'Cleaving Strike', stat: 'projectileSize', value: 0.3, icon: '⭕', desc: '+30% Attack Size', rare: false },
      { name: 'Warrior Reach', stat: 'attackRange', value: 30, icon: '🎯', desc: '+30 Attack Range', rare: false },
      { name: 'Iron Will', stat: 'maxHp', value: 30, icon: '❤️', desc: '+30 Max HP', heal: true, rare: false },
      { name: 'Battle Hardened', stat: 'hpRegen', value: 0.8, icon: '💚', desc: '+0.8 HP/sec', rare: false },
      { name: 'Precise Strike', stat: 'critChance', value: 6, icon: '🎯', desc: '+6% Crit Chance', rare: false },
      { name: 'Stoneskin', stat: 'dodge', value: 4, icon: '💨', desc: '+4% Dodge', rare: false },
      { name: 'Magnetic Aura', stat: 'pickupRange', value: 20, icon: '✨', desc: '+20 Pickup Range', rare: false },
      { name: 'Sword Mastery', stat: 'pierce', value: 1, icon: '🔱', desc: '+1 Pierce', rare: false },
      { name: 'Rapid Assault', stat: 'projectileSpeed', value: 1.5, icon: '🏹', desc: '+1.5 Strike Speed', rare: false },
      // Rare Perks
      { name: 'Warlord\'s Might', stat: 'damage', value: 15, icon: '⚔️', desc: '+15 Melee Damage', rare: true },
      { name: 'Frenzy', stat: 'attackSpeed', value: 0.5, icon: '⚡', desc: '+50% Attack Speed', rare: true },
      { name: 'Devastation', stat: 'critDamage', value: 100, icon: '💥', desc: '+100% Crit Damage', rare: true },
      { name: 'Immortal Fortress', stat: 'armor', value: 25, icon: '🛡️', desc: '+25 Armor', rare: true },
      { name: 'Vampiric Fury', stat: 'lifesteal', value: 15, icon: '🩸', desc: '+15% Life Steal', rare: true },
      { name: 'Titan\'s Heart', stat: 'maxHp', value: 80, icon: '❤️', desc: '+80 Max HP', heal: true, rare: true },
    ],
    marksman: [
      { name: 'Deadly Aim', stat: 'damage', value: 4, icon: '🎯', desc: '+4 Arrow Damage', rare: false },
      { name: 'Rapid Fire', stat: 'attackSpeed', value: 0.25, icon: '⚡', desc: '+25% Attack Speed', rare: false },
      { name: 'Sharpshooter', stat: 'critChance', value: 8, icon: '🎯', desc: '+8% Crit Chance', rare: false },
      { name: 'Lethal Shot', stat: 'critDamage', value: 30, icon: '💥', desc: '+30% Crit Damage', rare: false },
      { name: 'Leather Armor', stat: 'armor', value: 4, icon: '🛡️', desc: '+4 Armor', rare: false },
      { name: 'Acrobatics', stat: 'dodge', value: 5, icon: '💨', desc: '+5% Dodge', rare: false },
      { name: 'Swift Feet', stat: 'movementSpeed', value: 0.5, icon: '👟', desc: '+0.5 Movement Speed', rare: false },
      { name: 'Arrow Velocity', stat: 'projectileSpeed', value: 2, icon: '🏹', desc: '+2 Projectile Speed', rare: false },
      { name: 'Multi-Shot', stat: 'pierce', value: 2, icon: '🔱', desc: '+2 Pierce', rare: false },
      { name: 'Eagle Eye', stat: 'attackRange', value: 80, icon: '👁️', desc: '+80 Attack Range', rare: false },
      { name: 'Vitality Boost', stat: 'maxHp', value: 15, icon: '❤️', desc: '+15 Max HP', heal: true, rare: false },
      { name: 'Vampiric Arrows', stat: 'lifesteal', value: 4, icon: '🩸', desc: '+4% Life Steal', rare: false },
      { name: 'Scavenger', stat: 'pickupRange', value: 25, icon: '✨', desc: '+25 Pickup Range', rare: false },
      { name: 'Broadhead Arrows', stat: 'projectileSize', value: 0.15, icon: '⭕', desc: '+15% Arrow Size', rare: false },
      { name: 'Recovery', stat: 'hpRegen', value: 0.4, icon: '💚', desc: '+0.4 HP/sec', rare: false },
      // Rare Perks
      { name: 'Deadeye', stat: 'critChance', value: 25, icon: '🎯', desc: '+25% Crit Chance', rare: true },
      { name: 'Assassination', stat: 'critDamage', value: 120, icon: '💥', desc: '+120% Crit Damage', rare: true },
      { name: 'Machine Gun', stat: 'attackSpeed', value: 0.6, icon: '⚡', desc: '+60% Attack Speed', rare: true },
      { name: 'Phase Walker', stat: 'dodge', value: 20, icon: '💨', desc: '+20% Dodge', rare: true },
      { name: 'Ballista Bolts', stat: 'damage', value: 12, icon: '🎯', desc: '+12 Arrow Damage', rare: true },
      { name: 'Penetrator', stat: 'pierce', value: 5, icon: '🔱', desc: '+5 Pierce', rare: true },
    ],
    exorcist: [
      { name: 'Arcane Power', stat: 'damage', value: 4, icon: '✨', desc: '+4 Spell Damage', rare: false },
      { name: 'Spell Haste', stat: 'attackSpeed', value: 0.18, icon: '⚡', desc: '+18% Cast Speed', rare: false },
      { name: 'Mystic Focus', stat: 'critChance', value: 7, icon: '🎯', desc: '+7% Crit Chance', rare: false },
      { name: 'Spell Surge', stat: 'critDamage', value: 28, icon: '💥', desc: '+28% Crit Damage', rare: false },
      { name: 'Mystic Barrier', stat: 'armor', value: 6, icon: '🛡️', desc: '+6 Armor', rare: false },
      { name: 'Phase Shift', stat: 'dodge', value: 4, icon: '💨', desc: '+4% Dodge', rare: false },
      { name: 'Soul Drain', stat: 'lifesteal', value: 4, icon: '🩸', desc: '+4% Life Steal', rare: false },
      { name: 'Levitation', stat: 'movementSpeed', value: 0.4, icon: '👟', desc: '+0.4 Movement Speed', rare: false },
      { name: 'Spell Velocity', stat: 'projectileSpeed', value: 1.2, icon: '🏹', desc: '+1.2 Spell Speed', rare: false },
      { name: 'Spell Amplify', stat: 'projectileSize', value: 0.25, icon: '⭕', desc: '+25% Spell Size', rare: false },
      { name: 'Chain Magic', stat: 'pierce', value: 2, icon: '🔱', desc: '+2 Pierce', rare: false },
      { name: 'Spell Range', stat: 'attackRange', value: 50, icon: '🎯', desc: '+50 Cast Range', rare: false },
      { name: 'Mana Shield', stat: 'maxHp', value: 20, icon: '❤️', desc: '+20 Max HP', heal: true, rare: false },
      { name: 'Life Tap', stat: 'hpRegen', value: 0.6, icon: '💚', desc: '+0.6 HP/sec', rare: false },
      { name: 'Magical Presence', stat: 'pickupRange', value: 30, icon: '✨', desc: '+30 Pickup Range', rare: false },
      // Rare Perks
      { name: 'Archmage', stat: 'damage', value: 12, icon: '✨', desc: '+12 Spell Damage', rare: true },
      { name: 'Time Warp', stat: 'attackSpeed', value: 0.5, icon: '⚡', desc: '+50% Cast Speed', rare: true },
      { name: 'Apocalypse', stat: 'critDamage', value: 110, icon: '💥', desc: '+110% Crit Damage', rare: true },
      { name: 'Soul Reaver', stat: 'lifesteal', value: 12, icon: '🩸', desc: '+12% Life Steal', rare: true },
      { name: 'Chain Lightning', stat: 'pierce', value: 6, icon: '🔱', desc: '+6 Pierce', rare: true },
      { name: 'Divine Protection', stat: 'armor', value: 20, icon: '🛡️', desc: '+20 Armor', rare: true },
    ]
  };
  
  const getStatDisplay = (stat, value) => {
    switch(stat) {
      case 'attackSpeed':
      case 'critChance':
      case 'critDamage':
      case 'dodge':
      case 'lifesteal':
        return stat === 'attackSpeed' ? `${((value - 1) * 100).toFixed(0)}%` : `${value.toFixed(0)}%`;
      case 'projectileSize':
        return `${((value - 1) * 100).toFixed(0)}%`;
      case 'movementSpeed':
      case 'projectileSpeed':
      case 'hpRegen':
        return stat === 'hpRegen' ? `${value.toFixed(1)}/s` : `${value.toFixed(1)}`;
      default:
        return `${value.toFixed(0)}`;
    }
  };
  
  const getRandomUpgrades = (classType) => {
    const upgrades = classUpgrades[classType];
    const commonUpgrades = upgrades.filter(u => !u.rare);
    const rareUpgrades = upgrades.filter(u => u.rare);
    
    const selected = [];
    
    // Pick 3 upgrades, each has 5% chance to be rare
    for (let i = 0; i < 3; i++) {
      const isRare = Math.random() < 0.05;
      
      if (isRare && rareUpgrades.length > 0) {
        const available = rareUpgrades.filter(r => !selected.includes(r));
        if (available.length > 0) {
          const randomRare = available[Math.floor(Math.random() * available.length)];
          selected.push(randomRare);
        } else {
          // No rare available, pick common
          const available = commonUpgrades.filter(c => !selected.includes(c));
          const randomCommon = available[Math.floor(Math.random() * available.length)];
          selected.push(randomCommon);
        }
      } else {
        // Pick common
        const available = commonUpgrades.filter(c => !selected.includes(c));
        const randomCommon = available[Math.floor(Math.random() * available.length)];
        selected.push(randomCommon);
      }
    }
    
    return selected;
  };
  
  const selectClass = (classKey) => {
    setSelectedClass(classKey);
    const classData = classes[classKey];
    
    playerRef.current = {
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      size: 20,
      hp: classData.startStats.maxHp,
      maxHp: classData.startStats.maxHp,
      exp: 0,
      level: 1,
      expToNext: 5,
      class: classKey,
      invulnerable: false,
      lastHit: 0,
      stats: { ...classData.startStats },
      perksChosen: []
    };
    
    gameRef.current = {
      enemies: [],
      projectiles: [],
      xpOrbs: [],
      lastShot: 0,
      keys: {},
      lastRegen: 0,
      enemySpawnRate: 2000,
      lastSpawn: 0,
      frameCount: 0
    };
    
    setDifficultyTier('TRIVIAL');
    setExpPercent(0);
    setHpPercent(100);
    
    // Show first perk selection
    setLevelUpOptions(getRandomUpgrades(classKey));
    setGameState('firstPerk');
  };
  
  const selectUpgrade = (upgrade) => {
    const player = playerRef.current;
    player.stats[upgrade.stat] += upgrade.value;
    
    const existingPerk = player.perksChosen.find(p => p.name === upgrade.name);
    if (existingPerk) {
      existingPerk.count++;
    } else {
      player.perksChosen.push({
        name: upgrade.name,
        icon: upgrade.icon,
        stat: upgrade.stat,
        count: 1
      });
    }
    
    if (upgrade.heal) {
      player.maxHp = player.stats.maxHp;
      player.hp = Math.min(player.hp + (upgrade.value || 20), player.maxHp);
      setHpPercent((player.hp / player.maxHp) * 100);
    }
    
    setGameState('playing');
  };
  
  const togglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused');
    } else if (gameState === 'paused') {
      setGameState('playing');
    }
  };
  
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && (gameState === 'playing' || gameState === 'paused')) {
        togglePause();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [gameState]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    
    const handleKeyDown = (e) => {
      gameRef.current.keys[e.key.toLowerCase()] = true;
    };
    
    const handleKeyUp = (e) => {
      gameRef.current.keys[e.key.toLowerCase()] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    const spawnEnemy = () => {
      const side = Math.floor(Math.random() * 4);
      let x, y;
      
      switch(side) {
        case 0: x = Math.random() * 800; y = -20; break;
        case 1: x = 820; y = Math.random() * 600; break;
        case 2: x = Math.random() * 800; y = 620; break;
        case 3: x = -20; y = Math.random() * 600; break;
      }
      
      const player = playerRef.current;
      const level = player.level;
      const baseHp = 20 + (level * 5);
      const hpMultiplier = level > 15 ? Math.pow(1.3, level - 15) : 1;
      
      const enemy = {
        x,
        y,
        size: 15 + Math.random() * 10,
        speed: 0.8 + (level * 0.05) + (level > 15 ? (level - 15) * 0.1 : 0),
        hp: baseHp * hpMultiplier,
        maxHp: baseHp * hpMultiplier,
        damage: 5 + (level * 2),
        color: `hsl(${Math.random() * 60}, 70%, ${40 - level}%)`
      };
      
      gameRef.current.enemies.push(enemy);
    };
    
    const shootProjectile = (player) => {
      const now = Date.now();
      const shootDelay = 1000 / player.stats.attackSpeed;
      
      if (now - gameRef.current.lastShot > shootDelay) {
        const game = gameRef.current;
        
        if (game.enemies.length > 0) {
          let nearest = game.enemies[0];
          let minDist = Infinity;
          
          game.enemies.forEach(enemy => {
            const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
            if (dist < minDist && dist <= player.stats.attackRange) {
              minDist = dist;
              nearest = enemy;
            }
          });
          
          if (minDist <= player.stats.attackRange) {
            const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
            
            game.projectiles.push({
              x: player.x,
              y: player.y,
              vx: Math.cos(angle) * player.stats.projectileSpeed,
              vy: Math.sin(angle) * player.stats.projectileSpeed,
              damage: player.stats.damage,
              size: 8 * player.stats.projectileSize,
              pierce: player.stats.pierce,
              hits: 0,
              maxRange: player.stats.attackRange,
              startX: player.x,
              startY: player.y
            });
            
            gameRef.current.lastShot = now;
          }
        }
      }
    };
    
    const gameLoop = () => {
      if (gameState !== 'playing') {
        animationId = requestAnimationFrame(gameLoop);
        return;
      }
      
      const player = playerRef.current;
      const game = gameRef.current;
      const keys = game.keys;
      
      game.frameCount++;
      
      // Movement
      player.vx = 0;
      player.vy = 0;
      
      if (keys['w'] || keys['arrowup']) player.vy = -player.stats.movementSpeed;
      if (keys['s'] || keys['arrowdown']) player.vy = player.stats.movementSpeed;
      if (keys['a'] || keys['arrowleft']) player.vx = -player.stats.movementSpeed;
      if (keys['d'] || keys['arrowright']) player.vx = player.stats.movementSpeed;
      
      if (player.vx !== 0 && player.vy !== 0) {
        const norm = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
        player.vx = (player.vx / norm) * player.stats.movementSpeed;
        player.vy = (player.vy / norm) * player.stats.movementSpeed;
      }
      
      player.x += player.vx;
      player.y += player.vy;
      
      player.x = Math.max(player.size, Math.min(800 - player.size, player.x));
      player.y = Math.max(player.size, Math.min(600 - player.size, player.y));
      
      const now = Date.now();
      if (now - game.lastRegen > 1000) {
        if (player.stats.hpRegen > 0) {
          player.hp = Math.min(player.hp + player.stats.hpRegen, player.maxHp);
          setHpPercent((player.hp / player.maxHp) * 100);
        }
        game.lastRegen = now;
      }
      
      shootProjectile(player);
      
      const spawnRate = Math.max(300, game.enemySpawnRate - (player.level * 60));
      if (now - game.lastSpawn > spawnRate) {
        const count = Math.min(6, 1 + Math.floor(player.level / 4));
        for (let i = 0; i < count; i++) {
          spawnEnemy();
        }
        game.lastSpawn = now;
      }
      
      game.enemies.forEach(enemy => {
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;
        
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist < player.size + enemy.size && !player.invulnerable) {
          const dodge = Math.random() * 100 < player.stats.dodge;
          if (!dodge) {
            const damageReduction = player.stats.armor / (player.stats.armor + 100);
            const damage = enemy.damage * (1 - damageReduction);
            player.hp -= damage;
            
            // Update HP bar immediately
            setHpPercent((player.hp / player.maxHp) * 100);
            
            // Set invulnerability period
            player.invulnerable = true;
            player.lastHit = now;
            
            if (player.hp <= 0) {
              player.hp = 0;
              setGameState('dead');
            }
          }
          // Push enemy back to prevent stacking
          const pushAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
          enemy.x += Math.cos(pushAngle) * 3;
          enemy.y += Math.sin(pushAngle) * 3;
        }
      });
      
      // Check if invulnerability period is over (500ms)
      if (player.invulnerable && now - player.lastHit > 500) {
        player.invulnerable = false;
      }
      
      game.projectiles = game.projectiles.filter(proj => {
        proj.x += proj.vx;
        proj.y += proj.vy;
        
        const distTraveled = Math.hypot(proj.x - proj.startX, proj.y - proj.startY);
        if (distTraveled > proj.maxRange) {
          return false;
        }
        
        if (proj.x < 0 || proj.x > 800 || proj.y < 0 || proj.y > 600) {
          return false;
        }
        
        for (let i = game.enemies.length - 1; i >= 0; i--) {
          const enemy = game.enemies[i];
          const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
          
          if (dist < proj.size + enemy.size) {
            const isCrit = Math.random() * 100 < player.stats.critChance;
            const damage = isCrit ? proj.damage * (player.stats.critDamage / 100) : proj.damage;
            
            enemy.hp -= damage;
            
            if (player.stats.lifesteal > 0) {
              player.hp = Math.min(player.hp + (damage * player.stats.lifesteal / 100), player.maxHp);
              setHpPercent((player.hp / player.maxHp) * 100);
            }
            
            if (enemy.hp <= 0) {
              game.xpOrbs.push({
                x: enemy.x,
                y: enemy.y,
                value: 2
              });
              
              game.enemies.splice(i, 1);
            }
            
            proj.hits++;
            if (proj.hits > proj.pierce) {
              return false;
            }
          }
        }
        
        return true;
      });
      
      game.xpOrbs = game.xpOrbs.filter(orb => {
        const dist = Math.hypot(player.x - orb.x, player.y - orb.y);
        
        if (dist < player.stats.pickupRange) {
          const angle = Math.atan2(player.y - orb.y, player.x - orb.x);
          orb.x += Math.cos(angle) * 8;
          orb.y += Math.sin(angle) * 8;
        }
        
        if (dist < player.size + 10) {
          player.exp += orb.value;
          
          // Update exp bar
          setExpPercent((player.exp / player.expToNext) * 100);
          
          if (player.exp >= player.expToNext) {
            player.level++;
            player.exp -= player.expToNext;
            player.expToNext = Math.floor(5 * Math.pow(1.4, player.level - 1));
            
            // Update difficulty tier and exp bar
            const tier = getDifficultyTier(player.level);
            setDifficultyTier(tier.name);
            setExpPercent((player.exp / player.expToNext) * 100);
            
            setLevelUpOptions(getRandomUpgrades(player.class));
            setGameState('levelup');
          }
          
          return false;
        }
        
        return true;
      });
      
      // Draw
      ctx.fillStyle = '#1a0f0f';
      ctx.fillRect(0, 0, 800, 600);
      
      ctx.strokeStyle = '#2a1515';
      ctx.lineWidth = 1;
      for (let i = 0; i < 800; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 600);
        ctx.stroke();
      }
      for (let i = 0; i < 600; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(800, i);
        ctx.stroke();
      }
      
      game.xpOrbs.forEach(orb => {
        ctx.fillStyle = '#00ff88';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ff88';
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      
      game.projectiles.forEach(proj => {
        const classColor = player.class === 'warrior' ? '#ff4444' : 
                          player.class === 'marksman' ? '#44ff44' : '#aa44ff';
        ctx.fillStyle = classColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = classColor;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      
      game.enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ff0000';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        const barWidth = enemy.size * 2;
        const barHeight = 4;
        ctx.fillStyle = '#300000';
        ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.size - 10, barWidth, barHeight);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.size - 10, barWidth * (enemy.hp / enemy.maxHp), barHeight);
      });
      
      const classColor = player.class === 'warrior' ? '#dc2626' : 
                        player.class === 'marksman' ? '#16a34a' : '#9333ea';
      ctx.fillStyle = classColor;
      ctx.shadowBlur = 15;
      ctx.shadowColor = classColor;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      animationId = requestAnimationFrame(gameLoop);
    };
    
    gameLoop();
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, [gameState]);
  
  const player = playerRef.current;
  
  return (
    <div className="w-full h-screen bg-black flex items-center justify-center p-4">
      {/* Highscore List - Always Visible on Left */}
      <div className="absolute left-4 top-4 bottom-4 w-64 bg-black/90 rounded-lg border-2 border-amber-900 p-4 overflow-y-auto">
        <h2 className="text-2xl font-bold text-amber-500 mb-4 flex items-center gap-2">
          <Trophy size={24} />
          TOP SCORES
        </h2>
        <div className="space-y-2">
          {highscores.map((score, idx) => (
            <div key={score.id} className="bg-amber-900/20 p-2 rounded border border-amber-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-amber-500 font-bold">#{idx + 1}</span>
                <span className="text-white font-bold">Lv.{score.level}</span>
              </div>
              <div className="text-sm text-gray-300 truncate">{score.player_name}</div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-400">{score.class}</span>
                <span style={{ color: getDifficultyTier(score.level).color }} className="font-bold">
                  {score.difficulty}
                </span>
              </div>
            </div>
          ))}
          {highscores.length === 0 && (
            <div className="text-gray-500 text-center py-8">
              No scores yet!<br/>Be the first!
            </div>
          )}
        </div>
      </div>
      
      <div className="relative ml-72">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-4 border-amber-900 rounded-lg shadow-2xl"
        />
        
        {/* HUD */}
        {gameState === 'playing' && (
          <>
            {/* Top UI Bar */}
            <div className="absolute -top-24 left-0 right-0 pointer-events-none">
              <div className="flex justify-between items-center px-4">
                <div className="bg-black/80 p-3 rounded border-2 border-amber-900">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="text-red-500" size={20} />
                    <div className="w-48 h-4 bg-gray-800 rounded overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-200"
                        style={{ width: `${hpPercent}%` }}
                      />
                    </div>
                    <span className="text-white text-sm font-bold">{Math.ceil(player.hp)}/{player.maxHp}</span>
                    <button
                      onClick={() => {
                        player.hp = 0;
                        setGameState('dead');
                      }}
                      className="pointer-events-auto ml-2 bg-red-900 hover:bg-red-800 text-white text-xs font-bold px-3 py-1 rounded border border-red-700 transition-all"
                    >
                      💀 GIVE UP
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="text-yellow-500" size={20} />
                    <div className="w-48 h-4 bg-gray-800 rounded overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400"
                        style={{ width: `${expPercent}%` }}
                      />
                    </div>
                    <span className="text-white text-sm font-bold">Lv.{player.level}</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="bg-black/80 p-3 rounded border-2 border-amber-900 text-white min-w-32">
                    <div className="text-2xl font-bold" style={{ color: getDifficultyTier(player.level).color }}>
                      {getDifficultyTier(player.level).name}
                    </div>
                    <div className="text-xs text-gray-400">DIFFICULTY</div>
                  </div>
                  
                  <button
                    onClick={togglePause}
                    className="pointer-events-auto bg-black/80 p-3 rounded border-2 border-amber-900 hover:bg-amber-900/20 transition-all"
                  >
                    <Pause className="text-amber-500" size={24} />
                  </button>
                  
                  <button
                    onClick={() => setShowStats(!showStats)}
                    className="pointer-events-auto bg-black/80 p-3 rounded border-2 border-amber-900 hover:bg-amber-900/20 transition-all"
                  >
                    <BookOpen className="text-amber-500" size={24} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Stats Panel */}
        {showStats && gameState === 'playing' && (
          <div className="absolute -top-24 right-72 bg-black/95 p-4 rounded border-2 border-amber-900 w-80 max-h-96 overflow-y-auto pointer-events-auto">
            <h3 className="text-xl font-bold text-amber-500 mb-3 flex items-center gap-2">
              <BookOpen size={20} />
              Character Stats
            </h3>
            
            <div className="space-y-2 text-sm">
              {player.perksChosen.map((perk, idx) => (
                <div key={idx} className="bg-amber-900/20 p-2 rounded border border-amber-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{perk.icon}</span>
                      <span className="text-amber-400 font-bold">{perk.name}</span>
                      {perk.count > 1 && (
                        <span className="text-gray-400">x{perk.count}</span>
                      )}
                    </div>
                    <span className="text-white font-bold">
                      {getStatDisplay(perk.stat, player.stats[perk.stat])}
                    </span>
                  </div>
                </div>
              ))}
              
              {player.perksChosen.length === 0 && (
                <p className="text-gray-500 text-center py-4">No perks chosen yet</p>
              )}
            </div>
          </div>
        )}
        
        {/* Menu */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-amber-500 mb-4" style={{textShadow: '0 0 20px #d97706'}}>
                DARK SANCTUARY
              </h1>
              <p className="text-gray-400 mb-8 text-lg">Survive the endless horde</p>
              <button
                onClick={() => setGameState('classSelect')}
                className="bg-amber-900 hover:bg-amber-800 text-white font-bold py-4 px-8 rounded text-xl border-2 border-amber-700 transition-all transform hover:scale-105"
              >
                START GAME
              </button>
              <div className="mt-8 text-gray-500 text-sm">
                <p>WASD / Arrow Keys to Move</p>
                <p>ESC to Pause</p>
                <p>Auto-attack nearest enemy</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Class Selection */}
        {gameState === 'classSelect' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/95">
            <div className="text-center max-w-5xl">
              <h2 className="text-5xl font-bold text-amber-500 mb-2">CHOOSE YOUR CLASS</h2>
              <p className="text-gray-400 mb-8 text-xl">Each class has unique strengths and abilities</p>
              
              <div className="grid grid-cols-3 gap-6">
                {Object.entries(classes).map(([key, classData]) => (
                  <button
                    key={key}
                    onClick={() => selectClass(key)}
                    className="bg-gradient-to-b from-amber-900 to-amber-950 hover:from-amber-800 hover:to-amber-900 p-6 rounded-lg border-2 border-amber-700 transition-all transform hover:scale-105 hover:shadow-xl"
                    style={{ borderColor: classData.color }}
                  >
                    <div className="text-6xl mb-3">{classData.icon}</div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: classData.color }}>
                      {classData.name}
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">{classData.description}</p>
                    
                    <div className="text-left text-xs space-y-1 bg-black/40 p-3 rounded">
                      <div className="flex justify-between">
                        <span className="text-gray-400">HP:</span>
                        <span className="text-white font-bold">{classData.startStats.maxHp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Damage:</span>
                        <span className="text-white font-bold">{classData.startStats.damage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Attack Range:</span>
                        <span className="text-white font-bold">{classData.startStats.attackRange}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Speed:</span>
                        <span className="text-white font-bold">{classData.startStats.movementSpeed.toFixed(1)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* First Perk Selection */}
        {gameState === 'firstPerk' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/95">
            <div className="text-center max-w-4xl">
              <h2 className="text-5xl font-bold text-amber-500 mb-2">CHOOSE YOUR STARTING PERK</h2>
              <p className="text-gray-400 mb-8 text-xl">Select your first ability before battle begins</p>
              
              <div className="grid grid-cols-3 gap-6">
                {levelUpOptions.map((upgrade, idx) => (
                  <div key={idx} className="relative">
                    {upgrade.rare && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                          ✨ RARE PERK ✨
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => selectUpgrade(upgrade)}
                      className={`${
                        upgrade.rare 
                          ? 'bg-gradient-to-b from-purple-900 to-purple-950 hover:from-purple-800 hover:to-purple-900 border-purple-500 shadow-lg shadow-purple-500/50' 
                          : 'bg-gradient-to-b from-amber-900 to-amber-950 hover:from-amber-800 hover:to-amber-900 border-amber-700'
                      } w-full p-6 rounded-lg border-2 transition-all transform hover:scale-105 hover:shadow-xl`}
                    >
                      <div className="text-5xl mb-3">{upgrade.icon}</div>
                      <h3 className={`text-xl font-bold mb-2 ${upgrade.rare ? 'text-purple-400' : 'text-amber-400'}`}>
                        {upgrade.name}
                      </h3>
                      <p className="text-gray-300 text-sm">{upgrade.desc}</p>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Paused */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90">
            <div className="text-center max-w-2xl">
              <Pause className="w-20 h-20 text-amber-500 mx-auto mb-4" />
              <h2 className="text-5xl font-bold text-amber-500 mb-8">PAUSED</h2>
              
              <div className="bg-black/80 p-6 rounded border-2 border-amber-900 mb-6 max-h-96 overflow-y-auto">
                <h3 className="text-2xl font-bold text-amber-400 mb-4">Your Stats</h3>
                
                <div className="grid grid-cols-2 gap-3 text-left">
                  {player.perksChosen.map((perk, idx) => (
                    <div key={idx} className="bg-amber-900/20 p-3 rounded border border-amber-800">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{perk.icon}</span>
                        <span className="text-amber-400 font-bold text-sm">{perk.name}</span>
                        {perk.count > 1 && (
                          <span className="text-gray-400 text-xs">x{perk.count}</span>
                        )}
                      </div>
                      <div className="text-white font-bold text-lg">
                        {getStatDisplay(perk.stat, player.stats[perk.stat])}
                      </div>
                    </div>
                  ))}
                  
                  {player.perksChosen.length === 0 && (
                    <div className="col-span-2 text-gray-500 text-center py-4">
                      No perks chosen yet
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={togglePause}
                className="bg-amber-900 hover:bg-amber-800 text-white font-bold py-4 px-8 rounded text-xl border-2 border-amber-700 transition-all transform hover:scale-105"
              >
                <Play className="inline mr-2" size={20} />
                RESUME
              </button>
              
              <p className="text-gray-500 mt-4 text-sm">Press ESC to resume</p>
            </div>
          </div>
        )}
        
        {/* Level Up */}
        {gameState === 'levelup' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/95">
            <div className="text-center max-w-4xl">
              <h2 className="text-5xl font-bold text-amber-500 mb-2">LEVEL UP!</h2>
              <p className="text-gray-400 mb-8 text-xl">Level {player.level} - Choose Your Power</p>
              
              <div className="grid grid-cols-3 gap-6">
                {levelUpOptions.map((upgrade, idx) => (
                  <div key={idx} className="relative">
                    {upgrade.rare && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                          ✨ RARE PERK ✨
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => selectUpgrade(upgrade)}
                      className={`${
                        upgrade.rare 
                          ? 'bg-gradient-to-b from-purple-900 to-purple-950 hover:from-purple-800 hover:to-purple-900 border-purple-500 shadow-lg shadow-purple-500/50' 
                          : 'bg-gradient-to-b from-amber-900 to-amber-950 hover:from-amber-800 hover:to-amber-900 border-amber-700'
                      } w-full p-6 rounded-lg border-2 transition-all transform hover:scale-105 hover:shadow-xl`}
                    >
                      <div className="text-5xl mb-3">{upgrade.icon}</div>
                      <h3 className={`text-xl font-bold mb-2 ${upgrade.rare ? 'text-purple-400' : 'text-amber-400'}`}>
                        {upgrade.name}
                      </h3>
                      <p className="text-gray-300 text-sm">{upgrade.desc}</p>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Game Over */}
        {gameState === 'dead' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/95">
            <div className="text-center max-w-md">
              <Skull className="w-24 h-24 text-red-600 mx-auto mb-4" />
              <h2 className="text-5xl font-bold text-red-600 mb-4">YOU DIED</h2>
              <div className="mb-2">
                <span className="text-gray-400 text-xl">Final Difficulty: </span>
                <span className="text-2xl font-bold" style={{ color: getDifficultyTier(player.level).color }}>
                  {getDifficultyTier(player.level).name}
                </span>
              </div>
              <p className="text-gray-400 mb-6">Level Reached: {player.level}</p>
              
              <div className="bg-black/80 p-6 rounded border-2 border-amber-900 mb-4">
                <h3 className="text-xl font-bold text-amber-500 mb-3">Submit Your Score</h3>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
                  onKeyDown={(e) => e.key === 'Enter' && submitHighscore()}
                  placeholder="Enter your name..."
                  maxLength={20}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded border-2 border-amber-700 focus:border-amber-500 outline-none mb-3"
                  autoFocus
                />
                <button
                  onClick={submitHighscore}
                  disabled={!playerName.trim() || isSubmitting}
                  className="w-full bg-amber-900 hover:bg-amber-800 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded text-lg border-2 border-amber-700 transition-all transform hover:scale-105 mb-2"
                >
                  {isSubmitting ? 'SUBMITTING...' : 'SUBMIT SCORE'}
                </button>
                <button
                  onClick={() => setGameState('menu')}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded border-2 border-gray-600 transition-all"
                >
                  SKIP
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VampireSurvivor;