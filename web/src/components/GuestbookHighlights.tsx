import { HIGHLIGHTED_SECTIONS, type HighlightSection, type HighlightedComment } from '../data/highlightedComments';

function CommentCard({ comment }: { comment: HighlightedComment }) {
  const entryUrl = `/guestbook/${comment.sourceFile}#${comment.anchor}`;

  return (
    <div className="guestbook-highlight__comment">
      <blockquote className="guestbook-highlight__quote">
        "{comment.quote}"
      </blockquote>
      <div className="guestbook-highlight__attribution">
        <a href={entryUrl} className="guestbook-highlight__author">
          {comment.author}
        </a>
      </div>
      {comment.response && (
        <div className="guestbook-highlight__response">
          <strong>Paul's Response:</strong> "{comment.response}"
        </div>
      )}
    </div>
  );
}

function Section({ section }: { section: HighlightSection }) {
  return (
    <div className="guestbook-highlight__section">
      <h2 className="guestbook-highlight__section-title">{section.title}</h2>
      <p className="guestbook-highlight__section-description">{section.description}</p>
      <div className="guestbook-highlight__comments">
        {section.comments.map((comment, index) => (
          <CommentCard key={`${section.id}-${index}`} comment={comment} />
        ))}
      </div>
    </div>
  );
}

export function GuestbookHighlights() {
  return (
    <div className="guestbook-highlights">
      <p className="guestbook-highlights__intro">
        A curated collection of compelling comments from the Broomsticks guestbook (2001-2005),
        organized by theme.
      </p>
      <div className="guestbook-highlights__sections">
        {HIGHLIGHTED_SECTIONS.map((section) => (
          <Section key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
