import {webAppButton} from "../utils/buttons/userButtons.js";

export const handleSearchChat = async (ctx) => {
    try {
        await ctx.reply('Добро пожаловать в поиск чата. Вы можете открыть чат по кнопке ниже', webAppButton)
    } catch (error) {
        await ctx.reply('Ошибка при поиске чата')
    }
}
