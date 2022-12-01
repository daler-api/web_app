import { Markup } from 'telegraf'
export const DATA_ADMIN = 'DATA_ADMIN'
export const DATA_GET_DB = 'DATA_GET_DB'
export const DATA_ADD_CHANNEL = 'DATA_ADD_CHANNEL'
export const DATA_DELETE_CHANNEL = 'DATA_DELETE_CHANNEL'
export const DATA_DISCOUNT = 'DATA_DISCOUNT'
export const DATA_REVIEW_URL = 'DATA_REVIEW_URL'

export const DATA_CANCEL = 'DATA_CANCEL'

export const DATA_BONUS = 'DATA_BONUS'
export const DATA_REF_BONUS = 'DATA_REF_BONUS'
export const DATA_CANCEL_BONUSES = 'DATA_CANCEL_BONUSES'

export const DATA_MAILING = 'DATA_MAILING'
export const DATA_MAILING_CANCEL = 'DATA_MAILING_CANCEL'
export const DATA_MAILING_CONFIRM = 'DATA_MAILING_CONFIRM'

export const DATA_REFERRAL = 'DATA_REFERRAL'
export const DATA_REFERRAL_COUNT = 'DATA_REFERRAL_COUNT'

export const DATA_ADD_ADMIN = 'DATA_ADD_ADMIN'

/*PRODUCT CONST*/
export const DATA_LIST_PRODUCT = 'DATA_LIST_PRODUCT'
export const DATA_ADD_PRODUCT = 'DATA_ADD_PRODUCT'

export const DATA_EDIT_PRODUCT = 'DATA_EDIT_PRODUCT'
export const DATA_EDIT_PRODUCT_ATTRIBUTE = 'DATA_EDIT_PRODUCT_ATTRIBUTE'

export const DATA_REMOVE_PRODUCT = 'DATA_REMOVE_PRODUCT'
export const DATA_REMOVE_CONFIRM_PRODUCT = 'DATA_REMOVE_CONFIRM_PRODUCT'


export const ADMIN_INLINE_KEYBOARD = Markup.inlineKeyboard([
    [
        Markup.button.callback('Поменять скидку', DATA_DISCOUNT),
    ],
    [
        Markup.button.callback('Поменять бонус для пользователей', DATA_BONUS)
    ],
    [
        Markup.button.callback('Поменять бонус для рефералов', DATA_REF_BONUS)
    ],
    [
        Markup.button.callback('Аннулировать бонусы', DATA_CANCEL_BONUSES),
    ],
    [
        Markup.button.callback('Сделать админом', DATA_ADD_ADMIN),
    ],
    [
        Markup.button.callback('Поменять ссылку на отзывы', DATA_REVIEW_URL),
    ],
    [
        Markup.button.callback('Добавить реферал', DATA_REFERRAL),
    ],
    [
        Markup.button.callback('Статистика по рефералу', DATA_REFERRAL_COUNT)
    ],
    [
        Markup.button.callback('Рассылка', DATA_MAILING),
        Markup.button.callback('Список продуктов', `${DATA_LIST_PRODUCT} 0`),
    ],
    [
        Markup.button.callback('Выгрузка БД', DATA_GET_DB),
    ],

])

export const CANCEL_BUTTON = Markup.inlineKeyboard([
    [
        Markup.button.callback('Отмена 🚫', DATA_CANCEL),
    ],
])

export function getAddChannelButton(text = 'Добавить канал') {
    return Markup.inlineKeyboard([
        Markup.button.callback(text, DATA_ADD_CHANNEL)
    ])
}

export function getCancelButton(text = 'Отмена') {
    return Markup.inlineKeyboard([
        Markup.button.callback(text, DATA_CANCEL)
    ])
}


export const DATA_PHRASE_TYPE_PHOTO = 'photo'
export const DATA_PHRASE_TYPE_STICKER = 'sticker'
export const DATA_PHRASE_TYPE_GIF = 'gif'
