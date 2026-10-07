# ⚔️ DAWN OF WARRIORS: ANCIENT TIMES

> **Static GitHub Pages game:** This release runs without a Node.js or Express
> server. Enable **Settings → Pages → GitHub Actions** to publish it. See
> [DEPLOYMENT.md](./DEPLOYMENT.md). Saves are local to the current browser and
> are not synced between devices. Local commander profiles are browser-only
> labels, not online accounts; there is no password authentication or email
> recovery in this static release.

DAWN OF WARRIORS: ANCIENT TIMES is a web-based, open-world real-time strategy game inspired by Age of Empires and Rise of Kingdoms. Set in the ancient world, players can choose kingdoms across Europe, Asia, and the Middle East to build powerful empires, develop settlements, gather resources, recruit armies, and conquer rival civilizations.

The game features two main modes: Campaign Mode, where players freely build and expand their own empires, and Story Mode, which offers a guided narrative with cinematic cutscenes, memorable characters, and epic ancient battles.

Every new Campaign or Story Mode realm begins in its selected civilization's historical period with its own movable historical commander, period-appropriate tools, no buildings, no stored resources, and no enemy forces. The wilderness contains trees, wildlife, and gatherable materials; roads, bridges, fields, and settlement structures appear only after the realm has grown. Build a town center, establish at least four buildings, and grow to 12 people to reveal rival territories and begin conquest. Open **Camp & people** to gather supplies, hire villagers, and assign specialist roles. The opening loading screen uses animated pixel-art historical scenes.

With over 50 playable and enemy characters, strategic combat, empire-building mechanics, resource management, and persistent player progression, the game delivers an immersive ancient-world experience. Africa and Australia are planned for future expansion.

### 1. 🎮 Game Overview

**DAWN OF WARRIORS: ANCIENT TIMES** is a web-based, open-world real-time strategy game inspired by _Age of Empires_ and _Rise of Kingdoms_.

Players command ancient civilizations, build empires, gather resources, recruit armies, explore territories, and conquer rival kingdoms.

The game uses an **isometric, elevated top-down perspective**, allowing players to observe and command entire armies instead of controlling a single soldier.

- **Platform:** Web browser
- **Frontend:** React
- **Genre:** Real-Time Strategy, Empire Building, Military Conquest
- **Playable Regions:** Europe, Asia, and the Middle East
- **Future Regions:** Africa and Australia
- **Game Modes:** Campaign and Story Mode

---

# 2. 🏰 Main Menu and Game Modes

The main menu contains exactly six options:

| Menu              | Function                                             |
| ----------------- | ---------------------------------------------------- |
| Campaign          | Build and expand your own empire.                    |
| Story Mode        | Play a guided narrative campaign.                    |
| Character Profile | View your profile, characters, and achievements.     |
| Settings          | Configure game preferences.                          |
| Extras            | Explore lore, encyclopedias, and additional content. |
| Quit              | Leave the active game session.                       |

Only **Campaign and Story Mode** are playable game modes.

---

# 3. 🌍 World Map and Exploration

The world map is divided into three initially playable regions:

### Europe

Ancient kingdoms, forests, mountains, plains, and fortified cities.

### Asia

Ancient civilizations, river valleys, mountain ranges, and expansive territories.

### Middle East

Desert kingdoms, trading cities, fertile river valleys, and fortified settlements.

### Future Expansion

Africa and Australia appear as **COMING SOON** regions.

## Exploration Rules

- Players begin with a limited area of explored territory.
- Scouts and armies reveal unexplored locations.
- Resources and settlements can be discovered across the map.
- Enemy kingdoms occupy territories outside the player's control.
- Terrain influences movement, visibility, and battlefield positioning.

The world map should feel large and connected, while individual battles take place in dedicated strategic environments.

---

# 4. 🛡️ Campaign Mode — Build Your Own Empire

Campaign Mode is a sandbox-style experience in which the player chooses a kingdom and develops an empire.

## Starting a Campaign

1. Select Campaign Mode.
2. Choose a geographical region.
3. Select an available kingdom or civilization.
4. Review its strengths, weaknesses, and starting resources.
5. Establish your capital and begin expanding.

## Campaign Objectives

- Build settlements.
- Gather resources.
- Recruit military units.
- Expand territorial control.
- Research technologies.
- Form alliances.
- Defend your kingdom.
- Conquer rival civilizations.

### Victory Conditions

The campaign can support multiple objectives, such as:

- Conquering a rival empire.
- Capturing designated territories.
- Controlling important settlements.
- Completing civilization-specific objectives.

The player determines how to develop their empire and which kingdoms to confront.

---

# 5. 📖 Story Mode — A Guided Ancient-War Campaign

Story Mode follows a predetermined narrative featuring original characters, ancient civilizations, political conflicts, and large-scale battles.

Unlike Campaign Mode, the player follows a structured sequence of missions.

