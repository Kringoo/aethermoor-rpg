# Pseudo-Code: Prozedurale Dungeon-Generation & Loot-Skalierung

## Dungeon-Generation Algorithmus

```pseudo
FUNCTION generateDungeonRift(dimensionLevel, playerLevel) {
    // Basis-Parameter berechnen
    roomCount = MIN(5 + FLOOR(dimensionLevel / 2), 15)
    complexity = dimensionLevel + FLOOR(playerLevel / 5)
    
    // Raumtyp-Gewichtung basierend auf Level
    roomWeights = {
        safe: 0.1,                    // Sichere Rastplätze
        combat: 0.4 + (complexity * 0.02),  // Standard Kampf-Räume
        treasure: 0.25 - (complexity * 0.01), // Schätze werden rarer auf höheren Leveln
        trap: 0.1 + (complexity * 0.015),   // Mehr Fallen in höheren Dimensionen
        special: 0.1,                 // Äther-Pools, Portale etc.
        boss: 0.05                    // Immer selten, aber scaling damage
    }
    
    // Raum-Grid erstellen (hexagonal für interessante Pfade)
    grid = createHexGrid(CEIL(SQRT(roomCount * 1.5)))
    rooms = []
    
    // Eingangsraum ist immer sicher
    entryRoom = {
        id: 0,
        type: "safe",
        position: grid.center,
        connections: [],
        difficulty: 0
    }
    rooms.push(entryRoom)
    
    // Hauptpfad generieren (kritischer Pfad zum Ausgang)
    mainPath = generateMainPath(grid, roomCount)
    
    FOR i = 1 to roomCount-1 {
        roomType = weightedRandomSelect(roomWeights)
        
        // Boss-Raum ist immer der letzte
        IF i == roomCount-1 THEN roomType = "boss"
        
        // Schwierigkeit skaliert mit Entfernung vom Start
        distanceFromEntry = calculateDistance(mainPath[i], entryRoom.position)
        baseDifficulty = dimensionLevel + FLOOR(distanceFromEntry * 0.5)
        
        room = {
            id: i,
            type: roomType,
            position: mainPath[i],
            difficulty: baseDifficulty,
            stability: calculateStability(roomType, dimensionLevel),
            enemies: generateEnemies(roomType, baseDifficulty),
            loot: generateRoomLoot(roomType, baseDifficulty, playerLevel),
            specialEffects: generateSpecialEffects(roomType, complexity)
        }
        
        rooms.push(room)
    }
    
    // Zusätzliche Verbindungen für alternative Pfade
    createAlternativePaths(rooms, grid, complexity)
    
    // Raum-Stabilität berechnen (Dimensionsdrift-Mechanik)
    FOR each room in rooms {
        room.driftTimer = RANDOM(3600, 21600) // 1-6 Stunden in Sekunden
        room.nextDriftEffect = generateDriftEffect(dimensionLevel)
    }
    
    RETURN {
        rooms: rooms,
        totalStability: calculateDungeonStability(rooms),
        recommendedLevel: dimensionLevel,
        estimatedClearTime: estimateClearTime(rooms),
        specialModifiers: generateDungeonModifiers(dimensionLevel)
    }
}

FUNCTION generateMainPath(grid, roomCount) {
    // Verwendet modifizierten A*-Algorithmus für interessante Pfade
    start = grid.center
    end = grid.randomEdgePosition()
    
    path = []
    current = start
    
    WHILE current != end AND path.length < roomCount {
        // Berechne nächste Position mit bias zu interessanten Bereichen
        nextPositions = getValidNeighbors(current, grid)
        
        // Bewerte Positionen basierend auf:
        // 1. Distanz zum Ziel
        // 2. Vermeidung von zu geraden Pfaden  
        // 3. Präferenz für "interessante" Positionen
        scored = scorePositions(nextPositions, end, path)
        
        current = weightedRandomSelect(scored)
        path.push(current)
    }
    
    RETURN path
}
```

## Loot-Skalierung System

