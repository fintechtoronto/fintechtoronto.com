export default {
  name: 'event',
  title: 'Events',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'date',
      title: 'Event Date',
      type: 'datetime',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'location',
      title: 'Location',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'link',
      title: 'Registration Link',
      type: 'url',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'eventType',
      title: 'Event Type',
      type: 'string',
      options: {
        list: [
          { title: 'In-Person', value: 'In-Person' },
          { title: 'Virtual', value: 'Virtual' },
          { title: 'Hybrid', value: 'Hybrid' },
          { title: 'Workshop', value: 'Workshop' },
          { title: 'Conference', value: 'Conference' },
          { title: 'Networking', value: 'Networking' },
        ],
      },
    },
    {
      name: 'calId',
      title: 'Cal.com Event ID',
      type: 'string',
      description: 'ID of the event in Cal.com for calendar integration',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Published', value: 'published' },
          { title: 'Draft', value: 'draft' },
        ],
      },
      initialValue: 'published',
    },
    {
      name: 'maxAttendees',
      title: 'Maximum Attendees',
      type: 'number',
      description: 'Maximum number of attendees allowed',
    },
    {
      name: 'isFeatured',
      title: 'Featured Event',
      type: 'boolean',
      description: 'Show this event in the featured events section',
      initialValue: false,
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'location',
      media: 'image',
    },
  },
} 