import {Referral, Setting, User} from "../models/models.js";
import _ from "lodash";
import {MenuButtons} from "../handlers/handleUser.js";

export default async function handleStart(ctx) {

    const referral = _.toInteger(ctx.startPayload) > 0 ? await Referral.findOne({
        where: { user_id: _.toInteger(ctx.startPayload) },
        raw: true
    }) : null

    const message = ctx.update.message
    const from = message.from

    const findUser = await User.findOne({ raw: true, where: { user_id: _.toInteger(from.id) } })

    if (!findUser?.id) {
        await User.create({
            user_id: _.toInteger(from.id),
            username: from.username,
            first_name: from.first_name,
            last_name: from.last_name,
            language_code: from.language_code,
            active: true,
            referral: _.toInteger(from.id) !== _.toInteger(referral?.user_id) ? _.toInteger(referral?.user_id) : null
        })

        if (findUser?.referral && _.toInteger(from.id) !== _.toInteger(referral?.user_id)) {
            await Referral?.update(
                {
                    count: _.toInteger(referral?.count) + 1
                },
                {
                    where: {user_id: _.toInteger(findUser?.user_id)}
                }
            )

            let userName = from?.username ? `@${from.username}` : 'Пользователь без ника'
            const setting = await Setting.findOne({raw: true})

            await ctx.telegram.sendMessage(
                _.toInteger(findUser?.referral),
                `${userName} перешел по твоей реферальной ссылке! \n\n 🎉 Тебе начислено вознаграждение в размере ${setting.discount}%! Ты можешь узнать кол-во имеющихся бонусов по кнопке " 📎 Партнерская программа "`,
                { parse_mode: 'HTML'}
            )
        }
    } else {
        await User.update({
            user_id: from.id,
            username: from.username,
            first_name: from.first_name,
            last_name: from.last_name,
            language_code: from.language_code,
            active: true,
            referral: _.toInteger(from.id) !== _.toInteger(referral?.user_id) ? _.toInteger(referral?.user_id) : null
        }, {
            raw: true,
            where: { user_id: _.toInteger(from.id) }
        })
    }

    const user = await User.findOne({
        raw: true,
        where: {
            user_id: _.toInteger(from.id)
        }
    })

    let text = `Приветствую. @${user?.username}\n\n<b>В этом боте ты сможешь:</b>\n\nВыбрать товары, нажав кнопку \n"📕 Каталог"\n\nОткрыть список выбранных, но не оплаченных товаров, нажав \n"🗑 Корзина"\n\nПосмотреть статистику своих заказов по кнопке\n"💼 Мой кабинет"\n\nПолучить бонусы,  приглашая друзей по рефельной ссылке, нажав\n"🧷 Партнёрская программа"`;
    await MenuButtons(ctx, text)

}
