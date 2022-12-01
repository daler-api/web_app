import {
    ADMIN_INLINE_KEYBOARD,
    CANCEL_BUTTON, DATA_CANCEL,
    DATA_MAILING_CANCEL, DATA_MAILING_CONFIRM,
} from "../utils/buttons/adminButtons.js";
import {Composer, Markup, Scenes} from "telegraf";
import {Order, Referral, Setting, User} from "../models/models.js";
import {sceneIds} from "../utils/consts.js";
import _ from "lodash";

export async function handleAdmin(ctx) {
    await ctx.reply('Привет админ', ADMIN_INLINE_KEYBOARD)
}

export async function handleAdminMenu(ctx) {
    await ctx.reply('Меню администратора', ADMIN_INLINE_KEYBOARD)
}

export async function handleDiscount(ctx) {
    try {
        await ctx.deleteMessage()
        await ctx.replyWithHTML('Введите размер скидки в % формате, например <b>"10"</b>.', CANCEL_BUTTON)
        await ctx.answerCbQuery()
        await ctx.scene.enter(sceneIds.admin.SCENE_ADD_DISCOUNT)
    } catch (e) {
        console.log(e)
    }
}

const DiscountStep = new Composer()
DiscountStep.on('text', async ctx => {
    try {

        const message = ctx.update.message

        if (_.toInteger(message.text) > 0 && _.toInteger(message.text) <= 100) {

            const result = await Setting.findAll({
                limit: 1,
                order: [['id', 'DESC']]
            })
                .then(function (obj) {
                    const first = _.first(obj);

                    if (first?.dataValues?.id) {
                        return first.update({
                            discount: _.toInteger(message.text)
                        });
                    }

                    return Setting.create({
                        discount: _.toInteger(message.text)
                    });

                })

            await ctx.scene.leave()
            await ctx.deleteMessage()
            await ctx.replyWithHTML(`✅ Изменения внесены! \n\nТеперь при совершении первой покупки скидка будет составлять ${result?.discount}%.`, ADMIN_INLINE_KEYBOARD)
        } else {
            await ctx.reply('Ведите число от 1 до 100!')
        }

    } catch (e) {
        console.log(e)
    }
})
export const sceneAddDiscount = new Scenes.WizardScene(sceneIds.admin.SCENE_ADD_DISCOUNT, DiscountStep)


export async function handleBonus(ctx) {
    try {
        await ctx.deleteMessage()
        await ctx.replyWithHTML('Введите размер начисляемых бонусов для пользователей в % формате, например <b>"20"</b>.', CANCEL_BUTTON)
        await ctx.answerCbQuery()
        await ctx.scene.enter(sceneIds.admin.SCENE_ADD_BONUS)
    } catch (e) {
        console.log(e)
    }
}

const BonusStep = new Composer()
BonusStep.on('text', async ctx => {
    try {

        const message = ctx.update.message

        if (_.toInteger(message.text) > 0 && _.toInteger(message.text) <= 100) {

            await Setting.findAll({
                limit: 1,
                order: [['id', 'DESC']]
            })
                .then(function (obj) {
                    const first = _.first(obj);

                    if (first?.dataValues?.id) {
                        return first.update({
                            bonus: _.toInteger(message.text)
                        });
                    }

                    return Setting.create({
                        bonus: _.toInteger(message.text)
                    });

                })

            await ctx.scene.leave()
            await ctx.deleteMessage()
            await ctx.replyWithHTML(`✅ Изменения внесены! \n\nТеперь при переходе по реф ссылке пользователю будут начисляться бонусы в размере ${_.toInteger(message.text)}% от его первой покупки.`, ADMIN_INLINE_KEYBOARD)
        } else {
            await ctx.reply('Ведите число от 1 до 100!')
        }

    } catch (e) {
        console.log(e)
        await ctx.reply('Ведите число от 1 до 100!')
    }
})
export const sceneAddBonus = new Scenes.WizardScene(sceneIds.admin.SCENE_ADD_BONUS, BonusStep)


export async function handleRefBonus(ctx) {
    try {
        await ctx.deleteMessage()
        await ctx.replyWithHTML('Введите размер начисляемых бонусов для рефералов в % формате, например <b>"20"</b>.', CANCEL_BUTTON)
        await ctx.answerCbQuery()
        await ctx.scene.enter(sceneIds.admin.SCENE_ADD_REF_BONUS)
    } catch (e) {
        console.log(e)
    }
}

