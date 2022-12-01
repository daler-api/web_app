import {User} from "../models/models.js";
import _ from "lodash";

export async function isAdmin(from) {
    const user = await User.findOne({
        raw:true,
        where: { user_id: _.toInteger(from.id) }
    })

    if (!user?.user_id && from?.id) {
        await User.create({
            user_id: _.toInteger(from.id),
            username: from.username,
            first_name: from.first_name,
            last_name: from.last_name,
            language_code: from.language_code,
            active: true,
            isAdmin: false
        })
    }

    return user?.isAdmin
}

