// ==========================================
// 卡牌数据库
// ==========================================

let cards = [];


// ==========================================
// 游戏常量
// ==========================================

const DECK_SIZE = 39;

const INITIAL_HAND_FIRST = 4;

const INITIAL_HAND_SECOND = 5;

const LINE_CAPACITY = 5;

const HAND_LIMIT = 9;


// ==========================================
// 游戏状态
// ==========================================

let gameState = {

    turn: "player",


    player: {

        hp: 20,

        // 当前指挥点
        kredits: 1,

        // 指挥点槽
        maxKredits: 1,

        deck: [],
        hand: [],
        supportLine: []

    },


    ai: {

        hp: 20,

        // AI 游戏开始时还没有进行自己的回合
        kredits: 0,

        // 指挥点槽
        maxKredits: 0,

        deck: [],
        hand: [],
        supportLine: []

    },


    frontline: {

        owner: null,

        cards: []

    }

};


// ==========================================
// 手牌拖动状态
// ==========================================

let handDragState = {

    active: false,

    cardIndex: null,

    card: null,

    pointerId: null,

    dragElement: null,

    sourceElement: null,

    targetLine: null,

    insertIndex: null

};


// ==========================================
// 单位行动拖动状态
// ==========================================

let unitActionState = {

    active: false,

    card: null,

    sourceLine: null,

    sourceIndex: null,

    sourceElement: null,

    pointerId: null,

    arrow: null,

    targetLine: null,

    targetIndex: null,

    targetCard: null,

    actionType: null

};

// ==========================================
// 单位移动状态
// ==========================================

let moveState = {

    active: false,

    card: null,

    sourceLine: null,

    sourceIndex: null,

    sourceElement: null,

    pointerId: null,

    arrow: null,

    targetLine: null

};

// ==========================================
// 初始化
// ==========================================

async function initGame() {

    try {

        await loadCards();

        createDecks();

        createHeadquarters();

        drawInitialHands();

        updateUI();


        console.log(
            "=============================="
        );

        console.log(
            "游戏初始化完成"
        );

        console.log(
            "玩家牌库：",
            gameState.player.deck.length
        );

        console.log(
            "玩家手牌：",
            gameState.player.hand
        );

        console.log(
            "AI牌库：",
            gameState.ai.deck.length
        );

        console.log(
            "AI手牌数量：",
            gameState.ai.hand.length
        );

    }

    catch (error) {

        console.error(
            "游戏初始化失败：",
            error
        );

    }

}


// ==========================================
// 读取卡牌 JSON
// ==========================================

async function loadCards() {

    const response =
        await fetch(
            "data/Germany_active_pool.json"
        );


    if (!response.ok) {

        throw new Error(
            "无法读取 Germany_active_pool.json"
        );

    }


    cards =
        await response.json();


    console.log(
        "卡牌数据库数量：",
        cards.length
    );

}


// ==========================================
// 创建牌库
// ==========================================

function createDecks() {

    gameState.player.deck =
        createRandomDeck();


    gameState.ai.deck =
        createRandomDeck();

}


// ==========================================
// 创建 39 张牌
// ==========================================

function createRandomDeck() {

    const pool = [
        ...cards
    ];


    shuffle(pool);


    return pool.slice(
        0,
        DECK_SIZE
    );

}


// ==========================================
// 洗牌
// ==========================================

function shuffle(deck) {

    for (
        let i = deck.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            deck[i],
            deck[j]
        ] = [
            deck[j],
            deck[i]
        ];

    }

}


// ==========================================
// 创建总部
// ==========================================

function createHeadquarters() {

    gameState.player.supportLine = [

        {

            id: "player_HQ",

            type: "hq",

            owner: "player"

        }

    ];


    gameState.ai.supportLine = [

        {

            id: "ai_HQ",

            type: "hq",

            owner: "ai"

        }

    ];


    gameState.frontline = {

        owner: null,

        cards: []

    };

}


// ==========================================
// 抽牌
// ==========================================

function drawCard(player) {

    if (
        player.deck.length === 0
    ) {

        console.log(
            "牌库为空"
        );

        return null;

    }


    if (
        player.hand.length >=
        HAND_LIMIT
    ) {

        console.log(
            "手牌已满，牌被移除"
        );

        player.deck.pop();

        return null;

    }


    const card =
        player.deck.pop();


    player.hand.push(
        card
    );


    return card;

}


// ==========================================
// 初始抽牌
// ==========================================

function drawInitialHands() {

    for (
        let i = 0;
        i < INITIAL_HAND_FIRST;
        i++
    ) {

        drawCard(
            gameState.player
        );

    }


    for (
        let i = 0;
        i < INITIAL_HAND_SECOND;
        i++
    ) {

        drawCard(
            gameState.ai
        );

    }

}


// ==========================================
// 判断是否为单位
// ==========================================

function isUnit(card) {

    const unitTypes = [

        "infantry",

        "tank",

        "artillery",

        "fighter",

        "bomber"

    ];


    return unitTypes.includes(
        card.type
    );

}


// ==========================================
// 判断是否为 HQ
// ==========================================

function isHQ(card) {

    return (
        card.type === "hq"
    );

}

// ==========================================
// 检查单位移动是否合法
// ==========================================

