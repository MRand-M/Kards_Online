// ==========================================
// 效果系统
// ==========================================

// ==========================================
// 获取所有场上单位
// ==========================================

function getAllBoardUnits() {

    return [

        ...gameState.player.supportLine.filter(
            card => isUnit(card)
        ),

        ...gameState.frontline.cards.filter(
            card => isUnit(card)
        ),

        ...gameState.ai.supportLine.filter(
            card => isUnit(card)
        )

    ];

}


// ==========================================
// 获取指定玩家的所有单位
// ==========================================

function getUnitsByOwner(owner) {

    return getAllBoardUnits().filter(
        card => card.owner === owner
    );

}


// ==========================================
// 判断单位是否属于前线
// ==========================================

function isUnitOnFrontline(card) {

    return (
        gameState.frontline.cards.includes(card)
    );

}


// ==========================================
// 判断单位是否属于支援阵线
// ==========================================

function isUnitInSupportLine(card) {

    return (

        gameState.player.supportLine.includes(card) ||

        gameState.ai.supportLine.includes(card)

    );

}


// ==========================================
// 获取卡牌所在阵线
// ==========================================

function getEffectTargetLine(card) {

    if (!card) {
        return null;
    }


    if (
        gameState.player.supportLine.includes(card)
    ) {

        return "player-support";

    }


    if (
        gameState.ai.supportLine.includes(card)
    ) {

        return "ai-support";

    }


    if (
        gameState.frontline.cards.includes(card)
    ) {

        return "frontline";

    }


    return null;

}


// ==========================================
// 获取效果目标
//
// source = 发动效果的卡
// targetType = 目标类型
// ==========================================

function getEffectTargets(
    source,
    targetType
) {

    if (!source) {

        return [];

    }


    const allUnits =
        getAllBoardUnits();


    const sourceOwner =
        source.owner;


    const enemyOwner =
        sourceOwner === "player"
            ? "ai"
            : "player";


    // ======================================
    // 自己
    // ======================================

    if (
        targetType === "self"
    ) {

        return [source];

    }


    // ======================================
    // 一个友方单位
    // ======================================

    if (
        targetType === "ally_unit"
    ) {

        return allUnits.filter(
            card =>
                card !== source &&
                card.owner === sourceOwner
        );

    }


    // ======================================
    // 所有友方单位
    // ======================================

    if (
        targetType === "all_ally_units"
    ) {

        return allUnits.filter(
            card =>
                card.owner === sourceOwner
        );

    }


    // ======================================
    // 一个敌方单位
    // ======================================

    if (
        targetType === "enemy_unit"
    ) {

        return allUnits.filter(
            card =>
                card.owner === enemyOwner
        );

    }


    // ======================================
    // 所有敌方单位
    // ======================================

    if (
        targetType === "all_enemy_units"
    ) {

        return allUnits.filter(
            card =>
                card.owner === enemyOwner
        );

    }


    // ======================================
    // 前线单位
    // ======================================

    if (
        targetType === "frontline_units"
    ) {

        return gameState.frontline.cards.filter(
            card => isUnit(card)
        );

    }


    // ======================================
    // 支援阵线单位
    // ======================================

    if (
        targetType === "support_units"
    ) {

        return [

            ...gameState.player.supportLine,

            ...gameState.ai.supportLine

        ].filter(
            card => isUnit(card)
        );

    }


    // ======================================
    // 敌方前线单位
    // ======================================

    if (
        targetType === "enemy_frontline_units"
    ) {

        return gameState.frontline.cards.filter(
            card =>
                isUnit(card) &&
                card.owner === enemyOwner
        );

    }


    // ======================================
    // 敌方支援阵线单位
    // ======================================

    if (
        targetType === "enemy_support_units"
    ) {

        return [

            ...gameState.player.supportLine,

            ...gameState.ai.supportLine

        ].filter(
            card =>
                isUnit(card) &&
                card.owner === enemyOwner
        );

    }


    // ======================================
    // 没有找到目标类型
    // ======================================

    console.warn(
        "未知效果目标类型：",
        targetType
    );


    return [];

}

// ==========================================
// 判断目标是否为合法效果目标
// ==========================================

