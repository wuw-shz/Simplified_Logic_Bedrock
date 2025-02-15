import { world, system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

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
 * @param {number} value
 * @returns {{ multiplier: number, multiple: boolean }}
 */
function processSliderValue(value) {
    if (value < 10) {
        return { multiplier: value, multiple: false };
    } else {
        return { multiplier: Math.floor(value / 10), multiple: true };
    }
}

/**
 * @param {import("@minecraft/server").Block} block 
 * @returns {boolean}
 */
function isClockActive(block) {
    return getBlockState(block, "ican:enabled") ||
        (getBlockState(block, "ican:enabledByRedstone") && getBlockState(block, "ican:inputEnabled"));
}

/**
 * @param {import("@minecraft/server").Block} block 
 */
function stopClock(block) {
    if (!block) return
    updateBlockState(block, "ican:output", false);
    updateBlockState(block, "ican:running", false);
}

/**
 * @param {number} duration
 * @returns {Promise<void>}
 */
function delay(duration) {
    return new Promise(resolve => system.runTimeout(resolve, duration));
}

/**
 * @param {import("@minecraft/server").Block} block 
 * @param {number} duration
 */
async function runClockCycle(block, duration) {
    if (!isClockActive(block)) {
        stopClock(block);
        return;
    }
    updateBlockState(block, "ican:output", true);

    const cancelPromise = new Promise(resolve => {
        const checkInterval = system.runInterval(() => {
            if (!block || !isClockActive(block)) {
                system.clearRun(checkInterval);
                resolve('cancelled');
            }
        });
    });

    await Promise.race([delay(duration), cancelPromise]);

    if (!isClockActive(block)) {
        stopClock(block);
        return;
    }
    updateBlockState(block, "ican:output", false);
}

/**
 * @param {import("@minecraft/server").Block} block 
 */
function clockActivate(block) {
    if (!isClockActive(block)) {
        stopClock(block);
        return;
    }
    const baseInterval = getBlockState(block, "ican:iSingleMultiplier");
    const baseDuration = getBlockState(block, "ican:dSingleMultiplier");
    const effectiveInterval = getBlockState(block, "ican:iMultipleOfTen") ? baseInterval * 10 : baseInterval;
    const effectiveDuration = getBlockState(block, "ican:dMultipleOfTen") ? baseDuration * 10 : baseDuration;
    const units = getBlockState(block, "ican:units");

    const runId = system.runInterval(async () => {
        if (!isClockActive(block) || !block) {
            stopClock(block);
            system.clearRun(runId);
            return;
        }
        await runClockCycle(block,
            units ? effectiveDuration : effectiveDuration * 20);
    }, units ? effectiveInterval : effectiveInterval * 20);
}

/**
 * COMPONENTS
 */

/** 
 * @type {import("@minecraft/server").BlockCustomComponent}
 */
const rsClockMenuComponent = {
    onPlayerInteract(event) {
        const block = event.block;

        const currentEnabled = getBlockState(block, "ican:enabled");
        const currentREnabled = getBlockState(block, "ican:enabledByRedstone");
        const currentUnits = getBlockState(block, "ican:units");
        let interval = getBlockState(block, "ican:iSingleMultiplier");
        let duration = getBlockState(block, "ican:dSingleMultiplier");

        if (getBlockState(block, "ican:iMultipleOfTen") === true) {
            interval *= 10;
        }
        if (getBlockState(block, "ican:dMultipleOfTen") === true) {
            duration *= 10;
        }

        const form = new ModalFormData()
            .title("Advanced Redstone Clock")
            .toggle("Manual Enabled", currentEnabled)
            .toggle("Redstone Enabled", currentREnabled)
            .toggle("Seconds / Ticks", currentUnits)
            .slider("Interval (only <=6 or groups of 10 up to 60 will be stored)", 1, 99, 1, interval)
            .slider("Duration (only <=6 or groups of 10 up to 60 will be stored)", 1, 99, 1, duration);

        form.show(event.player).then(response => {
            if (response.canceled) return;

            updateBlockState(block, "ican:enabled", false);
            updateBlockState(block, "ican:enabledByRedstone", false);

            system.waitTicks(1).then(() => {
                const intervalData = processSliderValue(response.formValues[3]);
                updateBlockState(block, "ican:iSingleMultiplier", intervalData.multiplier);
                updateBlockState(block, "ican:iMultipleOfTen", intervalData.multiple);

                const durationData = processSliderValue(response.formValues[4]);
                updateBlockState(block, "ican:dSingleMultiplier", durationData.multiplier);
                updateBlockState(block, "ican:dMultipleOfTen", durationData.multiple);

                updateBlockState(block, "ican:enabled", response.formValues[0]);
                updateBlockState(block, "ican:enabledByRedstone", response.formValues[1]);
                updateBlockState(block, "ican:units", response.formValues[2]);

                clockActivate(block);
            });
        });
    }
};

/** 
 * @type {import("@minecraft/server").BlockCustomComponent}
 */
const clockTriggerComponent = {
    onTick(event) {
        const block = event.block;
        if (block && !getBlockState(block, "ican:running") && isClockActive(block)) {
            updateBlockState(block, "ican:running", true);
            clockActivate(block);
        }
    }
};

/**
 * REGISTERING CUSTOM COMPONENTS
 */
world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("ican:rs_clock_menu", rsClockMenuComponent);
    blockComponentRegistry.registerCustomComponent("ican:rs_clock_trigger", clockTriggerComponent);
});