function canUnitMove(card) {

    if (!card) {

        return false;

    }


    // 只能移动自己的单位
    if (
        card.owner !== "player"
    ) {

        return false;

    }


    // 刚部署的单位不能行动
    if (
        card.justDeployed
    ) {

        return false;

    }


    // 前线单位不能移动回支援阵线
    if (
        moveState.sourceLine !==
        "player-support"
    ) {

        return false;

    }


    // ======================================
    // 步兵行动限制
    // ======================================
    //
    // 步兵一回合只能移动或攻击一次。
    //
    // 如果本回合已经攻击过，
    // 就不能再移动。
    //
    // 坦克以及其他单位不受这个限制。
    //

    if (
        card.type === "infantry" &&
        card.attacksThisTurn > 0
    ) {

        return false;

    }


    // ======================================
    // 检查移动所需的指挥点
    // ======================================

    const operationCost =
        Number(card.operation_cost) || 0;


    if (
        gameState.player.kredits <
        operationCost
    ) {

        return false;

    }


    return true;

}

// ==========================================
// 判断单位是否可以攻击
// ==========================================

function canUnitAttack(card) {

    if (!card) {

        return false;

    }


    // 只能操作自己的单位
    if (
        card.owner !== "player"
    ) {

        return false;

    }


    // 刚部署的单位不能行动
    if (
        card.justDeployed
    ) {

        return false;

    }


    // ======================================
    // 步兵行动限制
    // ======================================

    if (
        card.type === "infantry" &&
        card.hasMoved === true
    ) {

        return false;

    }


    // ======================================
    // 检查攻击所需的指挥点
    // ======================================

    const operationCost =
        Number(card.operation_cost) || 0;


    if (
        gameState.player.kredits <
        operationCost
    ) {

        return false;

    }


    return true;

}

// ==========================================
// 检查阵线容量
// ==========================================

function canDeployToLine(line) {

    return (
        line.length <
        LINE_CAPACITY
    );

}


// ==========================================
// 检查玩家是否可以进入前线
// ==========================================

function canPlayerEnterFrontline() {

    if (
        gameState.frontline.owner ===
        null
    ) {

        return true;

    }


    return (
        gameState.frontline.owner ===
        "player"
    );

}


// ==========================================
// 更新前线占领权
// ==========================================

function updateFrontlineOwnership() {

    const frontline =
        gameState.frontline;


    if (
        frontline.cards.length > 0 &&
        frontline.owner === null
    ) {

        frontline.owner =
            "player";

    }


    if (
        frontline.cards.length === 0
    ) {

        frontline.owner =
            null;

    }

}


// ==========================================
// 渲染全部阵线
// ==========================================

function renderAllLines() {

    renderLine(
        gameState.ai.supportLine,
        "ai-support-line",
        "ai-support"
    );


    renderLine(
        gameState.frontline.cards,
        "frontline",
        "frontline"
    );


    renderLine(
        gameState.player.supportLine,
        "player-support-line",
        "player-support"
    );


    updateFrontlineOwnerUI();

}


// ==========================================
// 渲染前线占领状态
// ==========================================

function updateFrontlineOwnerUI() {

    const element =
        document.getElementById(
            "frontline-owner"
        );


    if (
        gameState.frontline.owner ===
        null
    ) {

        element.textContent =
            "FRONTLINE — 无人占领";

    }

    else if (
        gameState.frontline.owner ===
        "player"
    ) {

        element.textContent =
            "FRONTLINE — 玩家占领";

    }

    else {

        element.textContent =
            "FRONTLINE — AI 占领";

    }

}


// ==========================================
// 渲染阵线
// ==========================================

function renderLine(
    line,
    elementId,
    lineName
) {

    const container =
        document.getElementById(
            elementId
        );


    container.innerHTML = "";


    line.forEach(
        (card, index) => {

            const element =
                document.createElement(
                    "div"
                );


            if (
                isHQ(card)
            ) {

                element.className =
                    "hq-card";

                element.textContent =
                    "HQ";

            }

            else {

                element.className =
                    "card-on-board";


                element.innerHTML = `

                    <img
                        src="${card.image_url}"
                        alt="${card.name_en || ""}"
                    >

                    <div class="card-stat attack-stat">
                        ${Number(card.currentAttack ?? card.attack ?? 0)}
                    </div>

                    <div class="card-stat defense-stat">
                        ${Number(card.currentDefense ?? card.defense ?? 0)}
                    </div>

                `;


                /*
                    玩家单位可以移动。

                    AI 单位现在不处理。
                */

                if (
                    card.owner === "player" ||
                    lineName === "player-support" ||
                    (
                        lineName === "frontline" &&
                        gameState.frontline.owner === "player"
                    )
                ) {

                    element.addEventListener(
                        "pointerdown",
                        event => {

                            startUnitAction(
                                event,
                                card,
                                lineName,
                                index,
                                element
                            );

                        }
                    );

                }

            }


            container.appendChild(
                element
            );

        }
    );

}


// ==========================================
// 渲染手牌
// ==========================================

function renderHand() {

    const handElement =
        document.getElementById(
            "hand"
        );


    handElement.innerHTML = "";


    gameState.player.hand.forEach(
        (card, index) => {

            const cardElement =
                document.createElement(
                    "div"
                );


            cardElement.className =
                "hand-card";


            cardElement.dataset.index =
                index;


            cardElement.innerHTML = `

                <img
                    src="${card.image_url}"
                    alt="${card.name_en || ""}"
                >

                <div class="card-stat attack-stat">
                    ${Number(card.currentAttack ?? card.attack ?? 0)}
                </div>

                <div class="card-stat defense-stat">
                    ${Number(card.currentDefense ?? card.defense ?? 0)}
                </div>

            `;


            cardElement.addEventListener(
                "pointerdown",
                event => {

                    startHandDrag(
                        event,
                        index,
                        cardElement
                    );

                }
            );


            handElement.appendChild(
                cardElement
            );

        }
    );

}


