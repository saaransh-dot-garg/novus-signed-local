import { Badge, Button, Card, ErrorMessage, TextAreaField, TextField } from "@fieldnotes/ui";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trackNotebookObjectEvent } from "../analytics/objectEvents";
import { api, type Note, type NotebookDetail } from "../api/client";
import { useAuth } from "../auth/AuthContext";

function NoteItem({
  notebookId,
  note,
  onSaved,
}: {
  notebookId: string;
  note: Note;
  onSaved: (note: Note) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(note.body);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    onSaved(await api.updateNote(notebookId, note.id, body));
    setEditing(false);
  };

  if (!editing) {
    return (
      <li>
        <p>{note.body}</p>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </li>
    );
  }
  return (
    <li>
      <form onSubmit={(event) => void save(event)}>
        <TextAreaField
          id={`note-${note.id}-input`}
          label="Edit note"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <Button type="submit" disabled={!body.trim()}>
          Save changes
        </Button>{" "}
        <Button variant="secondary" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </form>
    </li>
  );
}

export function NotebookPage() {
  const { user } = useAuth();
  const { notebookId = "" } = useParams();
  const navigate = useNavigate();
  const [notebook, setNotebook] = useState<NotebookDetail | null>(null);
  const [title, setTitle] = useState("");
  const [newNote, setNewNote] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getNotebook(notebookId)
      .then((detail) => {
        setNotebook(detail);
        setTitle(detail.title);
      })
      .catch((err: Error) => setError(err.message));
  }, [notebookId]);

  if (!notebook) return <ErrorMessage message={error} />;

  const rename = async (event: FormEvent) => {
    event.preventDefault();
    const updated = await api.renameNotebook(notebook.id, title);
    setNotebook({ ...notebook, ...updated });
  };

  const addNote = async (event: FormEvent) => {
    event.preventDefault();
    const note = await api.addNote(notebook.id, newNote);
    trackNotebookObjectEvent("note_added", {
      notebookId: notebook.id,
      organizationId: user?.organization.id,
      noteId: note.id,
      notebookShared: notebook.shared,
    });
    setNotebook({
      ...notebook,
      notes: [...notebook.notes, note],
      noteCount: notebook.noteCount + 1,
    });
    setNewNote("");
  };

  const share = async () => {
    const result = await api.shareNotebook(notebook.id);
    trackNotebookObjectEvent("notebook_shared", {
      notebookId: notebook.id,
      organizationId: user?.organization.id,
      notebookShared: true,
    });
    setShareUrl(result.shareUrl);
    setNotebook({ ...notebook, shared: true });
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${notebook.title}"? This cannot be undone.`)) return;
    await api.deleteNotebook(notebook.id);
    // notebook_deleted: fires only after the delete succeeds, before leaving the page.
    trackNotebookObjectEvent("notebook_deleted", {
      notebookId: notebook.id,
      organizationId: user?.organization.id,
      noteCount: notebook.notes.length,
      notebookShared: notebook.shared,
    });
    navigate("/");
  };

  const replaceNote = (saved: Note) =>
    setNotebook({
      ...notebook,
      notes: notebook.notes.map((note) => (note.id === saved.id ? saved : note)),
    });

  return (
    <>
      <h1>
        {notebook.title} {notebook.shared && <Badge tone="success">Shared</Badge>}
      </h1>
      <ErrorMessage message={error} />
      <Card
        title="Notebook details"
        actions={
          <>
            <Button id="share-notebook-button" variant="secondary" onClick={() => void share()}>
              Share notebook
            </Button>{" "}
            <Button id="delete-notebook-button" variant="danger" onClick={() => void remove()}>
              Delete
            </Button>
          </>
        }
      >
        <form onSubmit={(event) => void rename(event)}>
          <TextField
            id="notebook-rename-input"
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Button id="rename-notebook-button" type="submit" disabled={!title.trim()}>
            Rename
          </Button>
        </form>
        {shareUrl && <p>Share link: {shareUrl}</p>}
      </Card>
      <Card title="Notes">
        <ul>
          {notebook.notes.map((note) => (
            <NoteItem key={note.id} notebookId={notebook.id} note={note} onSaved={replaceNote} />
          ))}
        </ul>
        <form onSubmit={(event) => void addNote(event)}>
          <TextAreaField
            id="note-body-input"
            label="New note"
            value={newNote}
            onChange={(event) => setNewNote(event.target.value)}
          />
          <Button id="save-note-button" type="submit" disabled={!newNote.trim()}>
            Add note
          </Button>
        </form>
      </Card>
    </>
  );
}
