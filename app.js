// Dateiname: app.js
// Aethermoor Chronicles - Main Application Module

class GameData {
    constructor() {
        this.version = "1.0.0";
        this.timestamp = Date.now();
        this.player = null;
        this.currentDimension = null;
        this.settings = {
            musicVolume: 50,
            sfxVolume: 75,
            autoSave: true
        };
    }
}

class Player {
    constructor(name, playerClass) {
        this.name = name;
        this.class = playerClass;
        this.level = 1;
        this.xp = 0;
        this.xpToNext = 100;
        this.stats = this.getBaseStats(playerClass);
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };
        this.inventory = [];
        this.resources = {
            aetherEssence: 0,
            dimensionalFragments: 0
        };
        this.skillPoints = 3;
        this.mementos = [];
        this.currentHP = this.getMaxHP();
    }

    getBaseStats(playerClass) {
        const baseStats = {
            voidwalker: { agility: 15, strength: 8, intelligence: 12 },
            aethermancer: { agility: 8, strength: 8, intelligence: 19 },
            forgemaster: { agility: 8, strength: 19, intelligence: 8 }
        };
        return baseStats[playerClass] || baseStats.voidwalker;
    }

    getMaxHP() {
        return 100 + (this.stats.strength * 5) + (this.level * 10);
    }

    gainXP(amount) {
        this.xp += amount;
        let levelsGained = 0;
        
        while (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level++;
            levelsGained++;
            this.skillPoints += 3;
            this.xpToNext = Math.floor(this.xpToNext * 1.2);
        }
        
        if (levelsGained > 0) {
            this.currentHP = this.getMaxHP();
            return levelsGained;
        }
        return 0;
    }

    getClassIcon() {
        const icons = {
            voidwalker: "🌙",
            aethermancer: "🔮", 
            forgemaster: "⚒️"
        };
        return icons[this.class] || "🌙";
    }
}

class Enemy {
    constructor(name, level) {
        this.name = name;
        this.level = level;
        this.maxHP = 50 + (level * 20);
        this.currentHP = this.maxHP;
        this.attack = 10 + (level * 5);
        this.defense = 5 + (level * 2);
        this.xpReward = 25 + (level * 15);
        this.loot = this.generateLoot();
    }

    generateLoot() {
        const lootTable = [
            { name: "Äther-Kristall", icon: "💎", rarity: "common", existencePoints: 1 },
            { name: "Schatten-Splitter", icon: "🔘", rarity: "common", existencePoints: 1 },
            { name: "Dimensionsstaub", icon: "✨", rarity: "uncommon", existencePoints: 2 },
            { name: "Voidessenz", icon: "🌑", rarity: "rare", existencePoints: 3 }
        ];
        
        if (Math.random() < 0.7) {
            return lootTable[Math.floor(Math.random() * lootTable.length)];
        }
        return null;
    }

    takeDamage(damage) {
        this.currentHP = Math.max(0, this.currentHP - damage);
        return this.currentHP <= 0;
    }

    getSprite() {
        const sprites = ["👹", "👻", "🐉", "🗿", "⚡", "🔥"];
        return sprites[Math.floor(Math.random() * sprites.length)];
    }
}

class DimensionRift {
    constructor(name, level) {
        this.name = name;
        this.level = level;
        this.stability = 100;
        this.rooms = this.generateRooms();
        this.currentRoom = 0;
        this.explored = [0];
    }

    generateRooms() {
        const roomTypes = [
            { name: "Eingangshalle", icon: "🚪", type: "safe" },
            { name: "Kristallkammer", icon: "💎", type: "treasure" },
            { name: "Schattenlabyrinth", icon: "🌫️", type: "combat" },
            { name: "Ätherpool", icon: "🌀", type: "special" },
            { name: "Wächter-Thronsaal", icon: "👑", type: "boss" }
        ];

        const rooms = [];
        const roomCount = Math.min(5 + Math.floor(this.level / 2), 12);

        for (let i = 0; i < roomCount; i++) {
            if (i === 0) {
                rooms.push({ ...roomTypes[0], id: i });
            } else if (i === roomCount - 1) {
                rooms.push({ ...roomTypes[4], id: i });
            } else {
                const typeIndex = 1 + Math.floor(Math.random() * 3);
                rooms.push({ ...roomTypes[typeIndex], id: i });
            }
        }

        return rooms;
    }

    explore() {
        if (this.currentRoom < this.rooms.length - 1) {
            this.currentRoom++;
            if (!this.explored.includes(this.currentRoom)) {
                this.explored.push(this.currentRoom);
            }
            this.stability = Math.max(0, this.stability - 5);
            return this.rooms[this.currentRoom];
        }
        return null;
    }
}

