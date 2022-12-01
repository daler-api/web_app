import {Channel} from "../models/models.js";
import {Markup} from "telegraf";

export default async function checkChannelSub(ctx, next) {
    try {
        const from = ctx.message.from
        const channels = await Channel.findAll({raw: true})

        const mustSubChannels = []
        for (const channel of channels) {

            try {
                const userMember = await ctx.telegram.getChatMember(channel.chat, from.id)
                if (userMember.status === 'left') {
                    mustSubChannels.push(channelUrlButton(channel))
                }
            } catch (e) {
                console.log(e)
                mustSubChannels.push(channelUrlButton(channel))
            }
        }
        console.log('mustSubChannels', mustSubChannels)
        if (mustSubChannels.length > 0) {
            return ctx.reply('Вы не подписаны на каналы:', Markup.inlineKeyboard(mustSubChannels))
        }
        return next()
    } catch (e) {
        console.log(e)
        await ctx.reply('Похоже вы не подписаны на каналы совсем')
    }
}


function channelUrlButton(channel) {
    return [Markup.button.url(channel.name, channel.link)]
}