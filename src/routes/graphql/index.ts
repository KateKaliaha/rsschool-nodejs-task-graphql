import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphql, parse, validate } from 'graphql';
import { schema } from './helpers/requestSchema';
import { graphqlBodySchema } from './schema';
import * as depthLimit from 'graphql-depth-limit';

const DEPTH = 6;

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.post(
    '/',
    {
      schema: {
        body: graphqlBodySchema,
      },
    },
    async function (request, reply) {
      if (!request.body.query) throw fastify.httpErrors.badRequest();

      const result = validate(schema, parse(request.body.query), [
        depthLimit(DEPTH),
      ]);

      if (result.length) {
        reply.send({ errors: result });
      }

      return await graphql({
        schema: schema,
        source: String(request.body.query),
        variableValues: request.body.variables,
        contextValue: fastify,
      });
    }
  );
};

export default plugin;
