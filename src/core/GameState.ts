import { eventBus } from "./EventBus";


export class GameState {
    public resources = {
        iron: 150,
        stone: 150
    };

    constructor() {
        eventBus.on("resource-mined", (payload) => {
            this.resources[payload.type] += payload.amount;
        });
    }
}

