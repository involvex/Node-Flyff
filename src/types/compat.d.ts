// Temporary compatibility type shims to aid incremental migration
// These declarations are intentionally permissive (any) and will be
// replaced by proper typings as we resolve implementation mismatches.

declare global {
  // Skill shims
  interface Skill {
    properties?: any;
    Properties?: any;
    level?: number;
    Level?: number;
    levelProperties?: any;
    LevelProperties?: any;
  }

  // Player / Mover shims
  interface Player {
    Inventory?: any;
    inventory?: any;
    Projectiles?: any;
    projectiles?: any;
    Delayer?: any;
    delayer?: any;
    CancelSkillUsage?: any;
    cancelSkillUsage?: any;
  }

  // Item shims
  interface Item {
    Properties?: any;
    properties?: any;
  }

  // Generic helpers
  interface RangeHelper<T> {
    readonly minimum: number;
    readonly maximum: number;
  }

  // Export empty to convert file to module if needed
  export {};
}
