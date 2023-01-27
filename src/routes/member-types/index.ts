import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    MemberTypeEntity[]
  > {
    const memberTypes = await fastify.db.memberTypes.findMany();
    return memberTypes;
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const memberTypeById = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: request.params.id,
      });

      if (memberTypeById === null) {
        throw fastify.httpErrors.notFound('Member type is not founded!');
      }

      return memberTypeById;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const memberTypeById = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: request.params.id,
      });

      if (memberTypeById === null) {
        throw fastify.httpErrors.badRequest('You use a wrong id!');
      }

      const updatedMemberType = await fastify.db.memberTypes.change(
        request.params.id,
        request.body
      );

      return updatedMemberType;
    }
  );
};

export default plugin;
