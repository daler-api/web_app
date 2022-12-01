import {
    ADMIN_INLINE_KEYBOARD, CANCEL_BUTTON,
    DATA_ADD_PRODUCT, DATA_ADMIN, DATA_CANCEL,
    DATA_EDIT_PRODUCT, DATA_EDIT_PRODUCT_ATTRIBUTE,
    DATA_LIST_PRODUCT,
    DATA_REMOVE_CONFIRM_PRODUCT,
    DATA_REMOVE_PRODUCT
} from "../utils/buttons/adminButtons.js"
import {Composer, Markup, Scenes} from "telegraf"
import {Basket, Product} from "../models/models.js"
import {sceneIds} from "../utils/consts.js";
import axios from "axios";
import {createWriteStream, unlink} from "fs";
import _ from "lodash";
import {handleCancel} from "./handleAdmin.js";

const paginate = (query, {page, pageSize}) => {
    const offset = page * pageSize;
    const limit = pageSize;

    return {
        ...query,
        offset,
        limit,
    };
};

export async function handleProductList(ctx) {
    try {
        ctx.deleteMessage()
        let page = _.toInteger(ctx?.update?.callback_query?.data?.replace(`${DATA_LIST_PRODUCT} `, ''))

        ctx.session.page = page < 0 ? 0 : page

        const userPage = ctx.session.page + 1

        const keyboards = Markup.inlineKeyboard([])

        await Product.findAll(paginate({raw: true, order: [['id', 'DESC']]}, {page: ctx.session.page, pageSize: 10}))
            .then((products) => {

                products.map((product) => {
                    keyboards?.reply_markup?.inline_keyboard?.push([
                        Markup.button.callback(product?.name ?? `Не задано №${product?.id}`, `${DATA_EDIT_PRODUCT} ${product?.id}`),
                    ])
                })

                keyboards?.reply_markup?.inline_keyboard?.push([
                    Markup.button.callback('🔙 Назад', `${DATA_LIST_PRODUCT} ${page -= 1}`),
                    Markup.button.callback('Вперёд 🔜', `${DATA_LIST_PRODUCT} ${products.length >= 10 ? ctx.session.page += 1 : ctx.session.page}`),
                ])

            })

        keyboards?.reply_markup?.inline_keyboard?.push([
            Markup.button.callback('➕ Добавить продукт', DATA_ADD_PRODUCT),
            Markup.button.callback('Меню администратора', DATA_ADMIN),
        ])

        return ctx.reply(`Список продуктов (страница № ${userPage})`, keyboards)
    } catch (e) {
        console.log(e)
    }
}

export async function handleAddProduct(ctx) {
    try {
        await ctx.deleteMessage()
        await ctx.answerCbQuery()
        await ctx.scene.enter(sceneIds.admin.SCENE_ADD_PRODUCT)
    } catch (e) {
        console.log(e)
    }

}

