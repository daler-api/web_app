import {Markup} from "telegraf";

export const DATA_CABINET                               = 'DATA_CABINET'
export const DATA_PARTNER                               = 'DATA_PARTNER'
export const DATA_MENU                                  = 'DATA_MENU'
export const DATA_BONUS_CONFIRM                         = 'DATA_BONUS_CONFIRM'
export const DATA_BONUS_CANCEL                          = 'DATA_BONUS_CANCEL'
export const PARTNER_COMMAND                            = 'partner'
export const CABINET_COMMAND                            = 'cabinet'
export const MENU_COMMAND                               = 'menu'
export const REF_COMMAND                                = 'ref'
export const DATA_PAYMENT_CONFIRM_BACK_MENU             = 'DATA_PAYMENT_CONFIRM_BACK_MENU'

export const addBackButton = Markup.inlineKeyboard([
    [
        Markup.button.callback('🔙 Назад', DATA_MENU),
    ],
]);

export const addBackPaymentButton = Markup.inlineKeyboard([
    [
        Markup.button.callback('🔙 Назад', DATA_PAYMENT_CONFIRM_BACK_MENU),
    ],
]);