// ==================================================
// ================== 手牌拖动 =======================
// ==================================================

function startHandDrag(
    event,
    index,
    element
) {

    if (
        gameState.turn !==
        "player"
    ) {

        return;

    }


    const card =
        gameState.player.hand[index];


    if (!card) {

        return;

    }


    /*
        只有单位可以部署。

        指令/反制以后再加入。
    */

    if (
        !isUnit(card)
    ) {

        console.log(
            "当前阶段只有单位可以部署"
        );

        return;

    }


    const cost =
        Number(card.kredits) || 0;


    if (
        gameState.player.kredits <
        cost
    ) {

        console.log(
            "Kredits 不足"
        );

        return;

    }


    element.setPointerCapture(
        event.pointerId
    );


    handDragState.active =
        true;


    handDragState.cardIndex =
        index;


    handDragState.card =
        card;


    handDragState.pointerId =
        event.pointerId;


    handDragState.sourceElement =
        element;


    const dragElement =
        document.createElement(
            "div"
        );


    dragElement.className =
        "drag-card";


    dragElement.innerHTML = `

        <img
            src="${card.image_url}"
            alt=""
        >

    `;


    document.body.appendChild(
        dragElement
    );


    handDragState.dragElement =
        dragElement;


    element.classList.add(
        "dragging"
    );


    document
        .getElementById(
            "drag-info"
        )
        .classList.add(
            "visible"
        );


    /*
        注意：

        这里只允许显示玩家支援阵线。

        前线不会亮。
    */

    document
        .getElementById(
            "player-support-line"
        )
        .classList.add(
            "deploy-target"
        );


    updateHandDragPosition(
        event
    );


    window.addEventListener(
        "pointermove",
        handleHandPointerMove
    );


    window.addEventListener(
        "pointerup",
        handleHandPointerUp
    );


    window.addEventListener(
        "pointercancel",
        handleHandPointerCancel
    );

}


// ==========================================
// 手牌拖动中
// ==========================================

function handleHandPointerMove(
    event
) {

    if (
        !handDragState.active
    ) {

        return;

    }


    updateHandDragPosition(
        event
    );


    updateHandDropTarget(
        event
    );

}


// ==========================================
// 更新手牌拖动位置
// ==========================================

function updateHandDragPosition(
    event
) {

    if (
        !handDragState.dragElement
    ) {

        return;

    }


    handDragState.dragElement.style.left =
        `${event.clientX}px`;


    handDragState.dragElement.style.top =
        `${event.clientY}px`;

}


// ==========================================
// 手牌放置目标
// ==========================================

function updateHandDropTarget(
    event
) {

    removeInsertSlot();


    handDragState.targetLine =
        null;


    handDragState.insertIndex =
        null;


    const supportElement =
        document.getElementById(
            "player-support-line"
        );


    if (
        isPointerInsideElement(
            event,
            supportElement
        )
    ) {

        const line =
            gameState.player.supportLine;


        if (
            canDeployToLine(line)
        ) {

            handDragState.targetLine =
                "player-support";


            handDragState.insertIndex =
                calculateInsertIndex(
                    supportElement,
                    event.clientX
                );


            showInsertSlot(
                supportElement,
                handDragState.insertIndex
            );

        }

    }

}


// ==========================================
// Pointer 是否在元素里面
// ==========================================

function isPointerInsideElement(
    event,
    element
) {

    const rect =
        element.getBoundingClientRect();


    return (

        event.clientX >= rect.left &&

        event.clientX <= rect.right &&

        event.clientY >= rect.top &&

        event.clientY <= rect.bottom

    );

}


// ==========================================
// 计算插入位置
// ==========================================

function calculateInsertIndex(
    container,
    mouseX
) {

    const children = [
        ...container.children
    ].filter(
        element =>
            !element.classList.contains(
                "insert-slot"
            )
    );


    if (
        children.length === 0
    ) {

        return 0;

    }


    for (
        let i = 0;
        i < children.length;
        i++
    ) {

        const rect =
            children[i]
                .getBoundingClientRect();


        const center =
            rect.left +
            rect.width / 2;


        if (
            mouseX < center
        ) {

            return i;

        }

    }


    return children.length;

}


// ==========================================
// 显示插入位置
// ==========================================

function showInsertSlot(
    container,
    index
) {

    removeInsertSlot();


    const slot =
        document.createElement(
            "div"
        );


    slot.className =
        "insert-slot";


    const children = [
        ...container.children
    ];


    if (
        index >= children.length
    ) {

        container.appendChild(
            slot
        );

    }

    else {

        container.insertBefore(
            slot,
            children[index]
        );

    }

}


// ==========================================
// 删除插入位置
// ==========================================

function removeInsertSlot() {

    const slots =
        document.querySelectorAll(
            ".insert-slot"
        );


    slots.forEach(
        slot => slot.remove()
    );

}


// ==========================================
// 手牌松开
// ==========================================

function handleHandPointerUp(
    event
) {

    if (
        !handDragState.active
    ) {

        return;

    }


    if (
        handDragState.targetLine ===
        "player-support"
    ) {

        deployCardToSupport(
            handDragState.cardIndex,
            handDragState.insertIndex
        );

    }


    finishHandDrag();

}


// ==========================================
// 从手牌部署到支援阵线
// ==========================================

