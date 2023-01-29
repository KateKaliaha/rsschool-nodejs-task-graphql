import { FastifyInstance } from 'fastify';
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLID,
  GraphQLList,
  GraphQLOutputType,
  GraphQLInputObjectType,
  GraphQLNonNull,
} from 'graphql';
import { PostEntity } from '../../../utils/DB/entities/DBPosts';
import { ProfileEntity } from '../../../utils/DB/entities/DBProfiles';
import { UserEntity } from '../../../utils/DB/entities/DBUsers';

const memberType = new GraphQLObjectType({
  name: 'memberType',
  fields: () => ({
    id: { type: GraphQLString },
    discount: { type: GraphQLInt },
    monthPostsLimit: { type: GraphQLInt },
  }),
});

const membersTypeQuery = {
  type: new GraphQLList(memberType),
  resolve: async (
    _: any,
    args: Record<string, string>,
    fastify: FastifyInstance
  ) => {
    return await fastify.db.memberTypes.findMany();
  },
};

const memberTypeQuery = {
  type: memberType,
  args: {
    id: { type: GraphQLString },
  },
  resolve: async (
    _: any,
    args: Record<string, string>,
    fastify: FastifyInstance
  ) => {
    const memberTypeById = await fastify.db.memberTypes.findOne({
      key: 'id',
      equals: args.id,
    });

    if (memberTypeById === null) {
      return null;
    }

    return memberTypeById;
  },
};

const postType = new GraphQLObjectType({
  name: 'postType',
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    userId: { type: GraphQLString },
  }),
});

const postsQuery = {
  type: new GraphQLList(postType),
  resolve: async (
    _: any,
    args: Record<string, string>,
    fastify: FastifyInstance
  ) => {
    return await fastify.db.posts.findMany();
  },
};

const postQuery = {
  type: postType,
  args: {
    id: { type: GraphQLID },
  },
  resolve: async (
    _: any,
    args: Record<string, string>,
    fastify: FastifyInstance
  ) => {
    const postById = await fastify.db.posts.findOne({
      key: 'id',
      equals: args.id,
    });

    if (postById === null) {
      return null;
    }

    return postById;
  },
};

type CreatePostDTO = Omit<PostEntity, 'id'>;

const createPostData = new GraphQLInputObjectType({
  name: 'createPostData',
  fields: {
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: new GraphQLNonNull(GraphQLID) },
  },
});
const createPost = {
  type: postType,
  args: {
    data: { type: createPostData },
  },
  resolve: async (
    _: any,
    { data }: { data: CreatePostDTO },
    fastify: FastifyInstance
  ) => {
    const userById = await fastify.db.users.findOne({
      key: 'id',
      equals: data.userId,
    });

    if (userById === null) {
      return fastify.httpErrors.badRequest('You send incorrect data!');
    }
    const newPost = await fastify.db.posts.create(data);
    return newPost;
  },
};

const userType: GraphQLOutputType = new GraphQLObjectType({
  name: 'userType',
  fields: () => ({
    id: { type: GraphQLID },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    subscribedToUserIds: {
      type: new GraphQLList(GraphQLString),
    },
    profile: {
      type: profileType,
      async resolve(
        parent: UserEntity,
        args: Record<string, string>,
        fastify: FastifyInstance
      ) {
        const profile = await fastify.db.profiles.findOne({
          key: 'userId',
          equals: parent.id,
        });
        return profile;
      },
    },
    posts: {
      type: new GraphQLList(postType),
      async resolve(
        parent: UserEntity,
        args: Record<string, string>,
        fastify: FastifyInstance
      ) {
        const posts = await fastify.db.posts.findMany({
          key: 'userId',
          equals: parent.id,
        });
        return posts;
      },
    },
    memberType: {
      type: memberType,
      async resolve(
        parent: UserEntity,
        args: Record<string, string>,
        fastify: FastifyInstance
      ) {
        const profile = await fastify.db.profiles.findOne({
          key: 'userId',
          equals: parent.id,
        });
        if (profile === null) {
          return null;
        }
        const memberType = await fastify.db.memberTypes.findOne({
          key: 'id',
          equals: profile.memberTypeId,
        });
        return memberType;
      },
    },
    userSubscribedTo: {
      type: new GraphQLList(userType),
      async resolve(
        parent: UserEntity,
        args: Record<string, string>,
        fastify: FastifyInstance
      ) {
        const users = await fastify.db.users.findMany({
          key: 'subscribedToUserIds',
          inArray: parent.id,
        });
        return users;
      },
    },
    subscribedToUser: {
      type: new GraphQLList(userType),
      async resolve(
        parent: UserEntity,
        args: Record<string, string>,
        fastify: FastifyInstance
      ) {
        const subscribes = Promise.all(
          parent.subscribedToUserIds.map(async (subscribeId) => {
            const subscribe = await fastify.db.users.findOne({
              key: 'id',
              equals: subscribeId,
            });
            return subscribe;
          })
        );

        return subscribes;
      },
    },
  }),
});

