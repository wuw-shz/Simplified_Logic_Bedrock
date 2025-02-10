import { BlockPermutation, world, system } from "@minecraft/server";

/**
 * GENERAL GATES
 * THE FOLLOWING COMPONENTS APPLY TO ALL GATES
 */

/** @type {import("@minecraft/server").BlockCustomComponent} */
const directionalBlockPlacementComponent = {
    beforeOnPlayerPlace(event) {
        let direction = -1
        const playerYRotation = event.player.getRotation().y;
        if (playerYRotation >= 135 || playerYRotation < -135)
            direction = 0;
        if (playerYRotation >= -135 && playerYRotation < -45)
            direction = 3;
        if (playerYRotation >= -45 && playerYRotation < 45)
            direction = 1;
        if (playerYRotation >= 45 && playerYRotation < 135)
            direction = 2;
        event.permutationToPlace = event.permutationToPlace.withState("ican:facing_direction", direction);
    }
};

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "ican:directional_block",
        directionalBlockPlacementComponent
    );
});

/** @type {import("@minecraft/server").BlockCustomComponent} */
const redstoneDirectionalComponent = {
    onTick(event) {
        let left = 0;
        let right = 0;
        let direction = event.block.permutation.getState("ican:facing_direction");
        switch (direction) {
            case 0:
                left = event.block.west(1).getRedstonePower();
                if (left >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:leftEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:leftEnabled", false));
                right = event.block.east(1).getRedstonePower();
                if (right >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:rightEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:rightEnabled", false));
                break;
            case 1:
                left = event.block.east(1).getRedstonePower();
                if (left >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:leftEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:leftEnabled", false));

                right = event.block.west(1).getRedstonePower();
                if (right >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:rightEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:rightEnabled", false));
                break;
            case 2:
                left = event.block.south(1).getRedstonePower();
                if (left >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:leftEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:leftEnabled", false));

                right = event.block.north(1).getRedstonePower();
                if (right >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:rightEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:rightEnabled", false));
                break;
            case 3:
                left = event.block.north(1).getRedstonePower();
                if (left >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:leftEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:leftEnabled", false));

                right = event.block.south(1).getRedstonePower();
                if (right >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:rightEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:rightEnabled", false));
                break;

        }
    }
}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "ican:redstone_directional",
        redstoneDirectionalComponent
    );
});

/** @type {import("@minecraft/server").BlockCustomComponent} */
const triggerOutputComponent = {
    onTick(event) {
        let block = null;
        let direction = event.block.permutation.getState("ican:facing_direction");
        let output = event.block.permutation.getState("ican:output");
        let blockType = output ? "minecraft:powered_repeater" : "minecraft:unpowered_repeater";
        let cardinalDirection = "north"; // Default, will be updated below

        switch (direction) {
            case 0:
                block = event.block.north(1);
                cardinalDirection = "south";
                break;
            case 1:
                block = event.block.south(1);
                cardinalDirection = "north";
                break;
            case 2:
                block = event.block.west(1);
                cardinalDirection = "east";
                break;
            case 3:
                block = event.block.east(1);
                cardinalDirection = "west";
                break;
        }

        if (block) {
            let newBlock = BlockPermutation.resolve(blockType, block.permutation.getAllStates()).withState("minecraft:cardinal_direction", cardinalDirection);
            block.setPermutation(newBlock);
        }
    }
}


world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "ican:trigger_output",
        triggerOutputComponent
    );
});


/**
 * AND GATE
 * THE FOLLOWING ONLY APPLY TO THE AND GATE
 */

/** @type {import("@minecraft/server").BlockCustomComponent} */
const andGateComponent = {
    onTick(event) {
        let leftState = event.block.permutation.getState("ican:leftEnabled");
        let rightState = event.block.permutation.getState("ican:rightEnabled");
        if (leftState == true && rightState == true)
            event.block.setPermutation(event.block.permutation.withState("ican:output", true));
        else
            event.block.setPermutation(event.block.permutation.withState("ican:output", false));
    }
};

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "ican:and_gate",
        andGateComponent
    );
});

/**
 * OR GATE
 * THE FOLLOWING ONLY APPLY TO THE OR GATE
 */

