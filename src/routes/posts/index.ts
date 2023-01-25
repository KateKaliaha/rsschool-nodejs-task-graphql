import { FastifyPluginAsyncJsonSchemaToTs } from "@fastify/type-provider-json-schema-to-ts";
import { idParamSchema } from "../../utils/reusedSchemas";
import { createPostBodySchema, changePostBodySchema } from "./schema";
import type { PostEntity } from "../../utils/DB/entities/DBPosts";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get("/", async function (request, reply): Promise<PostEntity[]> {
    const allPosts = await fastify.db.posts.findMany();
    return allPosts;
  });

  fastify.get(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const postById = await fastify.db.posts.findOne({
        key: "id",
        equals: request.params.id,
      });
      if (postById === null) {
        throw fastify.httpErrors.notFound("Post is not founded!");
      }
      return postById;
    }
  );

  fastify.post(
    "/",
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const newPost = await fastify.db.posts.create(request.body);
      return newPost;
    }
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const deletedPost = await fastify.db.posts.delete(request.params.id);
      return deletedPost;
    }
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const updatedPost = await fastify.db.posts.change(
        request.params.id,
        request.body
      );
      return updatedPost;
    }
  );
};

export default plugin;