function deployCardToSupport(
    cardIndex,
    insertIndex
) {

    const card =
        gameState.player.hand[
            cardIndex
        ];


    if (!card) {

        return;

    }


    if (
        !isUnit(card)
    ) {

        return;

    }


    const cost =
        Number(card.kredits) || 0;


    if (
        gameState.player.kredits <
        cost
    ) {

        return;

    }


    const line =
        gameState.player.supportLine;


    if (
        !canDeployToLine(line)
    ) {

        return;

    }


    /*
        扣除指挥点。

        暂时使用 kredits。
    */

    gameState.player.kredits -=
        cost;


    gameState.player.hand.splice(
        cardIndex,
        1
    );


    /*
        给单位记录真正的 owner。

        以后战斗系统会大量使用这个。
    */

    card.owner =
        "player";

    /*
        新部署单位本回合不能行动。

        以后加入“闪击”后，
        再根据关键词特殊处理。
    */

    card.justDeployed = true;
    card.hasMoved = false;
    card.attacksThisTurn = 0;

    /*
        非常重要：

        新部署单位永远进入支援阵线。

        不允许直接进入前线。
    */

    line.splice(
        insertIndex,
        0,
        card
    );


    console.log(
        "部署：",
        card.name_en
    );


    updateUI();

}


// ==========================================
// 完成手牌拖动
// ==========================================

function finishHandDrag() {

    if (
        handDragState.dragElement
    ) {

        handDragState.dragElement.remove();

    }


    if (
        handDragState.sourceElement
    ) {

        handDragState.sourceElement.classList.remove(
            "dragging"
        );

    }


    removeInsertSlot();


    document
        .getElementById(
            "player-support-line"
        )
        .classList.remove(
            "deploy-target"
        );


    document
        .getElementById(
            "drag-info"
        )
        .classList.remove(
            "visible"
        );


    window.removeEventListener(
        "pointermove",
        handleHandPointerMove
    );


    window.removeEventListener(
        "pointerup",
        handleHandPointerUp
    );


    window.removeEventListener(
        "pointercancel",
        handleHandPointerCancel
    );


    handDragState = {

        active: false,

        cardIndex: null,

        card: null,

        pointerId: null,

        dragElement: null,

        sourceElement: null,

        targetLine: null,

        insertIndex: null

    };

}


// ==========================================
// 取消手牌拖动
// ==========================================

function handleHandPointerCancel() {

    finishHandDrag();

}


// ==========================================
// 开始单位行动
// ==========================================

function startUnitAction(
    event,
    card,
    sourceLine,
    sourceIndex,
    element
) {

    if (
        gameState.turn !== "player"
    ) {

        return;

    }


    if (!card) {

        return;

    }


    // HQ 永远不能行动
    if (
        isHQ(card)
    ) {

        return;

    }


    // 只能操作自己的单位
    if (
        card.owner !== "player"
    ) {

        return;

    }


    event.preventDefault();


    element.setPointerCapture(
        event.pointerId
    );


    unitActionState.active =
        true;


    unitActionState.card =
        card;


    unitActionState.sourceLine =
        sourceLine;


    unitActionState.sourceIndex =
        sourceIndex;


    unitActionState.sourceElement =
        element;


    unitActionState.pointerId =
        event.pointerId;


    unitActionState.actionType =
        null;


    createUnitActionArrow();


    updateUnitActionArrow(
        event
    );


    window.addEventListener(
        "pointermove",
        handleUnitActionPointerMove
    );


    window.addEventListener(
        "pointerup",
        handleUnitActionPointerUp
    );


    window.addEventListener(
        "pointercancel",
        handleUnitActionPointerCancel
    );

}

// ==========================================
// 创建单位行动箭头
// ==========================================

function createUnitActionArrow() {

    const arrow =
        document.createElement(
            "div"
        );


    arrow.className =
        "move-arrow";


    arrow.innerHTML = `

        <div
            class="move-arrow-line"
        ></div>

        <div
            class="move-arrow-head"
        ></div>

    `;


    document.body.appendChild(
        arrow
    );


    unitActionState.arrow =
        arrow;

}

// ==========================================
// 更新单位行动箭头
// ==========================================

function updateUnitActionArrow(
    event
) {

    if (
        !unitActionState.arrow ||
        !unitActionState.sourceElement
    ) {

        return;

    }


    const rect =
        unitActionState.sourceElement
            .getBoundingClientRect();


    const startX =
        rect.left +
        rect.width / 2;


    const startY =
        rect.top +
        rect.height / 2;


    const endX =
        event.clientX;


    const endY =
        event.clientY;


    const dx =
        endX - startX;


    const dy =
        endY - startY;


    const length =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    const angle =
        Math.atan2(
            dy,
            dx
        ) *
        180 /
        Math.PI;


    unitActionState.arrow.style.left =
        `${startX}px`;


    unitActionState.arrow.style.top =
        `${startY}px`;


    unitActionState.arrow.style.width =
        `${length}px`;


    unitActionState.arrow.style.height =
        `20px`;


    unitActionState.arrow.style.transform =
        `rotate(${angle}deg)`;


    const line =
        unitActionState.arrow.querySelector(
            ".move-arrow-line"
        );


    line.style.width =
        `${Math.max(
            0,
            length - 15
        )}px`;

}

// ==========================================
// 单位行动拖动
// ==========================================

function handleUnitActionPointerMove(
    event
) {

    if (
        !unitActionState.active
    ) {

        return;

    }


    updateUnitActionArrow(
        event
    );


    updateUnitActionTarget(
        event
    );

}