export const sceneAddProduct = new Scenes.WizardScene(sceneIds.admin.SCENE_ADD_PRODUCT,
    async (ctx) => {
        try {
            await ctx.reply('Отправьте название продукта.', CANCEL_BUTTON)
            return ctx.wizard.next();
        } catch (e) {
            console.log(e)
        }
    },
    async (ctx) => {
        try {
            const regEx = new RegExp(/^[-a-zA-Z0-9\u0410-\u044F `]+$/)

            if (ctx.update?.message?.text) {
                ctx.session.productName = ctx.update?.message?.text
                await ctx.reply('Отправьте цену продукта', CANCEL_BUTTON)
                return ctx.wizard.next()
            }
        } catch (e) {
            console.log(e)
        }
    },
    async (ctx) => {
        try {
            if (_.toInteger(ctx.update?.message?.text) > 99 && _.toInteger(ctx.update?.message?.text) <= 1000000000) {
                ctx.session.productPrice = _.toInteger(ctx.update.message.text)
                await ctx.reply('Отправьте фотографию продукта', CANCEL_BUTTON)
                return ctx.wizard.next()
            } else if (ctx.update?.callback_query?.data === DATA_CANCEL) {
                await handleCancel(ctx)
            } else {
                await ctx.reply('Введите цифру например: от 100 до 1млрд рублей', CANCEL_BUTTON)
            }
        } catch (e) {
            console.log(e)
        }
    },
    async (ctx) => {
        try {
            if (
                ctx.update?.message?.photo?.length > 0 ||
                ['image/png', 'image/jpg', 'image/jpeg'].includes(ctx.update?.message?.document?.mime_type) ||
                ctx.update?.message?.sticker?.file_unique_id
            ) {
                //png/jpeg/not optimize v/webp
                ctx.session.photo = _.last(ctx?.update?.message?.photo) || ctx.update?.message?.document || ctx.update?.message?.sticker

                const {file_id: fileId} = ctx.session.photo
                const {href: fileUrl} = await ctx.telegram.getFileLink(fileId)
                const mimeType = fileUrl.split('.')

                if (_.last(mimeType) === 'tgs') {
                    await ctx.reply('Отправьте фотографию.', CANCEL_BUTTON)
                } else if (ctx.update?.callback_query?.data === DATA_CANCEL) {
                    await handleCancel(ctx)
                } else {
                    await axios.get(fileUrl, {
                        responseType: "stream"
                    }).then((response) => {

                        const photoName = `${new Date().getTime()}.${_.last(mimeType)}`

                        const writer = createWriteStream(`public/products/${photoName}`)

                        new Promise((resolve, reject) => {
                            response.data.pipe(writer)

                            let error = null

                            writer.on('error', err => {
                                error = err;
                                writer.close();
                                reject(err);
                                ctx.reply('Не удалось загрузить фотографию. Попробуйте отправить другую', CANCEL_BUTTON)
                            })
                            writer.on('close', async () => {
                                if (!error) {
                                    resolve(true);
                                    await Product.create({
                                        name: ctx.session.productName,
                                        price: ctx.session.productPrice,
                                        photo: photoName,
                                    })

                                    await ctx.replyWithHTML(`Товар <b>${ctx.session.productName}</b> c ценой в <b>${ctx.session.productPrice}</b> руб добавлен`, ADMIN_INLINE_KEYBOARD)
                                    return ctx.scene.leave()
                                }
                            })

                        })

                    })

                }
            } else if (ctx.update?.callback_query?.data === DATA_CANCEL) {
                await handleCancel(ctx)
            } else {
                await ctx.reply('Отправьте фотографию.', CANCEL_BUTTON)
            }
        } catch (e) {
            console.log(e)
        }
    }
)


export async function handleEditProduct(ctx) {
    try {
        ctx.deleteMessage()
        const id = _.toInteger(ctx?.update?.callback_query?.data?.replace(`${DATA_EDIT_PRODUCT} `, ''))
        const product = await Product.findOne({
            raw: true,
            where: {id}
        })

        return product?.id !== undefined ? await editProductButtons(ctx, product) : ctx.reply('Продукт не найден!')
    } catch (e) {
        console.log(e)
    }
}


export async function handleEditProductAttribute(ctx) {
    try {

        await ctx.answerCbQuery()

        const [type, id] = ctx?.update?.callback_query?.data?.replace(`${DATA_EDIT_PRODUCT_ATTRIBUTE} `, '')?.split('_')

        ctx.session.editProduct = {
            type,
            id
        }

        await ctx.deleteMessage()

        if (type === 'name') {
            await ctx.replyWithHTML('Отправьте название продукта', CANCEL_BUTTON)
        } else if (type === 'price') {
            await ctx.replyWithHTML('Отправьте цену продукта', CANCEL_BUTTON)
        } else if (type === 'photo') {
            await ctx.replyWithHTML('Отправьте фотографию продукта', CANCEL_BUTTON)
        }

        await ctx.scene.enter(sceneIds.admin.SCENE_EDIT_PRODUCT)
    } catch (e) {
        console.log(e)
    }

}

const EditProductStep = new Composer()
EditProductStep.on('text', await editProductScene)
EditProductStep.on('photo', await editProductScene)
EditProductStep.on('sticker', await editProductScene)

export async function editProductScene(ctx) {
    try {
        if (ctx.session.editProduct.type === 'name') {
            await editProductName(ctx)
        } else if (ctx.session.editProduct.type === 'price') {
            await editProductPrice(ctx)
        } else if (ctx.session.editProduct.type === 'photo') {
            await editProductPhoto(ctx)
        }
    } catch (e) {
        console.log(e)
    }
}

export const sceneEditProduct = new Scenes.WizardScene(sceneIds.admin.SCENE_EDIT_PRODUCT, EditProductStep)

export async function editProductName(ctx) {
    const regEx = new RegExp(/[-a-zA-Z0-9\u0410-\u044F`]/)

    if (ctx.update?.message?.text && regEx.exec(ctx.update?.message?.text)) {

        await Product.update({
            name: ctx.update.message.text
        }, {
            raw: true,
            where: {id: _.toInteger(ctx.session.editProduct.id)}
        })

        await ctx.scene.leave()
        const product = await Product.findOne({
            raw: true,
            where: {id: _.toInteger(ctx.session.editProduct.id)}
        })
        return await editProductButtons(ctx, product)
    } else if (ctx.update?.callback_query?.data === DATA_CANCEL) {
        await ctx.scene.leave()
        const product = await Product.findOne({
            raw: true,
            where: {id: _.toInteger(ctx.session.editProduct.id)}
        })
        return await editProductButtons(ctx, product)
    } else {
        return await ctx.reply('Отправьте правильное название продукта.', CANCEL_BUTTON)
    }

}

export async function editProductPrice(ctx) {

    if (_.toInteger(ctx.update?.message?.text) > 99 && _.toInteger(ctx.update?.message?.text) <= 1000000000) {

        await Product.update({
            price: _.toInteger(ctx.update.message.text)
        }, {
            raw: true,
            where: {id: _.toInteger(ctx.session.editProduct.id)}
        })
        await ctx.scene.leave()
        const product = await Product.findOne({
            raw: true,
            where: {id: _.toInteger(ctx.session.editProduct.id)}
        })
        return await editProductButtons(ctx, product)

    } else if (ctx.update?.callback_query?.data === DATA_CANCEL) {
        await ctx.scene.leave()
        const product = await Product.findOne({
            raw: true,
            where: {id: _.toInteger(ctx.session.editProduct.id)}
        })
        return await editProductButtons(ctx, product)
    } else {
        return await ctx.reply('Введите цифру например: от 100 до 1млрд рублей', CANCEL_BUTTON)
    }

}

export async function editProductPhoto(ctx) {
   try {
       if (
           ctx.update?.message?.photo?.length > 0 ||
           ['image/png', 'image/jpg', 'image/jpeg'].includes(ctx.update?.message?.document?.mime_type) ||
           ctx.update?.message?.sticker?.file_unique_id
       ) {

           ctx.session.photo = _.last(ctx?.update?.message?.photo) || ctx.update?.message?.document || ctx.update?.message?.sticker

           const {file_id: fileId} = ctx.session.photo
           const {href: fileUrl} = await ctx.telegram.getFileLink(fileId)
           const mimeType = fileUrl.split('.')

           if (_.last(mimeType) === 'tgs') {
               return await ctx.reply('Отправьте фотографию.', CANCEL_BUTTON)
           } else if (ctx.update?.callback_query?.data === DATA_CANCEL) {
               return await handleCancel(ctx)
           } else {
               await axios.get(fileUrl, {
                   responseType: "stream"
               }).then((response) => {

                   const photoName = `${new Date().getTime()}.${_.last(mimeType)}`

                   const writer = createWriteStream(`public/products/${photoName}`)

                   new Promise((resolve, reject) => {
                       response.data.pipe(writer)

                       let error = null

                       writer.on('error', async err => {
                           error = err;
                           writer.close();
                           reject(err);
                           return await ctx.reply('Не удалось загрузить фотографию. Попробуйте отправить другую', CANCEL_BUTTON)
                       })
                       writer.on('close', async () => {
                           if (!error) {
                               resolve(true);
                               await ctx.scene.leave()
                               await Product.update({
                                   photo: photoName,
                               }, {
                                   where: {id: _.toInteger(ctx.session.editProduct.id)}
                               })
                               const product = await Product.findOne({
                                   raw: true,
                                   where: {id: _.toInteger(ctx.session.editProduct.id)}
                               })
                               return await editProductButtons(ctx, product)
                           }
                       })

                   })

               })

           }
       } else if (ctx.update?.callback_query?.data === DATA_CANCEL) {
           await ctx.scene.leave()
           const product = await Product.findOne({
               raw: true,
               where: {id: _.toInteger(ctx.session.editProduct.id)}
           })
           return await editProductButtons(ctx, product)
       } else {
           return await ctx.reply('Отправьте фотографию.', CANCEL_BUTTON)
       }
   } catch (e) {
       console.log(e)
   }
}

export async function editProductButtons(ctx, product) {
    try {
        return await ctx.replyWithMarkdown(`Изменить/Удалить продукт\n\n<b>${product?.name ?? product?.id}, ${product?.price ?? 0} руб</b>`, Markup.inlineKeyboard([
            [
                Markup.button.callback('Изменить название', `${DATA_EDIT_PRODUCT_ATTRIBUTE} name_${product?.id}`),
            ],
            [
                Markup.button.callback('Изменить цену', `${DATA_EDIT_PRODUCT_ATTRIBUTE} price_${product?.id}`),
            ],
            [
                Markup.button.callback('Изменить фотографию', `${DATA_EDIT_PRODUCT_ATTRIBUTE} photo_${product?.id}`),
            ],
            [
                Markup.button.callback('Удалить', `${DATA_REMOVE_PRODUCT} ${product?.id}`),
            ],
            [
                Markup.button.callback('Меню администратора', DATA_ADMIN),
            ]
        ]))
    } catch (e) {
        console.log(e)
    }
}

export async function handleRemoveProduct(ctx) {
    try {
        const id = _.toInteger(ctx?.update?.callback_query?.data?.replace(`${DATA_REMOVE_PRODUCT} `, ''))

        const product = await Product.findOne({
            raw: true,
            where: {id}
        })

        const photoName = product?.photo

        const destoryProduct = await Product.destroy({
            where: {id}
        })

        if (destoryProduct) {
            await unlink(`public/products/${photoName}`, (e) => {
                console.log(e)
            })
            await ctx.deleteMessage()
            await ctx.reply('Товар удален!')
        } else {
            await ctx.reply('Не удалось удалить товар.')
        }

    } catch (e) {
        console.log(e)
        await ctx.reply('Товар не найден.')
    }
}

export async function handleRemoveProductConfirm(ctx) {
    try {
        const id = _.toInteger(ctx?.update?.callback_query?.data?.replace(`${DATA_REMOVE_CONFIRM_PRODUCT} `, ''))

        const product = await Product.findOne({
            raw: true,
            where: {id}
        })

        const photoName = product?.photo

        await Basket.destroy({
            where: {
                product_id: product?.id
            }
        })

        const destroyProduct = await Product.destroy({
            where: {id}
        })

        if (destroyProduct) {
            await unlink(`public/products/${photoName}`, (e) => {
                console.log(e)
            })
            await ctx.deleteMessage()
            await ctx.reply('Товар удален!')
        } else {
            await ctx.reply('Не удалось удалить товар.')
        }

    } catch (e) {
        console.log(e)
        await ctx.reply('Не удалось удалить товар.')
    }
}
