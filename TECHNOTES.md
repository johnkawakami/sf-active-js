# sf-active-js notes

Goal of the web app is to create a news reader for mobile phone users to read a single site's news.  The app will be relatively competitive with mobile sites for newspapers and online news sources.  It will be fast, simple, and can operate largely independently of the back-end CMS.

The initial version, and the main focus will be to support the LA Indymedia site, which runs on a modified sf-active.  It will be web-based, HTML5.

Development after this initial version can proceed in multiple directions.  Native versions for mobile phones will probably allow better publishing experiences.  Adapter code will allow the app to be run as a front end for WordPress and Drupal websites.

## Decoupling from the back end.

The current website is written in PHP with a MySQL back end.  It's presently too slow, and has some architectural problems.  (It's also running on an old server that needs to be replaced - so it's not all due to the design - but it seems kind of silly that a 250k page site should be slow when it's mostly just serving up files.)

The software is old, and nobody wants to work on it.  It's kind of a dead end, too.  There are better platforms out there (and by "better" I mean less lame).

The original design idea was to use RSS feeds to decouple the front end from the back.  That worked, but slowly.  The existing feeds were up to 120K.  That didn't work over a flaky 3G network.

So, the fix is to use contemporary tech: JSON files.  RSS feeds are replaced with non-standard JSON feeds.  The feeds are stripped of most of the data, and presently, there are four feeds that total around 3K.  Here's the feed:

http://la.indymedia.org/js/ws/regen.php?s=combined

JSON dumps of the articles come out to around 4K and less.  The initial page load, with all libraries and feeds, is around 68K at this time.  It should grow to around 70k to 80k.

If possible, this architecture of serving up JSON dumps of stories, and of lists of stories, should be carried forward to adapters for different CMSs.

## Feed and Dump formats are ad-hoc

They will be documented asap once they actually settle down.

The basic idea should be there's a generic story class of objects, and events and features are special cases of the story.

A story is can have attachments, and can have comments.

Attachments are treated somewhat like MIME email attachments.  Attachments are embedded via references in the story text.

That diverges from the sf-active model, where each story can have a single attachment, and multiple attachments are created by setting a parent_id in a story to it's parent.  (That is, the whole story is like an attachment.)

We won't diverge too much from that - except instead of the story pointing to the parent, the parent will have pointers down to the attachments.

Comments are stories.  Again, there's a list of comments in a story, so it's like the attachments.  Likewise, the sf-active way is to use a parent_id to point upward to the parent, and this new style is to point downward to the comment.

Comments are included in toto within the story, for rendering.

Presently, comments can have one attachment.  Perhaps that will be allowed.  Maybe attachments and comments are extensions of a generic story.

Calendar events are going to be shoehorned into stories.  It'll be forced.

Features are going to become stories too.  Right now, they are their own thing, with some revision history features.  I don't think the revisions feature has been that useful.

All these things should be designed so it can work with one of the NoSQL databases like MongoDB.  Think "document store".
