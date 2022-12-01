import {session, Scenes, Telegraf} from "telegraf";
import express from 'express';
import cors from 'cors';
import handleStart from "./commands/handleStart.js";
import handleHelp from "./commands/handleHelp.js";
import handleGetDataBase from "./handlers/handleGetDataBase.js";
import handleCheckRef from "./handlers/handleCheckRef.js";
import checkAdminLock from "./middlewares/checkAdminLock.js";
import {
    DATA_ADD_ADMIN,
    DATA_ADD_PRODUCT, DATA_ADMIN, DATA_BONUS, DATA_CANCEL, DATA_CANCEL_BONUSES,
    DATA_DISCOUNT,
    DATA_GET_DB, DATA_MAILING, DATA_REF_BONUS, DATA_REFERRAL, DATA_REFERRAL_COUNT, DATA_REVIEW_URL,
} from "./utils/buttons/adminButtons.js";
import {
    REF_COMMAND,
    DATA_PARTNER,
    MENU_COMMAND,
    DATA_MENU,
    DATA_CABINET,
    CABINET_COMMAND,
    PARTNER_COMMAND,
    DATA_BONUS_CONFIRM, DATA_BONUS_CANCEL, DATA_PAYMENT_CONFIRM_BACK_MENU,
} from "./utils/buttons/userButtons.js";

import {
    handleCabinet,
    handleChangePartner, handleMenu, handlePaymentConfirmBackMenu,
} from "./handlers/handleProfile.js";
import {
    handleDiscount,
    handleAdmin,
    handleBonus,
    handleReviewUrl,
    handleMailing,
    handleCancel,
    handleReferral,
    handleReferralCount,
    handleCancelBonuses,
    handleAdminMenu,
    sceneAddMailing,
    sceneAddReferral,
    sceneAddReferralCount,
    sceneCancelBonus,
    sceneAddDiscount,
    sceneAddBonus,
    sceneAddReviewUrl, sceneAddAdmin, handleAddAdmin, sceneAddRefBonus, handleRefBonus,
} from "./commands/handleAdmin.js";
import sender from "telegraf-sender";
import {
    handleAddProduct,
    handleEditProduct, handleEditProductAttribute,
    handleProductList,
    handleRemoveProduct, handleRemoveProductConfirm,
    sceneAddProduct, sceneEditProduct
} from "./commands/handleProduct.js";

import {DATA_PAYMENT_BACK, DATA_PAYMENTS} from "./utils/buttons/paymentButtons.js";
import {handleBonusNext, handleBonusConfirm, sceneGetBonus} from "./handlers/handleUser.js";
import {
    handleDataPayments,
    handlePaymentBackMenu,
    handlePaymentSuccess,
    handlePreCheckOutQuery
} from "./handlers/handlePayments.js";
import UserService from "./services/user.service.js";
import checkUserLock from "./middlewares/checkUserLock.js";