const RefBonusStep = new Composer()
RefBonusStep.on('text', async ctx => {
    try {

        const message = ctx.update.message

        if (_.toInteger(message.text) > 0 && _.toInteger(message.text) <= 100) {

            await Setting.findAll({
                limit: 1,
                order: [['id', 'DESC']]
            })
                .then(function (obj) {
                    const first = _.first(obj);

                    if (first?.dataValues?.id) {
                        return first.update({
                            ref_bonus: _.toInteger(message.text)
                        });
                    }

                    return Setting.create({
                        ref_bonus: _.toInteger(message.text)
                    });

                })

            await ctx.scene.leave()
            await ctx.deleteMessage()
            await ctx.replyWithHTML(`✅ Изменения внесены! \n\nТеперь при переходе по реф ссылке рефералу будут начисляться бонусы в размере ${_.toInteger(message.text)}% от его первой покупки.`, ADMIN_INLINE_KEYBOARD)
        } else {
            await ctx.reply('Ведите число от 1 до 100!')
        }

    } catch (e) {
        console.log(e)
        await ctx.reply('Ведите число от 1 до 100!')
    }
})
export const sceneAddRefBonus = new Scenes.WizardScene(sceneIds.admin.SCENE_ADD_REF_BONUS, RefBonusStep)


export async function handleReferral(ctx) {
    try {
        await ctx.deleteMessage()
        await ctx.reply('Пожалуйста, отправьте ID пользователя, для которого хотите сгенерировать реферальную ссылку промоутера', CANCEL_BUTTON)
        await ctx.answerCbQuery()
        await ctx.scene.enter(sceneIds.admin.SCENE_ADD_REFERRAL)
    } catch (e) {
        console.log(e)
    }
}

const ReferralStep = new Composer()
ReferralStep.on('text', async ctx => {
    try {

        const message = ctx.update.message

        if (_.toInteger(message.text) > 0) {
            await ctx.scene.leave()
            await ctx.deleteMessage()

            const referral = await Referral.findOne({
                where: {user_id: _.toInteger(message.text)},
                raw: true
            })

            if (referral?.user_id) {
                await ctx.reply(`Реферал с таким ID: ${referral?.user_id} уже добавлен`, ADMIN_INLINE_KEYBOARD)
            } else {
                const created = await Referral.create({
                    user_id: _.toInteger(message.text),
                })
                await ctx.replyWithHTML(`Новый реферал добавлен! Ссылка: <a href="https://t.me/${process.env.BOT_USERNAME}?start=${created.user_id}">реферальная ссылка</a>`, Object.assign({}, ADMIN_INLINE_KEYBOARD, {
                    disable_web_page_preview: true
                }))
            }
        } else {
            await ctx.reply('Отправьте ID!')
        }

    } catch (e) {
        console.log(e)
        await ctx.reply('Отправьте ID!')
    }
})
export const sceneAddReferral = new Scenes.WizardScene(sceneIds.admin.SCENE_ADD_REFERRAL, ReferralStep)


export async function handleReferralCount(ctx) {
    try {
        await ctx.deleteMessage()
        await ctx.reply('Пожалуйста, отправьте ID пользователя, для которого хотите получить статистику', CANCEL_BUTTON)
        await ctx.answerCbQuery()
        await ctx.scene.enter(sceneIds.admin.SCENE_ADD_REFERRAL_COUNT)
    } catch (e) {
        console.log(e)
    }
}

const ReferralCountStep = new Composer()
ReferralCountStep.on('text', async ctx => {
    try {
        const message = ctx.update.message
        let totalPrice = 0

        if (_.toInteger(message.text) > 0) {
            await ctx.scene.leave()
            await ctx.deleteMessage()

            const user = await User.findOne({
                raw: true,
                where: {
                    user_id: _.toInteger(message.text),
                }
            })

            const orders = await Order.findAll({
                raw: true,
                where: {user_id: _.toInteger(message.text), isPayment: 1},
            }).then((orders) => {
                for (const key in orders) {
                    totalPrice += _.toInteger(orders[key]?.total_price) ?? 0
                }
                return {
                    totalPrice,
                    count: orders?.length
                }
            })

            await ctx.replyWithHTML(`Статистика по ${message.text}\n\n💫<b>Всего бонусов</b>: ${user?.bonus ?? 0}\n👜<b>Всего заказов</b>: ${orders?.count ?? 0} \n💰 Общая сумма заказов: ${totalPrice} руб`, ADMIN_INLINE_KEYBOARD)
        } else {
            await ctx.reply('Отправьте ID!')
        }
    } catch (e) {
        console.log(e);
    }
})
export const sceneAddReferralCount = new Scenes.WizardScene(sceneIds.admin.SCENE_ADD_REFERRAL_COUNT, ReferralCountStep)


