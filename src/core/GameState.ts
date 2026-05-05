import { eventBus } from "./EventBus";


export class GameState {
    public resources = {
        iron: 0,
        stone: 0
    };

    constructor() {
        eventBus.on("resource-mined", (payload) => {
            this.resources[payload.type] += payload.amount;
        });
    }
}

