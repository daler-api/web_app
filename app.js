import 'dotenv/config';
import './src/models/models.js';
import sequelize from './src/db.js';
import {runBot} from "./src/bot.js";

const startApp = async () => {
    try {
        console.log('seq before')
        await sequelize.authenticate()
        console.log('seq after')
        //await sequelize.sync({alter: true})
        console.log('run bot before')
        await runBot()
        console.log('run bot after')

    } catch (error) {
        console.error('Ошибка при старте бота', error)
    }
}

try {
    (async () => await startApp())()
} catch (e) {
    console.log(e)
}
