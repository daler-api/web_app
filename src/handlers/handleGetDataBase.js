import fs from 'fs'
import {User} from "../models/models.js";


export default async function handleGetDataBase(ctx) {

    try {
        ctx.answerCbQuery()
        const users = await User.scope('active').findAll({raw: true})
        const writeContent = getIdsContent(users)
        const filePath = `db-csv.csv`

        await writeAndDownloadFile(ctx, filePath, writeContent)

    } catch (err) {
        console.log(err)
    }
}


async function writeAndDownloadFile(ctx, filePath, writeContent) {
    try {
        fs.writeFileSync(filePath, writeContent, console.log)
        console.log('Success write to file!')
        await ctx.replyWithChatAction('UPLOAD_DOCUMENT')
        await ctx.replyWithDocument({source: filePath})
    } catch (e) {
        console.log(e)
        await ctx.reply('Упс! Ошибка при выгрузке БД :(')
    }
}


function getIdsContent(users) {
    return users.map(user => user.user_id).join('\n')
}