export async function runBot() {

    const stage = new Scenes.Stage([
        sceneAddDiscount,
        sceneAddBonus,
        sceneAddReviewUrl,
        sceneAddMailing,
        sceneAddReferral,
        sceneAddReferralCount,
        sceneCancelBonus,
        sceneAddProduct,
        sceneEditProduct,
        sceneGetBonus,
        sceneAddAdmin,
        sceneAddRefBonus,
    ])

    const bot = new Telegraf(process.env.TOKEN)
    const app = express();

    app.use(express.json())
    app.use(cors())

    bot.use(session())
    bot.use(stage.middleware())
    bot.use(sender)

    bot.start(handleStart)
    bot.help(handleHelp)

    bot.command('admin', checkAdminLock, handleAdmin)
    bot.action(DATA_ADMIN, checkAdminLock, handleAdminMenu)

    bot.action(DATA_GET_DB, checkAdminLock, handleGetDataBase)
    bot.action(DATA_DISCOUNT, checkAdminLock, handleDiscount)
    bot.action(DATA_BONUS, checkAdminLock, handleBonus)
    bot.action(DATA_REF_BONUS, checkAdminLock, handleRefBonus)
    bot.action(DATA_REVIEW_URL, checkAdminLock, handleReviewUrl)
    bot.action(DATA_MAILING, checkAdminLock, handleMailing)
    bot.action(DATA_CANCEL, checkAdminLock, handleCancel)
    bot.action(DATA_REFERRAL, checkAdminLock, handleReferral)
    bot.action(DATA_REFERRAL_COUNT, checkAdminLock, handleReferralCount)
    bot.action(DATA_ADD_ADMIN, checkAdminLock, handleAddAdmin)
    bot.action(DATA_CANCEL_BONUSES, checkAdminLock, handleCancelBonuses)

    const DATA_LIST_PRODUCT = new RegExp(/DATA_LIST_PRODUCT (.+)/i)
    bot.action(DATA_LIST_PRODUCT, checkAdminLock, handleProductList)

    const DATA_EDIT_PRODUCT = new RegExp(/DATA_EDIT_PRODUCT (.+)/i)
    bot.action(DATA_EDIT_PRODUCT, checkAdminLock, handleEditProduct)

    const DATA_EDIT_PRODUCT_ATTRIBUTE = new RegExp(/DATA_EDIT_PRODUCT_ATTRIBUTE (.+)/i)
    bot.action(DATA_EDIT_PRODUCT_ATTRIBUTE, checkAdminLock, handleEditProductAttribute)

    const DATA_REMOVE_PRODUCT = new RegExp(/DATA_REMOVE_PRODUCT (.+)/i)
    bot.action(DATA_REMOVE_PRODUCT, checkAdminLock, handleRemoveProduct)

    const DATA_REMOVE_CONFIRM_PRODUCT = new RegExp(/DATA_REMOVE_CONFIRM_PRODUCT (.+)/i)
    bot.action(DATA_REMOVE_CONFIRM_PRODUCT, checkAdminLock, handleRemoveProductConfirm)


    bot.action(DATA_ADD_PRODUCT, checkAdminLock, handleAddProduct)

    // Временно сделано командой, в будущем добавится кнопка "Реф ссылки"
    bot.command(REF_COMMAND, checkAdminLock, handleCheckRef)

    bot.command(MENU_COMMAND, checkUserLock, handleMenu)
    bot.action(DATA_MENU, checkUserLock, handleMenu)
    bot.action(DATA_PAYMENT_CONFIRM_BACK_MENU, checkUserLock, handlePaymentConfirmBackMenu)

    //Партнёрская программа
    bot.action(DATA_PARTNER, checkUserLock, handleChangePartner)
    bot.command(PARTNER_COMMAND, checkUserLock, handleChangePartner)

    //Мой кабинет
    bot.action(DATA_CABINET, checkUserLock, handleCabinet)
    bot.command(CABINET_COMMAND, checkUserLock, handleCabinet)

    //Бонусы
    bot.action(DATA_BONUS_CONFIRM, checkUserLock, handleBonusConfirm)
    bot.action(DATA_BONUS_CANCEL, checkUserLock, handleBonusNext)
    bot.action(DATA_PAYMENT_BACK, checkUserLock, handlePaymentBackMenu)
    bot.action(DATA_PAYMENTS, checkUserLock, handleDataPayments)

    //Оплата
    bot.on('pre_checkout_query', handlePreCheckOutQuery)
    bot.on('successful_payment', handlePaymentSuccess)

    bot.telegram.getMe().then((botInfo) => {
        bot.options.username = botInfo.username
    })

    bot.catch(console.error)

    bot.launch()

    await bot.on('invoice', (ctx) => {
        console.log('invoice', ctx)
    })

    app.use(express.static('public/products'));
    app.use('/product-image', express.static('public/products'));

    app.get('/products', UserService.Products)

    app.post('/basket', UserService.Basket)

    app.post('/web-data', async (req, res) => UserService.WebData(req, res, bot))

    app.listen(process.env.EXPRESS_PORT, () => console.log(`server is run on port ${process.env.EXPRESS_PORT}`))

    console.info(`Bot ${bot.botInfo.username} is up and running`)
}
