import { BlockPermutation, system, world } from "@minecraft/server";

/**
 * UTILITY FUNCTIONS
 */

/**
 * @param {import("@minecraft/server").Block} block
 * @param {string} key
 * @param {string | number | boolean | undefined} value
 */
function updateBlockState(block, key, value) {
    const newPermutation = block.permutation.withState(key, value);
    block.setPermutation(newPermutation);
}

/**
 * @param {import("@minecraft/server").Block} block 
 * @param {string} key 
 * @returns {string | number | boolean | undefined}
 */
function getBlockState(block, key) {
    return block.permutation.getState(key);
}

/**
 * @param {import("@minecraft/server").Block} block 
 * @param {import("@minecraft/server").Direction} direction 
 * @param {number} distance
 * @returns 
 */
const getRedstoneState = (block, direction, distance = 1) => {
    return block[direction](distance).getRedstonePower() >= 1;
};

/**
 * CONSTANTS
 */
const redstoneDirectionalMap = {
    0: { left: "west", right: "east" },
    1: { left: "east", right: "west" },
    2: { left: "south", right: "north" },
    3: { left: "north", right: "south" },
};

const triggerOutputMap = {
    0: { offset: "north", cardinal: "south" },
    1: { offset: "south", cardinal: "north" },
    2: { offset: "west", cardinal: "east" },
    3: { offset: "east", cardinal: "west" },
};

const redstoneSingleDirectionalMap = {
    0: "south",
    1: "north",
    2: "east",
    3: "west",
};

/**
 * COMPONENTS
 */

/** @type {import("@minecraft/server").BlockCustomComponent} */
const directionalBlockPlacementComponent = {
    beforeOnPlayerPlace(event) {
        let direction = -1;
        const playerYRotation = event.player.getRotation().y;

        if (playerYRotation >= 135 || playerYRotation < -135) direction = 0;
        else if (playerYRotation >= -135 && playerYRotation < -45) direction = 3;
        else if (playerYRotation >= -45 && playerYRotation < 45) direction = 1;
        else if (playerYRotation >= 45 && playerYRotation < 135) direction = 2;

        event.permutationToPlace = event.permutationToPlace.withState("ican:facing_direction", direction);
    }
};

/** @type {import("@minecraft/server").BlockCustomComponent} */
const redstoneDirectionalComponent = {
    onTick(event) {
        const block = event.block;
        const direction = getBlockState(block, "ican:facing_direction");
        const mapping = redstoneDirectionalMap[direction];
        if (!mapping) return;

        // LEFT INPUT
        const leftPowered = getRedstoneState(block, mapping.left);
        let delayLeftInput = getBlockState(block, "ican:delayLeftInput");
        if (leftPowered) {
            updateBlockState(block, "ican:leftEnabled", true);
            updateBlockState(block, "ican:delayLeftInput", 1);
        } else {
            if (delayLeftInput < 4) {
                delayLeftInput++;
            }
            if (delayLeftInput >= 4) {
                updateBlockState(block, "ican:leftEnabled", false);
            }
            updateBlockState(block, "ican:delayLeftInput", delayLeftInput);
        }

        // RIGHT INPUT
        const rightPowered = getRedstoneState(block, mapping.right);
        let delayRightInput = getBlockState(block, "ican:delayRightInput");
        if (rightPowered) {
            updateBlockState(block, "ican:rightEnabled", true);
            updateBlockState(block, "ican:delayRightInput", 1);
        } else {
            if (delayRightInput < 4) {
                delayRightInput++;
            }
            if (delayRightInput >= 4) {
                updateBlockState(block, "ican:rightEnabled", false);
            }
            updateBlockState(block, "ican:delayRightInput", delayRightInput);
        }
    }
};

/** @type {import("@minecraft/server").BlockCustomComponent} */
const triggerOutputComponent = {
    onTick(event) {
        const block = event.block;
        const direction = getBlockState(block, "ican:facing_direction");
        const mapping = triggerOutputMap[direction];
        if (!mapping) return;

        const output = getBlockState(block, "ican:output");
        const blockType = output ? "minecraft:powered_repeater" : "minecraft:unpowered_repeater";
        const adjacentBlock = block[mapping.offset](1);

        if (['minecraft:air', "minecraft:powered_repeater", "minecraft:unpowered_repeater"].some(bl => adjacentBlock.matches(bl))) {
            const newPermutation = BlockPermutation
                .resolve(blockType, adjacentBlock.permutation.getAllStates())
                .withState("minecraft:cardinal_direction", mapping.cardinal);
            adjacentBlock.setPermutation(newPermutation);
        }
    }
};