// ==========================================
// 判断单位是否可以攻击指定目标
// ==========================================

function canUnitAttackTarget(
    attacker,
    target
) {

    if (!attacker) {
        return false;
    }

    if (!target) {
        return false;
    }


    // 不能攻击自己的单位
    if (
        attacker.owner ===
        target.owner
    ) {

        return false;

    }


    // HQ 暂时允许作为攻击目标
    if (
        isHQ(target)
    ) {

        return true;

    }


    // 目前只处理步兵
    if (
        attacker.type !==
        "infantry"
    ) {

        return false;

    }


    // 暂时只允许攻击前线目标
    if (
        !isCardInFrontline(target)
    ) {

        return false;

    }


    return true;

}

// ==========================================
// 判断卡牌是否位于前线
// ==========================================

function isCardInFrontline(
    card
) {

    return gameState.frontline.cards.includes(
        card
    );

}

// ==========================================
// 判断单位行动目标
// ==========================================

function updateUnitActionTarget(
    event
) {

    unitActionState.targetLine =
        null;

    unitActionState.targetIndex =
        null;

    unitActionState.targetCard =
        null;

    unitActionState.actionType =
        null;


    removeInsertSlot();


    /*
        =====================================
        找到鼠标指向的卡牌
        =====================================
    */

    const element =
        document.elementFromPoint(
            event.clientX,
            event.clientY
        );


    if (!element) {

        return;

    }


    const cardElement =
        element.closest(
            ".card-on-board, .hq-card"
        );


    if (cardElement) {

        const targetCard =
            findCardFromBoardElement(
                cardElement
            );


        if (targetCard) {

            unitActionState.targetCard =
                targetCard;


            /*
                =================================
                判断是否为攻击
                =================================
            */

            if (
                canUnitAttackTarget(
                    unitActionState.card,
                    targetCard
                )
            ) {

                unitActionState.actionType =
                    "attack";


                console.log(
                    "攻击目标：",
                    targetCard.name_en ||
                    targetCard.id
                );


                return;

            }


            /*
                指向了牌，但不能攻击
            */

            console.log(
                "无法攻击目标：",
                targetCard.name_en ||
                targetCard.id
            );


            return;

        }

    }


    /*
        =====================================
        没有指向卡牌
        → 检查是不是移动
        =====================================
    */

    if (
        unitActionState.sourceLine !==
        "player-support"
    ) {

        return;

    }


    const frontline =
        document.getElementById(
            "frontline"
        );


    if (
        !isPointerInsideElement(
            event,
            frontline
        )
    ) {

        return;

    }


    /*
        前线满了
    */

    if (
        gameState.frontline.cards.length >=
        LINE_CAPACITY
    ) {

        return;

    }


    /*
        敌方占领前线时不能进入
    */

    if (
        !canPlayerEnterFrontline()
    ) {

        return;

    }


    /*
        =====================================
        移动
        =====================================
    */

    const insertIndex =
        calculateInsertIndex(
            frontline,
            event.clientX
        );


    unitActionState.targetLine =
        "frontline";


    unitActionState.targetIndex =
        insertIndex;


    unitActionState.actionType =
        "move";


    showInsertSlot(
        frontline,
        insertIndex
    );

}

// ==========================================
// 根据 DOM 找到对应卡牌
// ==========================================

function findCardFromBoardElement(
    element
) {

    /*
        =====================================
        玩家支援阵线
        =====================================
    */

    const playerSupport =
        document.getElementById(
            "player-support-line"
        );


    if (
        playerSupport &&
        playerSupport.contains(element)
    ) {

        const children = [
            ...playerSupport.children
        ];


        const domIndex =
            children.indexOf(
                element
            );


        if (
            domIndex >= 0 &&
            domIndex <
            gameState.player.supportLine.length
        ) {

            return gameState.player.supportLine[
                domIndex
            ];

        }

    }


    /*
        =====================================
        前线
        =====================================
    */

    const frontline =
        document.getElementById(
            "frontline"
        );


    if (
        frontline &&
        frontline.contains(element)
    ) {

        const children = [
            ...frontline.children
        ];


        const domIndex =
            children.indexOf(
                element
            );


        if (
            domIndex >= 0 &&
            domIndex <
            gameState.frontline.cards.length
        ) {

            return gameState.frontline.cards[
                domIndex
            ];

        }

    }


    /*
        =====================================
        AI 支援阵线
        =====================================
    */

    const aiSupport =
        document.getElementById(
            "ai-support-line"
        );


    if (
        aiSupport &&
        aiSupport.contains(element)
    ) {

        const children = [
            ...aiSupport.children
        ];


        const domIndex =
            children.indexOf(
                element
            );


        if (
            domIndex >= 0 &&
            domIndex <
            gameState.ai.supportLine.length
        ) {

            return gameState.ai.supportLine[
                domIndex
            ];

        }

    }


    return null;

}

// ==========================================
// 单位行动松手
// ==========================================