function isValidEffectTarget(
    source,
    target,
    targetType
) {

    if (!source || !target) {

        return false;

    }


    // 获取当前效果允许的所有目标
    const validTargets =
        getEffectTargets(
            source,
            targetType
        );


    // 判断目标是否在合法目标列表中
    return validTargets.includes(
        target
    );

}

// ==========================================
// 统一执行触发器效果
// ==========================================

function executeTriggeredEffects(
    card,
    trigger,
    target = null,
    eventData = null
) {

    if (!card) {
        return;
    }


    if (!Array.isArray(card.effects)) {
        return;
    }


    console.log(
        "检查触发器：",
        trigger,
        "→",
        card.name_en || card.card_id
    );


    card.effects.forEach(effect => {

        if (!effect) {
            return;
        }


        if (
            effect.trigger !== trigger
        ) {

            return;

        }


        console.log(
            "触发效果：",
            effect
        );


        // ==================================
        // 如果外部已经提供目标
        // ==================================

        if (target) {

            executeCardEffect(
                card,
                effect,
                target,
                eventData
            );

            return;

        }


        // ==================================
        // 没有目标
        //
        // executeCardEffect 会自动判断
        // 是否需要玩家选择目标
        // ==================================

        executeCardEffect(
            card,
            effect,
            null,
            eventData
        );

    });

}

// ==========================================
// 部署时
// ==========================================

function onDeploy(card) {

    if (!card) {
        return;
    }


    console.log(
        "效果触发：部署时 →",
        card.name_en || card.card_id
    );


    executeTriggeredEffects(
        card,
        "deploy"
    );

}


// ==========================================
// 攻击时
// ==========================================

function onAttack(
    attacker,
    target
) {

    if (!attacker) {
        return;
    }


    console.log(
        "效果触发：攻击时 →",
        attacker.name_en ||
        attacker.card_id
    );


    executeTriggeredEffects(
        attacker,
        "attack",
        target
    );

}


// ==========================================
// 被攻击时
// ==========================================

function onDefend(
    defender,
    attacker
) {

    if (!defender) {
        return;
    }


    console.log(
        "效果触发：被攻击时 →",
        defender.name_en ||
        defender.card_id
    );


    executeTriggeredEffects(
        defender,
        "defend",
        attacker
    );

}

// ==========================================
// 移动时
// ==========================================

function onMove(card) {

    if (!card) {
        return;
    }


    console.log(
        "效果触发：移动时 →",
        card.name_en ||
        card.card_id
    );


    executeTriggeredEffects(
        card,
        "move"
    );

}


// ==========================================
// 摧毁 / 亡计
// ==========================================

function onDestroy(card) {

    if (!card) {
        return;
    }


    console.log(
        "效果触发：摧毁 / 亡计 →",
        card.name_en ||
        card.card_id
    );


    executeTriggeredEffects(
        card,
        "destroy"
    );

}


// ==========================================
// 回合开始
// ==========================================

function onTurnStart(player) {

    console.log(
        "效果触发：回合开始 →",
        player
    );


    const units =
        getUnitsByOwner(player);


    units.forEach(card => {

        executeTriggeredEffects(
            card,
            "turn_start"
        );

    });

}


// ==========================================
// 回合结束
// ==========================================

function onTurnEnd(player) {

    console.log(
        "效果触发：回合结束 →",
        player
    );


    const units =
        getUnitsByOwner(player);


    units.forEach(card => {

        executeTriggeredEffects(
            card,
            "turn_end"
        );

    });

}


// ==========================================
// 抽牌时
// ==========================================

function onDraw(
    player,
    card
) {

    console.log(
        "效果触发：抽牌 →",
        player,
        card
    );


    if (!card) {
        return;
    }


    // ======================================
    // ① 被抽到的牌自己的效果
    // ======================================

    executeTriggeredEffects(
        card,
        "draw"
    );


    // ======================================
    // ② 场上单位的抽牌触发效果
    // ======================================

    const boardUnits =
        getAllBoardUnits();


    boardUnits.forEach(
        boardCard => {

            // 刚抽到的牌如果已经在场上，
            // 上面已经检查过，不重复检查
            if (
                boardCard === card
            ) {

                return;

            }


            executeTriggeredEffects(
                boardCard,
                "draw"
            );

        }
    );

}

// ==========================================
// 使用卡牌时
// ==========================================

