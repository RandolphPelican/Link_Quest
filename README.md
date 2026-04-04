# ⚔️ LINK QUEST

A 100% Vanilla JS/Canvas2D RPG built with love. Explore dungeons, fight monsters, and create your own rooms!

## 🎮 Game Modes
- **Solo Adventure**: Journey through the Debug Dungeon, Hallucination Halls, and the Final Compile.
- **Multiplayer**: Host or Join rooms to play with friends (requires Socket.io relay server).
- **Maker Mode**: Design your own levels with a full-featured editor.

## 🛠️ Maker Mode Features
- **Palette**: Place tiles, enemies, objects, and decorations.
- **Campaigns**: Link multiple rooms into a single campaign.
- **Door Linking**: Connect rooms via doors with intuitive UI.
- **AI Suggest**: Generate Zelda-like room layouts using balanced design heuristics.
- **Undo/Redo**: Fast iteration with `Ctrl+Z` and `Ctrl+Y`.
- **Mobile Support**: Fully touch-compatible editor.
- **Sharing**: One-click sharing via GitHub Gists. Export your campaign and share the URL!

## 🔗 Sharing Your Campaign
1. Click **SHARE** in Maker Mode.
2. Provide a GitHub Personal Access Token (PAT) when prompted.
3. Copy the generated URL and send it to friends!
4. Friends can open the link to play your custom campaign instantly.

## ✨ Creative Features
- **Dad's AI Tip**: Keep an eye out for signs! Interacting with them might reveal a motivational coding tip from Dad.
- **PWA Ready**: Add the game to your home screen for offline play and a full-screen experience.
- **Particle Polish**: Enhanced visual feedback for attacks, spells, and game events.
- **Dynamic Animations**: Characters have walking animations, weapon swings, and attack effects.
- **Sound System**: Complete audio system with sound effects and level-specific background music.

## 🚀 Development
Built with:
- Vanilla JavaScript
- Canvas API
- Socket.io (for Multiplayer)

Deploy ready for **Render**.

## 📋 Development Roadmap & Priority Areas

### 🔴 HIGH PRIORITY (Function & Continuity)
1. **Multiplayer Server Setup**: Create a proper Socket.io server for multiplayer functionality
2. **Sound Assets**: Add actual sound files for the sound system
3. **Mobile Controls**: Test and improve mobile touch controls
4. **Bug Testing**: Comprehensive testing of all game modes and features

### 🟡 MEDIUM PRIORITY (Looks & Polish)
1. **Advanced Animations**: Frame-by-frame character animations using sprite sheets
2. **Enemy AI**: More sophisticated enemy behaviors and patterns
3. **Visual Effects**: Screen shake, hit pause, and other juicy effects
4. **UI/UX Improvements**: Better menus, tooltips, and visual feedback
5. **Level Design**: More levels and better balanced difficulty curve

### 🟢 LOW PRIORITY (Enhancements)
1. **Save System**: Cloud saving for campaigns and progress
2. **Achievements**: More achievements and progression tracking
3. **Customization**: Character customization and unlockables
4. **Story Mode**: Expanded narrative and cutscenes
5. **Accessibility**: Colorblind modes, font scaling, and other accessibility features

## 👨‍💻 For Developers Continuing This Project

### Getting Started
1. Clone the repository: `git clone https://github.com/RandolphPelican/Link_Quest.git`
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge)
3. Use the character selection screen to start playing

### Key Files to Understand
- `js/main.js` - Main game loop and state management
- `js/player.js` - Player character logic and rendering
- `js/enemy.js` - Enemy AI and types
- `js/maker.js` - Level editor functionality
- `js/network.js` - Multiplayer networking
- `js/engine.js` - Core engine, particles, and sound system
- `js/sprites.js` - Sprite management and rendering
- `js/tiles.js` - Tile management and rendering

### Testing
Test files are included to verify specific functionality:
- `test_character_selection.html` - Character selection UI
- `test_enemy_sprites.html` - Enemy rendering
- `test_sprite_loading.html` - Sprite loading
- `test_sound.html` - Sound system

### Adding New Features
1. **New Enemy Types**: Add to `js/enemy.js` and `js/sprites.js`
2. **New Items**: Add to `js/item.js` and include in level data
3. **New Tiles**: Add to `js/tiles.js` and maker mode palette
4. **New Sounds**: Add to `js/engine.js` SoundSystem and place files in `assets/sounds/`

### Debugging Tips
- Use `console.log()` liberally - the game has many debug points already
- Check browser console for errors
- Test in multiple browsers for compatibility
- Mobile testing should be done on actual devices

## 🎯 Game Design Philosophy
"The best things are built with love, teamwork, and every tool available."

Built for Lincoln, Journey, Noha, and Bear - may this game bring joy to players and developers alike!

**Priority Order**: Function → Continuity → Looks → Polish