```pseudo
FUNCTION generateRoomLoot(roomType, roomDifficulty, playerLevel) {
    baseLootBudget = roomDifficulty * 10
    playerLevelBonus = FLOOR(playerLevel / 3)
    totalBudget = baseLootBudget + playerLevelBonus
    
    // Raumtyp-spezifische Modifikatoren
    typeMultipliers = {
        combat: 1.0,
        treasure: 2.5,
        boss: 4.0,
        trap: 1.3,
        special: 1.8,
        safe: 0.3
    }
    
    finalBudget = totalBudget * typeMultipliers[roomType]
    
    lootItems = []
    remainingBudget = finalBudget
    
    WHILE remainingBudget > 5 {
        // Seltenheitsstufen mit exponentiellen Kosten
        rarityWeights = calculateRarityWeights(roomDifficulty, playerLevel)
        selectedRarity = weightedRandomSelect(rarityWeights)
        
        itemCost = getRarityItemCost(selectedRarity)
        
        IF itemCost <= remainingBudget THEN {
            item = generateItem(selectedRarity, roomDifficulty, playerLevel)
            lootItems.push(item)
            remainingBudget -= itemCost
        } ELSE {
            // Generiere kleinere Items oder Ressourcen
            generateResourceDrop(remainingBudget, lootItems)
            BREAK
        }
    }
    
    RETURN lootItems
}

FUNCTION calculateRarityWeights(roomDifficulty, playerLevel) {
    // Basis-Wahrscheinlichkeiten
    baseWeights = {
        common: 0.50,      // 50% Base
        uncommon: 0.30,    // 30% Base  
        rare: 0.15,        // 15% Base
        epic: 0.04,        // 4% Base
        legendary: 0.01    // 1% Base
    }
    
    // Level-basierte Anpassungen
    difficultyFactor = MIN(roomDifficulty / 100, 2.0)
    playerProgression = MIN(playerLevel / 50, 1.5)
    
    adjustedWeights = {
        common: baseWeights.common * (2.0 - difficultyFactor),
        uncommon: baseWeights.uncommon * (1.0 + difficultyFactor * 0.3),
        rare: baseWeights.rare * (1.0 + difficultyFactor * 0.5),
        epic: baseWeights.epic * (1.0 + difficultyFactor * 0.8 + playerProgression * 0.3),
        legendary: baseWeights.legendary * (difficultyFactor * 2.0 + playerProgression * 0.5)
    }
    
    // Normalisiere Gewichtungen
    total = SUM(adjustedWeights.values)
    FOR each weight in adjustedWeights {
        weight = weight / total
    }
    
    RETURN adjustedWeights
}

FUNCTION generateItem(rarity, difficulty, playerLevel) {
    // Item-Typ basierend auf Rarity bestimmen
    itemTypes = getItemTypesForRarity(rarity)
    selectedType = randomSelect(itemTypes)
    
    // Basis-Stats berechnen
    baseStats = getBaseStatsForType(selectedType)
    
    // Level-Skalierung anwenden
    scalingFactor = 1.0 + (difficulty * 0.05) + (playerLevel * 0.02)
    
    scaledStats = {}
    FOR each stat in baseStats {
        variance = RANDOM(0.85, 1.15) // ±15% Varianz
        scaledStats[stat] = FLOOR(baseStats[stat] * scalingFactor * variance)
    }
    
    // Rarity-spezifische Boni
    rarityBonuses = generateRarityBonuses(rarity, selectedType)
    
    // Spezial-Effekte für höhere Raritäten
    specialEffects = []
    IF rarity >= "rare" THEN {
        effectCount = getRarityEffectCount(rarity)
        specialEffects = generateSpecialEffects(effectCount, difficulty, selectedType)
    }
    
    // Existenz-Punkte (Quantum Inventory System)
    existencePoints = calculateExistencePoints(rarity, scaledStats, specialEffects)
    
    RETURN {
        name: generateItemName(selectedType, rarity, specialEffects),
        type: selectedType,
        rarity: rarity,
        level: difficulty,
        stats: scaledStats,
        bonuses: rarityBonuses,
        effects: specialEffects,
        existencePoints: existencePoints,
        icon: getItemIcon(selectedType, rarity),
        description: generateDescription(selectedType, rarity, specialEffects)
    }
}

FUNCTION calculateExistencePoints(rarity, stats, effects) {
    baseEP = {
        common: 1,
        uncommon: 2,
        rare: 4,
        epic: 7,
        legendary: 12
    }
    
    statBonus = SUM(stats.values) / 50  // High-stat items take more space
    effectBonus = effects.length * 2    // Each effect adds complexity
    
    totalEP = baseEP[rarity] + FLOOR(statBonus) + effectBonus
    
    RETURN CLAMP(totalEP, 1, 25) // Maximum 25 EP per item
}
```

