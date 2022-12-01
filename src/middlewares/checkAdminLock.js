import {isAdmin} from "../helpers/admin.js";

export default async function checkAdminLock(ctx, next) {
    let from = ctx?.update?.message?.from
    if (!from) {
        from = ctx?.update?.callback_query?.from
    }

    if (await isAdmin(from)) {
        return next()
    }
}