class GameEngine {
    constructor() {
        this.gameData = new GameData();
        this.currentScreen = 'loadingScreen';
        this.isLoading = false;
        this.inCombat = false;
        this.currentEnemy = null;

        this.init();
    }

    async init() {
        await this.loadResources();
        this.bindEvents();
        this.showScreen('mainMenu');
    }

    async loadResources() {
        const loadingProgress = document.getElementById('loadingProgress');
        const loadingText = document.getElementById('loadingText');
        
        const steps = [
            { text: "Dimensionen werden initialisiert...", duration: 800 },
            { text: "Äther-Verbindungen aufgebaut...", duration: 600 },
            { text: "Quantum-Systeme kalibriert...", duration: 500 },
            { text: "Spielwelt lädt...", duration: 400 }
        ];

        let progress = 0;
        for (let i = 0; i < steps.length; i++) {
            loadingText.textContent = steps[i].text;
            progress += (100 / steps.length);
            loadingProgress.style.width = `${progress}%`;
            await this.delay(steps[i].duration);
        }

        loadingText.textContent = "Fertig!";
        loadingProgress.style.width = "100%";
        await this.delay(500);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    bindEvents() {
        // Main Menu Events
        document.getElementById('newGameBtn').addEventListener('click', () => this.showScreen('characterCreation'));
        document.getElementById('loadGameBtn').addEventListener('click', () => this.loadGame());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showModal('settingsModal'));
        document.getElementById('aboutBtn').addEventListener('click', () => this.showAbout());

        // Character Creation Events
        document.querySelectorAll('.class-card').forEach(card => {
            card.addEventListener('click', (e) => this.selectClass(e.target.closest('.class-card')));
        });
        
        document.getElementById('characterName').addEventListener('input', () => this.validateCharacterCreation());
        document.getElementById('createCharacterBtn').addEventListener('click', () => this.createCharacter());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.showScreen('mainMenu'));

