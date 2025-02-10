import { world, Block, system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

/** @type {import("@minecraft/server").BlockCustomComponent} */
const rsClockMenuComponent = {
    onPlayerInteract(event) {
        let currentEnable = event.block.permutation.getState("ican:enabled");
        let currentREnable = event.block.permutation.getState("ican:enabledByRedstone");
        let currentUnits = event.block.permutation.getState("ican:units");
        let interval = event.block.permutation.getState("ican:iSingleMultiplier");
        let duration = event.block.permutation.getState("ican:dSingleMultiplier");
        if (event.block.permutation.getState("ican:iMultipleOfTen") == true)
            interval = interval * 10;
        if (event.block.permutation.getState("ican:dMultipleOfTen") == true)
            duration = duration * 10;
        let form = new ModalFormData();
        form.title(`Advanced Redstone Clock`);
        form.toggle(`Manual Enabled`, currentEnable);
        form.toggle(`Redstone Enabled`, currentREnable);
        form.toggle(`Seconds / Ticks`, currentUnits);
        form.slider(`Interval (only <=6 or groups of 10 up to 60 will be stored)`, 1, 99, 1, interval);
        form.slider(`Duration (only <=6 or groups of 10 up to 60 will be stored)`, 1, 99, 1, duration);
        form.show(event.player).then(response => {
            if (response.canceled) return;
            event.block.setPermutation(event.block.permutation.withState("ican:enabled", false));
            event.block.setPermutation(event.block.permutation.withState("ican:enabledByRedstone", false));
            system.waitTicks(20).then(() => {
                if ((response.formValues[3] / 10) % 10 == 0) {
                    event.block.setPermutation(event.block.permutation.withState("ican:iSingleMultiplier", response.formValues[3] % 10));
                }
                else {
                    event.block.setPermutation(event.block.permutation.withState("ican:iSingleMultiplier", (response.formValues[3] / 10) % 10));
                    event.block.setPermutation(event.block.permutation.withState("ican:iMultipleOfTen", true));
                }

                if ((response.formValues[4] / 10) % 10 == 0) {
                    event.block.setPermutation(event.block.permutation.withState("ican:dSingleMultiplier", response.formValues[4] % 10));
                }
                else {
                    event.block.setPermutation(event.block.permutation.withState("ican:dSingleMultiplier", (response.formValues[4] / 10) % 10));
                    event.block.setPermutation(event.block.permutation.withState("ican:dMultipleOfTen", true));
                }

                event.block.setPermutation(event.block.permutation.withState("ican:enabled", response.formValues[0]));
                event.block.setPermutation(event.block.permutation.withState("ican:enabledByRedstone", response.formValues[1]));
                event.block.setPermutation(event.block.permutation.withState("ican:units", response.formValues[2]));
                clockActivate(event.block, response.formValues[3], response.formValues[4]);
            });
        });
    }
}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "ican:rs_clock_menu",
        rsClockMenuComponent
    );
});

/** @type {import("@minecraft/server").BlockCustomComponent} */
const clockTriggerComponent = {
    onTick(event) {
        if (event.block.permutation.getState("ican:running") == false && (event.block.permutation.getState("ican:enabled") == true || (event.block.permutation.getState("ican:enabledByRedsone") == true && event.block.permutation.getState("ican:inputEnabled") == true))) {
            let interval = event.block.permutation.getState("ican:iSingleMultiplier");
            let duration = event.block.permutation.getState("ican:dSingleMultiplier");
            if (event.block.permutation.getState("ican:iMultipleOfTen") == true)
                interval = interval * 10;
            if (event.block.permutation.getState("ican:dMultipleOfTen") == true)
                duration = duration * 10;
            event.block.setPermutation(event.block.permutation.withState("ican:running", true));
            clockActivate(event.block, interval, duration);
        }
    }

}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "ican:rs_clock_trigger",
        clockTriggerComponent
    );
});

/**
 * @param {Block} block
 * @param {Integer} interval
 * @param {Integer} duration
 */
function clockActivate(block, interval, duration) {
    if (block.permutation.getState("ican:enabled") == false && (block.permutation.getState("ican:enabledByRedsone") == false || block.permutation.getState("ican:inputEnabled") == false)) {
        block.setPermutation(block.permutation.withState("ican:output", false));
        block.setPermutation(block.permutation.withState("ican:running", false));
        return;
    }
    let units = block.permutation.getState("ican:units");
    if (units) {
        system.runInterval(() => {
            if (block.permutation.getState("ican:enabled") == false && (block.permutation.getState("ican:enabledByRedsone") == false || block.permutation.getState("ican:inputEnabled") == false)) {
                block.setPermutation(block.permutation.withState("ican:output", false));
                block.setPermutation(block.permutation.withState("ican:running", false));
                return;
            }
            block.setPermutation(block.permutation.withState("ican:output", true));
            system.runTimeout(() => {
                if (block.permutation.getState("ican:enabled") == false && (block.permutation.getState("ican:enabledByRedsone") == false || block.permutation.getState("ican:inputEnabled") == false)) {
                    block.setPermutation(block.permutation.withState("ican:output", false));
                    block.setPermutation(block.permutation.withState("ican:running", false));
                    return;
                }
                block.setPermutation(block.permutation.withState("ican:output", false));
            }, duration);
        }, interval + duration);
    }
    else {
        system.runInterval(() => {
            if (block.permutation.getState("ican:enabled") == false && (block.permutation.getState("ican:enabledByRedsone") == false || block.permutation.getState("ican:inputEnabled") == false)) {
                block.setPermutation(block.permutation.withState("ican:output", false));
                block.setPermutation(block.permutation.withState("ican:running", false));
                return;
            }
            block.setPermutation(block.permutation.withState("ican:output", true));
            system.runTimeout(() => {
                if (block.permutation.getState("ican:enabled") == false && (block.permutation.getState("ican:enabledByRedsone") == false || block.permutation.getState("ican:inputEnabled") == false)) {
                    block.setPermutation(block.permutation.withState("ican:output", false));
                    block.setPermutation(block.permutation.withState("ican:running", false));
                    return;
                }
                block.setPermutation(block.permutation.withState("ican:output", false));
            }, duration * 20);
        }, (interval + duration) * 20);
    }
}
