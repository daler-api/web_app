import sequelize from '../db.js'
import {randomNum} from "../helpers/other.js";
import {
    DATA_PHRASE_TYPE_GIF,
    DATA_PHRASE_TYPE_PHOTO,
    DATA_PHRASE_TYPE_STICKER,
} from "../utils/buttons/adminButtons.js";

const countMessagesByChats = {}
const randomAmountChats = {}

export default async function handleMessage(ctx, asd, tt, aaa, bbb, ccc, dd, e) {
    const fromChat = ctx.message.from
    const count = countMessagesByChats[fromChat.id] || 1
    const amount = randomAmountChats[fromChat.id] || randomNum(5, 30)

    if (count >= amount) {
        randomAmountChats[fromChat.id] = randomNum(5, 30)
        console.log(randomAmountChats[fromChat.id])
        countMessagesByChats[fromChat.id] = 0
        return await sendRandomPhrase(ctx)
    }

    countMessagesByChats[fromChat.id] = count ? count + 1 : 1
}

async function getRandomPhrase() {
    try {
        const [results] = await sequelize.query("SELECT * FROM phrases ORDER BY RANDOM() LIMIT 1")
        return results?.[0]
    } catch (e) {
        console.log(e)
    }
}

async function sendRandomPhrase(ctx) {
    try {
        const reply_to_message_id = ctx.update.message.message_id
        const randomPhrase = await getRandomPhrase()
        if (randomPhrase) {
            const filePath = `${process.cwd()}\\${randomPhrase.content}`
            switch (randomPhrase.type) {
                case DATA_PHRASE_TYPE_STICKER:
                    return await ctx.replyWithSticker({source: filePath}, {reply_to_message_id})
                case DATA_PHRASE_TYPE_GIF:
                    return await ctx.replyWithDocument({source: filePath}, {reply_to_message_id})
                case DATA_PHRASE_TYPE_PHOTO:
                    return await ctx.replyWithPhoto({source: filePath}, {reply_to_message_id})
                default:
                    await ctx.reply(randomPhrase.content, {reply_to_message_id})
            }
        }
    } catch (e) {
        console.log(e)
    }
}