## Story Progression

Each chapter contains missions with specific objectives.

Examples:

- Defend a settlement from an invasion.
- Gather survivors and rebuild an army.
- Secure resources for a military campaign.
- Form alliances with neighboring kingdoms.
- Defeat an enemy commander.
- Capture a fortified capital.
- Confront the main antagonist.

## Cinematic Cutscenes

Story Mode features cinematic sequences inspired by the dramatic presentation of _Call of Duty: Modern Warfare_, adapted to an ancient setting.

Cutscenes include:

- Commanders delivering speeches.
- Armies marching toward battle.
- Cities under siege.
- Political confrontations.
- Character interactions.
- Major battle introductions.
- Victory and defeat sequences.

**Gameplay remains strategic and top-down.** Cinematic sequences may use close-up camera angles.

---

# 6. 💰 Resource Management and Economy

The game uses four primary resources.

| Resource | Purpose                                              |
| -------- | ---------------------------------------------------- |
| Food     | Supports population growth and military recruitment. |
| Wood     | Used for buildings and equipment.                    |
| Stone    | Used for fortifications and advanced structures.     |
| Gold     | Used for elite units, technologies, and trading.     |

## Resource Rules

1. Workers gather resources from available sources.
2. Gathered resources are added to the player's economy.
3. Buildings and military units require resources.
4. Resource production continues while the game simulation is active.
5. Controlling more territory can provide access to additional resources.
6. Players must balance economic development with military spending.

The core gameplay loop is **gather resources → construct buildings → recruit units → expand territory → fight enemies → strengthen the empire**. ([Blizzard News][1])

---

# 7. 🏗️ Empire Building and Construction

Players can construct and upgrade buildings within their settlements.

### Building Categories

| Building        | Function                             |
| --------------- | ------------------------------------ |
| Town Center     | Main settlement building.            |
| Capital Palace  | Administrative center of the empire. |
| Barracks        | Trains infantry.                     |
| Archery Range   | Trains ranged units.                 |
| Stable          | Trains cavalry.                      |
| Siege Workshop  | Produces siege equipment.            |
| Blacksmith      | Improves military equipment.         |
| Market          | Enables trading.                     |
| Farm            | Produces food.                       |
| Lumber Mill     | Supports wood production.            |
| Stone Quarry    | Produces stone.                      |
| Defensive Walls | Protect settlements.                 |
| Watchtower      | Provides defensive coverage.         |
| Research Center | Unlocks technologies.                |

## Construction Rules

- Buildings require resources.
- Some buildings require prerequisite structures.
- Construction takes time.
- Buildings can be upgraded.
- Buildings have health and can be damaged or destroyed.
- Certain buildings unlock new military units and technologies.

---

# 8. ⚔️ Military Units and Character System

The game must contain **at least 50 distinct characters**, divided into playable military units and AI-controlled enemies.

## Playable Units

Playable characters are military units that the player can recruit and deploy.

### Unit Classes

- Infantry
- Swordsmen
- Spearmen
- Archers
- Crossbowmen
- Cavalry
- Heavy Cavalry
- Shield Warriors
- Elite Guards
- Commanders
- Generals
- Siege Specialists
- Military Engineers
- Regional Warriors
- Elite Units

## Character Attributes

Each character has:

- Name and portrait.
- Civilization or faction.
- Unit class.
- Health.
- Attack damage.
- Defense.
- Movement speed.
- Attack range.
- Attack speed.
- Recruitment cost.
- Special abilities.
- Upgrade path.

Characters can gain experience, level up, and improve through equipment, training, and technology.

---

# 9. 🤖 Enemy AI and Difficulty

Enemy kingdoms are controlled by AI.

The AI must be capable of:

- Gathering resources.
- Constructing buildings.
- Recruiting military units.
- Expanding territory.
- Defending settlements.
- Attacking rival kingdoms.
- Reinforcing threatened locations.
- Using formations and strategic positioning.

## Difficulty Progression

| Difficulty   | Enemy Behavior                                               |
| ------------ | ------------------------------------------------------------ |
| Early        | Smaller armies and basic tactics.                            |
| Intermediate | Better equipment and stronger defenses.                      |
| Advanced     | Larger armies and coordinated attacks.                       |
| Elite        | Powerful commanders, advanced units, and complex strategies. |

Enemy strength should increase through appropriate unit composition, upgrades, equipment, and tactical behavior.

**Higher-level enemies should be more challenging without becoming impossible to defeat.**

---

# 10. 🗡️ Real-Time Combat and Army Commands

Combat takes place in real time.

The player commands armies using an elevated strategic camera.

## Available Commands

- Select units.
- Move units.
- Attack enemies.
- Hold positions.
- Defend locations.
- Form military formations.
- Retreat.
- Pursue enemies.
- Capture objectives.
- Attack settlements.

## Formation System

Military formations include:

