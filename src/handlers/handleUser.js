import {Basket, Order, Product, Referral, Setting, User} from "../models/models.js";
import {Composer, Markup, Scenes} from "telegraf";
import {DATA_BONUS_CANCEL, DATA_CABINET, DATA_MENU, DATA_PARTNER} from "../utils/buttons/userButtons.js";
import process from "node:process";
import _ from "lodash";
import {DATA_PAYMENTS} from "../utils/buttons/paymentButtons.js";
import {sceneIds} from "../utils/consts.js";

export async function MenuButtons(ctx, text = 'Меню') {

    const basket = await Basket.findOne({
        raw: true,
        where: {
            user_id: _.toInteger(ctx.from.id)
        }
    })

    const keyBoard = Markup.inlineKeyboard([
        [
            Markup.button.webApp('📕 Каталог', process.env.WEB_APP_URL)
        ],
        basket?.id ? [
            Markup.button.webApp('🗑 Корзина', process.env.WEB_APP_URL)
        ] : [],
        [
            Markup.button.callback('🧷 Партнёрская программа', DATA_PARTNER)
        ],
        [
            Markup.button.url('💌 Отзывы', 'https://t.me/muhomor3000')
        ],
        [
            Markup.button.callback('💼 Мой кабинет', DATA_CABINET)
        ]
    ])

    return await ctx.replyWithHTML(text, keyBoard)
}


export async function handleBonusConfirm(ctx) {
    try {

        const userId = ctx?.update?.callback_query?.from?.id ?? ctx?.update?.message?.from?.id

        if (!userId) {
            return await ctx.reply('Что-то пошло не так. Обратитесь в службу поддержки')
        }

        const user = await User.findOne({
            raw: true,
            where: {
                user_id: _.toInteger(userId),
            }
        })

        await ctx.reply(`Введите сумму бонусов которую хотите списать, в ответ на это сообщение. Например 30\n\nВсего бонусов: ${user?.bonus}`, DATA_BONUS_CANCEL)
        await ctx.answerCbQuery()
        await ctx.scene.enter(sceneIds.user.SCENE_GET_BONUS)
    } catch (e) {
        console.log(e)
    }
}

const GetBonusStep = new Composer()
GetBonusStep.on('text', async ctx => {

    try {
        const message = ctx.update.message

        const user = await User.findOne({
            raw: true,
            where: {
                user_id: _.toInteger(message.from.id),
            }
        })

        const order = await Order.findOne({
            raw: true,
            where: {
                user_id: _.toInteger(message.from.id),
                isPayment: 0,
            }
        })

        if (!order?.id) {
            await ctx.scene.leave()
            return await ctx.reply('Ваш заказ аннулирован попробуйте ещё раз.')
        }

        if (_.toInteger(message.text) <= _.toInteger(user?.bonus)) {
            const price = _.toInteger(order?.total_price) - _.toInteger(message.text)

            if (_.toInteger(order?.total_price) < _.toInteger(message.text) || price < 100) {

                return await ctx.telegram.sendMessage(user?.user_id, 'Сумма к оплате за вычетом бонусов не может быть менее 100 руб. Введите 0, чтобы пропустить этот шаг или меньшее число списываемых бонусов')
            }

            await ctx.scene.leave()

            await User.update({
                bonus: _.toInteger(user?.bonus) - _.toInteger(message.text),
            }, {
                raw: true,
                where: {user_id: _.toInteger(message.from.id)}
            })

            await Order.update(
                {
                    total_price: price,
                    bonus: _.toInteger(order?.bonus) + _.toInteger(message.text),
                }, {
                    raw: true,
                    where: {id: _.toInteger(order?.id), isPayment: 0,}
                })

            await ctx.deleteMessage()

            let basketToString = ''

            const baskets = await Basket.findAll({
                where: {user_id: _.toInteger(user?.user_id)}
            })

            baskets?.map(async (basket) => {
                const product = await Product.findOne({
                    raw: true,
                    where: {
                        id: _.toInteger(basket?.product_id)
                    }
                })

                if (product?.id) {
                    const price = _.toInteger(product?.price);
                    const count = _.toInteger(basket?.count)

                    basketToString += `➡️ <b>${product.name}</b>, ${price} руб, ${count} шт.\n\n`
                }
            })

            await ctx.replyWithHTML(`<b>Вы выбрали следующие товары</b>\n\n${basketToString}<b>💳 Итого к оплате с учётом списанных бонусов и промо: </b>${price} руб. <b>\n\nСпособ оплаты:</b> Юкасса\n\nЕсли всё верно, нажмите "💰 Перейти к оплате", если хотите внести изменения в свой заказ, нажмите "🔙 Назад"`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: '💰 Перейти к оплате', callback_data: DATA_PAYMENTS},
                        ],
                        [
                            {text: '🔙 Назад', callback_data: DATA_MENU},
                        ],
                    ]
                }
            })

        } else {
            await ctx.reply('❌ Кажется, введенное число бонусов не доступно для списания! Пожалуйста, попробуйте ещё раз.')
        }
    } catch (e) {
        console.log(e);
    }
})
export const sceneGetBonus = new Scenes.WizardScene(sceneIds.user.SCENE_GET_BONUS, GetBonusStep)

