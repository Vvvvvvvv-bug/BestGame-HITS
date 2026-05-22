import { eventBus } from "./EventBus";
import { BUILDING_CONFIGS, scaleCost, TURRET_BUILD_BASE_COST, TURRET_CONFIGS } from "./BuildingConfigs";
import type { ResourceCost } from "./BuildingConfigs";


export class GameState {
    public resources = {
        iron: 1200,
        stone: 1000
    };
    public drillsBuilt = 0;
    public turretsBuilt = 0;
    public unlockedTurretLevel = 0;

    constructor() {
        eventBus.on("resource-mined", (payload) => {
            this.resources[payload.type] += payload.amount;
        });
    }

    public getDrillCost(): ResourceCost {
        return scaleCost(BUILDING_CONFIGS.drill.cost, Math.pow(2, this.drillsBuilt));
    }

    public getWallCost(): ResourceCost {
        return BUILDING_CONFIGS.wall.cost;
    }

    public getBombCost(): ResourceCost {
        return BUILDING_CONFIGS.bomb.cost;
    }

    public getTurretBuildCost(): number {
        return Math.ceil(TURRET_BUILD_BASE_COST * Math.pow(2, this.turretsBuilt));
    }

    public getTurretUnlockCost(level: number): number {
        return TURRET_CONFIGS[level - 1]?.unlockCost ?? Infinity;
    }

    public spendMetal(amount: number): boolean {
        if (this.resources.iron < amount) return false;
        this.resources.iron -= amount;
        return true;
    }

    public spendStone(amount: number): boolean {
        if (this.resources.stone < amount) return false;
        this.resources.stone -= amount;
        return true;
    }

    public spendAny(amount: number): boolean {
        const totalResources = this.resources.iron + this.resources.stone;
        if (totalResources < amount) return false;

        const ironCost = Math.min(amount, this.resources.iron);
        const stoneCost = amount - ironCost;
        this.resources.iron -= ironCost;
        this.resources.stone -= stoneCost;
        return true;
    }

    public canAffordCost(cost: ResourceCost): boolean {
        return this.resources.iron >= cost.iron && this.resources.stone >= cost.stone;
    }

    public spendCost(cost: ResourceCost): boolean {
        if (!this.canAffordCost(cost)) return false;
        this.resources.iron -= cost.iron;
        this.resources.stone -= cost.stone;
        return true;
    }

    public recordDrillBuilt(): void {
        this.drillsBuilt++;
    }

    public recordTurretBuilt(): void {
        this.turretsBuilt++;
    }

    public unlockTurret(level: number): boolean {
        if (level !== this.unlockedTurretLevel + 1) return false;
        const cost = this.getTurretUnlockCost(level);
        if (!this.spendMetal(cost)) return false;
        this.unlockedTurretLevel = level;
        return true;
    }
}

