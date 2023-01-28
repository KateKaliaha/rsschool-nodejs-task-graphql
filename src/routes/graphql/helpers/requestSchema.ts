import { FastifyInstance } from 'fastify';
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLID,
  GraphQLList,
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
const createPost = {
  type: postType,
  args: {
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    userId: { type: GraphQLString },
  },
  resolve: async (_: any, args: CreatePostDTO, fastify: FastifyInstance) => {
    const userById = await fastify.db.users.findOne({
      key: 'id',
      equals: args.userId,
    });

    if (userById === null) {
      return fastify.httpErrors.badRequest('You send incorrect data!');
    }
    const newPost = await fastify.db.posts.create(args);
    return newPost;
  },
};

const userType = new GraphQLObjectType({
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

const createUser = {
  type: userType,
  args: {
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
  },
  resolve: async (_: any, args: CreateUserDTO, fastify: FastifyInstance) => {
    const newUser = await fastify.db.users.create(args);
    return newUser;
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

const createProfile = {
  type: profileType,
  args: {
    avatar: { type: GraphQLString },
    sex: { type: GraphQLString },
    birthday: { type: GraphQLInt },
    country: { type: GraphQLString },
    street: { type: GraphQLString },
    city: { type: GraphQLString },
    memberTypeId: { type: GraphQLString },
    userId: { type: GraphQLString },
  },
  resolve: async (_: any, args: CreateProfileDTO, fastify: FastifyInstance) => {
    const memberTypeById = await fastify.db.memberTypes.findOne({
      key: 'id',
      equals: args.memberTypeId,
    });

    if (memberTypeById === null) {
      return null;
    }

    if (
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        args.userId
      ) === false
    ) {
      return null;
    }

    const profileById = await fastify.db.profiles.findOne({
      key: 'userId',
      equals: args.userId,
    });

    if (profileById) {
      return null;
    }

    const newProfile = await fastify.db.profiles.create(args);

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
  },
});

export const schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation,
});