## Adaptive Schwierigkeit

```pseudo
FUNCTION calculateAdaptiveDifficulty(playerStats, recentPerformance) {
    // Analyse der letzten 10 Kämpfe
    winRate = recentPerformance.wins / recentPerformance.total
    avgCombatTime = recentPerformance.avgTimePerFight
    deathCount = recentPerformance.deaths
    
    // Basis-Schwierigkeitsanpassung
    difficultyModifier = 1.0
    
    // Zu einfach? Erhöhe Schwierigkeit
    IF winRate > 0.85 AND avgCombatTime < 30 THEN {
        difficultyModifier += 0.2
    }
    
    // Zu schwer? Verringere Schwierigkeit  
    IF winRate < 0.4 OR deathCount > 3 THEN {
        difficultyModifier -= 0.3
    }
    
    // Berücksichtige Ausrüstungsqualität
    gearScore = calculatePlayerGearScore(playerStats)
    expectedGearScore = getExpectedGearScore(playerLevel)
    
    gearModifier = (gearScore / expectedGearScore) - 1.0
    difficultyModifier += gearModifier * 0.1
    
    RETURN CLAMP(difficultyModifier, 0.5, 2.5)
}
```

## Beispiel-Loot Items

### Voidwalker Shadowblade (Legendary)
- **Stats**: +45 Agility, +25 Intelligence, +15 Strength  
- **Existenz-Punkte**: 12
- **Spezial-Effekte**:
  - Shadow Split: 15% Chance beim Angriff, 3 Kopien für 5 Sekunden zu erschaffen
  - Void Step: Teleportiere hinter Gegner bei kritischen Treffern
  - Dimensional Cut: Angriffe ignorieren 25% der Rüstung
- **Drop-Wahrscheinlichkeit**: 0.1% in Boss-Räumen Level 15+
- **Beschreibung**: *"Eine Klinge geschmiedet aus erstarrter Dunkelheit zwischen den Dimensionen. Ihre Schneide existiert in mehreren Realitäten gleichzeitig."*

### Aethermancer's Confluence Orb (Epic)  
- **Stats**: +35 Intelligence, +20 Agility, +10 Strength
- **Existenz-Punkte**: 8
- **Spezial-Effekte**:
  - Elemental Fusion: Zauber kombinieren automatisch bis zu 3 Elemente
  - Mana Overflow: 20% Chance auf kostenlosen Zauber nach Elementar-Kombo
  - Reality Anchor: Immunität gegen Dimensions-Verschiebungs-Debuffs
- **Drop-Wahrscheinlichkeit**: 0.8% in Special-Räumen Level 10+
- **Beschreibung**: *"Ein kristalliner Fokus der alle vier Grundelemente in perfekter Balance hält. Pulst mit dimensionaler Energie."*

### Forgemaster's Living Armor (Rare)
- **Stats**: +25 Strength, +30 HP, +15 Defense
- **Existenz-Punkte**: 6
- **Spezial-Effekte**:
  - Arsenal Memory: Speichere bis zu 3 Ausrüstungs-Sets für Schnellwechsel
  - Adaptive Plating: Rüstung passt sich dem letzten erlittenen Schadenstyp an (+20% Resistenz)
  - Forge Heat: Nach 30 Sekunden Kampf +15% Angriffstempo
- **Drop-Wahrscheinlichkeit**: 3.2% in Combat-Räumen Level 8+  
- **Beschreibung**: *"Diese Rüstung wächst mit ihrem Träger und passt sich jeder Bedrohung an. Schmiedespuren glühen noch immer mit Äther-Feuer."*