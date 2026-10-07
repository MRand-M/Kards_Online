// ==========================================
// DEBUG：将指定卡加入玩家手牌
//
// Console：
// debugAddCard("card_id")
// ==========================================

function debugAddCard(cardId) {

    if (!cardId) {

        console.log(
            "用法：debugAddCard(\"card_id\")"
        );

        return;

    }


    // ======================================
    // 检查手牌上限
    // ======================================

    if (
        gameState.player.hand.length >=
        HAND_LIMIT
    ) {

        console.log(
            "DEBUG：手牌已满"
        );

        return;

    }


    // ======================================
    // 从玩家牌库寻找
    // ======================================

    const index =
        gameState.player.deck.findIndex(
            card =>
                card.card_id === cardId
        );


    if (index === -1) {

        console.log(
            "DEBUG：玩家牌库找不到：",
            cardId
        );

        return;

    }


    // ======================================
    // 从牌库取出
    // ======================================

    const card =
        gameState.player.deck.splice(
            index,
            1
        )[0];


    // ======================================
    // 加入手牌
    // ======================================

    gameState.player.hand.push(
        card
    );


    console.log(
        "DEBUG：加入手牌 →",
        card.name_en ||
        card.card_id
    );


    updateUI();

}