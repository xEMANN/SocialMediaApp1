import { CreateOptions, HydratedDocument, MongooseUpdateQueryOptions, PopulateOptions, Types, Model, UpdateQuery, ProjectionType, QueryOptions, QueryFilter, DeleteResult} from "mongoose";

export abstract class DatabaseRepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) { }

  async create({
    data,
    options,
  }: {
    data: Partial<TDocument>[];
    options?: CreateOptions;
  }): Promise<HydratedDocument<TDocument>[] | undefined> {
    return await this.model.create(data as any, options);
  }

  async insertMany({
    data,
  }: {
    data: Partial<TDocument>[];
    options?: CreateOptions & { lean?: boolean };
  }): Promise<HydratedDocument<TDocument>[]> {

    return await this.model.insertMany(data) as unknown as HydratedDocument<TDocument>[];
  }

  async find({
    filter,
    select,
    options,
}: {
    filter?: QueryFilter<TDocument>;
    select?: ProjectionType<TDocument> | null;
    options?: QueryOptions<TDocument> | null;
}): Promise<any[] | HydratedDocument<TDocument>[] | []> {
    const doc = this.model.find(filter || {}).select(select || "");

    if (options?.populate) {
        doc.populate(options.populate as PopulateOptions[]);
    }

    if (options?.lean) {
        doc.lean(options.lean);
    }

    return await doc.exec();
  }

  async paginate({
    filter = {},
    select = {},
    options = {},
    page = 1,
    size = 5,
 }: {
    filter?: QueryFilter<TDocument>;
    select?: ProjectionType<TDocument> | undefined;
    options?: QueryOptions<TDocument> | undefined;
    page?: number;
    size?: number;
 }) {
    const currentPage = Math.floor(page < 1 ? 1 : page);
    const limit = Math.floor(size < 1 || !size ? 5 : size);
    const skip = (currentPage - 1) * limit;

    const results = await this.find({
        filter,
        select,
        options: { ...options, skip, limit }
    });

    const docsCount = await this.model.countDocuments(filter as any);
    const pages = Math.ceil(docsCount / limit);

    return {
        docsCount,
        pages,
        limit,
        currentPage,
        results,
    };
  }

  async findOne({
    filter,
    select,
    options,
  }: {
    filter?: QueryFilter<TDocument>;
    select?: ProjectionType<TDocument> | null;
    options?: QueryOptions<TDocument> | null;
  }) {
    const doc = this.model.findOne(filter as any).select(select || "");
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }
    return await doc.exec();
  }

  async findOneAndUpdate({
    filter,
    update,
    options,
}: {
    filter: QueryFilter<TDocument>;
    update: UpdateQuery<TDocument>;
    options?: QueryOptions<TDocument> | null;
}): Promise<any | HydratedDocument<TDocument> | null> {
    const doc = this.model.findOneAndUpdate(filter, update, { ...options, new: true });
    
    if (options?.populate) {
        doc.populate(options.populate as PopulateOptions[]);
    }
    
    if (options?.lean) {
        doc.lean(options.lean);
    }
    
    return await doc.exec();
 }

  async findById({
    id,
    select,
    options,
  }: {
    id?: Types.ObjectId;
    select?: ProjectionType<TDocument> | null;
    options?: QueryOptions<TDocument> | null;
  }): Promise<any | HydratedDocument<TDocument> | null> {
    const doc = this.model.findById(id).select(select || "");
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }
    if (options?.lean) {
      doc.lean(options.lean);
    }
    return await doc.exec();
  }

  async updateOne({
    filter,
    update,
    options,
  }: {
    filter?: QueryFilter<TDocument>;
    update?: UpdateQuery<TDocument>;
    options?: MongooseUpdateQueryOptions<TDocument> | null;
  }) {
    return await this.model.updateOne(
      filter as any,
      { ...(update as any), $inc: { __v: 1 } },
      options as any
    );
  }

  async deleteOne({
    filter,
  }: {
    filter?: QueryFilter<TDocument>;
  }): Promise<DeleteResult> {
    return await this.model.deleteOne(filter);
  }

   async deleteMany({
    filter,
  }: {
    filter?: QueryFilter<TDocument>;
  }): Promise<DeleteResult> {
    return await this.model.deleteMany(filter);
  }

   async findOneAndDelete({
    filter,
  }: {
    filter?: QueryFilter<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> {
    return await this.model.findOneAndDelete(filter);
  }
}
