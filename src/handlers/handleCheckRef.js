import {User} from "../models/models.js";

export default async function handleCheckRef(ctx) {
    try {
        const message = ctx.update.message
        const referral = message.text.split(' ')?.[1]
        if (referral) {
            const usersByRef = await User.findAndCountAll({where: {referral}, raw: true})

            const text =
                `Статистика по рефке <b>${referral}</b>:\nЗапустили бота: <b>${usersByRef?.count || 0}</b>`;

            await ctx.telegram.sendMessage(message.from.id, text, {parse_mode: 'HTML'})

        } else {
            await ctx.telegram.sendMessage(message.from.id, 'Отправьте рефку!')
        }
    } catch (e) {
        console.log(e)
        await ctx.telegram.sendMessage(message.from.id, 'Упс! Ошибка при получении статистики по рефке :(')
    }
}