function onPlayCard(
    player,
    card
) {

    if (!card) {
        return;
    }


    console.log(
        "效果触发：使用卡牌 →",
        card.name_en ||
        card.card_id
    );


    executeTriggeredEffects(
        card,
        "play"
    );

}


// ==========================================
// 单位行动时
// ==========================================

function onUnitAction(card) {

    if (!card) {
        return;
    }


    console.log(
        "效果触发：单位行动 →",
        card.name_en ||
        card.card_id
    );


    executeTriggeredEffects(
        card,
        "action"
    );

}


// ==========================================
// 升为老兵时
// ==========================================

function onVeteran(card) {

    if (!card) {
        return;
    }


    console.log(
        "效果触发：升为老兵 →",
        card.name_en ||
        card.card_id
    );


    executeTriggeredEffects(
        card,
        "veteran"
    );

}


// ==========================================
// 受到伤害时
// ==========================================

function onDamage(
    card,
    amount,
    source
) {

    if (!card) {
        return;
    }


    console.log(
        "效果触发：受到伤害 →",
        card.name_en ||
        card.card_id,
        amount,
        source
    );


    executeTriggeredEffects(
        card,
        "damage",
        source
    );

}

// ==========================================
// 效果指定目标状态
// ==========================================

let effectTargetState = {

    active: false,

    source: null,

    effect: null,

    validTargets: [],

    selectedTarget: null

};

// ==========================================
// 开始指定效果目标
// ==========================================

function startEffectTargetSelection(
    source,
    effect
) {

    if (!source || !effect) {

        return;

    }


    const validTargets =
        getEffectTargets(
            source,
            effect.target
        );


    if (
        validTargets.length === 0
    ) {

        console.log(
            "效果没有合法目标：",
            effect
        );

        return;

    }

    // ======================================
    // 有多个目标
    // 等待玩家选择
    // ======================================

    effectTargetState.active =
        true;


    effectTargetState.source =
        source;


    effectTargetState.effect =
        effect;


    effectTargetState.validTargets =
        validTargets;


    effectTargetState.selectedTarget =
        null;


    console.log(
        "请选择效果目标：",
        validTargets.map(
            card =>
                card.name_en ||
                card.card_id
        )
    );


    highlightEffectTargets(
        validTargets
    );

}

// ==========================================
// 高亮合法效果目标
// ==========================================

function highlightEffectTargets(
    targets
) {

    targets.forEach(
        card => {

            const element =
                findBoardElementFromCard(
                    card
                );


            if (element) {

                element.classList.add(
                    "effect-target"
                );

            }

        }
    );

}

// ==========================================
// 根据卡牌找到场上 DOM
// ==========================================

function findBoardElementFromCard(
    card
) {

    if (!card) {

        return null;

    }


    // ======================================
    // 玩家支援阵线
    // ======================================

    const playerSupport =
        gameState.player.supportLine;


    const playerIndex =
        playerSupport.indexOf(card);


    if (playerIndex !== -1) {

        const container =
            document.getElementById(
                "player-support-line"
            );


        return container.children[
            playerIndex
        ] || null;

    }


    // ======================================
    // 前线
    // ======================================

    const frontline =
        gameState.frontline.cards;


    const frontlineIndex =
        frontline.indexOf(card);


    if (frontlineIndex !== -1) {

        const container =
            document.getElementById(
                "frontline"
            );


        return container.children[
            frontlineIndex
        ] || null;

    }


    // ======================================
    // AI 支援阵线
    // ======================================

    const aiSupport =
        gameState.ai.supportLine;


    const aiIndex =
        aiSupport.indexOf(card);


    if (aiIndex !== -1) {

        const container =
            document.getElementById(
                "ai-support-line"
            );


        return container.children[
            aiIndex
        ] || null;

    }


    return null;

}

// ==========================================
// 选择效果目标
// ==========================================

function selectEffectTarget(
    target
) {

    if (
        !effectTargetState.active &&
        !target
    ) {

        return;

    }


    const source =
        effectTargetState.source;


    const effect =
        effectTargetState.effect;


    if (!source || !effect) {

        return;

    }


    if (
        !isValidEffectTarget(
            source,
            target,
            effect.target
        )
    ) {

        console.log(
            "这个单位不是合法效果目标"
        );

        return;

    }


    effectTargetState.selectedTarget =
        target;


    console.log(
        "效果目标选择成功：",
        target.name_en ||
        target.card_id
    );


    // ======================================
    // 触发目标的「被指向时」效果
    // ======================================

    onTargeted(
        target,
        source
    );


    // ======================================
    // 执行原本的卡牌效果
    // ======================================

    executeCardEffect(
        source,
        effect,
        target
    );


    finishEffectTargetSelection();

}