function handleUnitActionPointerUp(
    event
) {

    if (
        !unitActionState.active
    ) {

        return;

    }


    console.log(
        "松手目标：",
        unitActionState.targetCard
            ? (
                unitActionState.targetCard.name_en ||
                unitActionState.targetCard.id
            )
            : "无",

        "行动类型：",
        unitActionState.actionType
    );


    /*
        =====================================
        移动
        =====================================
    */

    if (
        unitActionState.actionType ===
        "move"
    ) {

        moveUnitToFrontline(
            unitActionState.targetIndex
        );

    }


    /*
        =====================================
        攻击
        =====================================

        现在暂时只记录。
        下一步才真正造成伤害。
    */

    else if (
        unitActionState.actionType ===
        "attack"
    ) {

        const attacker =
            unitActionState.card;


        const target =
            unitActionState.targetCard;


        /*
            =====================================
            攻击者和目标检查
            =====================================
        */

        if (
            !attacker ||
            !target
        ) {

            console.log(
                "攻击失败：攻击者或目标不存在"
            );

            finishUnitAction();

            return;

        }


        /*
            =====================================
            刚部署的单位不能攻击
            =====================================
        */

        if (
            attacker.justDeployed
        ) {

            console.log(
                "单位刚部署，本回合不能攻击"
            );

            finishUnitAction();

            return;

        }


        /*
            =====================================
            步兵行动限制
            =====================================

            步兵如果本回合已经移动，
            就不能再攻击。
        */

        if (
            attacker.type === "infantry" &&
            attacker.hasMoved === true
        ) {

            console.log(
                "步兵本回合已经移动过，不能再攻击"
            );

            finishUnitAction();

            return;

        }


        /*
            =====================================
            检查攻击行动花费
            =====================================
        */

        const operationCost =
            Number(
                attacker.operation_cost
            ) || 0;


        if (
            gameState.player.kredits <
            operationCost
        ) {

            console.log(
                "Kredits 不足，无法攻击"
            );

            finishUnitAction();

            return;

        }


        /*
            =====================================
            扣除攻击行动花费
            =====================================
        */

        gameState.player.kredits -=
            operationCost;


        /*
            =====================================
            记录本回合攻击
            =====================================
        */

        attacker.attacksThisTurn =
            (attacker.attacksThisTurn || 0) + 1;


        console.log(
            "攻击行动花费：",
            operationCost
        );


        console.log(
            "攻击判定成功：",
            attacker.name_en ||
            attacker.id,
            "→",
            target.name_en ||
            target.id
        );


        updateUI();

    }

    finishUnitAction();

}

// ==========================================
// 清除单位行动目标高亮
// ==========================================

function clearMoveTargets() {

    const frontline =
        document.getElementById(
            "frontline"
        );

    const playerSupport =
        document.getElementById(
            "player-support-line"
        );

    const aiSupport =
        document.getElementById(
            "ai-support-line"
        );


    if (frontline) {

        frontline.classList.remove(
            "deploy-target"
        );

    }


    if (playerSupport) {

        playerSupport.classList.remove(
            "deploy-target"
        );

    }


    if (aiSupport) {

        aiSupport.classList.remove(
            "deploy-target"
        );

    }

}

// ==========================================
// 完成单位行动拖动
// ==========================================

function finishUnitAction() {

    /*
        删除箭头
    */

    if (
        unitActionState.arrow
    ) {

        unitActionState.arrow.remove();

    }


    /*
        删除插入位置
    */

    removeInsertSlot();


    /*
        清除行动目标高亮
    */

    const frontline =
        document.getElementById(
            "frontline"
        );

    if (
        frontline
    ) {

        frontline.classList.remove(
            "deploy-target"
        );

    }


    const playerSupport =
        document.getElementById(
            "player-support-line"
        );

    if (
        playerSupport
    ) {

        playerSupport.classList.remove(
            "deploy-target"
        );

    }


    /*
        移除 pointer 事件
    */

    window.removeEventListener(
        "pointermove",
        handleUnitActionPointerMove
    );


    window.removeEventListener(
        "pointerup",
        handleUnitActionPointerUp
    );


    window.removeEventListener(
        "pointercancel",
        handleUnitActionPointerCancel
    );


    /*
        清空行动状态
    */

    unitActionState = {

        active: false,

        card: null,

        sourceLine: null,

        sourceIndex: null,

        sourceElement: null,

        pointerId: null,

        arrow: null,

        targetLine: null,

        targetIndex: null,

        targetCard: null,

        actionType: null

    };

}

// ==========================================
// 取消单位行动
// ==========================================

function handleUnitActionPointerCancel() {

    finishUnitAction();

}

// ==========================================
// 开始移动单位
// ==========================================

function startUnitMove(
    event,
    card,
    sourceLine,
    sourceIndex,
    element
) {

    if (
        gameState.turn !== "player"
    ) {

        return;

    }


    if (!card) {

        return;

    }


    // HQ 永远不能移动
    if (isHQ(card)) {

        return;

    }


    // 只能移动自己的单位
    if (card.owner !== "player") {

        return;

    }


    /*
        目前只有：

        玩家支援阵线 → 前线

        可以移动。

        前线 → 支援阵线

        完全禁止。
    */

    // 前线已经满了
    if (
        gameState.frontline.cards.length >=
        LINE_CAPACITY
    ) {

        console.log(
            "前线已满"
        );

        return;

    }


    // 如果前线被敌人占领，则不能进入
    if (
        !canPlayerEnterFrontline()
    ) {

        console.log(
            "敌方占领前线，暂时不能进入"
        );

        return;

    }


    event.preventDefault();


    element.setPointerCapture(
        event.pointerId
    );


    moveState.active =
        true;


    moveState.card =
        card;


    moveState.sourceLine =
        sourceLine;


    moveState.sourceIndex =
        sourceIndex;


    moveState.sourceElement =
        element;


    moveState.pointerId =
        event.pointerId;


    /*
        创建拖动箭头
    */

    createMoveArrow();


    updateMoveArrow(
        event
    );


    /*
        只有前线是合法目标
    */

    document
        .getElementById(
            "frontline"
        )
        .classList.add(
            "deploy-target"
        );


    window.addEventListener(
        "pointermove",
        handleUnitPointerMove
    );


    window.addEventListener(
        "pointerup",
        handleUnitPointerUp
    );


    window.addEventListener(
        "pointercancel",
        handleUnitPointerCancel
    );

}


