import sequelize from '../db.js'
import {DataTypes} from 'sequelize'

export const User = sequelize.define('user', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    user_id: {type: DataTypes.BIGINT, unique: true},
    username: {type: DataTypes.STRING(50), unique: true},
    first_name: {type: DataTypes.STRING},
    last_name: {type: DataTypes.STRING},
    language_code: {type: DataTypes.STRING(5)},
    referral: {type: DataTypes.BIGINT, defaultValue: 0},
    gender: {type: DataTypes.STRING},
    active: {type: DataTypes.BOOLEAN, defaultValue: true},
    bonus: {type: DataTypes.BIGINT, defaultValue: 0},
    payment_expired_at: {type: DataTypes.BIGINT, defaultValue: null},
    createdAt: {type: DataTypes.BIGINT, defaultValue: new Date().getTime()},
    isAdmin: {type: DataTypes.BOOLEAN, defaultValue: false},
}, {
    scopes: {
        active: {
            where: {active: true}
        },
    }
})

export const Channel = sequelize.define('channel', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING},
    chat: {type: DataTypes.STRING(50), unique: true},
    link: {type: DataTypes.STRING},
    active: {type: DataTypes.BOOLEAN, defaultValue: true},
})

export const PaymentLog = sequelize.define('payment_log', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    user_id: {type: DataTypes.BIGINT},
    uuid: {type: DataTypes.STRING},
    entity: {type: DataTypes.STRING},
    status: {type: DataTypes.STRING},
    data: {type: DataTypes.JSON},
})

export const Setting = sequelize.define('settings', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    discount: {type: DataTypes.INTEGER, defaultValue: 10},
    bonus: {type: DataTypes.INTEGER, defaultValue: 10},
    ref_bonus: {type: DataTypes.INTEGER, defaultValue: 10},
    reviews_url: {type: DataTypes.STRING, defaultValue: 'https://t.me/muhomor3000'},
}, {
    timestamps: false,
})

export const Order = sequelize.define('orders', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    queryId: {type: DataTypes.STRING},
    description: {type: DataTypes.TEXT},
    user_id: {type: DataTypes.BIGINT, defaultValue: null},
    total_price: {type: DataTypes.BIGINT, defaultValue: 0},
    referral: {type: DataTypes.BIGINT, defaultValue: null},
    bonus: {type: DataTypes.BIGINT, defaultValue: null},
    address: {type: DataTypes.STRING},
    contact: {type: DataTypes.STRING},
    phone: {type: DataTypes.STRING},
    isPayment: {type: DataTypes.INTEGER, defaultValue: 0},
    chargeId: {type: DataTypes.STRING, defaultValue: null},
})

export const Product = sequelize.define('products', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING},
    photo: {type: DataTypes.STRING},
    price: {type: DataTypes.BIGINT},
})

export const Basket = sequelize.define('baskets', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    product_id: {type: DataTypes.BIGINT, defaultValue: null},
    count: {type: DataTypes.BIGINT, defaultValue: 0},
    order_id: {type: DataTypes.BIGINT, defaultValue: null},
    user_id: {type: DataTypes.BIGINT, defaultValue: null},

})

export const Referral = sequelize.define('referrals', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    user_id: {type: DataTypes.BIGINT, unique: true},
    before: {type: DataTypes.INTEGER, defaultValue: 0},
    process: {type: DataTypes.INTEGER, defaultValue: 0},
    after: {type: DataTypes.INTEGER, defaultValue: 0},
    count: {type: DataTypes.INTEGER, defaultValue: 0},
}, {
    timestamps: false,
})

export const Queue = sequelize.define('queue', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    chatId: {type: DataTypes.STRING},
}, {
    freezeTableName: true,
    timestamps: false,
})