// ==========================================
// 执行卡牌效果
// ==========================================

function executeCardEffect(
    source,
    effect,
    target = null,
    eventData = null
) {

    if (!source || !effect) {
        return;
    }


    console.log(
        "执行卡牌效果：",
        effect
    );


    // ======================================
    // 需要指定目标
    // ======================================

    const targetType =
        effect.target;


    if (
        targetType &&
        !target
    ) {

        startEffectTargetSelection(
            source,
            effect
        );

        return;

    }


    // ======================================
    // 伤害
    // ======================================

    if (
        effect.effect === "damage"
    ) {

        const amount =
            Number(effect.amount) || 0;


        if (!target) {

            console.warn(
                "伤害效果没有目标"
            );

            return;

        }


        damageUnit(
            target,
            amount
        );


        return;

    }


    // ======================================
    // 治疗
    // ======================================

    if (
        effect.effect === "heal"
    ) {

        const amount =
            Number(effect.amount) || 0;


        if (!target) {

            console.warn(
                "治疗效果没有目标"
            );

            return;

        }


        healUnit(
            target,
            amount
        );


        return;

    }


    // ======================================
    // 修改攻防
    // ======================================

    if (
        effect.effect === "modify_stats"
    ) {

        const attackChange =
            Number(
                effect.attack
            ) || 0;


        const defenseChange =
            Number(
                effect.defense
            ) || 0;


        if (!target) {

            console.warn(
                "修改攻防效果没有目标"
            );

            return;

        }


        modifyStats(
            target,
            attackChange,
            defenseChange
        );


        updateUI();

        return;

    }


    console.warn(
        "未知卡牌效果：",
        effect.effect
    );

}

// ==========================================
// 完成效果目标选择
// ==========================================

function finishEffectTargetSelection() {

    const targets =
        effectTargetState.validTargets;


    targets.forEach(
        card => {

            const element =
                findBoardElementFromCard(
                    card
                );


            if (element) {

                element.classList.remove(
                    "effect-target"
                );

            }

        }
    );


    effectTargetState = {

        active: false,

        source: null,

        effect: null,

        validTargets: [],

        selectedTarget: null

    };

}

// ==========================================
// 被指向时
// ==========================================

function onTargeted(
    card,
    source
) {

    if (!card) {
        return;
    }


    console.log(
        "效果触发：被指向 →",
        card.name_en ||
        card.card_id
    );


    executeTriggeredEffects(
        card,
        "targeted",
        source
    );

}

// ==========================================
// 反制触发时
// ==========================================

// ==========================================
// 反制触发时
// ==========================================

function onCountermeasureTrigger(card) {

    if (!card) {
        return;
    }


    console.log(
        "效果触发：反制触发 →",
        card.name_en ||
        card.card_id
    );


    executeTriggeredEffects(
        card,
        "countermeasure"
    );

}

// ==========================================
// 占领前线时
// ==========================================

function onCaptureFrontline(player) {

    console.log(
        "效果触发：占领前线 →",
        player
    );

}


// ==========================================
// 常驻 / 静态效果
//
// passive   = 在场直接生效
// triggered = 在场等待事件触发
// ==========================================

function applyStaticEffects() {

    console.log(
        "检查常驻 / 静态效果"
    );


    // ======================================
    // 获取所有场上单位
    // ======================================

    const units =
        getAllBoardUnits();


    // ======================================
    // 检查每张场上单位
    // ======================================

    units.forEach(card => {

        if (!card) {
            return;
        }


        if (!Array.isArray(card.effects)) {
            return;
        }


        card.effects.forEach(effect => {

            if (!effect) {
                return;
            }


            // ==================================
            // 被动效果
            // ==================================

            if (
                effect.type === "passive"
            ) {

                console.log(
                    "发现被动效果：",
                    card.name_en ||
                    card.card_id,
                    effect
                );


                applyPassiveEffect(
                    card,
                    effect
                );


                return;

            }


            // ==================================
            // 触发效果
            //
            // 不在这里执行。
            //
            // 它会由：
            // onAttack
            // onDamage
            // onDraw
            // onMove
            // 等事件触发器处理。
            // ==================================

            if (
                effect.type === "triggered"
            ) {

                console.log(
                    "发现常驻触发效果：",
                    card.name_en ||
                    card.card_id,
                    effect
                );

            }

        });

    });

}