export async function calculateTotalPrice(user) {

    let totalPrice = 0
    let basketToString = ''

    const baskets = await Basket.findAll({
        where: {user_id: _.toInteger(user?.user_id)}
    })

    const setting = await Setting.findOne({raw: true})

    const isFirstOrder = await Order.findOne({
        raw: true,
        where: {
            user_id: _.toInteger(user?.user_id),
            isPayment: 1,
        }
    })

    baskets?.map(async (basket) => {
        const product = await Product.findOne({
            raw: true,
            where: {
                id: _.toInteger(basket?.product_id)
            }
        })
        const price = _.toInteger(product?.price);
        const count = _.toInteger(basket?.count)

        totalPrice += price * count
        basketToString += `➡️ <b>${product.name}</b>, ${price} руб, ${count} шт.\n\n`

    })

    const referral = user?.referral ? await Referral.findOne({
        raw: true,
        where: {
            user_id: _.toInteger(user?.referral)
        }
    }) : null

    totalPrice = !isFirstOrder?.id ?
        _.toInteger(totalPrice - (referral?.id ? _.toInteger(setting?.discount) / 100 * totalPrice : 0)) :
        totalPrice


    await Order.update({
            referral: _.toInteger(user?.referral),
            total_price: totalPrice < 100 ? 100 : totalPrice,
        },
        {
            where: {
                user_id: _.toInteger(user?.user_id),
                isPayment: 0,
            }
        })

    return {
        totalPrice: totalPrice < 100 ? 100 : totalPrice,
        basketToString
    }
}

export async function handleBonusNext(ctx) {
    try {
        const userId = ctx?.update?.callback_query?.from?.id ?? ctx.update.message.from.id

        const user = await User.findOne({
            raw: true,
            where: {
                user_id: _.toInteger(userId),
            }
        })

        if (!user?.id) {
            return await ctx.reply('Что-то пошло не так. Обратитесь в службу поддержки')
        }

        const order = await Order.findOne({
            raw: true,
            where: {
                user_id: _.toInteger(userId),
                isPayment: 0,
            }
        })

        if (!order?.id) {
            await ctx.scene.leave()
            return await ctx.reply('Ваш заказ аннулирован попробуйте ещё раз.', DATA_MENU)
        }

        const {basketToString, totalPrice} = await calculateTotalPrice(user)

        await ctx.replyWithHTML(`<b>Вы выбрали следующие товары</b>\n\n${basketToString}<b>💳 Итого к оплате с учётом списанных бонусов и промо: </b>${totalPrice} руб. <b>\n\nСпособ оплаты:</b> Юкасса\n\nЕсли всё верно, нажмите "💰 Перейти к оплате", если хотите внести изменения в свой заказ, нажмите "🔙 Назад"`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: '💰 Перейти к оплате', callback_data: DATA_PAYMENTS},
                    ],
                    [
                        {text: '🔙 Назад', callback_data: DATA_MENU},
                    ],
                ]
            }
        })
    } catch (e) {
        console.log(e)
    }
}
