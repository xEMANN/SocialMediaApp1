"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendRepository = void 0;
const database_repository_1 = require("./database.repository");
class FriendRepository extends database_repository_1.DatabaseRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
    async findByJti(jti) {
        return this.model.findOne({ jti }).exec();
    }
}
exports.FriendRepository = FriendRepository;
