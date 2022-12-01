import {User} from "../models/models.js";

export default async function handleGetStat(ctx) {
    await ctx.answerCbQuery()
    const users = await User.scope('active').findAndCountAll({where: {active: true}})

    const text =
`Статистика бота:\n
Общее кол-во пользователей: <b>${users?.count}</b>\n`;

    await ctx.replyWithHTML(text)
}
