import {Markup} from "telegraf";
import {Basket, Order, Product, Referral, Setting, User} from "../models/models.js";
import process from "node:process";
import {addBackPaymentButton, DATA_CABINET, DATA_PARTNER} from "../utils/buttons/userButtons.js";
import _ from "lodash";


export async function handlePaymentSuccess(ctx) { // ответ в случае положительной оплаты
    try {

        const query = ctx.update.message;
        const success = query.successful_payment;

        const isFirstOrder = await Order.findOne({
            raw: true,
            where: {
                user_id: _.toInteger(query.from.id),
                isPayment: 1,
            }
        })

        await Order.update(
            {
                isPayment: 1,
                chargeId: success.provider_payment_charge_id,
                queryId: success.telegram_payment_charge_id,
            },
            {
                where: {
                    id: _.toInteger(success.invoice_payload)
                }
            })

        const order = await Order.findOne(
            {
                raw: true,
                where: {
                    id: _.toInteger(success.invoice_payload)
                }
            })

        if (!isFirstOrder?.id) {
            const client = await User.findOne({
                raw: true,
                where: {
                    user_id: _.toInteger(query.from.id)
                }
            })

            const setting = await Setting.findOne({raw: true})

            if (client?.referral) {
                const referral = await Referral.findOne({raw: true, where: {user_id: _.toInteger(client?.referral)}})
                const bonus = referral?.id ? _.toInteger((_.toInteger(setting?.bonus) / 100 * order?.total_price)) : 1

                await User.update({
                        bonus: _.toInteger(client?.bonus + bonus)
                    },
                    {
                        where: {
                            user_id: _.toInteger(query.from.id)
                        }
                    })

                const referralUser = await User.findOne({raw: true, where: {user_id: _.toInteger(client?.referral)}})
                const refBonus = referral?.id ? _.toInteger((_.toInteger(setting?.ref_bonus) / 100 * order?.total_price)) : 1

                await User.update({
                        bonus: _.toInteger(referralUser?.bonus) + refBonus
                    },
                    {
                        where: {
                            user_id: _.toInteger(client?.referral)
                        }
                    })

            }

        }

        await ctx.replyWithHTML(`🎉 Поздравляем!\n\nВаш заказ #${order?.id} оформлен и будет отправлен по указанному адресу в течении 1-7 дней дней.\n\nМы свяжемся с Вами в течении 24часов, чтобы подтвердить детали заказа.`, addBackPaymentButton)

        const users = await User.findAll({
            raw: true,
            where: {
                isAdmin: true,
            }
        })

        let basketToString = ''

        const baskets = await Basket.findAll({
            where: {user_id: _.toInteger(query.from.id)}
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

        users.map(async (user) => {
            setTimeout(async () => {
                await ctx.telegram.sendMessage(user?.user_id, `Поступил новый заказ #${order?.id} от <b>ID:</b>${query.from.id}. @${query.from.username}\n\n<b>Детали заказа:</b>\n\n${basketToString}Заказ на сумму: ${order?.total_price} руб.\n\n<b>Информация о доставке:</b>\n\nАдрес получателя: ${order?.address}\n\nФИО получателя: ${order?.contact}\n\nТелефон получателя: ${order?.phone}\n\nНомер транзакции: ${order?.chargeId}`, {
                    parse_mode: 'HTML'
                })
            }, 100)
        })

        await Basket.destroy({
            where: {
                user_id: _.toInteger(query.from.id)
            }
        })
    } catch (e) {
        console.log(e)
    }

}

export async function handlePreCheckOutQuery(ctx) {
    try {
        const query = ctx.update.pre_checkout_query;
        const orderInfo = query.order_info
        const address = orderInfo.shipping_address

        await Order.update(
            {
                address: `${address.city} / ${address.state} / ${address.street_line1} / ${address.street_line2} / ${address.post_code}`,
                contact: orderInfo.name,
                phone: orderInfo.phone_number,
                total_price: _.toInteger(query.total_amount / 100),
                query_id: query.id
            },
            {
                where: {
                    id: _.toInteger(query.invoice_payload)
                }
            })
        await ctx.answerPreCheckoutQuery(true)
    } catch (e) {
        console.log(e)
        return true
    }
}

export async function handlePaymentFail(ctx, data) {

}


export async function handleDataPayments(ctx) {
    try {
        const order = await Order.findOne({
            raw: true,
            where: {
                user_id: _.toInteger(ctx.update.callback_query.from.id),
                isPayment: 0,
            }
        })

        if (!order?.id) {
            return await ctx.reply('Ваш заказ аннулирован попробуйте ещё раз.')
        }

        const invoice = {
            provider_token: process.env.PROVIDER_TOKEN,
            start_parameter: _.toInteger(ctx.update.callback_query.from.id),
            title: 'Процесс оплаты',
            description: 'Пожалуйста, введите Ваши: \n\n-ФИО\n\n-номер телефона\n\n-адрес доставки\n\n для завершения заказа ⬇️',
            currency: 'RUB',
            need_shipping_address: true,
            need_name: true,
            need_phone_number: true,
            is_flexible: false,
            prices: [
                {
                    label: 'Онлайн заказ',
                    amount: order?.total_price < 100 ? 100 * 100 : _.toInteger(order?.total_price * 100) // * 100 это копейки .00
                }
            ],
            payload: order?.id,


        };

        await ctx.telegram.sendInvoice(ctx.update.callback_query.from.id, invoice)
    } catch (e) {
        console.log(e)
    }

}


export async function handlePaymentBackMenu(ctx) {
    try {
        const basket = await Basket.findOne({
            raw: true,
            where: {
                user_id: _.toInteger(ctx.update.callback_query.from.id)
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

        return await ctx?.msg?.sendTo(ctx.update.callback_query.from.id, 'Меню', keyBoard)
    } catch (e) {
        console.log(e)
    }
}
