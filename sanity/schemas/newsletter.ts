export default {
  name: 'newsletter',
  title: 'Newsletters',
  type: 'document',
  fields: [
    {
      name: 'subject',
      title: 'Subject',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block' }],
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Sent', value: 'sent' },
        ],
      },
      initialValue: 'draft',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'sentAt',
      title: 'Sent At',
      type: 'datetime',
      hidden: ({ document }: { document: any }) => document?.status !== 'sent',
    },
  ],
} 