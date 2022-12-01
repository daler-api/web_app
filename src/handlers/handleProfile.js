import {addBackButton, DATA_MENU} from "../utils/buttons/userButtons.js";
import {Order, Referral, Setting, User} from "../models/models.js";
import process from "node:process";
import {Markup} from "telegraf";
import {MenuButtons} from "./handleUser.js";
import _ from "lodash";

export async function handleMenu(ctx) {
    try {
        await ctx.deleteMessage()
        await MenuButtons(ctx)
    } catch (e) {
        console.log(e)
    }
}

export async function handlePaymentConfirmBackMenu(ctx) {
    try {
        await MenuButtons(ctx)
    } catch (e) {
        console.log(e)
    }
}

export async function handleChangePartner(ctx) {
    try {
        await ctx.deleteMessage()
        const partnerCount = await User.findAndCountAll({where: {referral: _.toInteger(ctx.from.id)}})

        const user = await User.findOne({
            raw: true,
            where: {
                user_id: _.toInteger(ctx.from.id),
            }
        })

        const referral = await Referral.findOne({
            raw: true,
            where: {
                user_id: _.toInteger(user?.user_id),
            }
        })

        const ref = `https://telegram.me/${process.env.BOT_USERNAME}?start=${_.toInteger(user?.user_id)}`
        const setting = await Setting.findOne({
            raw: true,
        })

        const url = `Переходи в бота по моей реферальной ссылке и возвращай ${setting?.discount} процентов от суммы первого заказа бонусами ☀️⬇️\n\nhttps://t.me/share/url?url=${ref}`

        const bonus = referral?.id ? `${setting?.ref_bonus}% от суммы его первой покупки` : '1 рубля'

        await ctx.replyWithHTML(`❗️  <b>Статистика</b>\n\n👫 Всего партнеров: ${partnerCount?.count}\n\n💫 Начислено бонусов: ${_.toInteger(user?.bonus)}\n\nЗа каждого приглашенного друга, Вы будете получать бонусы в размере ${bonus}.\n\nЧтобы получить бонусы, поделитель реферальной ссылкой: <a href="https://t.me/share/url?url=${ref}">ссылка</a>\n\n Или нажмите кнопку ниже ⬇️`, Object.assign({}, {
            disable_web_page_preview: true,
        }, Markup.inlineKeyboard([
            [
                Markup.button.switchToChat('Поделиться ссылкой 🔗', url),
            ],
            [
                Markup.button.callback('🔙 Назад', DATA_MENU),
            ]
        ])))

    } catch (e) {
        console.log(e)
    }
}

export async function handleCabinet(ctx) {
    try {
        await ctx.deleteMessage()
        let totalPrice = 0
        let orders = await Order.findAll({
            raw: true,
            where: {user_id: _.toInteger(ctx.from.id), isPayment: 1}
        }).then((orders) => {
            for (const key in orders) {
                totalPrice += _.toInteger(orders[key]?.total_price) ?? 0
            }
            return {
                totalPrice,
                count: orders?.length
            }
        })

        const user = await User.findOne({
            raw: true,
            where: {
                user_id: _.toInteger(ctx.from.id),
            }
        })

        await ctx.replyWithHTML(`💼 Мой кабинет\n\n💫<b>Всего бонусов</b>: ${user?.bonus ?? 0}\n👜<b>Всего заказов</b>: ${orders?.count ?? 0} \n💰 Общая сумма заказов: ${totalPrice ?? 0} руб`, addBackButton)
    } catch (e) {
        console.log(e);
    }
}