// ==========================================
// 创建移动箭头
// ==========================================

function createMoveArrow() {

    const arrow =
        document.createElement(
            "div"
        );


    arrow.className =
        "move-arrow";


    arrow.innerHTML = `

        <div
            class="move-arrow-line"
        ></div>

        <div
            class="move-arrow-head"
        ></div>

    `;


    document.body.appendChild(
        arrow
    );


    moveState.arrow =
        arrow;

}


// ==========================================
// 更新箭头
// ==========================================

function updateMoveArrow(
    event
) {

    if (
        !moveState.arrow ||
        !moveState.sourceElement
    ) {

        return;

    }


    const rect =
        moveState.sourceElement
            .getBoundingClientRect();


    const startX =
        rect.left +
        rect.width / 2;


    const startY =
        rect.top +
        rect.height / 2;


    const endX =
        event.clientX;


    const endY =
        event.clientY;


    const dx =
        endX - startX;


    const dy =
        endY - startY;


    const length =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    const angle =
        Math.atan2(
            dy,
            dx
        ) *
        180 /
        Math.PI;


    moveState.arrow.style.left =
        `${startX}px`;


    moveState.arrow.style.top =
        `${startY}px`;


    moveState.arrow.style.width =
        `${length}px`;


    moveState.arrow.style.height =
        `20px`;


    moveState.arrow.style.transform =
        `rotate(${angle}deg)`;


    const line =
        moveState.arrow.querySelector(
            ".move-arrow-line"
        );


    line.style.width =
        `${Math.max(
            0,
            length - 15
        )}px`;

}



// ==========================================
// 判断移动目标
// ==========================================

function updateMoveTarget(
    event
) {

    moveState.targetLine =
        null;


    moveState.insertIndex =
        null;


    /*
        当前唯一合法目标：

        玩家支援阵线 → 玩家前线
    */

    if (
        moveState.sourceLine !==
        "player-support"
    ) {

        return;

    }


    const frontline =
        document.getElementById(
            "frontline"
        );


    if (
        !isPointerInsideElement(
            event,
            frontline
        )
    ) {

        removeInsertSlot();

        return;

    }


    /*
        前线不能超过 5 张
    */

    if (
        gameState.frontline.cards.length >=
        LINE_CAPACITY
    ) {

        removeInsertSlot();

        return;

    }


    /*
        前线被敌人占领时不能进入
    */

    if (
        !canPlayerEnterFrontline()
    ) {

        removeInsertSlot();

        return;

    }


    /*
        计算鼠标所在位置。

        这样就可以把单位插入
        两张牌之间。
    */

    const insertIndex =
        calculateInsertIndex(
            frontline,
            event.clientX
        );


    moveState.targetLine =
        "frontline";


    moveState.insertIndex =
        insertIndex;


    showInsertSlot(
        frontline,
        insertIndex
    );

}


// ==========================================
// 计算插入位置
// ==========================================

function calculateInsertIndex(
    container,
    mouseX
) {

    const children = [
        ...container.children
    ].filter(
        element =>
            !element.classList.contains(
                "insert-slot"
            )
    );


    if (
        children.length === 0
    ) {

        return 0;

    }


    for (
        let i = 0;
        i < children.length;
        i++
    ) {

        const rect =
            children[i]
                .getBoundingClientRect();


        const center =
            rect.left +
            rect.width / 2;


        /*
            鼠标在这张牌左半边：

            插到这张牌之前
        */

        if (
            mouseX < center
        ) {

            return i;

        }

    }


    /*
        鼠标在最后一张牌右边：

        插到最后
    */

    return children.length;

}


// ==========================================
// 显示插入位置
// ==========================================

function showInsertSlot(
    container,
    index
) {

    removeInsertSlot();


    const slot =
        document.createElement(
            "div"
        );


    slot.className =
        "insert-slot";


    const children = [
        ...container.children
    ].filter(
        element =>
            !element.classList.contains(
                "insert-slot"
            )
    );


    if (
        index >= children.length
    ) {

        container.appendChild(
            slot
        );

    }

    else {

        container.insertBefore(
            slot,
            children[index]
        );

    }

}


// ==========================================
// 删除插入位置
// ==========================================

function removeInsertSlot() {

    const slots =
        document.querySelectorAll(
            ".insert-slot"
        );


    slots.forEach(
        slot => {

            slot.remove();

        }
    );

}

// ==========================================
// 移动单位到前线
// ==========================================