/** @type {import("@minecraft/server").BlockCustomComponent} */
const orGateComponent = {
    onTick(event) {
        let leftState = event.block.permutation.getState("ican:leftEnabled");
        let rightState = event.block.permutation.getState("ican:rightEnabled");
        if (leftState == true || rightState == true)
            event.block.setPermutation(event.block.permutation.withState("ican:output", true));
        else
            event.block.setPermutation(event.block.permutation.withState("ican:output", false));
    }
};

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "ican:or_gate",
        orGateComponent
    );
});

/**
 * NAND GATE
 * THE FOLLOWING ONLY APPLY TO THE NAND GATE
 */

/** @type {import("@minecraft/server").BlockCustomComponent} */
const nandGateComponent = {
    onTick(event) {
        let leftState = event.block.permutation.getState("ican:leftEnabled");
        let rightState = event.block.permutation.getState("ican:rightEnabled");
        if (leftState == true && rightState == true)
            event.block.setPermutation(event.block.permutation.withState("ican:output", false));
        else
            event.block.setPermutation(event.block.permutation.withState("ican:output", true));
    }
};

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "ican:nand_gate",
        nandGateComponent
    );
});


/**
 * NOR GATE
 * THE FOLLOWING ONLY APPLY TO THE NOR GATE
 */

/** @type {import("@minecraft/server").BlockCustomComponent} */
const norGateComponent = {
    onTick(event) {
        let leftState = event.block.permutation.getState("ican:leftEnabled");
        let rightState = event.block.permutation.getState("ican:rightEnabled");
        if (leftState == false && rightState == false)
            event.block.setPermutation(event.block.permutation.withState("ican:output", true));
        else
            event.block.setPermutation(event.block.permutation.withState("ican:output", false));
    }
};

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "ican:nor_gate",
        norGateComponent
    );
});

/**
 * XOR GATE
 * THE FOLLOWING ONLY APPLY TO THE XOR GATE
 */

/** @type {import("@minecraft/server").BlockCustomComponent} */
const xorGateComponent = {
    onTick(event) {
        let leftState = event.block.permutation.getState("ican:leftEnabled");
        let rightState = event.block.permutation.getState("ican:rightEnabled");
        if ((leftState == false && rightState == false) || (leftState == true && rightState == true))
            event.block.setPermutation(event.block.permutation.withState("ican:output", false));
        else
            event.block.setPermutation(event.block.permutation.withState("ican:output", true));
    }
};

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "ican:xor_gate",
        xorGateComponent
    );
});

/**
 * XNOR GATE
 * THE FOLLOWING ONLY APPLY TO THE XNOR GATE
 */

/** @type {import("@minecraft/server").BlockCustomComponent} */
const xnorGateComponent = {
    onTick(event) {
        let leftState = event.block.permutation.getState("ican:leftEnabled");
        let rightState = event.block.permutation.getState("ican:rightEnabled");
        if ((leftState == false && rightState == false) || (leftState == true && rightState == true))
            event.block.setPermutation(event.block.permutation.withState("ican:output", true));
        else
            event.block.setPermutation(event.block.permutation.withState("ican:output", false));
    }
};

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "ican:xnor_gate",
        xnorGateComponent
    );
});

/**
 * NOT GATE
 * THE FOLLOWING ONLY APPLY TO THE XNOR GATE
 */

/** @type {import("@minecraft/server").BlockCustomComponent} */
const notGateComponent = {
    onTick(event) {
        let inputState = event.block.permutation.getState("ican:inputEnabled");
        if (inputState == true)
            event.block.setPermutation(event.block.permutation.withState("ican:output", false));
        else
            event.block.setPermutation(event.block.permutation.withState("ican:output", true));
    }
};

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "ican:not_gate",
        notGateComponent
    );
});

/** @type {import("@minecraft/server").BlockCustomComponent} */
const redstoneSingleDirectionalComponent = {
    onTick(event) {
        let bottom = 0;
        let direction = event.block.permutation.getState("ican:facing_direction");
        switch (direction) {
            case 0:
                bottom = event.block.south(1).getRedstonePower();
                if (bottom >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:inputEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:inputEnabled", false));
                break;
            case 1:
                bottom = event.block.north(1).getRedstonePower();
                if (bottom >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:inputEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:inputEnabled", false));
                break;
            case 2:
                bottom = event.block.east(1).getRedstonePower();
                if (bottom >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:inputEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:inputEnabled", false));
                break;
            case 3:
                bottom = event.block.west(1).getRedstonePower();
                if (bottom >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:inputEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:inputEnabled", false));
                break;

        }
    }
}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "ican:redstone_single_directional",
        redstoneSingleDirectionalComponent
    );
});