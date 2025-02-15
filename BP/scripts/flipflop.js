import { BlockPermutation, world, system } from "@minecraft/server";

/** @type {import("@minecraft/server").BlockCustomComponent} */
const redstoneFlipDirectionalComponent = {
    onTick(event) {
        let clock = 0;
        let input = 0;
        let direction = event.block.permutation.getState("ican:facing_direction");
        switch (direction) {
            case 0:
                clock = event.block.west(1).getRedstonePower();
                if (clock >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:clkEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:clkEnabled", false));
                input = event.block.south(1).getRedstonePower();
                if (input >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:inputEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:inputEnabled", false));
                break;
            case 1:
                clock = event.block.east(1).getRedstonePower();
                if (clock >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:clkEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:clkEnabled", false));

                input = event.block.north(1).getRedstonePower();
                if (input >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:inputEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:inputEnabled", false));
                break;
            case 2:
                clock = event.block.south(1).getRedstonePower();
                if (clock >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:clkEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:clkEnabled", false));

                input = event.block.east(1).getRedstonePower();
                if (input >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:inputEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:inputEnabled", false));
                break;
            case 3:
                clock = event.block.north(1).getRedstonePower();
                if (clock >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:clkEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:clkEnabled", false));

                input = event.block.west(1).getRedstonePower();
                if (input >= 1)
                    event.block.setPermutation(event.block.permutation.withState("ican:inputEnabled", true));
                else
                    event.block.setPermutation(event.block.permutation.withState("ican:inputEnabled", false));
                break;

        }
    }
}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "ican:redstone_flip_directional",
        redstoneFlipDirectionalComponent
    );
});

/** @type {import("@minecraft/server").BlockCustomComponent} */
const triggerInverseOutputComponent = {
    onTick(event) {
        let block = null;
        let direction = event.block.permutation.getState("ican:facing_direction");
        let output = event.block.permutation.getState("ican:output");
        let blockType = output ? "minecraft:unpowered_repeater" : "minecraft:powered_repeater";
        let cardinalDirection = "north"; // Default, will be updated below

        switch (direction) {
            case 0:
                block = event.block.east(1);
                cardinalDirection = "west";
                break;
            case 1:
                block = event.block.west(1);
                cardinalDirection = "east";
                break;
            case 2:
                block = event.block.north(1);
                cardinalDirection = "south";
                break;
            case 3:
                block = event.block.south(1);
                cardinalDirection = "north";
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
        "ican:trigger_inverse_output",
        triggerInverseOutputComponent
    );
});

/** @type {import("@minecraft/server").BlockCustomComponent} */
const dFlipFlopComponent = {
    onTick(event) {
        let clock = event.block.permutation.getState("ican:clkEnabled");
        let input = event.block.permutation.getState("ican:inputEnabled");
        if (clock == true) {
            if (input == true)
                event.block.setPermutation(event.block.permutation.withState("ican:output", true));
            else
                event.block.setPermutation(event.block.permutation.withState("ican:output", false));
        }
    }

}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "ican:d_flipflop",
        dFlipFlopComponent
    );
});

/** @type {import("@minecraft/server").BlockCustomComponent} */
const srFlipFlopComponent = {
    onTick(event) {
        let clock = event.block.permutation.getState("ican:inputEnabled");
        let inputS = event.block.permutation.getState("ican:leftEnabled");
        let inputR = event.block.permutation.getState("ican:rightEnabled");
        if (clock == true) {
            if (inputS == true && inputR == false)
                event.block.setPermutation(event.block.permutation.withState("ican:output", true));
            else if ((inputS != false && inputR != false) || (inputS == false && inputR == true))
                event.block.setPermutation(event.block.permutation.withState("ican:output", false));
        }
    }

}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "ican:sr_flipflop",
        srFlipFlopComponent
    );
});

/** @type {import("@minecraft/server").BlockCustomComponent} */
const jkFlipFlopComponent = {
    onTick(event) {
        let clock = event.block.permutation.getState("ican:inputEnabled");
        let inputS = event.block.permutation.getState("ican:leftEnabled");
        let inputR = event.block.permutation.getState("ican:rightEnabled");
        let output = event.block.permutation.getState("ican:output");
        let toggle = event.block.permutation.getState("ican:toggle");
        if (clock == true) {
            if (inputS == true && inputR == false) {
                event.block.setPermutation(event.block.permutation.withState("ican:output", true));
                event.block.setPermutation(event.block.permutation.withState("ican:toggle", false));
            }
            else if (inputS == false && inputR == true) {
                event.block.setPermutation(event.block.permutation.withState("ican:output", false));
                event.block.setPermutation(event.block.permutation.withState("ican:toggle", false));
            }
            else if (inputS == true && inputR == true && output == false && toggle == false) {
                event.block.setPermutation(event.block.permutation.withState("ican:output", true));
                event.block.setPermutation(event.block.permutation.withState("ican:toggle", true));
            }
            else if (inputS == true && inputR == true && output == true && toggle == false) {
                event.block.setPermutation(event.block.permutation.withState("ican:output", false));
                event.block.setPermutation(event.block.permutation.withState("ican:toggle", true));
            }
            else if (inputS == false && inputR == false && toggle == true) {
                event.block.setPermutation(event.block.permutation.withState("ican:toggle", false));
            }
        }
        else
            event.block.setPermutation(event.block.permutation.withState("ican:toggle", false));
    }

}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "ican:jk_flipflop",
        jkFlipFlopComponent
    );
});

const tFlipFlopComponent = {
    onTick(event) {
        let clock = event.block.permutation.getState("ican:clkEnabled");
        let input = event.block.permutation.getState("ican:inputEnabled");
        let output = event.block.permutation.getState("ican:output");
        let toggle = event.block.permutation.getState("ican:toggle");
        if (clock == true) {
            if (input == true && output == false && toggle == false) {
                event.block.setPermutation(event.block.permutation.withState("ican:output", true));
                event.block.setPermutation(event.block.permutation.withState("ican:toggle", true));
            }
            else if (input == true && output == true && toggle == false) {
                event.block.setPermutation(event.block.permutation.withState("ican:output", false));
                event.block.setPermutation(event.block.permutation.withState("ican:toggle", true));
            }
            else if (input == false && toggle == true) {
                event.block.setPermutation(event.block.permutation.withState("ican:toggle", false));
            }
        }
        else
            event.block.setPermutation(event.block.permutation.withState("ican:toggle", false));
    }

}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "ican:t_flipflop",
        tFlipFlopComponent
    );
});