import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    const users = await fastify.db.users.findMany();

    return users;
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const userById = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id,
      });

      if (userById === null) {
        throw fastify.httpErrors.notFound('User is not founded!');
      }

      return userById;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const newUser = await fastify.db.users.create(request.body);

      return newUser;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      if (
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          request.params.id
        ) === false
      ) {
        throw fastify.httpErrors.badRequest('ID must be in uuid format!');
      }

      const userById = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id,
      });

      if (userById === null) {
        throw fastify.httpErrors.notFound('User is not founded!');
      }

      const subscribes = await fastify.db.users.findMany({
        key: 'subscribedToUserIds',
        inArray: request.params.id,
      });

      subscribes.forEach(async (subscribe) => {
        const newSubscribe = subscribe.subscribedToUserIds.filter(
          (sub) => sub !== request.params.id
        );
        await fastify.db.users.change(subscribe.id, {
          subscribedToUserIds: [...newSubscribe],
        });
      });

      const posts = await fastify.db.posts.findMany({
        key: 'userId',
        equals: request.params.id,
      });

      if (posts.length === 0) {
        throw fastify.httpErrors.notFound('Post is not founded!');
      }

      posts.forEach(async (post) => await fastify.db.posts.delete(post.id));

      const profile = await fastify.db.profiles.findOne({
        key: 'userId',
        equals: request.params.id,
      });

      if (profile === null) {
        throw fastify.httpErrors.notFound('Profile is not founded!');
      }

      await fastify.db.profiles.delete(profile.id);

      const deletedUser = await fastify.db.users.delete(request.params.id);

      return deletedUser;
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const objectSubscribeTo = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id,
      });

      const subscribeUser = await fastify.db.users.findOne({
        key: 'id',
        equals: request.body.userId,
      });

      if (objectSubscribeTo === null || subscribeUser === null) {
        throw fastify.httpErrors.notFound('User is not founded!');
      }

      subscribeUser.subscribedToUserIds = [
        ...subscribeUser.subscribedToUserIds,
        request.params.id,
      ];

      const updatedUser = await fastify.db.users.change(request.body.userId, {
        subscribedToUserIds: [...subscribeUser.subscribedToUserIds],
      });

      return updatedUser;
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const userById = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id,
      });

      if (userById === null) {
        throw fastify.httpErrors.notFound('User is not founded!');
      }

      const checkSubscribe = await fastify.db.users.findOne({
        key: 'id',
        equals: request.body.userId,
      });

      if (checkSubscribe === null) {
        throw fastify.httpErrors.notFound('User does not have such subscribe!');
      }

      if (!checkSubscribe.subscribedToUserIds.includes(userById.id)) {
        throw fastify.httpErrors.badRequest(
          'User does not have such subscribe!'
        );
      }

      const index = checkSubscribe.subscribedToUserIds.findIndex(
        (user) => user === request.body.userId
      );
      const updatedSubscribes = checkSubscribe.subscribedToUserIds.splice(
        index,
        1
      );

      const updatedUser = await fastify.db.users.change(request.body.userId, {
        subscribedToUserIds: updatedSubscribes,
      });

      return updatedUser;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const userById = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id,
      });

      if (userById === null) {
        throw fastify.httpErrors.badRequest('User is not founded!');
      }

      const updatedUser = await fastify.db.users.change(
        request.params.id,
        request.body
      );
      return updatedUser;
    }
  );
};

export default plugin;
