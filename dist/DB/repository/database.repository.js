"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, options, }) {
        return await this.model.create(data, options);
    }
    async insertMany({ data, }) {
        return await this.model.insertMany(data);
    }
    async find({ filter, select, options, }) {
        const doc = this.model.find(filter || {}).select(select || "");
        if (options?.populate) {
            doc.populate(options.populate);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    async paginate({ filter = {}, select = {}, options = {}, page = 1, size = 5, }) {
        const currentPage = Math.floor(page < 1 ? 1 : page);
        const limit = Math.floor(size < 1 || !size ? 5 : size);
        const skip = (currentPage - 1) * limit;
        const results = await this.find({
            filter,
            select,
            options: { ...options, skip, limit }
        });
        const docsCount = await this.model.countDocuments(filter);
        const pages = Math.ceil(docsCount / limit);
        return {
            docsCount,
            pages,
            limit,
            currentPage,
            results,
        };
    }
    async findOne({ filter, select, options, }) {
        const doc = this.model.findOne(filter).select(select || "");
        if (options?.populate) {
            doc.populate(options.populate);
        }
        return await doc.exec();
    }
    async findOneAndUpdate({ filter, update, options, }) {
        const doc = this.model.findOneAndUpdate(filter, update, { ...options, new: true });
        if (options?.populate) {
            doc.populate(options.populate);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    async findById({ id, select, options, }) {
        const doc = this.model.findById(id).select(select || "");
        if (options?.populate) {
            doc.populate(options.populate);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    async updateOne({ filter, update, options, }) {
        return await this.model.updateOne(filter, { ...update, $inc: { __v: 1 } }, options);
    }
    async deleteOne({ filter, }) {
        return await this.model.deleteOne(filter);
    }
    async deleteMany({ filter, }) {
        return await this.model.deleteMany(filter);
    }
    async findOneAndDelete({ filter, }) {
        return await this.model.findOneAndDelete(filter);
    }
}
exports.DatabaseRepository = DatabaseRepository;
