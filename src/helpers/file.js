import fs from 'fs'
import path from 'path'
import axios from "axios";

export async function saveFile(ctx) {

    return new Promise(async (resolve, reject) => {
        try {
            const file = getFile(ctx)
            const fileLink = await ctx.telegram.getFileLink(file.file_id)

            const res = await axios.get(fileLink.href, {responseType: 'stream'})

            const filePath = `files/${file.file_unique_id}${path.extname(fileLink.href)}`;
            const createFile = fs.createWriteStream(filePath);

            res.data.pipe(createFile);

            createFile.on('finish', () => {
                createFile.close();
                resolve(filePath)
            })

        } catch (e) {
            reject(e)
        }
    })

}


export function getFile(ctx) {
    return ctx.update.message.photo || ctx.update.message.sticker || ctx.update.message.document || ctx.update.message.photo
}