world.beforeEvents.playerBreakBlock.subscribe(event => {
    const block = event.block;
    const direction = getBlockState(block, "ican:facing_direction");
    const mapping = triggerOutputMap[direction];
    if (!mapping) return;

    const adjacentBlock = block[mapping.offset](1);
    if (["minecraft:powered_repeater", "minecraft:unpowered_repeater"].some(bl => adjacentBlock.matches(bl))) {
        const newPermutation = BlockPermutation.resolve('minecraft:air');
        system.run(() => adjacentBlock.setPermutation(newPermutation));
    }
});

/**
 * AND GATE
 * THE FOLLOWING ONLY APPLY TO THE AND GATE
 * @type {import("@minecraft/server").BlockCustomComponent}
 */
const andGateComponent = {
    onTick(event) {
        const block = event.block;
        const leftState = getBlockState(block, "ican:leftEnabled");
        const rightState = getBlockState(block, "ican:rightEnabled");
        updateBlockState(block, "ican:output", leftState && rightState);
    }
};

/**
 * OR GATE
 * THE FOLLOWING ONLY APPLY TO THE OR GATE
 * @type {import("@minecraft/server").BlockCustomComponent}
 */
const orGateComponent = {
    onTick(event) {
        const block = event.block;
        const leftState = getBlockState(block, "ican:leftEnabled");
        const rightState = getBlockState(block, "ican:rightEnabled");
        updateBlockState(block, "ican:output", leftState || rightState);
    }
};

/**
 * NAND GATE
 * THE FOLLOWING ONLY APPLY TO THE NAND GATE
 * @type {import("@minecraft/server").BlockCustomComponent}
 */
const nandGateComponent = {
    onTick(event) {
        const block = event.block;
        const leftState = getBlockState(block, "ican:leftEnabled");
        const rightState = getBlockState(block, "ican:rightEnabled");
        updateBlockState(block, "ican:output", !(leftState && rightState));
    }
};

/**
 * NOR GATE
 * THE FOLLOWING ONLY APPLY TO THE NOR GATE
 * @type {import("@minecraft/server").BlockCustomComponent}
 */
const norGateComponent = {
    onTick(event) {
        const block = event.block;
        const leftState = getBlockState(block, "ican:leftEnabled");
        const rightState = getBlockState(block, "ican:rightEnabled");
        updateBlockState(block, "ican:output", !leftState && !rightState);
    }
};

/**
 * XOR GATE
 * THE FOLLOWING ONLY APPLY TO THE XOR GATE
 * @type {import("@minecraft/server").BlockCustomComponent}
 */
const xorGateComponent = {
    onTick(event) {
        const block = event.block;
        const leftState = getBlockState(block, "ican:leftEnabled");
        const rightState = getBlockState(block, "ican:rightEnabled");
        updateBlockState(block, "ican:output", leftState !== rightState);
    }
};

/**
 * XNOR GATE
 * THE FOLLOWING ONLY APPLY TO THE XNOR GATE
 * @type {import("@minecraft/server").BlockCustomComponent}
 */
const xnorGateComponent = {
    onTick(event) {
        const block = event.block;
        const leftState = getBlockState(block, "ican:leftEnabled");
        const rightState = getBlockState(block, "ican:rightEnabled");
        updateBlockState(block, "ican:output", leftState === rightState);
    }
};

/**
 * NOT GATE
 * THE FOLLOWING ONLY APPLY TO THE XNOR GATE
 * @type {import("@minecraft/server").BlockCustomComponent}
 */
const notGateComponent = {
    onTick(event) {
        const block = event.block;
        const inputState = getBlockState(block, "ican:inputEnabled");
        updateBlockState(block, "ican:output", !inputState);
    }
};

/** @type {import("@minecraft/server").BlockCustomComponent} */
const redstoneSingleDirectionalComponent = {
    onTick(event) {
        const block = event.block;
        const direction = getBlockState(block, "ican:facing_direction");
        const side = redstoneSingleDirectionalMap[direction];
        if (side) {
            const inputEnabled = getRedstoneState(block, side);
            updateBlockState(block, "ican:inputEnabled", inputEnabled);
        }
    }
};

/**
 * REGISTERING CUSTOM COMPONENTS
 */
world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    const components = {
        "ican:directional_block": directionalBlockPlacementComponent,
        "ican:redstone_directional": redstoneDirectionalComponent,
        "ican:trigger_output": triggerOutputComponent,
        "ican:and_gate": andGateComponent,
        "ican:or_gate": orGateComponent,
        "ican:nand_gate": nandGateComponent,
        "ican:nor_gate": norGateComponent,
        "ican:xor_gate": xorGateComponent,
        "ican:xnor_gate": xnorGateComponent,
        "ican:not_gate": notGateComponent,
        "ican:redstone_single_directional": redstoneSingleDirectionalComponent,
    };

    for (const [name, component] of Object.entries(components)) {
        blockComponentRegistry.registerCustomComponent(name, component);
    }
});