const usersQuery = {
  type: new GraphQLList(userType),
  resolve: async (
    _: any,
    args: Record<string, string>,
    fastify: FastifyInstance
  ) => {
    return await fastify.db.users.findMany();
  },
};

const userQuery = {
  type: userType,
  args: {
    id: { type: GraphQLID },
  },
  resolve: async (
    _: any,
    args: Record<string, string>,
    fastify: FastifyInstance
  ) => {
    const userById = await fastify.db.users.findOne({
      key: 'id',
      equals: args.id,
    });

    if (userById === null) {
      return null;
    }
    return userById;
  },
};

type CreateUserDTO = Omit<UserEntity, 'id' | 'subscribedToUserIds'>;
const createUserData = new GraphQLInputObjectType({
  name: 'createUserData',
  fields: {
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
  },
});

const createUser = {
  type: userType,
  args: {
    data: { type: createUserData },
  },
  resolve: async (
    _: any,
    { data }: { data: CreateUserDTO },
    fastify: FastifyInstance
  ) => {
    const newUser = await fastify.db.users.create(data);
    return newUser;
  },
};

const subscribeToUser = {
  type: userType,
  args: {
    userId: { type: GraphQLID },
    id: { type: GraphQLID },
  },
  resolve: async (_: any, args: any, fastify: FastifyInstance) => {
    const objectSubscribeTo = await fastify.db.users.findOne({
      key: 'id',
      equals: args.id,
    });

    const subscribeUser = await fastify.db.users.findOne({
      key: 'id',
      equals: args.userId,
    });

    if (objectSubscribeTo === null || subscribeUser === null) {
      return null;
    }

    subscribeUser.subscribedToUserIds = [
      ...subscribeUser.subscribedToUserIds,
      args.id,
    ];

    const updatedUser = await fastify.db.users.change(args.userId, {
      subscribedToUserIds: [...subscribeUser.subscribedToUserIds],
    });

    return updatedUser;
  },
};

const profileType = new GraphQLObjectType({
  name: 'profileType',
  fields: () => ({
    id: { type: GraphQLID },
    avatar: { type: GraphQLString },
    sex: { type: GraphQLString },
    birthday: { type: GraphQLInt },
    country: { type: GraphQLString },
    street: { type: GraphQLString },
    city: { type: GraphQLString },
    memberTypeId: { type: GraphQLString },
    userId: { type: GraphQLString },
  }),
});

const profilesQuery = {
  type: new GraphQLList(profileType),
  resolve: async (
    _: any,
    args: Record<string, string>,
    fastify: FastifyInstance
  ) => {
    return await fastify.db.profiles.findMany();
  },
};

const profileQuery = {
  type: profileType,
  args: {
    id: { type: GraphQLID },
  },
  resolve: async (
    _: any,
    args: Record<string, string>,
    fastify: FastifyInstance
  ) => {
    const profileById = await fastify.db.profiles.findOne({
      key: 'id',
      equals: args.id,
    });

    if (profileById === null) {
      return null;
    }

    return profileById;
  },
};
type CreateProfileDTO = Omit<ProfileEntity, 'id'>;
const createProfileData = new GraphQLInputObjectType({
  name: 'createProfileData',
  fields: {
    avatar: { type: new GraphQLNonNull(GraphQLString) },
    sex: { type: new GraphQLNonNull(GraphQLString) },
    birthday: { type: new GraphQLNonNull(GraphQLInt) },
    country: { type: new GraphQLNonNull(GraphQLString) },
    street: { type: new GraphQLNonNull(GraphQLString) },
    city: { type: new GraphQLNonNull(GraphQLString) },
    memberTypeId: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: new GraphQLNonNull(GraphQLID) },
  },
});

const createProfile = {
  type: profileType,
  args: {
    data: { type: createProfileData },
  },
  resolve: async (
    _: any,
    { data }: { data: CreateProfileDTO },
    fastify: FastifyInstance
  ) => {
    const memberTypeById = await fastify.db.memberTypes.findOne({
      key: 'id',
      equals: data.memberTypeId,
    });

    if (memberTypeById === null) {
      return null;
    }

    if (
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        data.userId
      ) === false
    ) {
      return null;
    }

    const profileById = await fastify.db.profiles.findOne({
      key: 'userId',
      equals: data.userId,
    });

    if (profileById) {
      return null;
    }

    const newProfile = await fastify.db.profiles.create(data);

    return newProfile;
  },
};

const Query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    membersType: membersTypeQuery,
    memberType: memberTypeQuery,
    users: usersQuery,
    user: userQuery,
    posts: postsQuery,
    post: postQuery,
    profiles: profilesQuery,
    profile: profileQuery,
  },
});

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createUser: createUser,
    createPost: createPost,
    createProfile: createProfile,
    subscribeToUser: subscribeToUser,
  },
});

export const schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation,
});