export async function handleAddAdmin(ctx) {
    try {
        await ctx.deleteMessage()
        await ctx.reply('Пожалуйста, отправьте ID пользователя, которого хотите сделать админом', CANCEL_BUTTON)
        await ctx.answerCbQuery()
        await ctx.scene.enter(sceneIds.admin.SCENE_ADD_ADMIN)
    } catch (e) {
        console.log(e)
    }
}

const AddAdminStep = new Composer()
AddAdminStep.on('text', async ctx => {
    try {
        const message = ctx.update.message

        if (_.toInteger(message.text) > 0) {
            const user = await User.findOne({
                raw: true,
                where: {
                    user_id: _.toInteger(message.text)
                }
            })

            if (!user?.id) {
                return await ctx.reply('Пользователь не найден')
            }

            await ctx.scene.leave()
            await ctx.deleteMessage()

            await User.update({
                isAdmin: true
            }, {
                raw: true,
                where: {
                    user_id: _.toInteger(message.text),
                }
            })

            await ctx.reply(`Пользователь @${user?.username} стал админом`)

        } else {
            await ctx.reply('Отправьте ID!')
        }
    } catch (e) {
        console.log(e);
    }
})
export const sceneAddAdmin = new Scenes.WizardScene(sceneIds.admin.SCENE_ADD_ADMIN, AddAdminStep)


export async function handleCancelBonuses(ctx) {
    try {
        await ctx.deleteMessage()
        await ctx.reply('Пожалуйста, отправьте ID пользователя, для которого хотите аннулировать бонусы', CANCEL_BUTTON)
        await ctx.answerCbQuery()
        await ctx.scene.enter(sceneIds.admin.SCENE_CANCEL_BONUSES)
    } catch (e) {
        console.log(e)
    }
}

const CancelBonusesStep = new Composer()
CancelBonusesStep.on('text', async ctx => {
    try {
        const message = ctx.update.message
        if (_.toInteger(message.text) > 0) {
            await ctx.scene.leave()
            await ctx.deleteMessage()
            await User.update({
                    bonus: 0
                },
                {
                    raw: true,
                    where: {user_id: _.toInteger(message.text)}
                })

            await ctx.replyWithHTML(`По рефералке ID: ${_.toInteger(message.text)} аннулированы бонусы`, ADMIN_INLINE_KEYBOARD)
        } else {
            await ctx.reply('Отправьте ID!')
        }
    } catch (e) {
        console.log(e);
    }
})
export const sceneCancelBonus = new Scenes.WizardScene(sceneIds.admin.SCENE_CANCEL_BONUSES, CancelBonusesStep)


export async function handleReviewUrl(ctx) {
    try {
        await ctx.deleteMessage()
        await ctx.replyWithHTML('Отправьте ссылку на канал в формате, например https://t.me/muhomor3000', Object.assign({}, CANCEL_BUTTON, {
            disable_web_page_preview: true
        }))
        await ctx.answerCbQuery()
        await ctx.scene.enter(sceneIds.admin.SCENE_ADD_REVIEW_URL)
    } catch (e) {
        console.log(e)
    }
}

const ReviewUrlStep = new Composer()
ReviewUrlStep.on('text', async ctx => {
    try {

        const message = ctx.update.message

        if (message.text.startsWith('https://t.me/') || message.text().startsWith('https://telegram.me/')) {

            const result = await Setting.findAll({
                limit: 1,
                order: [['id', 'DESC']]
            })
                .then(function (obj) {
                    const first = _.first(obj);

                    if (first?.dataValues?.id) {
                        return first.update({
                            reviews_url: message.text.replace(' ', '')
                        });
                    }

                    return Setting.create({
                        bonus: message.text.replace(' ', '')
                    });

                })

            await ctx.scene.leave()
            await ctx.deleteMessage()
            await ctx.replyWithHTML(`✅ Изменения внесены! \n\nТеперь при нажатии кнопки отзывы пользователь перейдёт <a href="${result?.reviews_url}">сюда</a>.`, Object.assign({}, ADMIN_INLINE_KEYBOARD, {
                disable_web_page_preview: true
            }))
        } else {
            await ctx.reply('Отправьте корректную ссылку. Пример: https://t.me/muhomor3000!', {
                disable_web_page_preview: true
            })
        }

    } catch (e) {
        console.log(e)
        await ctx.reply('Отправьте корректную ссылку. Пример: https://t.me/muhomor3000!', {
            disable_web_page_preview: true
        })
    }
})
export const sceneAddReviewUrl = new Scenes.WizardScene(sceneIds.admin.SCENE_ADD_REVIEW_URL, ReviewUrlStep)


export async function handleMailing(ctx) {
    try {
        await ctx.deleteMessage()
        await ctx.answerCbQuery()
        await ctx.scene.enter(sceneIds.admin.SCENE_MAILING)
    } catch (e) {
        console.log(e)
    }
}