- Line Formation
- Defensive Formation
- Spear Formation
- Cavalry Formation
- Archer Formation
- Siege Formation

## Combat Rules

1. Units have health and combat attributes.
2. Units automatically attack enemies within their effective range when given appropriate orders.
3. Different unit classes have different strengths and weaknesses.
4. Terrain and positioning influence combat effectiveness.
5. Units can be defeated and removed from the battlefield.
6. Commanders can provide bonuses to nearby troops.
7. Battles end when the mission's victory or defeat conditions are met.

### Example Counter System

- Spearmen are effective against cavalry.
- Cavalry can flank ranged units.
- Archers attack from a distance.
- Infantry protect the frontline.
- Siege units specialize in damaging defensive structures.

---

# 11. 🔬 Technology and Civilization Progression

Each civilization has a technology tree.

### Technology Categories

- Military
- Agriculture
- Construction
- Trade
- Defense
- Engineering
- Logistics

Research can unlock:

- New military units.
- Stronger equipment.
- Improved resource production.
- Better defensive structures.
- Faster construction.
- Increased unit health and damage.

Technologies require resources and may have prerequisites.

---

# 12. 🏆 Conquest and Territorial Control

Territory is a central part of empire development.

## Territory Rules

- Territories may contain resources, settlements, and strategic locations.
- Players can expand through exploration, settlement, diplomacy, or conquest.
- Enemy territories are defended by AI armies and structures.
- Capturing a settlement grants control according to the mission's rules.
- Some territories require defeating a commander or capturing a strategic objective.

Conquest should provide meaningful rewards, such as additional resources, new settlements, and access to strategic locations.

---

# 13. 👤 Character Profile, Settings, and Extras

### Character Profile

Displays:

- Player identity.
- Selected civilization.
- Player level.
- Character collection.
- Unlocked commanders.
- Military achievements.
- Victories and defeats.
- Conquered territories.

### Settings

Includes:

- Graphics.
- Audio.
- Camera controls.
- Gameplay preferences.
- Accessibility options.

### Extras

Includes:

- Character Encyclopedia.
- Civilization Encyclopedia.
- Ancient World Lore.
- Military Unit Information.
- Technology Information.
- Achievements.
- Credits.

---

# 14. 💾 Browser Saves and Settings

The static release saves campaign state and game preferences in the browser's
local storage. Saves are scoped to the current browser and website origin;
they are not account-backed, synchronized, or recoverable after clearing site
data. GitHub Pages does not run a game server or database.

---

# 15. 🖥️ User Interface and Camera

The game uses a **strategic, isometric or elevated top-down camera**, not a first-person shooter perspective.

## Main Interface

| UI Element   | Function                                                   |
| ------------ | ---------------------------------------------------------- |
| Top Bar      | Displays resources and civilization information.           |
| Left Panel   | Displays selected units and their statistics.              |
| Right Panel  | Displays building information and upgrades.                |
| Bottom Panel | Provides recruitment, construction, and military commands. |
| Minimap      | Displays explored territory and important locations.       |
| World Map    | Displays territorial ownership and settlements.            |

The interface must be responsive, readable, and suitable for managing large armies.

---

# 16. 🏁 Overall Gameplay Loop

The complete gameplay cycle is:

**1. Choose a Kingdom**
Select a civilization and establish a capital.

**2. Develop the Economy**
Gather food, wood, stone, and gold.

**3. Build Settlements**
Construct buildings and improve infrastructure.

**4. Recruit Armies**
Train soldiers, commanders, and specialized units.

**5. Explore the World**
Discover resources, settlements, and rival kingdoms.

**6. Expand Your Territory**
Establish new settlements and secure strategic locations.

**7. Fight Battles**
Command armies, defend your territory, and defeat enemies.

**8. Upgrade Your Civilization**
Research technologies and improve military capabilities.

**9. Conquer Rival Kingdoms**
Capture settlements and achieve campaign objectives.

**10. Preserve Your Progress**
Save your empire and continue developing it in future sessions.

---

# 17. 🎯 Final Game Objective

The objective of **DAWN OF WARRIORS: ANCIENT TIMES** is to deliver a complete ancient-world strategy experience where players can build powerful civilizations, command armies, explore vast territories, and conquer rival empires.

The game combines:

- Open-world exploration.
- Empire building.
- Resource management.
- Military recruitment.
- Real-time strategic combat.
- Enemy AI.
- Technology progression.
- Territorial conquest.
- Cinematic storytelling.
- Persistent player progression.

**The central gameplay principle is simple: build your civilization, strengthen your army, expand your territory, and rise to become a dominant ancient empire.**

[1]: https://news.blizzard.com/en-us/article/23229495/finding-the-fun-real-time-strategy-games-for-beginners?utm_source=chatgpt.com "Finding the Fun: Real-Time Strategy Games for Beginners — Warcraft III: Reforged — Blizzard News"
