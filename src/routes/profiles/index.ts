import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<ProfileEntity[]> {
    const profiles = await fastify.db.profiles.findMany();

    return profiles;
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const profileById = await fastify.db.profiles.findOne({
        key: 'id',
        equals: request.params.id,
      });

      if (profileById === null) {
        throw fastify.httpErrors.notFound('Profile is not founded!');
      }

      return profileById;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const memberTypeById = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: request.body.memberTypeId,
      });

      if (memberTypeById === null) {
        throw fastify.httpErrors.badRequest('Such member type is absent!');
      }

      if (
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          request.body.userId
        ) === false
      ) {
        throw fastify.httpErrors.badRequest('ID must be in uuid format!');
      }

      const profileById = await fastify.db.profiles.findOne({
        key: 'userId',
        equals: request.body.userId,
      });

      if (profileById) {
        throw fastify.httpErrors.badRequest('User already has a profile!');
      }

      const newProfile = await fastify.db.profiles.create(request.body);

      return newProfile;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const profileById = await fastify.db.profiles.findOne({
        key: 'id',
        equals: request.params.id,
      });

      if (profileById === null) {
        throw fastify.httpErrors.badRequest('You send incorrect data!');
      }

      const deletedProfile = await fastify.db.profiles.delete(
        request.params.id
      );

      return deletedProfile;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      if (
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          request.params.id
        ) === false
      ) {
        throw fastify.httpErrors.badRequest('ID must be in uuid format!');
      }

      const profileById = await fastify.db.profiles.findOne({
        key: 'id',
        equals: request.params.id,
      });

      if (profileById === null) {
        throw fastify.httpErrors.badRequest('Profile is not founded!');
      }

      const updatedProfile = await fastify.db.profiles.change(
        request.params.id,
        request.body
      );

      return updatedProfile;
    }
  );
};

export default plugin;
