export const structure = (S: any) => 
  S.list()
    .title("Content")
    .items([
      // Blog posts
      S.listItem()
        .title('Blog Posts')
        .schemaType('blog')
        .child(
          S.documentList()
            .title('Blog Posts')
            .filter('_type == "blog"')
            .defaultOrdering([{field: 'publishDate', direction: 'desc'}])
        ),
      
      // Series
      S.listItem()
        .title('Series')
        .schemaType('series')
        .child(
          S.documentList()
            .title('Series')
            .filter('_type == "series"')
        ),
        
      // Events
      S.listItem()
        .title('Events')
        .schemaType('event')
        .child(
          S.documentList()
            .title('Events')
            .filter('_type == "event"')
            .defaultOrdering([{field: 'date', direction: 'desc'}])
        ),
        
      // Users
      S.listItem()
        .title('Users')
        .schemaType('user')
        .child(
          S.documentList()
            .title('Users')
            .filter('_type == "user"')
        ),
        
      // Newsletter Signups
      S.listItem()
        .title('Newsletter Signups')
        .schemaType('newsletter')
        .child(
          S.documentList()
            .title('Newsletter Signups')
            .filter('_type == "newsletter"')
        ),
    ]);