export const sceneAddMailing = new Scenes.WizardScene(sceneIds.admin.SCENE_MAILING, (ctx) => {
        ctx.replyWithHTML('Отправьте сообщение для рассылки.', CANCEL_BUTTON)
        return ctx.wizard.next()
    },
    async (ctx) => {
        try {
            if (ctx.update?.callback_query?.data === DATA_MAILING_CONFIRM) {
                try {
                    async function waitedProcess() {

                        const users = await User.findAll({
                            where: {active: true},
                            raw: true
                        })
                        const updateMsg = await ctx.replyWithHTML(`🕘 <b>Рассылается</b> 0 / ${users.length}...`)

                        await ctx.deleteMessage()
                        await ctx.replyWithHTML(`🕘 <b>Рассылается</b> 0 / ${users.length}...`)

                        const result = await callMailing({
                            users,
                            ctx,
                            isCopy: false,
                            myMessage: ctx.session.mailingText,
                            updateMsg
                        })

                        await ctx.replyWithHTML(`✅ <b>Рассылка завершена\n\nУдалось отправить:</b> ${result?.success}<b>\nНе удалось:</b>${result?.error}\n\n❗️ Тем, кому не удалось отправить, это пользователи, которые остановили бота!`, ADMIN_INLINE_KEYBOARD)

                    }

                    setTimeout(async () => await waitedProcess(), 0)

                } catch (e) {
                    console.log(e)
                    await ctx.reply('Что-то пошло не так с рассылкой! Обратитесь к разработчику.')
                }

                return await ctx.scene.leave()

            } else if (ctx.update?.callback_query?.data === DATA_MAILING_CANCEL) {
                await ctx.deleteMessage()
                return await ctx.reply('Отправьте текст рассылки', CANCEL_BUTTON)
            } else if (ctx.update?.callback_query?.data === DATA_CANCEL) {
                await handleCancel(ctx)
                return await ctx.scene.leave()
            }

            ctx.session.mailingText = ctx.update?.message?.text
            await ctx.reply(JSON.stringify(ctx.update))
            await ctx.reply(`Вы уверены, что хотите отправить рассылку со следующим текстом: \n\n${ctx.session.mailingText}\n\nНажмите "✅ ДА". чтобы запустить рассылку или "🔙 Назад", чтобы внести изменения`, Markup.inlineKeyboard([
                [
                    Markup.button.callback('✅ ДА', DATA_MAILING_CONFIRM),
                    Markup.button.callback('🔙 Назад', DATA_MAILING_CANCEL),
                ],
            ]))
        } catch (e) {
            console.log(e)
        }
    })


export async function handleCancel(ctx) {
    try {
        await ctx.deleteMessage()
        await ctx.scene.leave()
        await ctx.reply('Отменено.', ADMIN_INLINE_KEYBOARD)
    } catch (e) {
        console.log(e)
    }
}

export async function callMailing(params) {
    try {

        let {users, message, ctx, isCopy = true, myMessage = '', updateMsg} = params

        const resultUsers = [[]]
        let success = 0
        let error = 0

        let activeUsersIndex = 0

        users.forEach((user) => {

            const last = resultUsers[resultUsers.length - 1]

            if (last.length < 29) {
                last.push(user?.user_id)
            } else {
                resultUsers.push([user?.user_id])
            }

        })

        async function step() {

            const usrs = resultUsers[activeUsersIndex++]

            if (!usrs || usrs.length <= 0) {
                return true
            }

            await Promise.all(
                usrs.map(async (userId) => {

                    if (isCopy) {
                        try {
                            await ctx.copyMessage(userId)
                            success++
                        } catch (e) {
                            error++
                        }
                    } else {
                        try {
                            if (myMessage !== '') {
                                await ctx.telegram.sendMessage(userId, myMessage, {parse_mode: 'HTML', ...message?.extra})
                            } else {
                                await ctx.telegram.sendMessage(userId, message.text, {parse_mode: 'HTML', ...message?.extra})
                            }
                            success++
                        } catch (e) {
                            error++
                        }
                    }

                })
            )

            return new Promise((resolve) => {

                setTimeout(async () => {
                    try {
                        await ctx.telegram.editMessageText(updateMsg.chat.id, updateMsg.message_id, updateMsg.message_id, `🕘 Рассылается ${success+error} / ${users.length}...`,)
                    } catch (e) {
                        console.log(e)
                    }
                    resolve(await step())

                }, 1000)

            })
        }

        await step()
        return {
            success,
            error
        }
    } catch (e) {
        console.error(e)
    }
}
