import { FastifyPluginAsyncJsonSchemaToTs } from "@fastify/type-provider-json-schema-to-ts";
import { idParamSchema } from "../../utils/reusedSchemas";
import { createProfileBodySchema, changeProfileBodySchema } from "./schema";
import type { ProfileEntity } from "../../utils/DB/entities/DBProfiles";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get("/", async function (request, reply): Promise<ProfileEntity[]> {
    const allProfiles = await fastify.db.profiles.findMany();
    return allProfiles;
  });

  fastify.get(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const getProfileById = await fastify.db.profiles.findOne({
        key: "id",
        equals: request.params.id,
      });
      if (getProfileById === null) {
        throw fastify.httpErrors.notFound("Profile is not founded!");
      }
      return getProfileById;
    }
  );

  fastify.post(
    "/",
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const newProfile = await fastify.db.profiles.create(request.body);
      return newProfile;
    }
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const deletedProfile = await fastify.db.profiles.delete(
        request.params.id
      );
      return deletedProfile;
    }
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const updatedProfile = await fastify.db.profiles.change(
        request.params.id,
        request.body
      );
      return updatedProfile;
    }
  );
};

export default plugin;