function moveUnitToFrontline(
    insertIndex
) {

    const card =
        unitActionState.card;


    if (!card) {

        return;

    }


    /*
        =====================================
        必须来自玩家支援阵线
        =====================================
    */

    if (
        unitActionState.sourceLine !==
        "player-support"
    ) {

        return;

    }


    /*
        =====================================
        刚部署的单位不能行动
        =====================================
    */

    if (
        card.justDeployed
    ) {

        console.log(
            "单位刚部署，本回合不能移动"
        );

        return;

    }


    /*
        =====================================
        步兵行动限制
        =====================================

        步兵一回合只能移动或攻击一次。

        如果已经攻击过，
        本回合不能再移动。
    */

    if (
        card.type === "infantry" &&
        card.attacksThisTurn > 0
    ) {

        console.log(
            "步兵本回合已经攻击过，不能再移动"
        );

        return;

    }


    /*
        =====================================
        找到当前支援阵线
        =====================================
    */

    const source =
        gameState.player.supportLine;


    const target =
        gameState.frontline.cards;


    /*
        找到真正的单位位置
    */

    const sourceIndex =
        source.indexOf(card);


    if (
        sourceIndex === -1
    ) {

        return;

    }


    /*
        =====================================
        前线容量
        =====================================
    */

    if (
        target.length >=
        LINE_CAPACITY
    ) {

        return;

    }


    /*
        =====================================
        前线占领权
        =====================================
    */

    if (
        !canPlayerEnterFrontline()
    ) {

        return;

    }


    /*
        =====================================
        检查移动行动花费
        =====================================
    */

    const operationCost =
        Number(card.operation_cost) || 0;


    if (
        gameState.player.kredits <
        operationCost
    ) {

        console.log(
            "Kredits 不足，无法移动"
        );

        return;

    }


    /*
        =====================================
        扣除行动花费
        =====================================
    */

    gameState.player.kredits -=
        operationCost;


    /*
        =====================================
        从支援阵线移除
        =====================================
    */

    source.splice(
        sourceIndex,
        1
    );


    /*
        =====================================
        修正插入位置
        =====================================
    */

    insertIndex =
        Math.max(
            0,
            Math.min(
                insertIndex,
                target.length
            )
        );


    /*
        =====================================
        放入前线
        =====================================
    */

    target.splice(
        insertIndex,
        0,
        card
    );


    /*
        =====================================
        记录本回合已经移动
        =====================================
    */

    card.hasMoved =
        true;


    /*
        =====================================
        更新前线占领权
        =====================================
    */

    updateFrontlineOwnership();


    console.log(
        "单位移动到前线：",
        card.name_en,
        "行动花费：",
        operationCost
    );


    updateUI();

}

// ==========================================
// 完成单位移动
// ==========================================

function finishUnitMove() {

    if (
        moveState.arrow
    ) {

        moveState.arrow.remove();

    }


    removeInsertSlot();


    clearMoveTargets();


    window.removeEventListener(
        "pointermove",
        handleUnitPointerMove
    );


    window.removeEventListener(
        "pointerup",
        handleUnitPointerUp
    );


    window.removeEventListener(
        "pointercancel",
        handleUnitPointerCancel
    );


    moveState = {

        active: false,

        card: null,

        sourceLine: null,

        sourceIndex: null,

        sourceElement: null,

        pointerId: null,

        arrow: null,

        targetLine: null,

        insertIndex: null

    };

}

// ==========================================
// 新回合重置玩家单位行动状态
// ==========================================

function resetPlayerUnitActions() {

    gameState.player.supportLine.forEach(
        card => {

            if (!isHQ(card)) {

                card.justDeployed = false;
                card.hasMoved = false;
                card.attacksThisTurn = 0;

            }

        }
    );


    gameState.frontline.cards.forEach(
        card => {

            if (!isHQ(card)) {

                if (card.owner === "player") {

                    card.justDeployed = false;
                    card.hasMoved = false;
                    card.attacksThisTurn = 0;

                }

            }

        }
    );

}

// ==========================================
// 取消单位移动
// ==========================================

function handleUnitPointerCancel() {

    finishUnitMove();

}

// ==========================================
// 渲染 UI
// ==========================================

function updateUI() {

    document.getElementById(
        "player-hp"
    ).textContent =
        `${gameState.player.hp} HP`;


    document.getElementById(
        "kredits"
    ).textContent =
        `Kredits: ${gameState.player.kredits} / ${gameState.player.maxKredits}`;

    document.getElementById(
        "ai-kredits"
    ).textContent =
        `Kredits: ${gameState.ai.kredits} / ${gameState.ai.maxKredits}`;

    document.getElementById(
        "ai-hp"
    ).textContent =
        `${gameState.ai.hp} HP`;

    renderHand();

    renderAllLines();

}


// ==========================================
// 结束回合
// ==========================================

function endTurn() {

    if (
        gameState.turn !==
        "player"
    ) {

        return;

    }


    gameState.turn =
        "ai";


    updateUI();


    console.log(
        "AI 回合"
    );


    setTimeout(
        () => {

            aiTurn();

        },
        1000
    );

}


// ==========================================
// AI 回合
// ==========================================

function aiTurn() {

    console.log(
        "AI 行动"
    );


    // ======================================
    // AI 回合开始
    // ======================================

    if (
        gameState.ai.maxKredits < 12
    ) {

        gameState.ai.maxKredits += 1;

    }


    gameState.ai.kredits =
        gameState.ai.maxKredits;


    /*
        AI 暂时什么都不做。
    */


    // ======================================
    // 玩家回合开始
    // ======================================

    gameState.turn =
        "player";


    if (
        gameState.player.maxKredits < 12
    ) {

        gameState.player.maxKredits += 1;

    }


    gameState.player.kredits =
        gameState.player.maxKredits;


    resetPlayerUnitActions();


    updateUI();


    console.log(
        "玩家回合开始"
    );

}

// ==========================================
// 绑定结束回合
// ==========================================

document
    .getElementById(
        "end-turn"
    )
    .addEventListener(
        "click",
        endTurn
    );


// ==========================================
// 启动
// ==========================================

initGame();