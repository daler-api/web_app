import {Channel} from "../models/models.js";

export async function getChannelsList() {
    return await Channel.findAll({raw: true})
}