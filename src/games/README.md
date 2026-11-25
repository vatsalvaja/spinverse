# Legacy game sources (no longer used by the website)

The website no longer imports anything from this folder. The six games that used to live here were migrated, unchanged in behaviour, into independent versioned packages under `game-packages/<gameId>/` and are loaded through the package loader (`src/features/game-runtime/`).

**The source of truth is `game-packages/`.** Make all game changes there. This folder is kept only so the migration can be compared against the original, and can be deleted once you are satisfied (git history keeps it).