// ==========================================
// 具体效果函数
// ==========================================


// ==========================================
// 造成伤害
// ==========================================

function damageUnit(
    target,
    amount
) {

    if (!target) {

        return;

    }


    // HQ 使用独立的 HP
    if (
        isHQ(target)
    ) {

        if (
            target.owner === "player"
        ) {

            gameState.player.hp -=
                amount;

        }

        else if (
            target.owner === "ai"
        ) {

            gameState.ai.hp -=
                amount;

        }


        console.log(
            "效果：HQ 受到伤害 →",
            amount
        );

        return;

    }


    const defense =
        Number(
            target.currentDefense ??
            target.defense
        ) || 0;


    target.currentDefense =
        defense -
        Number(amount);

    onDamage(
        target,
        Number(amount),
        null
    );

    console.log(
        "效果：单位受到伤害 →",
        target.name_en ||
        target.card_id ||
        target.id,

        amount
    );


    /*
        防御归零后检查摧毁
    */

    removeDeadUnit(
        target
    );

    updateUI();

}


// ==========================================
// 治疗 / 修复
// ==========================================

function healUnit(
    target,
    amount
) {

    if (!target) {

        return;

    }


    // HQ
    if (
        isHQ(target)
    ) {

        if (
            target.owner === "player"
        ) {

            gameState.player.hp +=
                Number(amount);

        }

        else if (
            target.owner === "ai"
        ) {

            gameState.ai.hp +=
                Number(amount);

        }


        console.log(
            "效果：HQ 治疗 →",
            amount
        );

        return;

    }


    const maxDefense =
        Number(
            target.defense
        ) || 0;


    const currentDefense =
        Number(
            target.currentDefense ??
            target.defense
        ) || 0;


    target.currentDefense =
        Math.min(
            maxDefense,
            currentDefense +
            Number(amount)
        );


    console.log(
        "效果：单位治疗 →",
        target.name_en ||
        target.card_id ||
        target.id,

        amount
    );

}


// ==========================================
// 修改攻击 / 防御
// ==========================================

function modifyStats(
    target,
    attackChange = 0,
    defenseChange = 0
) {

    if (!target) {

        return;

    }


    if (
        attackChange !== 0
    ) {

        const currentAttack =
            Number(
                target.currentAttack ??
                target.attack
            ) || 0;


        target.currentAttack =
            currentAttack +
            Number(attackChange);

    }


    if (
        defenseChange !== 0
    ) {

        const currentDefense =
            Number(
                target.currentDefense ??
                target.defense
            ) || 0;


        target.currentDefense =
            currentDefense +
            Number(defenseChange);

    }


    console.log(
        "效果：修改攻防 →",
        target.name_en ||
        target.card_id ||
        target.id,

        "攻击:",
        attackChange,

        "防御:",
        defenseChange
    );

}

// ==========================================
// 点击场上单位选择效果目标
// ==========================================

document.addEventListener(
    "click",
    event => {

        if (
            !effectTargetState.active
        ) {

            return;

        }


        const cardElement =
            event.target.closest(
                ".card-on-board"
            );


        if (!cardElement) {

            return;

        }


        const target =
            findCardFromBoardElement(
                cardElement
            );


        if (!target) {

            return;

        }


        selectEffectTarget(
            target
        );

    }
);

// ==========================================
// DEBUG：测试效果目标系统
// Console:
// testEffectTarget()
// ==========================================

function testEffectTarget() {

    const source =
        gameState.player.supportLine.find(
            card => isUnit(card)
        );

    if (!source) {

        console.log(
            "DEBUG：玩家支援阵线没有单位"
        );

        return;

    }

    const effect = {

        trigger: "deploy",

        effect: "damage",

        amount: 3,

        target: "enemy_unit"

    };

    console.log(
        "DEBUG：开始测试效果目标系统",
        source
    );

    startEffectTargetSelection(
        source,
        effect
    );

}