import { defineField, defineType } from 'sanity';

export const user = defineType({
  name: 'user',
  title: 'User',
  type: 'document',
  fields: [
    defineField({
      name: 'uid',
      title: 'Firebase UID',
      type: 'string',
      validation: (Rule) => Rule.required(),
      readOnly: true,
    }),
    defineField({
      name: 'name',
      title: 'Display Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'photoURL',
      title: 'Profile Photo URL',
      type: 'url',
      description: 'Automatically synced from auth provider',
    }),
    defineField({
      name: 'providerData',
      title: 'Auth Providers',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Email/Password', value: 'password' },
          { title: 'Google', value: 'google.com' },
          { title: 'Facebook', value: 'facebook.com' },
        ],
      },
      readOnly: true,
    }),
    defineField({
      name: 'primaryProvider',
      title: 'Primary Auth Method',
      type: 'string',
      options: {
        list: [
          { title: 'Email/Password', value: 'password' },
          { title: 'Google', value: 'google.com' },
          { title: 'Facebook', value: 'facebook.com' },
        ],
      },
      readOnly: true,
    }),
    defineField({
      name: 'emailVerified',
      title: 'Email Verified',
      type: 'boolean',
      initialValue: false,
      readOnly: true,
    }),
    defineField({
      name: 'bannerImage',
      title: 'Banner Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: [
          { title: 'User', value: 'user' },
          { title: 'Admin', value: 'admin' },
          { title: 'Editor', value: 'editor' },
        ],
      },
      initialValue: 'user',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'notificationPrefs',
      title: 'Notification Preferences',
      type: 'object',
      fields: [
        defineField({
          name: 'comments',
          title: 'New Comments',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'likes',
          title: 'Likes on Posts',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'newFollowers',
          title: 'New Followers',
          type: 'boolean',
          initialValue: true,
        }),
      ],
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
    defineField({
      name: 'lastLogin',
      title: 'Last Login',
      type: 'datetime',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      email: 'email',
      provider: 'primaryProvider',
      role: 'role',
      media: 'photoURL',
    },
    prepare(selection) {
      const { title, email, provider, role, media } = selection;
      const providerMap = {
        'password': 'Email',
        'google.com': 'Google',
        'facebook.com': 'Facebook'
      };
      return {
        title: title,
        subtitle: `${email} • ${providerMap[provider] || 'Unknown'} ${role !== 'user' ? `• ${role.toUpperCase()}` : ''}`,
        media: media ? { asset: { _ref: media } } : undefined,
      };
    },
  },
});