        // Game Interface Events
        document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.closest('.nav-btn').dataset.view));
        });
        
        document.getElementById('menuBtn').addEventListener('click', () => this.showModal('settingsModal'));
        document.getElementById('exploreBtn').addEventListener('click', () => this.explore());
        document.getElementById('restBtn').addEventListener('click', () => this.rest());
        document.getElementById('dimensionShiftBtn').addEventListener('click', () => this.dimensionShift());

        // Combat Events
        document.querySelectorAll('.ability-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.useAbility(e.target.dataset.ability));
        });

        // Modal Events
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.hideModal('settingsModal'));
        document.getElementById('exportSaveBtn').addEventListener('click', () => this.exportSave());
        document.getElementById('importSaveBtn').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile').addEventListener('change', (e) => this.importSave(e.target.files[0]));

        // Level Up Events
        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.upgradeStat(e.target.dataset.stat));
        });
        
        document.getElementById('confirmLevelUpBtn').addEventListener('click', () => this.confirmLevelUp());

        // Auto-save every 30 seconds
        setInterval(() => {
            if (this.gameData.settings.autoSave && this.gameData.player) {
                this.saveGame();
            }
        }, 30000);
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    selectClass(classCard) {
        document.querySelectorAll('.class-card').forEach(card => card.classList.remove('selected'));
        classCard.classList.add('selected');
        this.selectedClass = classCard.dataset.class;
        this.validateCharacterCreation();
    }

    validateCharacterCreation() {
        const name = document.getElementById('characterName').value.trim();
        const createBtn = document.getElementById('createCharacterBtn');
        
        if (name.length >= 3 && this.selectedClass) {
            createBtn.disabled = false;
        } else {
            createBtn.disabled = true;
        }
    }

    createCharacter() {
        const name = document.getElementById('characterName').value.trim();
        this.gameData.player = new Player(name, this.selectedClass);
        this.gameData.currentDimension = new DimensionRift("Schatten-Dimension Alpha-7", 1);
        
        this.updateUI();
        this.generateExplorationGrid();
        this.showScreen('gameInterface');
        this.saveGame();
    }

    updateUI() {
        if (!this.gameData.player) return;

        const player = this.gameData.player;
        
        // Character Info
        document.getElementById('charIcon').textContent = player.getClassIcon();
        document.getElementById('charName').textContent = player.name;
        document.getElementById('charLevel').textContent = player.level;
        
        // XP Bar
        const xpPercent = (player.xp / player.xpToNext) * 100;
        document.getElementById('xpBar').style.width = `${xpPercent}%`;
        document.getElementById('xpText').textContent = `${player.xp}/${player.xpToNext}`;
        
        // Resources
        document.getElementById('aetherEssence').textContent = player.resources.aetherEssence;
        document.getElementById('dimensionalFragments').textContent = player.resources.dimensionalFragments;
        
        // Dimension Info
        if (this.gameData.currentDimension) {
            document.getElementById('dimensionName').textContent = this.gameData.currentDimension.name;
            const stabilityPercent = this.gameData.currentDimension.stability;
            document.getElementById('stabilityBar').style.width = `${stabilityPercent}%`;
            document.getElementById('stabilityText').textContent = `${stabilityPercent}%`;
        }
    }

    generateExplorationGrid() {
        const grid = document.getElementById('explorationGrid');
        grid.innerHTML = '';
        
        if (!this.gameData.currentDimension) return;
        
        this.gameData.currentDimension.rooms.forEach(room => {
            const tile = document.createElement('div');
            tile.className = 'room-tile';
            tile.dataset.roomId = room.id;
            
            if (this.gameData.currentDimension.explored.includes(room.id)) {
                tile.classList.add('explored');
            }
            if (room.id === this.gameData.currentDimension.currentRoom) {
                tile.classList.add('current');
            }
            
            tile.innerHTML = `
                <div class="room-icon">${room.icon}</div>
                <div class="room-name">${room.name}</div>
            `;
            
            tile.addEventListener('click', () => this.enterRoom(room.id));
            grid.appendChild(tile);
        });
    }

    switchView(viewId) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.game-view').forEach(view => view.classList.remove('active'));
        
        document.querySelector(`[data-view="${viewId}"]`).classList.add('active');
        document.getElementById(viewId).classList.add('active');
    }

    explore() {
        if (!this.gameData.currentDimension) return;
        
        const nextRoom = this.gameData.currentDimension.explore();
        if (nextRoom) {
            this.generateExplorationGrid();
            this.updateUI();
            
            if (nextRoom.type === 'combat' || nextRoom.type === 'boss') {
                this.startCombat(nextRoom);
            } else if (nextRoom.type === 'treasure') {
                this.foundTreasure();
            } else if (nextRoom.type === 'special') {
                this.specialEvent();
            }
        } else {
            this.showNotification("Du hast das Ende dieser Dimension erreicht!");
        }
    }

    startCombat(room) {
        const enemyLevel = this.gameData.currentDimension.level + (room.type === 'boss' ? 2 : 0);
        const enemyNames = {
            combat: ["Schatten-Läufer", "Void-Wächter", "Äther-Bestie"],
            boss: ["Dimensions-Lord", "Schatten-König", "Void-Titan"]
        };
        
        const names = enemyNames[room.type];
        const enemyName = names[Math.floor(Math.random() * names.length)];
        
        this.currentEnemy = new Enemy(enemyName, enemyLevel);
        this.inCombat = true;
        
        this.updateCombatUI();
        this.switchView('combatView');
        this.addCombatLog(`${enemyName} erscheint!`);
    }

    updateCombatUI() {
        if (!this.currentEnemy) return;
        
        document.getElementById('enemyName').textContent = this.currentEnemy.name;
        document.getElementById('enemySprite').textContent = this.currentEnemy.getSprite();
        
        const hpPercent = (this.currentEnemy.currentHP / this.currentEnemy.maxHP) * 100;
        document.getElementById('enemyHpBar').style.width = `${hpPercent}%`;
        document.getElementById('enemyHpText').textContent = `${this.currentEnemy.currentHP}/${this.currentEnemy.maxHP}`;
    }

    useAbility(ability) {
        if (!this.inCombat || !this.currentEnemy) return;
        
        let playerDamage = 0;
        let logMessage = "";
        
        switch (ability) {
            case 'attack':
                playerDamage = 15 + this.gameData.player.stats.strength;
                logMessage = `Du greifst für ${playerDamage} Schaden an!`;
                break;
            case 'special':
                playerDamage = Math.floor((20 + this.gameData.player.stats.intelligence) * 1.5);
                logMessage = `Du verwendest deine Spezialfähigkeit für ${playerDamage} Schaden!`;
                break;
            case 'defend':
                logMessage = `Du gehst in Verteidigungshaltung!`;
                break;
            case 'escape':
                if (Math.random() < 0.7) {
                    this.endCombat(false);
                    logMessage = `Flucht erfolgreich!`;
                } else {
                    logMessage = `Flucht fehlgeschlagen!`;
                }
                break;
        }
        
        this.addCombatLog(logMessage);
        
        if (playerDamage > 0) {
            const defeated = this.currentEnemy.takeDamage(playerDamage);
            if (defeated) {
                this.victory();
                return;
            }
        }
        
        this.updateCombatUI();
        
        // Enemy Turn
        setTimeout(() => this.enemyTurn(), 1000);
    }

    enemyTurn() {
        if (!this.inCombat || !this.currentEnemy) return;
        
        const enemyDamage = Math.max(1, this.currentEnemy.attack - Math.floor(this.gameData.player.stats.strength / 3));
        this.gameData.player.currentHP = Math.max(0, this.gameData.player.currentHP - enemyDamage);
        
        this.addCombatLog(`${this.currentEnemy.name} greift für ${enemyDamage} Schaden an!`);
        
        if (this.gameData.player.currentHP <= 0) {
            this.defeat();
        }
    }

    victory() {
        const xpGained = this.currentEnemy.xpReward;
        const levelsGained = this.gameData.player.gainXP(xpGained);
        
        this.addCombatLog(`Sieg! Du erhältst ${xpGained} XP!`);
        
        if (this.currentEnemy.loot) {
            this.gameData.player.inventory.push(this.currentEnemy.loot);
            this.addCombatLog(`Du findest: ${this.currentEnemy.loot.name}!`);
        }
        
        // Resources
        this.gameData.player.resources.aetherEssence += Math.floor(Math.random() * 5) + 1;
        this.gameData.player.resources.dimensionalFragments += Math.floor(Math.random() * 3);
        
        this.endCombat(true);
        
        if (levelsGained > 0) {
            this.showLevelUp(levelsGained);
        }
    }

    defeat() {
        this.addCombatLog("Du wurdest besiegt!");
        this.gameData.player.currentHP = Math.floor(this.gameData.player.getMaxHP() / 2);
        this.endCombat(false);
        this.showNotification("Du erwachst in der Dimensionsstation...");
    }

    endCombat(victory) {
        this.inCombat = false;
        this.currentEnemy = null;
        this.updateUI();
        this.switchView('explorationView');
        
        setTimeout(() => {
            document.getElementById('combatLog').innerHTML = '';
        }, 3000);
    }

    addCombatLog(message) {
        const log = document.getElementById('combatLog');
        const p = document.createElement('p');
        p.textContent = message;
        log.appendChild(p);
        log.scrollTop = log.scrollHeight;
    }

    showLevelUp(levels) {
        document.getElementById('newLevel').textContent = this.gameData.player.level;
        document.getElementById('skillPoints').textContent = this.gameData.player.skillPoints;
        this.showModal('levelUpModal');
    }

    upgradeStat(stat) {
        if (this.gameData.player.skillPoints > 0) {
            this.gameData.player.stats[stat]++;
            this.gameData.player.skillPoints--;
            
            document.getElementById('skillPoints').textContent = this.gameData.player.skillPoints;
            
            if (this.gameData.player.skillPoints === 0) {
                document.getElementById('confirmLevelUpBtn').style.display = 'block';
            }
        }
    }

    confirmLevelUp() {
        this.hideModal('levelUpModal');
        this.updateUI();
        this.saveGame();
    }

    foundTreasure() {
        const treasures = [
            { name: "Dimensionskristall", icon: "💎", rarity: "rare", existencePoints: 4 },
            { name: "Äther-Relikt", icon: "🏺", rarity: "epic", existencePoints: 6 },
            { name: "Void-Essenz", icon: "🌌", rarity: "legendary", existencePoints: 8 }
        ];
        
        const treasure = treasures[Math.floor(Math.random() * treasures.length)];
        this.gameData.player.inventory.push(treasure);
        this.gameData.player.resources.aetherEssence += 10;
        
        this.showNotification(`Du findest einen Schatz: ${treasure.name}!`);
    }

    specialEvent() {
        const events = [
            "Du findest einen Äther-Pool und regenerierst vollständig!",
            "Ein dimensionales Portal gewährt dir zusätzliche Ressourcen!",
            "Du entdeckst ein altes Memento-Fragment!"
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        
        if (event.includes("regenerierst")) {
            this.gameData.player.currentHP = this.gameData.player.getMaxHP();
        } else if (event.includes("Ressourcen")) {
            this.gameData.player.resources.aetherEssence += 15;
            this.gameData.player.resources.dimensionalFragments += 5;
        }
        
        this.showNotification(event);
        this.updateUI();
    }

    rest() {
        this.gameData.player.currentHP = Math.min(
            this.gameData.player.getMaxHP(),
            this.gameData.player.currentHP + Math.floor(this.gameData.player.getMaxHP() * 0.3)
        );
        this.updateUI();
        this.showNotification("Du rastest und regenerierst Lebenspunkte.");
    }

    dimensionShift() {
        const newLevel = this.gameData.currentDimension.level + 1;
        const dimensionNames = [
            `Kristall-Dimension Beta-${newLevel}`,
            `Schatten-Dimension Gamma-${newLevel}`,
            `Äther-Dimension Delta-${newLevel}`,
            `Void-Dimension Omega-${newLevel}`
        ];
        
        const newName = dimensionNames[Math.floor(Math.random() * dimensionNames.length)];
        this.gameData.currentDimension = new DimensionRift(newName, newLevel);
        
        this.generateExplorationGrid();
        this.updateUI();
        this.showNotification(`Du betrittst eine neue Dimension: ${newName}`);
    }

    enterRoom(roomId) {
        if (roomId === this.gameData.currentDimension.currentRoom) return;
        if (Math.abs(roomId - this.gameData.currentDimension.currentRoom) > 1) {
            this.showNotification("Du kannst nur zu angrenzenden Räumen gehen!");
            return;
        }
        
        this.gameData.currentDimension.currentRoom = roomId;
        if (!this.gameData.currentDimension.explored.includes(roomId)) {
            this.gameData.currentDimension.explored.push(roomId);
        }
        
        this.generateExplorationGrid();
        this.updateUI();
        
        const room = this.gameData.currentDimension.rooms[roomId];
        if (room.type === 'combat' || room.type === 'boss') {
            this.startCombat(room);
        } else if (room.type === 'treasure') {
            this.foundTreasure();
        }
    }

    showNotification(message) {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--secondary-color);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 2000;
            max-width: 300px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }

    saveGame() {
        try {
            const saveData = JSON.stringify(this.gameData);
            localStorage.setItem('aethermoor_save', saveData);
            console.log('Spiel gespeichert');
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
        }
    }

    loadGame() {
        try {
            const saveData = localStorage.getItem('aethermoor_save');
            if (saveData) {
                const parsed = JSON.parse(saveData);
                this.gameData = Object.assign(new GameData(), parsed);
                
                if (this.gameData.player) {
                    this.gameData.player = Object.assign(new Player(), this.gameData.player);
                }
                if (this.gameData.currentDimension) {
                    this.gameData.currentDimension = Object.assign(new DimensionRift(), this.gameData.currentDimension);
                }
                
                this.updateUI();
                this.generateExplorationGrid();
                this.showScreen('gameInterface');
                this.showNotification('Spielstand geladen!');
            } else {
                this.showNotification('Kein Spielstand gefunden!');
            }
        } catch (error) {
            console.error('Fehler beim Laden:', error);
            this.showNotification('Fehler beim Laden des Spielstands!');
        }
    }

    exportSave() {
        try {
            const saveData = JSON.stringify(this.gameData, null, 2);
            const blob = new Blob([saveData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `aethermoor_save_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            this.showNotification('Spielstand exportiert!');
        } catch (error) {
            console.error('Fehler beim Export:', error);
            this.showNotification('Fehler beim Export!');
        }
    }

    importSave(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const saveData = JSON.parse(e.target.result);
                this.gameData = Object.assign(new GameData(), saveData);
                
                if (this.gameData.player) {
                    this.gameData.player = Object.assign(new Player(), this.gameData.player);
                }
                if (this.gameData.currentDimension) {
                    this.gameData.currentDimension = Object.assign(new DimensionRift(), this.gameData.currentDimension);
                }
                
                this.updateUI();
                this.generateExplorationGrid();
                this.showScreen('gameInterface');
                this.showNotification('Spielstand importiert!');
                this.hideModal('settingsModal');
            } catch (error) {
                console.error('Fehler beim Import:', error);
                this.showNotification('Ungültige Speicherdatei!');
            }
        };
        reader.readAsText(file);
    }

    showAbout() {
        const aboutText = `
Aethermoor Chronicles v${this.gameData.version}

Ein episches 2D-RPG mit prozeduralen Dimensionen.

Features:
• Dimensional Rift System
• Elemental Confluence Combat  
• Quantum Inventory
• Endless Progression
• Vollständig offline spielbar

Entwickelt als Progressive Web App.
        `;
        
        alert(aboutText);
    }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('Service Worker registriert:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker Registrierung fehlgeschlagen:', error);
            });
    });
}

// Initialize Game
const game = new GameEngine();

// Prevent zoom on mobile
document.addEventListener('touchstart', function (event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
});

let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);